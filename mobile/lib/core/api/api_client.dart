import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../storage/token_storage.dart';
import 'api_config.dart';

class ApiClient {
  static String get baseUrl => ApiConfig.baseUrl;

  /// Called after tokens are cleared due to 401 (e.g. redirect to login).
  static void Function()? onUnauthorized;

  static const Duration _requestTimeout = Duration(seconds: 15);

  static Future<http.Response> _withTimeout(Future<http.Response> request) async {
    try {
      return await request.timeout(_requestTimeout);
    } on TimeoutException {
      throw ApiException(
        message: 'Could not connect to the server. Check your network.',
        statusCode: 0,
      );
    } on SocketException catch (e) {
      if (kDebugMode) debugPrint('ApiClient socket error: $e');
      throw ApiException(
        message: 'Could not connect to the server. Check your network.',
        statusCode: 0,
      );
    }
  }

  static Future<void> _handleUnauthorized() async {
    await clearTokens();
    onUnauthorized?.call();
  }

  static Future<String?> getToken() => TokenStorage.getAccessToken();

  static Future<void> saveTokens(String access, String? refresh) =>
      TokenStorage.saveTokens(access, refresh);

  static Future<void> clearTokens() async {
    await TokenStorage.clearTokens();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_data');
  }

  static Future<Map<String, String>> _headers({bool json = true}) async {
    final token = await getToken();
    return {
      if (json) 'Content-Type': 'application/json',
      if (json) 'Accept': 'application/json',
      if (!json) 'Accept': 'application/pdf, application/octet-stream, */*',
      if (token != null) 'Authorization': 'Bearer $token',
      if (ApiConfig.usesNgrok) 'ngrok-skip-browser-warning': 'true',
    };
  }

  static Future<bool> refreshToken() async {
    final refresh = await TokenStorage.getRefreshToken();
    if (refresh == null || refresh.isEmpty) return false;

    try {
      final response = await _withTimeout(
        http.post(
          Uri.parse('$baseUrl/api/accounts/token/refresh/'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'refresh': refresh}),
        ),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final access = data['access'] as String?;
        if (access != null && access.isNotEmpty) {
          await TokenStorage.saveTokens(access, refresh);
          return true;
        }
      }
    } on Object {
      return false;
    }
    return false;
  }

  static Future<http.Response> _authorizedGet(String path) async {
    var headers = await _headers();
    var response = await _withTimeout(
      http.get(Uri.parse('$baseUrl$path'), headers: headers),
    );

    if (response.statusCode == 401) {
      final refreshed = await refreshToken();
      if (refreshed) {
        headers = await _headers();
        response = await _withTimeout(
          http.get(Uri.parse('$baseUrl$path'), headers: headers),
        );
      } else {
        await _handleUnauthorized();
      }
    }
    return response;
  }

  static Future<Map<String, dynamic>> get(String path) async {
    try {
      final response = await _authorizedGet(path);
      return _handleResponse(response);
    } on ApiException {
      rethrow;
    } on SocketException {
      throw ApiException(
        message: 'Could not connect to the server. Check your network.',
        statusCode: 0,
      );
    } on http.ClientException {
      throw ApiException(
        message: 'Could not connect to the server. Check your network.',
        statusCode: 0,
      );
    }
  }

  /// Authenticated binary download (e.g. PDF) — mirrors React `fetch` + blob flow.
  static Future<Uint8List> download(String path) async {
    var headers = await _headers(json: false);
    var response = await _withTimeout(
      http.get(
        Uri.parse('$baseUrl$path'),
        headers: headers,
      ),
    );

    if (response.statusCode == 401) {
      final refreshed = await refreshToken();
      if (refreshed) {
        headers = await _headers(json: false);
        response = await _withTimeout(
          http.get(
            Uri.parse('$baseUrl$path'),
            headers: headers,
          ),
        );
      } else {
        await _handleUnauthorized();
      }
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final bytes = response.bodyBytes;
      if (bytes.length < 100) {
        throw ApiException(
          message: 'Received an empty or invalid PDF file',
          statusCode: response.statusCode,
        );
      }
      return bytes;
    }

    throw _binaryError(response);
  }

  static ApiException _binaryError(http.Response response) {
    try {
      final body = utf8.decode(response.bodyBytes);
      if (body.trim().isNotEmpty) {
        final decoded = jsonDecode(body);
        if (decoded is Map<String, dynamic>) {
          final message = decoded['error']?['message'] ??
              decoded['message'] ??
              decoded['detail'] ??
              'Download failed';
          return ApiException(
            message: message.toString(),
            statusCode: response.statusCode,
          );
        }
      }
    } catch (_) {
      // fall through
    }
    return ApiException(
      message: 'Download failed (${response.statusCode})',
      statusCode: response.statusCode,
    );
  }

  static Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body, {
    bool requiresAuth = true,
  }) async {
    final headers = requiresAuth
        ? await _headers()
        : {'Content-Type': 'application/json', 'Accept': 'application/json'};

    final response = await _withTimeout(
      http.post(
        Uri.parse('$baseUrl$path'),
        headers: headers,
        body: jsonEncode(body),
      ),
    );

    return _handleResponse(response);
  }

  static Future<Map<String, dynamic>> patch(
    String path,
    Map<String, dynamic> body,
  ) async {
    final headers = await _headers();
    final response = await _withTimeout(
      http.patch(
        Uri.parse('$baseUrl$path'),
        headers: headers,
        body: jsonEncode(body),
      ),
    );
    return _handleResponse(response);
  }

  static Map<String, dynamic> _handleResponse(http.Response response) {
    final body = utf8.decode(response.bodyBytes);
    if (body.trim().isEmpty) {
      throw ApiException(
        message: 'Empty server response',
        statusCode: response.statusCode,
      );
    }

    final Map<String, dynamic> decoded;
    try {
      final parsed = jsonDecode(body);
      if (parsed is! Map<String, dynamic>) {
        throw ApiException(
          message: 'Unexpected server response',
          statusCode: response.statusCode,
        );
      }
      decoded = parsed;
    } on FormatException {
      throw ApiException(
        message: 'Server returned an invalid response. Check API_HOST.',
        statusCode: response.statusCode,
      );
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return decoded;
    }

    final message = decoded['error']?['message'] ??
        decoded['detail'] ??
        'Request failed (${response.statusCode})';

    throw ApiException(
      message: message.toString(),
      statusCode: response.statusCode,
    );
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException({required this.message, required this.statusCode});

  @override
  String toString() => message;
}

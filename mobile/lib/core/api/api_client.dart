import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  // Change this to your Backend URL
  static const String baseUrl = 'http://10.0.2.2:8000';

  // Get stored access token
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  // Save tokens after login
  static Future<void> saveTokens(String access, String refresh) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', access);
    await prefs.setString('refresh_token', refresh);
  }

  // Clear tokens on logout
  static Future<void> clearTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    await prefs.remove('user_data');
  }

  // Build headers with JWT token
  static Future<Map<String, String>> _headers() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Refresh access token
  static Future<bool> refreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    final refresh = prefs.getString('refresh_token');
    if (refresh == null) return false;

    final response = await http.post(
      Uri.parse('$baseUrl/api/accounts/token/refresh/'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refresh': refresh}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await prefs.setString('access_token', data['access']);
      return true;
    }
    return false;
  }

  // GET request with auto token refresh
  static Future<Map<String, dynamic>> get(String path) async {
    var headers = await _headers();
    var response = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: headers,
    );

    // Try refresh if 401
    if (response.statusCode == 401) {
      final refreshed = await refreshToken();
      if (refreshed) {
        headers = await _headers();
        response = await http.get(
          Uri.parse('$baseUrl$path'),
          headers: headers,
        );
      }
    }

    return _handleResponse(response);
  }

  // POST request
  static Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body, {
    bool requiresAuth = true,
  }) async {
    final headers = requiresAuth
        ? await _headers()
        : {'Content-Type': 'application/json', 'Accept': 'application/json'};

    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: headers,
      body: jsonEncode(body),
    );

    return _handleResponse(response);
  }

  // PATCH request
  static Future<Map<String, dynamic>> patch(
    String path,
    Map<String, dynamic> body,
  ) async {
    final headers = await _headers();
    final response = await http.patch(
      Uri.parse('$baseUrl$path'),
      headers: headers,
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  // Handle response and parse JSON
  static Map<String, dynamic> _handleResponse(http.Response response) {
    final data = jsonDecode(utf8.decode(response.bodyBytes));
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }
    throw ApiException(
      message: data['error']?['message'] ?? 'Request failed',
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

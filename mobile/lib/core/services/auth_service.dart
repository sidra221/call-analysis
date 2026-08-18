import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_client.dart';
import '../models/models.dart';

class AuthService {
  static Future<(UserModel user, String accessToken)> login(
    String username,
    String password,
  ) async {
    final response = await ApiClient.post(
      '/api/accounts/login/',
      {'username': username, 'password': password},
      requiresAuth: false,
    );

    final payload = response['data'] is Map
        ? Map<String, dynamic>.from(response['data'] as Map)
        : response;
    final access = payload['access'] as String?;
    final refresh = payload['refresh'] as String?;

    if (access == null || access.isEmpty) {
      throw ApiException(
        message: 'Invalid username or password',
        statusCode: 401,
      );
    }

    await ApiClient.saveTokens(access, refresh);

    final meResponse = await ApiClient.get('/api/accounts/me/');
    final userData = meResponse['data'] ?? meResponse;
    final user = UserModel.fromJson(Map<String, dynamic>.from(userData));

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_data', jsonEncode({
      'id': user.id,
      'user': user.username,
      'email': user.email,
      'role': user.role,
    }));

    return (user, access);
  }

  static Future<void> logout() async {
    await ApiClient.clearTokens();
  }

  static Future<UserModel?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('user_data');
    if (data == null) return null;
    return UserModel.fromJson(jsonDecode(data));
  }

  static Future<bool> isLoggedIn() async {
    final token = await ApiClient.getToken();
    return token != null && token.isNotEmpty;
  }
}

import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/api_client.dart';
import '../models/models.dart';

class AuthService {
  // Login with email and password
  static Future<UserModel> login(String email, String password) async {
    final response = await ApiClient.post(
      '/api/accounts/login/',
      {'username': email, 'password': password},
      requiresAuth: false,
    );

    final access = response['access'];
    final refresh = response['refresh'];

    if (access == null) {
      throw ApiException(
        message: 'Invalid email or password',
        statusCode: 401,
      );
    }

    await ApiClient.saveTokens(access, refresh);

    // Fetch user profile
    final meResponse = await ApiClient.get('/api/accounts/me/');
    final userData = meResponse['data'] ?? meResponse;
    final user = UserModel.fromJson(userData);

    // Save user data locally
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_data', jsonEncode({
      'user': user.username,
      'email': user.email,
      'role': user.role,
    }));

    return user;
  }

  // Logout
  static Future<void> logout() async {
    await ApiClient.clearTokens();
  }

  // Get saved user
  static Future<UserModel?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString('user_data');
    if (data == null) return null;
    return UserModel.fromJson(jsonDecode(data));
  }

  // Check if logged in
  static Future<bool> isLoggedIn() async {
    final token = await ApiClient.getToken();
    return token != null;
  }
}

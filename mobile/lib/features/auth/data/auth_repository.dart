import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/api/api_client.dart';
import '../../../core/services/auth_service.dart';
import '../../../core/storage/token_storage.dart';
import '../domain/user.dart';

class AuthRepository {
  static const _userNameKey = 'user_name';
  static const _userEmailKey = 'user_email';

  Future<String?> readToken() => ApiClient.getToken();

  Future<void> persistToken(String token, {String? refresh}) async {
    final existingRefresh = refresh ?? await TokenStorage.getRefreshToken();
    await ApiClient.saveTokens(token, existingRefresh);
  }

  Future<void> clearToken() => ApiClient.clearTokens();

  Future<User?> readUser() async {
    final prefs = await SharedPreferences.getInstance();
    final name = prefs.getString(_userNameKey);
    final email = prefs.getString(_userEmailKey);
    if (name == null || email == null) return null;
    return User(id: 'me', name: name, email: email);
  }

  Future<void> persistUser(User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userNameKey, user.name);
    await prefs.setString(_userEmailKey, user.email);
  }

  Future<void> clearUser() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userNameKey);
    await prefs.remove(_userEmailKey);
  }

  Future<(String token, User user)> login({
    required String username,
    required String password,
  }) async {
    final (userModel, accessToken) =
        await AuthService.login(username, password);

    final user = User(
      id: (userModel.id ?? 'me').toString(),
      name: userModel.username,
      email: userModel.email,
    );
    return (accessToken, user);
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

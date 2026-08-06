import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/storage/secure_storage.dart';
import '../domain/user.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthRepository {
  static const _tokenKey = 'auth_token';
  static const _userNameKey = 'user_name';
  static const _userEmailKey = 'user_email';
  final FlutterSecureStorage _storage;

  AuthRepository(this._storage);

  Future<String?> readToken() => _storage.read(key: _tokenKey);

  Future<void> persistToken(String token) => _storage.write(key: _tokenKey, value: token);

  Future<void> clearToken() => _storage.delete(key: _tokenKey);

  Future<User?> readUser() async {
    final name = await _storage.read(key: _userNameKey);
    final email = await _storage.read(key: _userEmailKey);
    if (name == null || email == null) return null;
    return User(id: 'me', name: name, email: email);
  }

  Future<void> persistUser(User user) async {
    await _storage.write(key: _userNameKey, value: user.name);
    await _storage.write(key: _userEmailKey, value: user.email);
  }

  Future<void> clearUser() async {
    await _storage.delete(key: _userNameKey);
    await _storage.delete(key: _userEmailKey);
  }

  Future<(String token, User user)> login({required String email, required String password}) async {
    await Future.delayed(const Duration(milliseconds: 800));
    final token = 'mock_jwt_${DateTime.now().millisecondsSinceEpoch}';
    final user = User(id: '1', name: 'Manager', email: email);
    return (token, user);
  }
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return AuthRepository(storage);
});


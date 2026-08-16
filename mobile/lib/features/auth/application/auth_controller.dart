import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/services/auth_service.dart';
import '../data/auth_repository.dart';
import '../domain/user.dart';

class AuthState {
  final bool loading;
  final bool authenticated;
  final User? user;
  final String? error;
  const AuthState({this.loading = false, this.authenticated = false, this.user, this.error});
  AuthState copyWith({bool? loading, bool? authenticated, User? user, String? error}) =>
      AuthState(loading: loading ?? this.loading, authenticated: authenticated ?? this.authenticated, user: user ?? this.user, error: error);
}

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthState();

  Future<void> loadSession() async {
    state = state.copyWith(loading: true);
    final repo = ref.read(authRepositoryProvider);
    final token = await repo.readToken();
    if (token == null) {
      state = const AuthState(loading: false, authenticated: false);
      return;
    }

    try {
      final response = await ApiClient.get('/api/accounts/me/');
      final data = response['data'] ?? response;
      final user = User(
        id: (data['id'] ?? 'me').toString(),
        name: (data['user'] ?? data['username'] ?? 'User').toString(),
        email: (data['email'] ?? '').toString(),
      );
      await repo.persistUser(user);
      state = AuthState(loading: false, authenticated: true, user: user);
    } catch (_) {
      await AuthService.logout();
      await repo.clearToken();
      await repo.clearUser();
      state = const AuthState(loading: false, authenticated: false);
    }
  }

  Future<bool> login(String username, String password) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final repo = ref.read(authRepositoryProvider);
      final result = await repo.login(username: username, password: password);
      await repo.persistToken(result.$1);
      await repo.persistUser(result.$2);
      state = AuthState(loading: false, authenticated: true, user: result.$2);
      return true;
    } catch (e) {
      final message = e is ApiException ? e.message : 'Login failed';
      state = state.copyWith(loading: false, error: message);
      return false;
    }
  }

  Future<void> logout() async {
    final repo = ref.read(authRepositoryProvider);
    await AuthService.logout();
    await repo.clearToken();
    await repo.clearUser();
    state = const AuthState(loading: false, authenticated: false, user: null);
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(AuthController.new);

import 'package:flutter_riverpod/flutter_riverpod.dart';
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
    if (token != null) {
      final u = await repo.readUser();
      state = AuthState(loading: false, authenticated: true, user: u);
    } else {
      state = const AuthState(loading: false, authenticated: false);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final repo = ref.read(authRepositoryProvider);
      final result = await repo.login(email: email, password: password);
      await repo.persistToken(result.$1);
      await repo.persistUser(result.$2);
      state = AuthState(loading: false, authenticated: true, user: result.$2);
      return true;
    } catch (e) {
      state = state.copyWith(loading: false, error: 'Login failed');
      return false;
    }
  }

  Future<void> logout() async {
    final repo = ref.read(authRepositoryProvider);
    await repo.clearToken();
    await repo.clearUser();
    state = const AuthState(loading: false, authenticated: false, user: null);
  }
}

final authControllerProvider = NotifierProvider<AuthController, AuthState>(AuthController.new);


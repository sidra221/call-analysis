// ─────────────────────────────────────────
// User Model
// ─────────────────────────────────────────
class UserModel {
  final String username;
  final String email;
  final String role;

  UserModel({
    required this.username,
    required this.email,
    required this.role,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      username: json['user'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? '',
    );
  }
}
// ─────────────────────────────────────────
// User Model
// ─────────────────────────────────────────
class UserModel {
  final int? id;
  final String username;
  final String email;
  final String role;

  UserModel({
    this.id,
    required this.username,
    required this.email,
    required this.role,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] is int ? json['id'] as int : int.tryParse('${json['id']}'),
      username: json['user'] ?? json['username'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? '',
    );
  }
}
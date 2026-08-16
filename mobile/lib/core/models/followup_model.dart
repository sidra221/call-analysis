
// ─────────────────────────────────────────
// FollowUp Model
// ─────────────────────────────────────────
class FollowUpModel {
  final int id;
  final String callId;
  final int assignedTo;
  final String assignedToUsername;
  final String notes;
  final String status;
  final String createdAt;
  final String updatedAt;
  final String updatedByUsername;

  FollowUpModel({
    required this.id,
    required this.callId,
    required this.assignedTo,
    required this.assignedToUsername,
    required this.notes,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.updatedByUsername = '',
  });

  factory FollowUpModel.fromJson(Map<String, dynamic> json) {
    return FollowUpModel(
      id: json['id'] ?? 0,
      callId: '${json['call_id'] ?? ''}',
      assignedTo: json['assigned_to'] ?? 0,
      assignedToUsername: json['assigned_to_username'] ?? '',
      notes: json['notes'] ?? json['creator_notes'] ?? '',
      status: json['status'] ?? 'pending',
      createdAt: json['created_at'] ?? '',
      updatedAt: json['updated_at'] ?? json['created_at'] ?? '',
      updatedByUsername: json['updated_by_username']?.toString() ?? '',
    );
  }
}

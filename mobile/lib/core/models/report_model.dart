
// ─────────────────────────────────────────
// Report Model
// ─────────────────────────────────────────
class ReportModel {
  final int id;
  final String period;
  final String status;
  final String dateFrom;
  final String dateTo;
  final String summary;
  final String recommendations;
  final String positives;
  final List<dynamic> topIssues;
  final Map<String, dynamic> sentimentStats;
  final String createdAt;
  final String createdByUsername;

  ReportModel({
    required this.id,
    required this.period,
    required this.status,
    required this.dateFrom,
    required this.dateTo,
    required this.summary,
    required this.recommendations,
    required this.positives,
    required this.topIssues,
    required this.sentimentStats,
    required this.createdAt,
    required this.createdByUsername,
  });

  factory ReportModel.fromJson(Map<String, dynamic> json) {
    return ReportModel(
      id: json['id'] ?? 0,
      period: json['period'] ?? '',
      status: json['status'] ?? 'draft',
      dateFrom: json['date_from'] ?? '',
      dateTo: json['date_to'] ?? '',
      summary: json['summary'] ?? '',
      recommendations: json['recommendations'] ?? '',
      positives: json['positives'] ?? '',
      topIssues: json['top_issues'] ?? [],
      sentimentStats: Map<String, dynamic>.from(json['sentiment_stats'] ?? {}),
      createdAt: json['created_at'] ?? '',
      createdByUsername: json['created_by_username'] ?? '',
    );
  }
}
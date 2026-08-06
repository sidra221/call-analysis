
// ─────────────────────────────────────────
// Dashboard Models
// ─────────────────────────────────────────
class DashboardOverview {
  final int totalCalls;
  final int completedCalls;
  final int pendingCalls;
  final int processingCalls;
  final int failedCalls;
  final double completionRate;

  DashboardOverview({
    required this.totalCalls,
    required this.completedCalls,
    required this.pendingCalls,
    required this.processingCalls,
    required this.failedCalls,
    required this.completionRate,
  });

  factory DashboardOverview.fromJson(Map<String, dynamic> json) {
    final overview = json['overview'] ?? json;
    return DashboardOverview(
      totalCalls: overview['total_calls'] ?? 0,
      completedCalls: overview['completed_calls'] ?? 0,
      pendingCalls: overview['pending_calls'] ?? 0,
      processingCalls: overview['processing_calls'] ?? 0,
      failedCalls: overview['failed_calls'] ?? 0,
      completionRate: (overview['completion_rate'] ?? 0).toDouble(),
    );
  }
}

class DashboardSentiment {
  final int positive;
  final int negative;
  final int neutral;
  final double averageScore;

  DashboardSentiment({
    required this.positive,
    required this.negative,
    required this.neutral,
    required this.averageScore,
  });

  factory DashboardSentiment.fromJson(Map<String, dynamic> json) {
    final sentiment = json['sentiment'] ?? json;
    return DashboardSentiment(
      positive: sentiment['positive'] ?? 0,
      negative: sentiment['negative'] ?? 0,
      neutral: sentiment['neutral'] ?? 0,
      averageScore: (sentiment['average_score'] ?? 0).toDouble(),
    );
  }

  int get total => positive + negative + neutral;
}

class DashboardSummary {
  final DashboardOverview overview;
  final DashboardSentiment sentiment;
  final Map<String, dynamic> priority;
  final Map<String, dynamic> followUps;

  DashboardSummary({
    required this.overview,
    required this.sentiment,
    required this.priority,
    required this.followUps,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    final data = json['data'] ?? json;
    return DashboardSummary(
      overview: DashboardOverview.fromJson(data),
      sentiment: DashboardSentiment.fromJson(data),
      priority: Map<String, dynamic>.from(data['priority'] ?? {}),
      followUps: Map<String, dynamic>.from(data['follow_ups'] ?? {}),
    );
  }
}
import '../../features/auth/domain/user_profile.dart';
import '../../features/calls/domain/call.dart';
import '../../features/dashboard/domain/dashboard_issue.dart';
import '../../features/dashboard/domain/dashboard_summary.dart' as ui;
import '../../features/logs/domain/log_item.dart';
import '../../features/reports/domain/report.dart';
import '../../shared/enums.dart';
import '../models/call_model.dart';
import '../models/dashboard_summary.dart' as api;
import '../models/report_model.dart';
import 'api_config.dart';

String? resolveMediaUrl(String? path) {
  if (path == null || path.trim().isEmpty) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  final normalized = path.startsWith('/') ? path : '/$path';
  return '${ApiConfig.baseUrl}$normalized';
}

CallStatus mapCallStatus(String status) {
  switch (status.toLowerCase()) {
    case 'completed':
      return CallStatus.completed;
    case 'processing':
      return CallStatus.inProgress;
    case 'failed':
      return CallStatus.failed;
    default:
      return CallStatus.queued;
  }
}

PriorityLevel mapPriority(String? value) {
  switch ((value ?? 'low').toLowerCase()) {
    case 'critical':
      return PriorityLevel.critical;
    case 'high':
      return PriorityLevel.high;
    case 'medium':
      return PriorityLevel.medium;
    default:
      return PriorityLevel.low;
  }
}

CallItem callModelToItem(CallModel call) {
  final analysis = call.analysis;
  final issue = analysis?.mainIssue?.trim() ?? '';
  return CallItem(
    id: call.id.toString(),
    callerName: issue,
    callerNumber: call.id.toString(),
    status: mapCallStatus(call.status),
    priority: mapPriority(analysis?.priority),
    sentiment: SentimentParsers.fromString(analysis?.sentiment ?? 'neutral'),
    date: DateTime.tryParse(call.createdAt) ?? DateTime.now(),
    agentName: call.uploadedByUsername ?? 'Unknown',
    durationMinutes: (call.duration / 60).round().clamp(1, 999),
  );
}

CallDetails callModelToDetails(CallModel call) {
  final analysis = call.analysis;
  final base = callModelToItem(call);

  return CallDetails(
    base: base,
    transcript: analysis?.transcript ?? '',
    mainIssue: analysis?.mainIssue ?? 'No issue recorded',
    keywords: analysis?.keywords ?? const [],
    needsFollowUp: analysis?.needsFollowup ?? false,
    isReviewed: analysis?.isReviewed ?? false,
    audioUrl: resolveMediaUrl(call.audioFile),
    summary: analysis?.mainIssue ?? 'No summary available.',
    keyIssues: analysis?.keywords ?? const [],
    notes: const [],
  );
}

ui.DashboardSummary dashboardSummaryToUi(api.DashboardSummary summary) {
  final overview = summary.overview;
  final sentiment = summary.sentiment;
  final priority = summary.priority;
  final totalSentiment = sentiment.total;

  double pct(int count) =>
      totalSentiment > 0 ? (count / totalSentiment) * 100 : 0;

  int countOf(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.round();
    return int.tryParse('$value') ?? 0;
  }

  return ui.DashboardSummary(
    totalCalls: overview.totalCalls,
    completedCalls: overview.completedCalls,
    inProgressCalls: overview.pendingCalls + overview.processingCalls,
    criticalPriorityCount: countOf(priority['critical']),
    highPriorityCount: countOf(priority['high']),
    mediumPriorityCount: countOf(priority['medium']),
    lowPriorityCount: countOf(priority['low']),
    positivePct: pct(sentiment.positive),
    neutralPct: pct(sentiment.neutral),
    negativePct: pct(sentiment.negative),
  );
}

DashboardIssue topicToIssue(Map<String, dynamic> issue, {required bool isPositive}) {
  final title = (issue['main_issue'] ?? issue['topic'] ?? 'Unknown').toString();
  final count = issue['count'] as int? ?? issue['total_count'] as int? ?? 0;

  return DashboardIssue(
    id: title,
    title: title,
    count: count,
    severity: (count / 10).clamp(0.0, 1.0),
    trend: Trend.stable,
    isPositive: isPositive,
  );
}

UserProfile userJsonToProfile(Map<String, dynamic> json) {
  return UserProfile(
    id: (json['id'] ?? 'me').toString(),
    name: (json['user'] ?? json['username'] ?? 'Manager').toString(),
    email: (json['email'] ?? '').toString(),
    avatarUrl: (json['avatar'] ?? '').toString(),
  );
}

Report reportModelToUi(ReportModel model) {
  final issues = model.topIssues.map((item) {
    if (item is! Map) {
      return ReportIssue(title: item.toString(), count: 0);
    }
    final map = Map<String, dynamic>.from(item);
    return ReportIssue(
      title: (map['main_issue'] ?? map['issue'] ?? 'Unknown').toString(),
      count: map['count'] as int? ?? 0,
    );
  }).toList();

  return Report(
    id: model.id.toString(),
    title: '${model.period} Report',
    period: model.period,
    date: DateTime.tryParse(model.createdAt) ?? DateTime.now(),
    summary: model.summary,
    recommendations: model.recommendations,
    positives: model.positives,
    topIssues: issues,
    sentimentStats: model.sentimentStats,
    managerNotes: model.managerNotes,
    createdByUsername: model.createdByUsername,
  );
}

LogItem activityLogToItem(Map<String, dynamic> json) {
  return LogItem(
    id: (json['id'] ?? '').toString(),
    action: (json['action'] ?? 'activity').toString(),
    username: (json['username'] ?? 'System').toString(),
    description: (json['description'] ?? '').toString(),
    timestamp: DateTime.tryParse(json['created_at']?.toString() ?? '') ??
        DateTime.now(),
  );
}

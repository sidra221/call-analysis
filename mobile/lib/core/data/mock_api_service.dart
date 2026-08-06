import 'dart:math';

import '../../features/auth/domain/user_profile.dart';
import '../../features/dashboard/domain/dashboard_summary.dart';
import '../../features/dashboard/domain/dashboard_issue.dart';
import '../../features/calls/domain/call.dart';
import '../../features/reports/domain/report.dart';
import '../../features/logs/domain/log_item.dart';
import '../../shared/enums.dart';
import '../../features/notifications/domain/app_notification.dart';

class MockApiService {
  final Random _rand = Random(1);

  final List<String> _agentNames = [
    'Ahmed Hassan',
    'Fatima Ali',
    'Omar Khalid',
    'Sarah Mahmoud',
    'Youssef Farid'
  ];

  // Single shared source of truth for all calls
  final List<CallItem> _allCalls = [];
  bool _initialized = false;

  // Initialize calls on first use
  Future<void> _ensureCallsInitialized() async {
    if (_initialized) return;
    // Generate 25 consistent calls
    _allCalls.clear();
    for (int i = 0; i < 25; i++) {
      _allCalls.add(
        CallItem(
          id: 'C-${i + 1}',
          callerName: 'Caller ${i + 1}',
          callerNumber: '+1 202 ${1000000 + i}',
          status: CallStatus.values[_rand.nextInt(CallStatus.values.length)],
          priority: PriorityLevel.values[_rand.nextInt(3)],
          sentiment: Sentiment.values[_rand.nextInt(3)],
          date: DateTime.now().subtract(Duration(hours: i)),
          agentName: _agentNames[_rand.nextInt(_agentNames.length)],
          durationMinutes: 5 + _rand.nextInt(30),
        ),
      );
    }
    _initialized = true;
  }


  Future<List<Report>> fetchReports() async {
    await Future.delayed(const Duration(milliseconds: 450));

    return List.generate(10, (i) {
      return Report(
        id: 'R-$i',
        title: 'Weekly Report #$i',
        date: DateTime.now().subtract(Duration(days: i * 7)),
        summary: 'Summary of report $i',
        recommendations: 'Improve performance metrics',
      );
    });
  }

  Future<Report> fetchReportDetails(String id) async {
    await Future.delayed(const Duration(milliseconds: 300));

    return Report(
      id: id,
      title: 'Report $id',
      date: DateTime.now(),
      summary: 'Detailed analytics report',
      recommendations: 'Focus on optimization',
    );
  }


  Future<List<LogItem>> fetchLogs() async {
    await Future.delayed(const Duration(milliseconds: 400));

    return [
      LogItem(
        id: 'L-1',
        type: LogType.activity,
        title: 'Call Analyzed',
        description: 'Sentiment: Positive',
        timestamp: DateTime.now(),
      ),
    ];
  }

  // ✅ CALLS LIST
  Future<List<CallItem>> fetchCalls({
    required int page,
    required int pageSize,
    PriorityLevel? priority,
    Sentiment? sentiment,
  }) async {
    await Future.delayed(const Duration(milliseconds: 450));
    await _ensureCallsInitialized();

    // Filter if needed
    List<CallItem> filtered = _allCalls;
    if (priority != null) {
      filtered = filtered.where((c) => c.priority == priority).toList();
    }
    if (sentiment != null) {
      filtered = filtered.where((c) => c.sentiment == sentiment).toList();
    }

    // Pagination
    final start = (page - 1) * pageSize;
    if (start >= filtered.length) return [];
    final end = start + pageSize;
    return filtered.sublist(start, end > filtered.length ? filtered.length : end);
  }

  // ✅ CALL DETAILS
  Future<CallDetails> fetchCallDetails(String id) async {
    await Future.delayed(const Duration(milliseconds: 400));
    await _ensureCallsInitialized();

    // Find the call in our shared list, otherwise create a dummy
    final call = _allCalls.firstWhere((c) => c.id == id, orElse: () => CallItem(
          id: id,
          callerName: 'Customer',
          callerNumber: '+1 202 xxx xxxx',
          status: CallStatus.completed,
          priority: PriorityLevel.medium,
          sentiment: Sentiment.positive,
          date: DateTime.now(),
          agentName: _agentNames.first,
          durationMinutes: 10,
        ));

    return CallDetails(
      base: call,
      transcript: 'Sample transcript...',
      mainIssue: 'Billing issue',
      keywords: ['billing', 'support'],
      needsFollowUp: false,
      summary: 'Call resolved successfully.',
      keyIssues: ['Billing delay'],
      notes: ['Customer satisfied'],
    );
  }

  // ---------------- USER ----------------
  Future<UserProfile> fetchUserProfile() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return UserProfile(
      id: 'u-001',
      name: 'Ahmed Mansour',
      email: 'a.mansour@callcenter.com',
      avatarUrl: 'https://api.dicebear.com/8.x/avataaars-neutral/svg?seed=Ahmed',
    );
  }

  // ---------------- NOTIFICATIONS ----------------
  Future<List<AppNotification>> fetchNotifications() async {
    await Future.delayed(const Duration(milliseconds: 500));

    return [
      AppNotification(
        id: '1',
        title: 'New Call Assigned',
        description: 'You have a new high-priority call to review',
        time: DateTime.now().subtract(const Duration(minutes: 15)),
        type: 'call',
        isRead: false,
      ),
      AppNotification(
        id: '2',
        title: 'Follow-up Required',
        description: 'Customer call needs follow-up action',
        time: DateTime.now().subtract(const Duration(hours: 2)),
        type: 'followup',
        isRead: false,
      ),
      AppNotification(
        id: '3',
        title: 'Weekly Report Ready',
        description: 'Your weekly performance report has been generated',
        time: DateTime.now().subtract(const Duration(days: 1)),
        type: 'report',
        isRead: true,
      ),
      AppNotification(
        id: '4',
        title: 'New Agent Onboarding',
        description: 'New agent has joined your team',
        time: DateTime.now().subtract(const Duration(days: 2)),
        type: 'system',
        isRead: true,
      ),
    ];
  }

  // ---------------- DASHBOARD ----------------
  Future<DashboardSummary> fetchDashboard() async {
    await Future.delayed(const Duration(milliseconds: 500));
    await _ensureCallsInitialized();

    final total = _allCalls.length;
    final completed = _allCalls.where((c) => c.status == CallStatus.completed).length;
    final inProgress = _allCalls.where((c) => c.status == CallStatus.inProgress).length;
    final high = _allCalls.where((c) => c.priority == PriorityLevel.high).length;

    final pos = 0.62 + _rand.nextDouble() * 0.1;
    final neu = 0.22 + _rand.nextDouble() * 0.1;
    final neg = 1 - pos - neu;

    return DashboardSummary(
      totalCalls: total,
      completedCalls: completed,
      inProgressCalls: inProgress,
      highPriorityCount: high,
      criticalPriorityCount: 4,
      mediumPriorityCount: 12,
      lowPriorityCount: 20,
      positivePct: double.parse(pos.toStringAsFixed(2)),
      neutralPct: double.parse(neu.toStringAsFixed(2)),
      negativePct: double.parse(neg.toStringAsFixed(2)),
    );
  }

  Future<List<DashboardIssue>> fetchTopNegativeIssues() async {
    await Future.delayed(const Duration(milliseconds: 400));

    return [
      DashboardIssue(
        id: 'ni-1',
        title: 'Long wait time',
        count: 42,
        severity: 0.85,
        trend: Trend.up,
        isPositive: false,
      ),
      DashboardIssue(
        id: 'ni-2',
        title: 'Unresolved billing queries',
        count: 31,
        severity: 0.78,
        trend: Trend.stable,
        isPositive: false,
      ),
      DashboardIssue(
        id: 'ni-3',
        title: 'Technical support delays',
        count: 25,
        severity: 0.72,
        trend: Trend.down,
        isPositive: false,
      ),
      DashboardIssue(
        id: 'ni-4',
        title: 'Agent knowledge gaps',
        count: 19,
        severity: 0.68,
        trend: Trend.up,
        isPositive: false,
      ),
    ];
  }

  Future<List<DashboardIssue>> fetchTopPositiveIssues() async {
    await Future.delayed(const Duration(milliseconds: 400));

    return [
      DashboardIssue(
        id: 'pi-1',
        title: 'Quick resolution time',
        count: 58,
        severity: 0.92,
        trend: Trend.up,
        isPositive: true,
      ),
      DashboardIssue(
        id: 'pi-2',
        title: 'Friendly agent interaction',
        count: 45,
        severity: 0.88,
        trend: Trend.up,
        isPositive: true,
      ),
      DashboardIssue(
        id: 'pi-3',
        title: 'Clear information provided',
        count: 39,
        severity: 0.81,
        trend: Trend.stable,
        isPositive: true,
      ),
      DashboardIssue(
        id: 'pi-4',
        title: 'Follow-up satisfaction',
        count: 33,
        severity: 0.75,
        trend: Trend.up,
        isPositive: true,
      ),
    ];
  }

  Future<List<CallItem>> fetchPriorityFollowUpCalls() async {
    await Future.delayed(const Duration(milliseconds: 400));
    await _ensureCallsInitialized();

    // Return first 5 high or medium priority calls from shared list
    return _allCalls.where((c) => c.priority != PriorityLevel.low).take(5).toList();
  }
}

final mockApi = MockApiService();


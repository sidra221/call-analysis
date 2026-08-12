import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/dashboard_repository.dart';
import '../domain/dashboard_summary.dart';
import '../domain/dashboard_issue.dart';
import '../../calls/domain/call.dart';
import '../../auth/domain/user_profile.dart';

final userProfileProvider = FutureProvider<UserProfile>((ref) async {
  final repo = ref.watch(dashboardRepositoryProvider);
  return repo.getUserProfile();
});

final dashboardSummaryProvider = FutureProvider<DashboardSummary>((ref) async {
  final repo = ref.watch(dashboardRepositoryProvider);
  return repo.getSummary();
});

final topNegativeIssuesProvider = FutureProvider<List<DashboardIssue>>((ref) async {
  final repo = ref.watch(dashboardRepositoryProvider);
  return repo.getTopNegativeIssues();
});

final topPositiveIssuesProvider = FutureProvider<List<DashboardIssue>>((ref) async {
  final repo = ref.watch(dashboardRepositoryProvider);
  return repo.getTopPositiveIssues();
});

final priorityFollowUpCallsProvider = FutureProvider<List<CallItem>>((ref) async {
  final repo = ref.watch(dashboardRepositoryProvider);
  return repo.getPriorityFollowUpCalls();
});

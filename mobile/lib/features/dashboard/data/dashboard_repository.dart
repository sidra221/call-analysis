import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/data/mock_api_service.dart';
import '../domain/dashboard_summary.dart';
import '../domain/dashboard_issue.dart';
import '../../calls/domain/call.dart';
import '../../auth/domain/user_profile.dart';

class DashboardRepository {
  Future<UserProfile> getUserProfile() => mockApi.fetchUserProfile();
  Future<DashboardSummary> getSummary() => mockApi.fetchDashboard();
  Future<List<DashboardIssue>> getTopNegativeIssues() => mockApi.fetchTopNegativeIssues();
  Future<List<DashboardIssue>> getTopPositiveIssues() => mockApi.fetchTopPositiveIssues();
  Future<List<CallItem>> getPriorityFollowUpCalls() => mockApi.fetchPriorityFollowUpCalls();
}

final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) => DashboardRepository());

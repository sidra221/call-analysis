import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/backend_mappers.dart';
import '../../../core/services/dashboard_service.dart';
import '../../auth/domain/user_profile.dart';
import '../domain/dashboard_issue.dart';
import '../domain/dashboard_summary.dart';

class DashboardRepository {
  Future<UserProfile> getUserProfile() async {
    final response = await ApiClient.get('/api/accounts/me/');
    final data = response['data'] ?? response;
    return userJsonToProfile(Map<String, dynamic>.from(data));
  }

  Future<DashboardSummary> getSummary() async {
    final summary = await DashboardService.getSummary();
    return dashboardSummaryToUi(summary);
  }

  Future<List<DashboardIssue>> getTopNegativeIssues() async {
    final response = await DashboardService.getTopics();
    final issues = List<Map<String, dynamic>>.from(
      response['negative_issues'] ?? const [],
    );
    return issues
        .map((issue) => topicToIssue(issue, isPositive: false))
        .toList();
  }

  Future<List<DashboardIssue>> getTopPositiveIssues() async {
    final response = await DashboardService.getTopics();
    final issues = List<Map<String, dynamic>>.from(
      response['positive_issues'] ?? const [],
    );
    return issues
        .map((issue) => topicToIssue(issue, isPositive: true))
        .toList();
  }

  Future<List<Map<String, dynamic>>> getLiveFeed() async {
    return DashboardService.getLiveFeed();
  }

  Future<List<Map<String, dynamic>>> getTopKeywords() async {
    return DashboardService.getTopKeywords();
  }
}

final dashboardRepositoryProvider =
    Provider<DashboardRepository>((ref) => DashboardRepository());

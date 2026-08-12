import '../api/api_client.dart';
import '../models/models.dart';

class DashboardService {
  // Get dashboard summary
  static Future<DashboardSummary> getSummary() async {
    final response = await ApiClient.get('/api/dashboard/summary/');
    return DashboardSummary.fromJson(response);
  }

  // Get top keywords
  static Future<List<Map<String, dynamic>>> getTopKeywords() async {
    final response = await ApiClient.get('/api/dashboard/');
    final data = response['data'] ?? response;
    return List<Map<String, dynamic>>.from(data['top_keywords'] ?? []);
  }

  // Get live feed (latest 5 calls)
  static Future<List<Map<String, dynamic>>> getLiveFeed() async {
    final response = await ApiClient.get('/api/dashboard/live/');
    final data = response['data'] ?? response;
    return List<Map<String, dynamic>>.from(data['latest_calls'] ?? []);
  }

  // Get topics
  static Future<Map<String, dynamic>> getTopics() async {
    final response = await ApiClient.get('/api/dashboard/topics/');
    return response['data'] ?? response;
  }
}

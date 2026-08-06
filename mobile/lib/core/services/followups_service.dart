import '../api/api_client.dart';
import '../models/models.dart';

class FollowUpsService {
  // Get all follow-ups
  static Future<List<FollowUpModel>> getFollowUps() async {
    final response = await ApiClient.get('/api/calls/followups/');
    final data = response['data'] ?? response;
    final results = data['results'] ?? data;

    return List<FollowUpModel>.from(
      (results as List).map((e) => FollowUpModel.fromJson(e)),
    );
  }

  // Update follow-up status
  static Future<FollowUpModel> updateStatus(int id, String status) async {
    final response = await ApiClient.patch(
      '/api/calls/followups/$id/',
      {'status': status},
    );
    final data = response['data'] ?? response;
    return FollowUpModel.fromJson(data);
  }

  // Assign follow-up to user
  static Future<FollowUpModel> assignTo(int id, int userId) async {
    final response = await ApiClient.patch(
      '/api/calls/followups/$id/',
      {'assigned_to': userId},
    );
    final data = response['data'] ?? response;
    return FollowUpModel.fromJson(data);
  }
}

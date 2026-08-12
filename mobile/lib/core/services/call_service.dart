import '../api/api_client.dart';
import '../models/models.dart';

class CallsService {
  // Get all calls with optional filters
  static Future<List<CallModel>> getCalls({
    String? status,
    String? sentiment,
    String? search,
    int page = 1,
  }) async {
    var path = '/api/calls/?page=$page';
    if (status != null) path += '&status=$status';
    if (sentiment != null) path += '&sentiment=$sentiment';
    if (search != null) path += '&search=$search';

    final response = await ApiClient.get(path);
    final data = response['data'] ?? response;
    final results = data['results'] ?? data;

    return List<CallModel>.from(
      (results as List).map((e) => CallModel.fromJson(e)),
    );
  }

  // Get single call
  static Future<CallModel> getCall(String id) async {
    final response = await ApiClient.get('/api/calls/$id/');
    final data = response['data'] ?? response;
    return CallModel.fromJson(data);
  }

  // Get negative calls
  static Future<List<CallModel>> getNegativeCalls() async {
    final response = await ApiClient.get('/api/calls/negative/');
    final data = response['data'] ?? response;
    return List<CallModel>.from(
      (data as List).map((e) => CallModel.fromJson(e)),
    );
  }
}

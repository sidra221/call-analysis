import '../api/api_client.dart';
import '../api/paginated_result.dart';
import '../models/models.dart';

class CallsService {
  static const defaultPageSize = 20;

  static Future<PaginatedResult<CallModel>> getCallsPaginated({
    String? status,
    String? sentiment,
    String? priority,
    String? search,
    int page = 1,
    int pageSize = defaultPageSize,
  }) async {
    final query = <String, String>{
      'page': '$page',
      'page_size': '$pageSize',
    };
    if (status != null) query['status'] = status;
    if (sentiment != null) query['sentiment'] = sentiment;
    if (priority != null) query['priority'] = priority;
    if (search != null && search.isNotEmpty) query['search'] = search;

    final uri = Uri(path: '/api/calls/calls/', queryParameters: query);
    final response = await ApiClient.get(uri.toString());
    return PaginatedResult.fromJson(response, CallModel.fromJson);
  }

  // Get all calls with optional filters (legacy helper)
  static Future<List<CallModel>> getCalls({
    String? status,
    String? sentiment,
    String? search,
    int page = 1,
  }) async {
    final result = await getCallsPaginated(
      status: status,
      sentiment: sentiment,
      search: search,
      page: page,
    );
    return result.items;
  }

  // Get single call
  static Future<CallModel> getCall(String id) async {
    final response = await ApiClient.get('/api/calls/calls/$id/');
    final data = response['data'] ?? response;
    return CallModel.fromJson(data);
  }

  // Get negative calls
  static Future<List<CallModel>> getNegativeCalls() async {
    final response = await ApiClient.get('/api/calls/calls/negative/');
    final data = response['data'] ?? response;
    final list = data is List
        ? data
        : (data is Map ? (data['results'] as List?) : null) ?? const [];
    return List<CallModel>.from(
      list.map((e) => CallModel.fromJson(Map<String, dynamic>.from(e))),
    );
  }

  // Mark call as reviewed
  static Future<void> markReviewed(String id) async {
    await ApiClient.post('/api/calls/calls/$id/mark-reviewed/', {});
  }
}

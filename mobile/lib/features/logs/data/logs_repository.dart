import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/backend_mappers.dart';
import '../../../core/api/paginated_result.dart';
import '../domain/log_item.dart';

class LogsRepository {
  Future<PaginatedResult<LogItem>> getLogs({
    required int page,
    required int pageSize,
    String search = '',
    String action = 'all',
    String username = '',
    String date = '',
  }) async {
    final query = <String, String>{
      'page': '$page',
      'page_size': '$pageSize',
    };
    if (search.trim().isNotEmpty) query['search'] = search.trim();
    if (action.isNotEmpty && action != 'all') query['action'] = action;
    if (username.trim().isNotEmpty) query['username'] = username.trim();
    if (date.trim().isNotEmpty) query['date'] = date.trim();

    final uri = Uri(path: '/api/logs/', queryParameters: query);
    final response = await ApiClient.get(uri.toString());
    return PaginatedResult.fromJson(response, activityLogToItem);
  }

  Future<List<String>> getUsernames() async {
    final response = await ApiClient.get('/api/logs/usernames/');
    final data = response['data'] ?? response;
    return List<String>.from(data as List).map((e) => e.toString()).toList();
  }
}

final logsRepositoryProvider =
    Provider<LogsRepository>((ref) => LogsRepository());

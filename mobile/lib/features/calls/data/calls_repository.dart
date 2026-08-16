import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/paginated_result.dart';
import '../../../core/services/call_service.dart';
import '../../../core/api/backend_mappers.dart';
import '../../../shared/enums.dart';
import '../domain/call.dart';

class CallsRepository {
  Future<PaginatedResult<CallItem>> getCalls({
    required int page,
    required int pageSize,
    PriorityLevel? priority,
    Sentiment? sentiment,
    String? search,
  }) async {
    final result = await CallsService.getCallsPaginated(
      page: page,
      pageSize: pageSize,
      sentiment: sentiment?.name,
      search: search,
    );

    var items = result.items.map(callModelToItem).toList();

    if (priority != null) {
      items = items.where((call) => call.priority == priority).toList();
    }

    return PaginatedResult(
      items: items,
      count: result.count,
      hasMore: result.hasMore,
    );
  }

  Future<CallDetails> getCallDetails(String id) async {
    final call = await CallsService.getCall(id);
    return callModelToDetails(call);
  }

  Future<void> markReviewed(String id) async {
    await CallsService.markReviewed(id);
  }
}

final callsRepositoryProvider =
    Provider<CallsRepository>((ref) => CallsRepository());

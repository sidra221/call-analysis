import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/data/mock_api_service.dart';
import '../../../shared/enums.dart';
import '../domain/call.dart';

class CallsRepository {
  Future<List<CallItem>> getCalls({required int page, required int pageSize, PriorityLevel? priority, Sentiment? sentiment}) =>
      mockApi.fetchCalls(page: page, pageSize: pageSize, priority: priority, sentiment: sentiment);
  Future<CallDetails> getCallDetails(String id) => mockApi.fetchCallDetails(id);
}

final callsRepositoryProvider = Provider<CallsRepository>((ref) => CallsRepository());


import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/data/mock_api_service.dart';
import '../domain/log_item.dart';

class LogsRepository {
  Future<List<LogItem>> getLogs() => mockApi.fetchLogs();
}

final logsRepositoryProvider = Provider<LogsRepository>((ref) => LogsRepository());

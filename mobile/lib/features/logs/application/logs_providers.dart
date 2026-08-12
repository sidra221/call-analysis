import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/logs_repository.dart';
import '../domain/log_item.dart';

final logsProvider = FutureProvider<List<LogItem>>((ref) async {
  final repo = ref.watch(logsRepositoryProvider);
  return repo.getLogs();
});

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/reports_repository.dart';
import '../domain/report.dart';

final reportsProvider = FutureProvider<List<Report>>((ref) async {
  final repo = ref.watch(reportsRepositoryProvider);
  return repo.getReports();
});

final reportDetailsProvider = FutureProvider.family<Report, String>((ref, id) async {
  final repo = ref.watch(reportsRepositoryProvider);
  return repo.getReport(id);
});


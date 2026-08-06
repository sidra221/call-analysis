import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/data/mock_api_service.dart';
import '../domain/report.dart';

class ReportsRepository {
  Future<List<Report>> getReports() => mockApi.fetchReports();
  Future<Report> getReport(String id) => mockApi.fetchReportDetails(id);
}

final reportsRepositoryProvider = Provider<ReportsRepository>((ref) => ReportsRepository());


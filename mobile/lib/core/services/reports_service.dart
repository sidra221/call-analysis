import '../api/api_client.dart';
import '../models/models.dart';

class ReportsService {
  // Get published reports only (Manager sees published only)
  static Future<List<ReportModel>> getReports() async {
    final response = await ApiClient.get('/api/reports/reports/');
    final data = response['data'] ?? response;
    final results = data['results'] ?? data;

    final all = List<ReportModel>.from(
      (results as List).map((e) => ReportModel.fromJson(e)),
    );

    // Manager sees only published reports
    return all.where((r) => r.status == 'published').toList();
  }

  // Get single report
  static Future<ReportModel> getReport(int id) async {
    final response = await ApiClient.get('/api/reports/reports/$id/');
    final data = response['data'] ?? response;
    return ReportModel.fromJson(data);
  }
}

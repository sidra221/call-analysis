import '../api/api_client.dart';
import '../models/models.dart';

class ReportsService {
  static List<dynamic> _extractList(dynamic data) {
    if (data is List) return data;
    if (data is Map<String, dynamic>) {
      final results = data['results'];
      if (results is List) return results;
    }
    return const [];
  }

  // Get published/reviewed reports for Manager
  static Future<List<ReportModel>> getReports() async {
    final response = await ApiClient.get('/api/reports/reports/');
    final data = response['data'] ?? response;
    final results = _extractList(data);

    final all = List<ReportModel>.from(
      results.map((e) => ReportModel.fromJson(Map<String, dynamic>.from(e))),
    );

    return all
        .where((r) => r.status == 'published' || r.status == 'reviewed')
        .toList();
  }

  // Get single report
  static Future<ReportModel> getReport(int id) async {
    final response = await ApiClient.get('/api/reports/reports/$id/');
    final data = response['data'] ?? response;
    return ReportModel.fromJson(data);
  }

  /// Same endpoint as React `reportsApi.downloadUrl(id)`.
  static Future<List<int>> downloadPdf(int id) async {
    final bytes = await ApiClient.download('/api/reports/reports/$id/download/');
    return bytes;
  }
}

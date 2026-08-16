import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/backend_mappers.dart';
import '../../../core/services/reports_service.dart';
import '../../../core/utils/pdf_file_helper.dart';
import '../domain/report.dart';

class ReportsRepository {
  Future<List<Report>> getReports() async {
    final reports = await ReportsService.getReports();
    return reports.map(reportModelToUi).toList();
  }

  Future<Report> getReport(String id) async {
    final report = await ReportsService.getReport(int.parse(id));
    return reportModelToUi(report);
  }

  Future<void> downloadPdf(Report report) async {
    final bytes = await ReportsService.downloadPdf(int.parse(report.id));
    final filename = 'report_${report.id}_${report.period}.pdf';
    await PdfFileHelper.saveAndOpen(bytes: bytes, filename: filename);
  }
}

final reportsRepositoryProvider =
    Provider<ReportsRepository>((ref) => ReportsRepository());

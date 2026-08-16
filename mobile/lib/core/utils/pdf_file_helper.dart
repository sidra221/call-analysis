import 'pdf_download_impl.dart'
    if (dart.library.html) 'pdf_download_web.dart' as pdf_download;

class PdfFileHelper {
  static Future<void> saveAndOpen({
    required List<int> bytes,
    required String filename,
  }) {
    return pdf_download.saveAndOpenPdf(bytes: bytes, filename: filename);
  }
}

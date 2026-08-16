import 'dart:html' as html;
import 'dart:typed_data';

/// Mirrors React: blob → object URL → programmatic `<a download>`.
Future<void> saveAndOpenPdf({
  required List<int> bytes,
  required String filename,
}) async {
  final safeName = filename.replaceAll(RegExp(r'[^\w.\-]'), '_');
  final blob = html.Blob(
    [Uint8List.fromList(bytes)],
    'application/pdf',
  );
  final url = html.Url.createObjectUrlFromBlob(blob);
  final anchor = html.AnchorElement(href: url)
    ..setAttribute('download', safeName)
    ..style.display = 'none';

  html.document.body?.append(anchor);
  anchor.click();
  anchor.remove();
  html.Url.revokeObjectUrl(url);
}

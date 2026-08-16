import 'dart:io';

import 'package:open_filex/open_filex.dart';
import 'package:path_provider/path_provider.dart';

Future<void> saveAndOpenPdf({
  required List<int> bytes,
  required String filename,
}) async {
  final safeName = filename.replaceAll(RegExp(r'[^\w.\-]'), '_');
  final dir = await getTemporaryDirectory();
  final file = File('${dir.path}/$safeName');
  await file.writeAsBytes(bytes, flush: true);

  final result = await OpenFilex.open(file.path, type: 'application/pdf');
  if (result.type != ResultType.done) {
    throw Exception(result.message);
  }
}

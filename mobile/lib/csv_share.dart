import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

Future<void> shareCsv({
  required String filename,
  required List<String> headers,
  required List<List<String>> rows,
}) async {
  final buf = StringBuffer('\uFEFF');
  buf.writeln(headers.map(_esc).join(','));
  for (final row in rows) {
    buf.writeln(row.map(_esc).join(','));
  }
  final dir = await getTemporaryDirectory();
  final file = File('${dir.path}/$filename');
  await file.writeAsString(buf.toString());
  await Share.shareXFiles([XFile(file.path)], text: filename);
}

String _esc(String value) {
  if (RegExp(r'[",\n\r]').hasMatch(value)) {
    return '"${value.replaceAll('"', '""')}"';
  }
  return value;
}

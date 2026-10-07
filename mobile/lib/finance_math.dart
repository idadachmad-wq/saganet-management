import 'package:intl/intl.dart';

class ProfitShareRates {
  final double ppnRate;
  final double bhpUsoRate;
  final double saganetShare;
  final double ispShare;

  const ProfitShareRates({
    this.ppnRate = 0.11,
    this.bhpUsoRate = 0.0175,
    this.saganetShare = 0.65,
    this.ispShare = 0.35,
  });
}

class ProfitShareBreakdown {
  final int gross;
  final int ppn;
  final int setelahPpn;
  final int bhpuso;
  final int net;
  final int saganet;
  final int isp;
  final ProfitShareRates rates;

  const ProfitShareBreakdown({
    required this.gross,
    required this.ppn,
    required this.setelahPpn,
    required this.bhpuso,
    required this.net,
    required this.saganet,
    required this.isp,
    required this.rates,
  });
}

ProfitShareBreakdown calculateProfitShare(
  int gross, [
  ProfitShareRates rates = const ProfitShareRates(),
]) {
  final safeGross = gross < 0 ? 0 : gross;
  final ppn = (safeGross * rates.ppnRate).round();
  final setelahPpn = safeGross - ppn;
  final bhpuso = (setelahPpn * rates.bhpUsoRate).round();
  final net = setelahPpn - bhpuso;
  final saganet = (net * rates.saganetShare).round();
  final isp = net - saganet;
  return ProfitShareBreakdown(
    gross: safeGross,
    ppn: ppn,
    setelahPpn: setelahPpn,
    bhpuso: bhpuso,
    net: net,
    saganet: saganet,
    isp: isp,
    rates: rates,
  );
}

String formatRp(int amount) {
  final f = NumberFormat.currency(
    locale: 'id_ID',
    symbol: 'Rp',
    decimalDigits: 0,
  );
  return f.format(amount);
}

String formatPercent(double rate) {
  return '${(rate * 100).toStringAsFixed(rate * 100 % 1 == 0 ? 0 : 2)}%';
}

/// Split nominal according to payment method.
/// For `gabungan`, [tunai] + [transfer] become the total amount.
({int amount, int tunai, int transfer}) splitPaymentAmounts({
  required String method,
  required int nominal,
  int tunai = 0,
  int transfer = 0,
}) {
  switch (method) {
    case 'transfer':
      return (amount: nominal, tunai: 0, transfer: nominal);
    case 'gabungan':
      final t = tunai < 0 ? 0 : tunai;
      final tr = transfer < 0 ? 0 : transfer;
      return (amount: t + tr, tunai: t, transfer: tr);
    case 'tunai':
    default:
      return (amount: nominal, tunai: nominal, transfer: 0);
  }
}

int parseRpInput(String raw) {
  final digits = raw.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.isEmpty) return 0;
  return int.tryParse(digits) ?? 0;
}

String? nullIfEmpty(String? value) {
  final t = value?.trim();
  if (t == null || t.isEmpty) return null;
  return t;
}

const financeTabs = <Map<String, String>>[
  {'key': 'invoice', 'label': 'Uang Invoice', 'type': 'masuk'},
  {'key': 'shodaqoh', 'label': 'Uang Shodaqoh', 'type': 'masuk'},
  {'key': 'belanja', 'label': 'Uang Belanja', 'type': 'keluar'},
  {'key': 'dtt', 'label': 'Uang DTT', 'type': 'masuk'},
  {'key': 'voucher_mitra', 'label': 'Uang Voucher Mitra', 'type': 'masuk'},
  {'key': 'tanggungan', 'label': 'Tanggungan Perusahaan', 'type': 'keluar'},
];

import 'package:flutter_test/flutter_test.dart';
import 'package:saganet_mobile/finance_math.dart';

void main() {
  group('calculateProfitShare', () {
    test('splits gross with default rates', () {
      final b = calculateProfitShare(1000000);
      expect(b.ppn, 110000);
      expect(b.setelahPpn, 890000);
      expect(b.bhpuso, 15575);
      expect(b.net, 874425);
      expect(b.saganet + b.isp, b.net);
    });

    test('clamps negative gross to zero', () {
      final b = calculateProfitShare(-100);
      expect(b.gross, 0);
      expect(b.net, 0);
    });
  });

  group('splitPaymentAmounts', () {
    test('tunai puts all on cash', () {
      final s = splitPaymentAmounts(method: 'tunai', nominal: 50000);
      expect(s.amount, 50000);
      expect(s.tunai, 50000);
      expect(s.transfer, 0);
    });

    test('transfer puts all on transfer', () {
      final s = splitPaymentAmounts(method: 'transfer', nominal: 75000);
      expect(s.amount, 75000);
      expect(s.tunai, 0);
      expect(s.transfer, 75000);
    });

    test('gabungan sums tunai + transfer', () {
      final s = splitPaymentAmounts(
        method: 'gabungan',
        nominal: 999999,
        tunai: 20000,
        transfer: 30000,
      );
      expect(s.amount, 50000);
      expect(s.tunai, 20000);
      expect(s.transfer, 30000);
    });
  });

  group('parseRpInput', () {
    test('strips non-digits', () {
      expect(parseRpInput('Rp 1.250.000'), 1250000);
      expect(parseRpInput(''), 0);
    });
  });

  group('nullIfEmpty', () {
    test('trims and nulls blanks', () {
      expect(nullIfEmpty('  '), isNull);
      expect(nullIfEmpty('ok'), 'ok');
    });
  });
}

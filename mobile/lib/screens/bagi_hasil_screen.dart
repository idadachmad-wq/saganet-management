import 'package:flutter/material.dart';
import 'package:saganet_mobile/csv_share.dart';
import 'package:saganet_mobile/data/local_db.dart';
import 'package:saganet_mobile/data/models.dart';
import 'package:saganet_mobile/finance_math.dart';
import 'package:saganet_mobile/theme.dart';

class BagiHasilScreen extends StatefulWidget {
  const BagiHasilScreen({super.key, required this.db});

  final LocalDb db;

  @override
  State<BagiHasilScreen> createState() => _BagiHasilScreenState();
}

class _BagiHasilScreenState extends State<BagiHasilScreen> {
  late String _month;
  List<FinanceRow> _invoices = [];
  ProfitShareBreakdown? _breakdown;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _month =
        '${now.year}-${now.month.toString().padLeft(2, '0')}';
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final all = await widget.db.listFinance(category: 'invoice');
    final invoices = all.where((e) => e.occurredAt.startsWith(_month)).toList();
    final rates = await widget.db.getProfitRates();
    final gross = invoices.fold<int>(0, (s, e) => s + e.amount);
    if (!mounted) return;
    setState(() {
      _invoices = invoices;
      _breakdown = calculateProfitShare(gross, rates);
      _loading = false;
    });
  }

  Future<void> _pickMonth() async {
    final parts = _month.split('-');
    final initial = DateTime(int.parse(parts[0]), int.parse(parts[1]));
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      helpText: 'Pilih bulan (tanggal diabaikan)',
    );
    if (picked == null) return;
    setState(() {
      _month =
          '${picked.year}-${picked.month.toString().padLeft(2, '0')}';
    });
    await _load();
  }

  Future<void> _export() async {
    final b = _breakdown;
    if (b == null) return;
    await shareCsv(
      filename: 'bagi-hasil-$_month.csv',
      headers: const ['bagian', 'nilai'],
      rows: [
        ['Omzet Invoice (Gross)', '${b.gross}'],
        ['PPN ${formatPercent(b.rates.ppnRate)}', '${b.ppn}'],
        ['Setelah PPN', '${b.setelahPpn}'],
        ['BHPUSO ${formatPercent(b.rates.bhpUsoRate)}', '${b.bhpuso}'],
        ['Net bagi hasil', '${b.net}'],
        ['SaGa-Net ${formatPercent(b.rates.saganetShare)}', '${b.saganet}'],
        ['ISP ${formatPercent(b.rates.ispShare)}', '${b.isp}'],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final b = _breakdown;
    return SafeArea(
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Bagi Hasil ISP',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: SagaColors.ink,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: _export,
                      icon: const Icon(Icons.ios_share),
                    ),
                  ],
                ),
                const Text(
                  'Skema: PPN 11% → BHPUSO 1,75% → SaGa-Net 65% / ISP 35%',
                  style: TextStyle(color: SagaColors.muted, fontSize: 13),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _pickMonth,
                  icon: const Icon(Icons.calendar_month),
                  label: Text('Bulan $_month'),
                ),
                const SizedBox(height: 12),
                if (b != null) ...[
                  _KpiGrid(breakdown: b),
                  const SizedBox(height: 16),
                  const Text(
                    'Invoice bulan ini',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  if (_invoices.isEmpty)
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('Belum ada invoice di bulan ini (data lokal).'),
                      ),
                    )
                  else
                    ..._invoices.map(
                      (e) => Card(
                        child: ListTile(
                          title: Text(e.description),
                          subtitle: Text(
                            e.occurredAt.length >= 10
                                ? e.occurredAt.substring(0, 10)
                                : e.occurredAt,
                          ),
                          trailing: Text(
                            formatRp(e.amount),
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ),
                ],
              ],
            ),
    );
  }
}

class _KpiGrid extends StatelessWidget {
  const _KpiGrid({required this.breakdown});
  final ProfitShareBreakdown breakdown;

  @override
  Widget build(BuildContext context) {
    final items = [
      ('Gross', breakdown.gross),
      ('PPN', breakdown.ppn),
      ('Net', breakdown.net),
      ('SaGa-Net', breakdown.saganet),
      ('ISP', breakdown.isp),
    ];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: items
          .map(
            (e) => SizedBox(
              width: (MediaQuery.of(context).size.width - 40) / 2,
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: SagaColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(e.$1,
                        style: const TextStyle(
                            fontSize: 12, color: SagaColors.muted)),
                    const SizedBox(height: 4),
                    Text(
                      formatRp(e.$2),
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: SagaColors.brandStrong,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

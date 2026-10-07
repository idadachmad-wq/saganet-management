import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:saganet_mobile/csv_share.dart';
import 'package:saganet_mobile/data/local_db.dart';
import 'package:saganet_mobile/data/models.dart';
import 'package:saganet_mobile/finance_math.dart';
import 'package:saganet_mobile/theme.dart';
import 'package:saganet_mobile/widgets/empty_state.dart';

class KeuanganScreen extends StatefulWidget {
  const KeuanganScreen({
    super.key,
    required this.db,
    required this.canMutate,
    required this.onChanged,
  });

  final LocalDb db;
  final bool canMutate;
  final VoidCallback onChanged;

  @override
  State<KeuanganScreen> createState() => _KeuanganScreenState();
}

class _KeuanganScreenState extends State<KeuanganScreen> {
  String _tab = 'invoice';
  final _search = TextEditingController();
  String? _dateFrom;
  String? _dateTo;
  List<FinanceRow> _rows = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final rows = await widget.db.listFinance(
      category: _tab,
      query: _search.text,
      dateFrom: _dateFrom,
      dateTo: _dateTo,
    );
    if (!mounted) return;
    setState(() {
      _rows = rows;
      _loading = false;
    });
  }

  int get _masuk =>
      _rows.where((e) => e.type == 'masuk').fold(0, (s, e) => s + e.amount);
  int get _keluar =>
      _rows.where((e) => e.type == 'keluar').fold(0, (s, e) => s + e.amount);

  Future<void> _pickDate({required bool from}) async {
    final initial = DateTime.tryParse(from ? (_dateFrom ?? '') : (_dateTo ?? '')) ??
        DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked == null) return;
    final iso =
        '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
    setState(() {
      if (from) {
        _dateFrom = iso;
      } else {
        _dateTo = iso;
      }
    });
    await _load();
  }

  Future<void> _export() async {
    await shareCsv(
      filename: 'keuangan-$_tab.csv',
      headers: const [
        'tanggal',
        'kategori',
        'tipe',
        'deskripsi',
        'referensi',
        'metode',
        'tunai',
        'transfer',
        'total',
      ],
      rows: _rows
          .map(
            (e) => [
              e.occurredAt.length >= 10 ? e.occurredAt.substring(0, 10) : e.occurredAt,
              e.category,
              e.type,
              e.description,
              e.reference ?? '',
              e.paymentMethod,
              '${e.amountTunai}',
              '${e.amountTransfer}',
              '${e.amount}',
            ],
          )
          .toList(),
    );
  }

  Future<void> _openForm({FinanceRow? existing}) async {
    if (!widget.canMutate) return;
    final desc = TextEditingController(text: existing?.description ?? '');
    final reference = TextEditingController(text: existing?.reference ?? '');
    final amount = TextEditingController(
      text: existing != null ? '${existing.amount}' : '',
    );
    final tunaiCtrl = TextEditingController(
      text: existing != null && existing.paymentMethod == 'gabungan'
          ? '${existing.amountTunai}'
          : '',
    );
    final transferCtrl = TextEditingController(
      text: existing != null && existing.paymentMethod == 'gabungan'
          ? '${existing.amountTransfer}'
          : '',
    );
    var method = existing?.paymentMethod ?? 'tunai';
    var type = existing?.type ??
        (financeTabs.firstWhere((t) => t['key'] == _tab)['type'] ?? 'masuk');
    var occurredDate = existing != null && existing.occurredAt.length >= 10
        ? existing.occurredAt.substring(0, 10)
        : DateTime.now().toIso8601String().substring(0, 10);
    final tabMeta = financeTabs.firstWhere((t) => t['key'] == _tab);

    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: SagaColors.mintCanvas,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
          ),
          child: StatefulBuilder(
            builder: (context, setModal) {
              return SizedBox(
                height: MediaQuery.of(ctx).size.height * 0.75,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      existing == null ? 'Tambah ${tabMeta['label']}' : 'Edit transaksi',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: SagaColors.ink,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: ListView(
                        children: [
                          TextField(
                            controller: desc,
                            decoration: const InputDecoration(labelText: 'Deskripsi *'),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: reference,
                            decoration: const InputDecoration(labelText: 'Referensi'),
                          ),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<String>(
                            // ignore: deprecated_member_use
                            value: type,
                            items: const [
                              DropdownMenuItem(value: 'masuk', child: Text('Masuk')),
                              DropdownMenuItem(value: 'keluar', child: Text('Keluar')),
                            ],
                            onChanged: (v) => setModal(() => type = v ?? type),
                            decoration: const InputDecoration(labelText: 'Jenis'),
                          ),
                          const SizedBox(height: 8),
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: const Text('Tanggal transaksi'),
                            subtitle: Text(occurredDate),
                            trailing: const Icon(Icons.calendar_month),
                            onTap: () async {
                              final initial =
                                  DateTime.tryParse(occurredDate) ?? DateTime.now();
                              final picked = await showDatePicker(
                                context: ctx,
                                initialDate: initial,
                                firstDate: DateTime(2020),
                                lastDate: DateTime.now().add(const Duration(days: 365)),
                              );
                              if (picked == null) return;
                              setModal(() {
                                occurredDate =
                                    '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
                              });
                            },
                          ),
                          DropdownButtonFormField<String>(
                            // ignore: deprecated_member_use
                            value: method,
                            items: const [
                              DropdownMenuItem(value: 'tunai', child: Text('Tunai')),
                              DropdownMenuItem(value: 'transfer', child: Text('Transfer')),
                              DropdownMenuItem(value: 'gabungan', child: Text('Gabungan')),
                            ],
                            onChanged: (v) => setModal(() => method = v ?? method),
                            decoration: const InputDecoration(labelText: 'Metode'),
                          ),
                          const SizedBox(height: 8),
                          if (method != 'gabungan')
                            TextField(
                              controller: amount,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(labelText: 'Nominal'),
                            )
                          else ...[
                            TextField(
                              controller: tunaiCtrl,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(labelText: 'Nominal tunai'),
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              controller: transferCtrl,
                              keyboardType: TextInputType.number,
                              decoration:
                                  const InputDecoration(labelText: 'Nominal transfer'),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () {
                        if (desc.text.trim().isEmpty) return;
                        Navigator.pop(ctx, true);
                      },
                      child: const Text('Simpan'),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );

    final controllers = [desc, reference, amount, tunaiCtrl, transferCtrl];
    if (ok != true) {
      for (final c in controllers) {
        c.dispose();
      }
      return;
    }

    final now = DateTime.now().toUtc().toIso8601String();
    final split = splitPaymentAmounts(
      method: method,
      nominal: parseRpInput(amount.text),
      tunai: parseRpInput(tunaiCtrl.text),
      transfer: parseRpInput(transferCtrl.text),
    );
    final occurredAt = DateTime.parse('${occurredDate}T12:00:00.000Z')
        .toUtc()
        .toIso8601String();

    final row = FinanceRow(
      id: existing?.id ?? const Uuid().v4(),
      category: existing?.category ?? _tab,
      type: type,
      amount: split.amount,
      amountTunai: split.tunai,
      amountTransfer: split.transfer,
      paymentMethod: method,
      description: desc.text.trim(),
      reference: nullIfEmpty(reference.text),
      occurredAt: occurredAt,
      inputAt: existing?.inputAt ?? now,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      dirty: 1,
    );
    for (final c in controllers) {
      c.dispose();
    }

    await widget.db.upsertFinance(row);
    widget.onChanged();
    await _load();
  }

  Future<void> _delete(FinanceRow row) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus transaksi?'),
        content: Text('"${row.description}" akan dihapus (sync saat online).'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFB91C1C)),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    final now = DateTime.now().toUtc().toIso8601String();
    await widget.db.upsertFinance(
      row.copyWith(deletedLocally: 1, dirty: 1, updatedAt: now),
    );
    widget.onChanged();
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Keuangan',
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
                  tooltip: 'Export CSV',
                ),
                if (widget.canMutate)
                  IconButton.filled(
                    onPressed: () => _openForm(),
                    icon: const Icon(Icons.add),
                  ),
              ],
            ),
          ),
          SizedBox(
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: financeTabs.map((t) {
                final selected = t['key'] == _tab;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                    label: Text(t['label']!),
                    selected: selected,
                    onSelected: (_) {
                      setState(() => _tab = t['key']!);
                      _load();
                    },
                    selectedColor: SagaColors.brandSoft,
                    labelStyle: TextStyle(
                      color: selected ? SagaColors.brandStrong : SagaColors.muted,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickDate(from: true),
                    icon: const Icon(Icons.event, size: 16),
                    label: Text(
                      _dateFrom ?? 'Dari',
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickDate(from: false),
                    icon: const Icon(Icons.event, size: 16),
                    label: Text(
                      _dateTo ?? 'Sampai',
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                if (_dateFrom != null || _dateTo != null)
                  IconButton(
                    tooltip: 'Reset filter',
                    onPressed: () {
                      setState(() {
                        _dateFrom = null;
                        _dateTo = null;
                      });
                      _load();
                    },
                    icon: const Icon(Icons.clear),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: TextField(
              controller: _search,
              decoration: const InputDecoration(
                hintText: 'Cari deskripsi / referensi…',
                prefixIcon: Icon(Icons.search),
                isDense: true,
              ),
              onChanged: (_) => _load(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: _MiniKpi(label: 'Masuk', value: formatRp(_masuk), ok: true),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _MiniKpi(label: 'Keluar', value: formatRp(_keluar), ok: false),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _rows.isEmpty
                    ? const EmptyState(
                        icon: Icons.account_balance_wallet_outlined,
                        title: 'Belum ada transaksi lokal',
                        subtitle: 'Tambah entri atau sync dari server.',
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        itemCount: _rows.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, i) {
                          final e = _rows[i];
                          return Card(
                            child: ListTile(
                              title: Text(
                                e.description,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              subtitle: Text(
                                '${e.occurredAt.length >= 10 ? e.occurredAt.substring(0, 10) : e.occurredAt} · ${e.paymentMethod}${e.reference != null ? ' · ${e.reference}' : ''}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: ConstrainedBox(
                                constraints: const BoxConstraints(maxWidth: 110),
                                child: Text(
                                  formatRp(e.amount),
                                  textAlign: TextAlign.end,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: e.type == 'masuk'
                                        ? SagaColors.brandStrong
                                        : const Color(0xFFB91C1C),
                                  ),
                                ),
                              ),
                              onTap: widget.canMutate ? () => _openForm(existing: e) : null,
                              onLongPress:
                                  widget.canMutate ? () => _delete(e) : null,
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _MiniKpi extends StatelessWidget {
  const _MiniKpi({required this.label, required this.value, required this.ok});
  final String label;
  final String value;
  final bool ok;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: SagaColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: SagaColors.muted)),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: ok ? SagaColors.brandStrong : const Color(0xFFB91C1C),
            ),
          ),
        ],
      ),
    );
  }
}

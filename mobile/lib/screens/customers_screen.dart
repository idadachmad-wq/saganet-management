import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:saganet_mobile/data/local_db.dart';
import 'package:saganet_mobile/data/models.dart';
import 'package:saganet_mobile/finance_math.dart';
import 'package:saganet_mobile/theme.dart';
import 'package:saganet_mobile/widgets/empty_state.dart';
import 'package:saganet_mobile/widgets/status_badge.dart';

const _statuses = ['semua', 'aktif', 'isolir', 'putus'];

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({
    super.key,
    required this.db,
    required this.canMutate,
    required this.onChanged,
  });

  final LocalDb db;
  final bool canMutate;
  final VoidCallback onChanged;

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  final _search = TextEditingController();
  String _status = 'semua';
  List<CustomerRow> _rows = [];
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
    final rows =
        await widget.db.listCustomers(query: _search.text, status: _status);
    if (!mounted) return;
    setState(() {
      _rows = rows;
      _loading = false;
    });
  }

  Future<void> _openForm({CustomerRow? existing}) async {
    if (!widget.canMutate) return;
    final name = TextEditingController(text: existing?.name ?? '');
    final nik = TextEditingController(text: existing?.nik ?? '');
    final phone = TextEditingController(text: existing?.phone ?? '');
    final address = TextEditingController(text: existing?.address ?? '');
    final packageName = TextEditingController(text: existing?.packageName ?? '');
    final monthly =
        TextEditingController(text: existing != null ? '${existing.monthlyFee}' : '');
    final ssid = TextEditingController(text: existing?.wifiSsid ?? '');
    final pppoe = TextEditingController(text: existing?.pppoeUser ?? '');
    var status = existing?.status ?? 'aktif';

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
                height: MediaQuery.of(ctx).size.height * 0.8,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      existing == null ? 'Pelanggan baru' : 'Edit pelanggan',
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
                            controller: name,
                            decoration: const InputDecoration(labelText: 'Nama *'),
                          ),
                          TextField(
                            controller: nik,
                            decoration: const InputDecoration(labelText: 'NIK'),
                            keyboardType: TextInputType.number,
                          ),
                          TextField(
                            controller: phone,
                            decoration: const InputDecoration(labelText: 'Telepon'),
                            keyboardType: TextInputType.phone,
                          ),
                          TextField(
                            controller: address,
                            decoration: const InputDecoration(labelText: 'Alamat'),
                            maxLines: 2,
                          ),
                          TextField(
                            controller: packageName,
                            decoration: const InputDecoration(labelText: 'Paket'),
                          ),
                          TextField(
                            controller: monthly,
                            decoration: const InputDecoration(labelText: 'Biaya bulanan'),
                            keyboardType: TextInputType.number,
                          ),
                          TextField(
                            controller: ssid,
                            decoration: const InputDecoration(labelText: 'SSID WiFi'),
                          ),
                          TextField(
                            controller: pppoe,
                            decoration: const InputDecoration(labelText: 'PPPoE user'),
                          ),
                          DropdownButtonFormField<String>(
                            // ignore: deprecated_member_use
                            value: status,
                            items: _statuses
                                .where((s) => s != 'semua')
                                .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                                .toList(),
                            onChanged: (v) => setModal(() => status = v ?? status),
                            decoration: const InputDecoration(labelText: 'Status'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () {
                        if (name.text.trim().isEmpty) return;
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

    final controllers = [name, nik, phone, address, packageName, monthly, ssid, pppoe];
    if (ok != true) {
      for (final c in controllers) {
        c.dispose();
      }
      return;
    }

    final now = DateTime.now().toUtc().toIso8601String();
    final row = CustomerRow(
      id: existing?.id ?? const Uuid().v4(),
      name: name.text.trim(),
      nik: nullIfEmpty(nik.text),
      phone: nullIfEmpty(phone.text),
      address: nullIfEmpty(address.text),
      packageName: nullIfEmpty(packageName.text),
      monthlyFee: parseRpInput(monthly.text),
      wifiSsid: nullIfEmpty(ssid.text),
      pppoeUser: nullIfEmpty(pppoe.text),
      status: status,
      ispPartnerId: existing?.ispPartnerId,
      installedAt: existing?.installedAt,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      dirty: 1,
    );
    for (final c in controllers) {
      c.dispose();
    }

    await widget.db.upsertCustomer(row);
    widget.onChanged();
    await _load();
  }

  Future<void> _delete(CustomerRow row) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus pelanggan?'),
        content: Text('"${row.name}" akan dihapus (sync saat online).'),
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
    await widget.db.upsertCustomer(
      row.copyWith(deletedLocally: 1, dirty: 1, updatedAt: now),
    );
    widget.onChanged();
    await _load();
  }

  void _showActions(CustomerRow r) {
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit_outlined),
              title: const Text('Edit'),
              onTap: () {
                Navigator.pop(ctx);
                _openForm(existing: r);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: Color(0xFFB91C1C)),
              title: const Text('Hapus'),
              onTap: () {
                Navigator.pop(ctx);
                _delete(r);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    '${_rows.length} pelanggan',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: SagaColors.ink,
                        ),
                  ),
                ),
                if (widget.canMutate)
                  FilledButton.icon(
                    onPressed: () => _openForm(),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Tambah'),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _search,
                    decoration: const InputDecoration(
                      hintText: 'Cari nama / telepon…',
                      prefixIcon: Icon(Icons.search),
                      isDense: true,
                    ),
                    onChanged: (_) => _load(),
                  ),
                ),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: _status,
                  items: _statuses
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (v) {
                    setState(() => _status = v ?? 'semua');
                    _load();
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _rows.isEmpty
                    ? EmptyState(
                        icon: Icons.groups_outlined,
                        title: 'Belum ada pelanggan lokal',
                        subtitle: widget.canMutate
                            ? 'Sync dari server atau tambah data baru.'
                            : 'Sync dari server untuk melihat data.',
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                        itemCount: _rows.length,
                        itemBuilder: (context, i) {
                          final r = _rows[i];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              title: Text(
                                r.name,
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                              subtitle: Text(
                                [
                                  if (r.packageName != null && r.packageName!.isNotEmpty)
                                    r.packageName!,
                                  if (r.phone != null) r.phone!,
                                  if (r.address != null) r.address!,
                                ].join(' · '),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (r.dirty == 1) ...[
                                    const Icon(Icons.cloud_upload_outlined,
                                        size: 16, color: SagaColors.muted),
                                    const SizedBox(width: 6),
                                  ],
                                  StatusBadge(r.status, tone: toneForCustomer(r.status)),
                                ],
                              ),
                              onTap: widget.canMutate ? () => _showActions(r) : null,
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

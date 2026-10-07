import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:saganet_mobile/data/local_db.dart';
import 'package:saganet_mobile/data/models.dart';
import 'package:saganet_mobile/finance_math.dart';
import 'package:saganet_mobile/theme.dart';
import 'package:saganet_mobile/widgets/empty_state.dart';
import 'package:saganet_mobile/widgets/status_badge.dart';

const _statuses = ['semua', 'lead', 'survey', 'install', 'aktif', 'batal'];

class PsbScreen extends StatefulWidget {
  const PsbScreen({
    super.key,
    required this.db,
    required this.canMutate,
    required this.onChanged,
  });

  final LocalDb db;
  final bool canMutate;
  final VoidCallback onChanged;

  @override
  State<PsbScreen> createState() => _PsbScreenState();
}

class _PsbScreenState extends State<PsbScreen> {
  final _search = TextEditingController();
  String _status = 'semua';
  List<PsbRow> _rows = [];
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
    final rows = await widget.db.listPsb(query: _search.text, status: _status);
    if (!mounted) return;
    setState(() {
      _rows = rows;
      _loading = false;
    });
  }

  Future<PsbRow> _ensureCustomerFromPsb(PsbRow order) async {
    final now = DateTime.now().toUtc().toIso8601String();
    final monthly = order.packagePrice > 0 ? order.packagePrice : order.fee;
    final installed = order.installDate ?? now;

    if (order.customerId != null) {
      final existing = await widget.db.customerById(order.customerId!);
      if (existing != null) {
        await widget.db.upsertCustomer(
          existing.copyWith(
            name: order.customerName,
            nik: order.nik,
            phone: order.phone,
            address: order.address,
            packageName: order.packageName,
            monthlyFee: monthly,
            wifiSsid: order.wifiSsid,
            pppoeUser: order.pppoeUser,
            status: 'aktif',
            installedAt: installed,
            updatedAt: now,
            dirty: 1,
          ),
        );
        return order;
      }
    }

    final customerId = const Uuid().v4();
    await widget.db.upsertCustomer(
      CustomerRow(
        id: customerId,
        name: order.customerName,
        nik: order.nik,
        phone: order.phone,
        address: order.address,
        packageName: order.packageName,
        monthlyFee: monthly,
        wifiSsid: order.wifiSsid,
        pppoeUser: order.pppoeUser,
        status: 'aktif',
        installedAt: installed,
        createdAt: now,
        updatedAt: now,
        dirty: 1,
      ),
    );
    final linked = order.copyWith(customerId: customerId, updatedAt: now, dirty: 1);
    await widget.db.upsertPsb(linked);
    return linked;
  }

  Future<void> _openForm({PsbRow? existing}) async {
    if (!widget.canMutate) return;
    final name = TextEditingController(text: existing?.customerName ?? '');
    final nik = TextEditingController(text: existing?.nik ?? '');
    final phone = TextEditingController(text: existing?.phone ?? '');
    final address = TextEditingController(text: existing?.address ?? '');
    final packageName = TextEditingController(text: existing?.packageName ?? '');
    final packagePrice =
        TextEditingController(text: existing != null ? '${existing.packagePrice}' : '');
    final fee = TextEditingController(text: existing != null ? '${existing.fee}' : '');
    final installDate = TextEditingController(
      text: existing?.installDate != null && existing!.installDate!.length >= 10
          ? existing.installDate!.substring(0, 10)
          : '',
    );
    final cable = TextEditingController(text: existing?.cableDistance ?? '');
    final ssid = TextEditingController(text: existing?.wifiSsid ?? '');
    final pppoe = TextEditingController(text: existing?.pppoeUser ?? '');
    final wifiPass = TextEditingController(text: existing?.wifiPassword ?? '');
    final notes = TextEditingController(text: existing?.notes ?? '');
    var status = existing?.status ?? 'lead';

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
                height: MediaQuery.of(ctx).size.height * 0.85,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      existing == null ? 'PSB baru' : 'Edit PSB',
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
                            decoration: const InputDecoration(labelText: 'Alamat *'),
                            maxLines: 2,
                          ),
                          TextField(
                            controller: packageName,
                            decoration: const InputDecoration(labelText: 'Paket'),
                          ),
                          TextField(
                            controller: packagePrice,
                            decoration: const InputDecoration(labelText: 'Harga paket'),
                            keyboardType: TextInputType.number,
                          ),
                          TextField(
                            controller: fee,
                            decoration: const InputDecoration(labelText: 'Fee / biaya pasang'),
                            keyboardType: TextInputType.number,
                          ),
                          TextField(
                            controller: installDate,
                            decoration: const InputDecoration(
                              labelText: 'Tgl pasang (YYYY-MM-DD)',
                              hintText: '2026-09-09',
                            ),
                          ),
                          TextField(
                            controller: cable,
                            decoration: const InputDecoration(labelText: 'Jarak kabel'),
                          ),
                          TextField(
                            controller: ssid,
                            decoration: const InputDecoration(labelText: 'SSID WiFi'),
                          ),
                          TextField(
                            controller: pppoe,
                            decoration: const InputDecoration(labelText: 'PPPoE user'),
                          ),
                          TextField(
                            controller: wifiPass,
                            decoration: const InputDecoration(labelText: 'Password WiFi'),
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
                          TextField(
                            controller: notes,
                            decoration: const InputDecoration(labelText: 'Catatan'),
                            maxLines: 2,
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

    final controllers = [
      name, nik, phone, address, packageName, packagePrice, fee,
      installDate, cable, ssid, pppoe, wifiPass, notes,
    ];
    if (ok != true) {
      for (final c in controllers) {
        c.dispose();
      }
      return;
    }

    final now = DateTime.now().toUtc().toIso8601String();
    final install = nullIfEmpty(installDate.text);
    var row = PsbRow(
      id: existing?.id ?? const Uuid().v4(),
      customerName: name.text.trim(),
      nik: nullIfEmpty(nik.text),
      phone: nullIfEmpty(phone.text),
      address: address.text.trim().isEmpty ? '-' : address.text.trim(),
      packageName: nullIfEmpty(packageName.text),
      packagePrice: parseRpInput(packagePrice.text),
      fee: parseRpInput(fee.text),
      installDate: install,
      cableDistance: nullIfEmpty(cable.text),
      wifiSsid: nullIfEmpty(ssid.text),
      pppoeUser: nullIfEmpty(pppoe.text),
      wifiPassword: nullIfEmpty(wifiPass.text),
      status: status,
      notes: nullIfEmpty(notes.text),
      ispPartnerId: existing?.ispPartnerId,
      customerId: existing?.customerId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      dirty: 1,
    );

    for (final c in controllers) {
      c.dispose();
    }

    await widget.db.upsertPsb(row);
    if (row.status == 'aktif') {
      row = await _ensureCustomerFromPsb(row);
    }
    widget.onChanged();
    await _load();
  }

  Future<void> _convert(PsbRow row) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Jadikan pelanggan?'),
        content: Text(
          'PSB "${row.customerName}" akan diaktifkan dan ditautkan ke data pelanggan.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Ya')),
        ],
      ),
    );
    if (confirm != true) return;
    final now = DateTime.now().toUtc().toIso8601String();
    final aktif = row.copyWith(status: 'aktif', updatedAt: now, dirty: 1);
    await widget.db.upsertPsb(aktif);
    await _ensureCustomerFromPsb(aktif);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('PSB dikonversi ke pelanggan')),
      );
    }
    widget.onChanged();
    await _load();
  }

  Future<void> _delete(PsbRow row) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus PSB?'),
        content: Text('"${row.customerName}" akan dihapus (sync saat online).'),
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
    await widget.db.upsertPsb(
      row.copyWith(deletedLocally: 1, dirty: 1, updatedAt: now),
    );
    widget.onChanged();
    await _load();
  }

  void _showActions(PsbRow r) {
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
            if (r.status != 'aktif' || r.customerId == null)
              ListTile(
                leading: const Icon(Icons.person_add_alt_1, color: SagaColors.brand),
                title: const Text('Konversi ke pelanggan'),
                onTap: () {
                  Navigator.pop(ctx);
                  _convert(r);
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
                    '${_rows.length} PSB',
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
                      hintText: 'Cari nama / alamat…',
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
                        icon: Icons.person_add_alt_1_outlined,
                        title: 'Belum ada PSB lokal',
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
                                r.customerName,
                                style: const TextStyle(fontWeight: FontWeight.w700),
                              ),
                              subtitle: Text(
                                [
                                  if (r.packageName != null && r.packageName!.isNotEmpty)
                                    r.packageName!,
                                  r.address,
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
                                  StatusBadge(r.status, tone: toneForPsb(r.status)),
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

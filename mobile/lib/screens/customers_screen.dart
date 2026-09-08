import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:saganet_mobile/data/local_db.dart';
import 'package:saganet_mobile/data/models.dart';

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
    final phone = TextEditingController(text: existing?.phone ?? '');
    final address = TextEditingController(text: existing?.address ?? '');
    var status = existing?.status ?? 'aktif';

    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
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
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    existing == null ? 'Pelanggan baru' : 'Edit pelanggan',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: name,
                    decoration: const InputDecoration(labelText: 'Nama'),
                  ),
                  TextField(
                    controller: phone,
                    decoration: const InputDecoration(labelText: 'Telepon'),
                  ),
                  TextField(
                    controller: address,
                    decoration: const InputDecoration(labelText: 'Alamat'),
                  ),
                  DropdownButtonFormField<String>(
                    value: status,
                    items: _statuses
                        .where((s) => s != 'semua')
                        .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                        .toList(),
                    onChanged: (v) => setModal(() => status = v ?? status),
                    decoration: const InputDecoration(labelText: 'Status'),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    child: const Text('Simpan'),
                  ),
                ],
              );
            },
          ),
        );
      },
    );

    if (ok != true) return;
    final now = DateTime.now().toUtc().toIso8601String();
    final row = existing == null
        ? CustomerRow(
            id: const Uuid().v4(),
            name: name.text.trim(),
            phone: phone.text.trim().isEmpty ? null : phone.text.trim(),
            address: address.text.trim().isEmpty ? null : address.text.trim(),
            status: status,
            createdAt: now,
            updatedAt: now,
            dirty: 1,
          )
        : existing.copyWith(
            name: name.text.trim(),
            phone: phone.text.trim().isEmpty ? null : phone.text.trim(),
            address: address.text.trim().isEmpty ? null : address.text.trim(),
            status: status,
            updatedAt: now,
            dirty: 1,
          );
    await widget.db.upsertCustomer(row);
    widget.onChanged();
    await _load();
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
                    'Pelanggan',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
                if (widget.canMutate)
                  IconButton.filled(
                    onPressed: () => _openForm(),
                    icon: const Icon(Icons.add),
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
                      hintText: 'Cari…',
                      prefixIcon: Icon(Icons.search),
                      isDense: true,
                      border: OutlineInputBorder(),
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
                    ? const Center(child: Text('Belum ada pelanggan lokal'))
                    : ListView.separated(
                        itemCount: _rows.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, i) {
                          final r = _rows[i];
                          return ListTile(
                            title: Text(r.name),
                            subtitle: Text(
                              '${r.status} · ${r.phone ?? '-'} · ${r.address ?? '-'}',
                            ),
                            trailing: r.dirty == 1
                                ? const Icon(Icons.cloud_upload_outlined, size: 18)
                                : null,
                            onTap:
                                widget.canMutate ? () => _openForm(existing: r) : null,
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

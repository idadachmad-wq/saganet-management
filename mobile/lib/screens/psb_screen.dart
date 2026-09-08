import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:saganet_mobile/data/local_db.dart';
import 'package:saganet_mobile/data/models.dart';

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

  Future<void> _openForm({PsbRow? existing}) async {
    if (!widget.canMutate) return;
    final name = TextEditingController(text: existing?.customerName ?? '');
    final phone = TextEditingController(text: existing?.phone ?? '');
    final address = TextEditingController(text: existing?.address ?? '');
    final notes = TextEditingController(text: existing?.notes ?? '');
    var status = existing?.status ?? 'lead';

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
                    existing == null ? 'PSB baru' : 'Edit PSB',
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
                  TextField(
                    controller: notes,
                    decoration: const InputDecoration(labelText: 'Catatan'),
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
        ? PsbRow(
            id: const Uuid().v4(),
            customerName: name.text.trim(),
            phone: phone.text.trim().isEmpty ? null : phone.text.trim(),
            address: address.text.trim().isEmpty ? '-' : address.text.trim(),
            status: status,
            notes: notes.text.trim().isEmpty ? null : notes.text.trim(),
            createdAt: now,
            updatedAt: now,
            dirty: 1,
          )
        : existing.copyWith(
            customerName: name.text.trim(),
            phone: phone.text.trim().isEmpty ? null : phone.text.trim(),
            address: address.text.trim().isEmpty ? '-' : address.text.trim(),
            status: status,
            notes: notes.text.trim().isEmpty ? null : notes.text.trim(),
            updatedAt: now,
            dirty: 1,
          );
    await widget.db.upsertPsb(row);
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
                    'PSB',
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
                    ? const Center(child: Text('Belum ada data PSB lokal'))
                    : ListView.separated(
                        itemCount: _rows.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, i) {
                          final r = _rows[i];
                          return ListTile(
                            title: Text(r.customerName),
                            subtitle: Text('${r.status} · ${r.address}'),
                            trailing: r.dirty == 1
                                ? const Icon(Icons.cloud_upload_outlined, size: 18)
                                : null,
                            onTap: widget.canMutate ? () => _openForm(existing: r) : null,
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

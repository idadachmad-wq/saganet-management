import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:saganet_mobile/rbac.dart';
import 'package:saganet_mobile/theme.dart';

class PenggunaScreen extends StatefulWidget {
  const PenggunaScreen({super.key, required this.currentUserId});

  final String currentUserId;

  @override
  State<PenggunaScreen> createState() => _PenggunaScreenState();
}

class _PenggunaScreenState extends State<PenggunaScreen> {
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await Supabase.instance.client
          .from('profiles')
          .select('id, name, role')
          .order('name');
      if (!mounted) return;
      setState(() {
        _rows = List<Map<String, dynamic>>.from(data as List);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _changeRole(String id, String role) async {
    try {
      await Supabase.instance.client
          .from('profiles')
          .update({'role': role}).eq('id', id);
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Peran diperbarui. User perlu login ulang di web/APK.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Text(
              'Pengguna',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: SagaColors.ink,
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              'Ubah peran di sini. Tambah akun baru tetap lewat web (butuh service role).',
              style: TextStyle(color: SagaColors.muted, fontSize: 13),
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(child: Text(_error!))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _rows.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 8),
                          itemBuilder: (context, i) {
                            final u = _rows[i];
                            final id = u['id'] as String;
                            final role = u['role'] as String? ?? 'teknisi';
                            return Card(
                              child: ListTile(
                                title: Text(u['name'] as String? ?? 'Pengguna'),
                                subtitle: Text(roleLabel(parseRole(role))),
                                trailing: id == widget.currentUserId
                                    ? const Text('Anda',
                                        style: TextStyle(color: SagaColors.muted))
                                    : PopupMenuButton<String>(
                                        onSelected: (v) => _changeRole(id, v),
                                        itemBuilder: (_) => const [
                                          PopupMenuItem(
                                            value: 'super_admin',
                                            child: Text('Super Admin'),
                                          ),
                                          PopupMenuItem(
                                            value: 'admin',
                                            child: Text('Admin'),
                                          ),
                                          PopupMenuItem(
                                            value: 'teknisi',
                                            child: Text('Teknisi'),
                                          ),
                                        ],
                                      ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

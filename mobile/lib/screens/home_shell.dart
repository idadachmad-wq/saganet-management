import 'package:flutter/material.dart';
import 'package:saganet_mobile/auth/auth_controller.dart';
import 'package:saganet_mobile/data/local_db.dart';
import 'package:saganet_mobile/data/sync_engine.dart';
import 'package:saganet_mobile/rbac.dart';
import 'package:saganet_mobile/screens/customers_screen.dart';
import 'package:saganet_mobile/screens/psb_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({
    super.key,
    required this.auth,
    required this.db,
    required this.sync,
  });

  final AuthController auth;
  final LocalDb db;
  final SyncEngine sync;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0;
  int _psbCount = 0;
  int _custCount = 0;
  int _dirty = 0;
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _refreshCounts();
    _autoSync();
  }

  Future<void> _refreshCounts() async {
    final psb = await widget.db.countPsb();
    final cust = await widget.db.countCustomers();
    final dirty = await widget.db.countDirty();
    if (!mounted) return;
    setState(() {
      _psbCount = psb;
      _custCount = cust;
      _dirty = dirty;
    });
  }

  Future<void> _autoSync() async {
    if (await widget.sync.isOnline) {
      await _runSync(silent: true);
    }
  }

  Future<void> _runSync({bool silent = false}) async {
    setState(() => _syncing = true);
    try {
      await widget.sync.syncAll();
      await _refreshCounts();
      if (!silent && mounted) {
        final msg = switch (widget.sync.status) {
          SyncStatus.ok => 'Sinkronisasi selesai',
          SyncStatus.offline => 'Sedang offline',
          SyncStatus.error => widget.sync.lastError ?? 'Sync gagal',
          _ => 'Selesai',
        };
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (e) {
      if (!silent && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sync gagal: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  String get _syncLabel {
    if (_syncing) return 'Menyinkronkan…';
    return switch (widget.sync.status) {
      SyncStatus.offline => 'Offline',
      SyncStatus.error => 'Sync error',
      SyncStatus.ok => 'Tersinkron',
      SyncStatus.syncing => 'Menyinkronkan…',
      SyncStatus.idle => _dirty > 0 ? '$_dirty pending' : 'Siap sync',
    };
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _HomeDashboard(
        name: widget.auth.displayName,
        role: roleLabel(widget.auth.role),
        psbCount: _psbCount,
        custCount: _custCount,
        dirty: _dirty,
        syncLabel: _syncLabel,
        syncing: _syncing,
        onSync: () => _runSync(),
        onSignOut: () => widget.auth.signOut(),
      ),
      PsbScreen(
        db: widget.db,
        canMutate: widget.auth.permissions.canMutatePsb,
        onChanged: _refreshCounts,
      ),
      CustomersScreen(
        db: widget.db,
        canMutate: widget.auth.permissions.canMutatePsb,
        onChanged: _refreshCounts,
      ),
    ];

    return Scaffold(
      body: pages[_tab],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) {
          setState(() => _tab = i);
          _refreshCounts();
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Beranda',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_add_alt_outlined),
            selectedIcon: Icon(Icons.person_add_alt_1),
            label: 'PSB',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Pelanggan',
          ),
        ],
      ),
    );
  }
}

class _HomeDashboard extends StatelessWidget {
  const _HomeDashboard({
    required this.name,
    required this.role,
    required this.psbCount,
    required this.custCount,
    required this.dirty,
    required this.syncLabel,
    required this.syncing,
    required this.onSync,
    required this.onSignOut,
  });

  final String name;
  final String role;
  final int psbCount;
  final int custCount;
  final int dirty;
  final String syncLabel;
  final bool syncing;
  final VoidCallback onSync;
  final VoidCallback onSignOut;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Halo, $name',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    Text(role, style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ),
              ),
              IconButton(
                onPressed: onSignOut,
                icon: const Icon(Icons.logout),
                tooltip: 'Keluar',
              ),
            ],
          ),
          const SizedBox(height: 16),
          Card(
            child: ListTile(
              leading: Icon(
                syncing ? Icons.sync : Icons.cloud_outlined,
                color: Theme.of(context).colorScheme.primary,
              ),
              title: Text(syncLabel),
              subtitle: Text(
                dirty > 0
                    ? '$dirty perubahan menunggu sync'
                    : 'Keuangan & Pengguna hanya di web (online)',
              ),
              trailing: FilledButton.tonal(
                onPressed: syncing ? null : onSync,
                child: const Text('Sync'),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _Kpi(title: 'PSB lokal', value: '$psbCount'),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _Kpi(title: 'Pelanggan lokal', value: '$custCount'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Kpi extends StatelessWidget {
  const _Kpi({required this.title, required this.value});
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.labelMedium),
            const SizedBox(height: 6),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:saganet_mobile/auth/auth_controller.dart';
import 'package:saganet_mobile/config.dart';
import 'package:saganet_mobile/data/local_db.dart';
import 'package:saganet_mobile/data/models.dart';
import 'package:saganet_mobile/data/sync_engine.dart';
import 'package:saganet_mobile/rbac.dart';
import 'package:saganet_mobile/screens/bagi_hasil_screen.dart';
import 'package:saganet_mobile/screens/customers_screen.dart';
import 'package:saganet_mobile/screens/keuangan_screen.dart';
import 'package:saganet_mobile/screens/pengguna_screen.dart';
import 'package:saganet_mobile/screens/psb_screen.dart';
import 'package:saganet_mobile/theme.dart';
import 'package:saganet_mobile/widgets/status_badge.dart';

enum AppPage { home, psb, pelanggan, keuangan, bagiHasil, pengguna }

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
  AppPage _page = AppPage.home;
  final List<AppPage> _history = [AppPage.home];
  int _psbCount = 0;
  int _custCount = 0;
  int _financeCount = 0;
  int _dirty = 0;
  int _psbAktif = 0;
  int _custAktif = 0;
  bool _syncing = false;
  bool _online = true;
  List<PsbRow> _recentPsb = [];
  List<CustomerRow> _recentCust = [];
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;

  @override
  void initState() {
    super.initState();
    _refresh();
    _autoSync();
    _connectivitySub =
        Connectivity().onConnectivityChanged.listen((_) => _refresh());
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }

  Future<void> _refresh() async {
    final online = await widget.sync.isOnline;
    final psb = await widget.db.countPsb();
    final cust = await widget.db.countCustomers();
    final fin = await widget.db.countFinance();
    final dirty = await widget.db.countDirty();
    final psbAktif = await widget.db.countPsb(status: 'aktif');
    final custAktif = await widget.db.countCustomers(status: 'aktif');
    final recentPsb = (await widget.db.listPsb()).take(5).toList();
    final recentCust = (await widget.db.listCustomers()).take(5).toList();
    if (!mounted) return;
    setState(() {
      _online = online;
      _psbCount = psb;
      _custCount = cust;
      _financeCount = fin;
      _dirty = dirty;
      _psbAktif = psbAktif;
      _custAktif = custAktif;
      _recentPsb = recentPsb;
      _recentCust = recentCust;
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
      await _refresh();
      if (!mounted) return;
      if (widget.sync.status == SyncStatus.error) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.sync.lastError ?? 'Sync gagal'),
            backgroundColor: const Color(0xFFB91C1C),
          ),
        );
      } else if (!silent) {
        final msg = switch (widget.sync.status) {
          SyncStatus.ok => 'Sinkronisasi selesai',
          SyncStatus.offline => 'Sedang offline',
          _ => 'Selesai',
        };
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } catch (e) {
      if (mounted) {
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
    if (!_online) return 'Offline';
    return switch (widget.sync.status) {
      SyncStatus.offline => 'Offline',
      SyncStatus.error => 'Sync error',
      SyncStatus.ok => 'Tersinkron',
      SyncStatus.syncing => 'Menyinkronkan…',
      SyncStatus.idle => _dirty > 0 ? '$_dirty pending' : 'Siap sync',
    };
  }

  void _go(AppPage page) {
    Navigator.of(context).maybePop(); // close drawer if open
    if (page == _page) return;
    setState(() {
      if (page == AppPage.home) {
        _history
          ..clear()
          ..add(AppPage.home);
      } else {
        _history.add(page);
      }
      _page = page;
    });
    _refresh();
  }

  bool get _canPopInApp => _history.length > 1;

  void _popPage() {
    if (!_canPopInApp) return;
    setState(() {
      _history.removeLast();
      _page = _history.last;
    });
    _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final perms = widget.auth.permissions;
    final body = switch (_page) {
      AppPage.home => _HomeDashboard(
          name: widget.auth.displayName,
          role: roleLabel(widget.auth.role),
          psbCount: _psbCount,
          custCount: _custCount,
          financeCount: _financeCount,
          dirty: _dirty,
          psbAktif: _psbAktif,
          custAktif: _custAktif,
          online: _online,
          syncLabel: _syncLabel,
          syncing: _syncing,
          canViewFinance: perms.canViewFinance,
          canMutatePsb: perms.canMutatePsb,
          recentPsb: _recentPsb,
          recentCust: _recentCust,
          onSync: () => _runSync(),
          onOpenPsb: () => _go(AppPage.psb),
          onOpenPelanggan: () => _go(AppPage.pelanggan),
          onOpenKeuangan: () => _go(AppPage.keuangan),
          onOpenBagiHasil: () => _go(AppPage.bagiHasil),
        ),
      AppPage.psb => PsbScreen(
          db: widget.db,
          canMutate: perms.canMutatePsb,
          onChanged: _refresh,
        ),
      AppPage.pelanggan => CustomersScreen(
          db: widget.db,
          canMutate: perms.canMutatePsb,
          onChanged: _refresh,
        ),
      AppPage.keuangan => KeuanganScreen(
          db: widget.db,
          canMutate: perms.canMutateFinance,
          onChanged: _refresh,
        ),
      AppPage.bagiHasil => BagiHasilScreen(db: widget.db),
      AppPage.pengguna => PenggunaScreen(
          currentUserId: Supabase.instance.client.auth.currentUser?.id ?? '',
        ),
    };

    return PopScope(
      canPop: !_canPopInApp,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        _popPage();
      },
      child: Scaffold(
        extendBodyBehindAppBar: false,
        appBar: AppBar(
          leading: _canPopInApp
              ? IconButton(
                  tooltip: 'Kembali',
                  icon: const Icon(Icons.arrow_back_rounded),
                  onPressed: _popPage,
                )
              : null,
          title: Text(_titleFor(_page)),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 4),
              child: IconButton(
                tooltip: 'Sync',
                onPressed: _syncing ? null : () => _runSync(),
                icon: AnimatedRotation(
                  turns: _syncing ? 1 : 0,
                  duration: const Duration(milliseconds: 800),
                  child: Icon(_syncing ? Icons.sync : Icons.cloud_sync_outlined),
                ),
              ),
            ),
          ],
        ),
        drawer: Drawer(
          child: SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 16),
              children: [
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [SagaColors.brand, SagaColors.teal],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: SagaColors.brand.withValues(alpha: 0.35),
                        blurRadius: 18,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: const Text(
                          'SaGa-Net',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.1,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        widget.auth.displayName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        roleLabel(widget.auth.role),
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.9)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                _drawerItem(Icons.home_rounded, 'Beranda', AppPage.home),
                _drawerItem(Icons.person_add_alt_1_rounded, 'PSB', AppPage.psb),
                _drawerItem(Icons.groups_rounded, 'Pelanggan', AppPage.pelanggan),
                if (perms.canViewFinance) ...[
                  _drawerItem(Icons.account_balance_wallet_rounded, 'Keuangan', AppPage.keuangan),
                  _drawerItem(Icons.pie_chart_rounded, 'Bagi Hasil ISP', AppPage.bagiHasil),
                ],
                if (perms.canManageUsers)
                  _drawerItem(Icons.manage_accounts_rounded, 'Pengguna', AppPage.pengguna),
                const SizedBox(height: 8),
                const Divider(),
                ListTile(
                  leading: const Icon(Icons.logout_rounded, color: SagaColors.muted),
                  title: const Text('Keluar'),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  onTap: () => widget.auth.signOut(),
                ),
                const SizedBox(height: 8),
                Text(
                  'v${AppConfig.appVersion}+${AppConfig.buildNumber}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: SagaColors.muted, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
        body: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [
                SagaColors.mintCanvas,
                Color(0xFFE8F8EF),
                Color(0xFFDCFCE7),
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: body,
        ),
      ),
    );
  }

  Widget _drawerItem(IconData icon, String label, AppPage page) {
    final selected = _page == page;
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: ListTile(
        leading: Icon(icon, color: selected ? SagaColors.brandStrong : SagaColors.muted),
        title: Text(
          label,
          style: TextStyle(
            fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
            color: selected ? SagaColors.brandStrong : SagaColors.ink,
          ),
        ),
        selected: selected,
        selectedTileColor: SagaColors.brandSoft.withValues(alpha: 0.55),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        onTap: () => _go(page),
      ),
    );
  }

  String _titleFor(AppPage page) => switch (page) {
        AppPage.home => 'Beranda',
        AppPage.psb => 'PSB',
        AppPage.pelanggan => 'Pelanggan',
        AppPage.keuangan => 'Keuangan',
        AppPage.bagiHasil => 'Bagi Hasil ISP',
        AppPage.pengguna => 'Pengguna',
      };
}

class _HomeDashboard extends StatelessWidget {
  const _HomeDashboard({
    required this.name,
    required this.role,
    required this.psbCount,
    required this.custCount,
    required this.financeCount,
    required this.dirty,
    required this.psbAktif,
    required this.custAktif,
    required this.online,
    required this.syncLabel,
    required this.syncing,
    required this.canViewFinance,
    required this.canMutatePsb,
    required this.recentPsb,
    required this.recentCust,
    required this.onSync,
    required this.onOpenPsb,
    required this.onOpenPelanggan,
    required this.onOpenKeuangan,
    required this.onOpenBagiHasil,
  });

  final String name;
  final String role;
  final int psbCount;
  final int custCount;
  final int financeCount;
  final int dirty;
  final int psbAktif;
  final int custAktif;
  final bool online;
  final String syncLabel;
  final bool syncing;
  final bool canViewFinance;
  final bool canMutatePsb;
  final List<PsbRow> recentPsb;
  final List<CustomerRow> recentCust;
  final VoidCallback onSync;
  final VoidCallback onOpenPsb;
  final VoidCallback onOpenPelanggan;
  final VoidCallback onOpenKeuangan;
  final VoidCallback onOpenBagiHasil;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF16A34A), Color(0xFF0D9488), Color(0xFF059669)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: SagaColors.brand.withValues(alpha: 0.35),
                blurRadius: 24,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Stack(
            children: [
              Positioned(
                right: -20,
                top: -20,
                child: Container(
                  width: 110,
                  height: 110,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.08),
                  ),
                ),
              ),
              Positioned(
                right: 30,
                bottom: -40,
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white.withValues(alpha: 0.06),
                  ),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.18),
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: const Text(
                          'SaGa-Net Workspace',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                      const Spacer(),
                      Icon(
                        online ? Icons.wifi_rounded : Icons.wifi_off_rounded,
                        color: Colors.white.withValues(alpha: 0.9),
                        size: 20,
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'Halo, $name',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    role,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.9),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Kelola PSB & pelanggan offline, sync kapan saja online.',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.88),
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: SagaColors.border),
            boxShadow: [
              BoxShadow(
                color: SagaColors.brand.withValues(alpha: 0.06),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: SagaColors.brandSoft.withValues(alpha: 0.65),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  syncing
                      ? Icons.sync_rounded
                      : online
                          ? Icons.cloud_done_rounded
                          : Icons.cloud_off_rounded,
                  color: SagaColors.brandStrong,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      syncLabel,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                        color: SagaColors.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      dirty > 0
                          ? '$dirty perubahan menunggu sync'
                          : online
                              ? 'Data lokal siap dipakai offline'
                              : 'Mode offline — disimpan di HP',
                      style: const TextStyle(
                        color: SagaColors.muted,
                        fontSize: 13,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              FilledButton(
                onPressed: syncing ? null : onSync,
                child: Text(syncing ? '…' : 'Sync'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        LayoutBuilder(
          builder: (context, constraints) {
            final w = (constraints.maxWidth - 10) / 2;
            return Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                SizedBox(
                  width: w,
                  child: _KpiCard(
                    title: 'PSB lokal',
                    value: '$psbCount',
                    hint: '$psbAktif aktif',
                    icon: Icons.person_add_alt_1_rounded,
                  ),
                ),
                SizedBox(
                  width: w,
                  child: _KpiCard(
                    title: 'Pelanggan',
                    value: '$custCount',
                    hint: '$custAktif aktif',
                    icon: Icons.groups_rounded,
                  ),
                ),
                SizedBox(
                  width: w,
                  child: _KpiCard(
                    title: 'Pending sync',
                    value: '$dirty',
                    hint: online ? 'Online' : 'Offline',
                    icon: Icons.cloud_upload_rounded,
                  ),
                ),
                SizedBox(
                  width: w,
                  child: canViewFinance
                      ? _KpiCard(
                          title: 'Keuangan',
                          value: '$financeCount',
                          hint: 'Entri lokal',
                          icon: Icons.account_balance_wallet_rounded,
                        )
                      : const _KpiCard(
                          title: 'Mode',
                          value: 'Field',
                          hint: 'PSB & pelanggan',
                          icon: Icons.engineering_rounded,
                        ),
                ),
              ],
            );
          },
        ),
        const SizedBox(height: 20),
        const Text(
          'Aksi cepat',
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 16,
            color: SagaColors.ink,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _QuickAction(
                label: canMutatePsb ? 'Kelola PSB' : 'Lihat PSB',
                icon: Icons.person_add_alt_1_rounded,
                onTap: onOpenPsb,
                filled: true,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _QuickAction(
                label: 'Pelanggan',
                icon: Icons.groups_rounded,
                onTap: onOpenPelanggan,
              ),
            ),
          ],
        ),
        if (canViewFinance) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _QuickAction(
                  label: 'Keuangan',
                  icon: Icons.account_balance_wallet_rounded,
                  onTap: onOpenKeuangan,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _QuickAction(
                  label: 'Bagi Hasil',
                  icon: Icons.pie_chart_rounded,
                  onTap: onOpenBagiHasil,
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: 22),
        _SectionHeader(title: 'PSB terbaru', onAll: onOpenPsb),
        const SizedBox(height: 8),
        if (recentPsb.isEmpty)
          const _EmptyHint('Belum ada PSB lokal. Sync atau tambah data.')
        else
          ...recentPsb.map(
            (o) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _RecentCard(
                title: o.customerName,
                subtitle: o.address,
                badge: o.status,
                tone: toneForPsb(o.status),
                onTap: onOpenPsb,
              ),
            ),
          ),
        const SizedBox(height: 10),
        _SectionHeader(title: 'Pelanggan terbaru', onAll: onOpenPelanggan),
        const SizedBox(height: 8),
        if (recentCust.isEmpty)
          const _EmptyHint('Belum ada pelanggan lokal.')
        else
          ...recentCust.map(
            (c) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _RecentCard(
                title: c.name,
                subtitle: c.phone ?? c.address ?? '-',
                badge: c.status,
                tone: toneForCustomer(c.status),
                onTap: onOpenPelanggan,
              ),
            ),
          ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.onAll});
  final String title;
  final VoidCallback onAll;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 16,
              color: SagaColors.ink,
            ),
          ),
        ),
        TextButton(onPressed: onAll, child: const Text('Semua')),
      ],
    );
  }
}

class _EmptyHint extends StatelessWidget {
  const _EmptyHint(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: SagaColors.border),
      ),
      child: Text(text, style: const TextStyle(color: SagaColors.muted)),
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.label,
    required this.icon,
    required this.onTap,
    this.filled = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: filled ? SagaColors.brand : Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: filled ? null : Border.all(color: SagaColors.border),
          ),
          child: Row(
            children: [
              Icon(
                icon,
                size: 20,
                color: filled ? Colors.white : SagaColors.brandStrong,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: filled ? Colors.white : SagaColors.ink,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecentCard extends StatelessWidget {
  const _RecentCard({
    required this.title,
    required this.subtitle,
    required this.badge,
    required this.tone,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final String badge;
  final BadgeTone tone;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: SagaColors.border),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontWeight: FontWeight.w800,
                        color: SagaColors.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: SagaColors.muted, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              StatusBadge(badge, tone: tone),
            ],
          ),
        ),
      ),
    );
  }
}

class _KpiCard extends StatelessWidget {
  const _KpiCard({
    required this.title,
    required this.value,
    required this.hint,
    required this.icon,
  });

  final String title;
  final String value;
  final String hint;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: SagaColors.border),
        boxShadow: [
          BoxShadow(
            color: SagaColors.brand.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: SagaColors.brandSoft.withValues(alpha: 0.6),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, size: 18, color: SagaColors.brandStrong),
              ),
              const Spacer(),
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: SagaColors.brand,
                  shape: BoxShape.circle,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(title, style: const TextStyle(fontSize: 12, color: SagaColors.muted)),
          Text(
            value,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: SagaColors.brandStrong,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 2),
          Text(hint, style: const TextStyle(fontSize: 11, color: SagaColors.muted)),
        ],
      ),
    );
  }
}

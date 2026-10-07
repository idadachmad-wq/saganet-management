import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:saganet_mobile/config.dart';
import 'package:saganet_mobile/data/local_db.dart';
import 'package:saganet_mobile/data/models.dart';
import 'package:saganet_mobile/finance_math.dart';

enum SyncStatus { idle, syncing, offline, error, ok }

class SyncEngine {
  SyncEngine(this._db);

  final LocalDb _db;
  SyncStatus status = SyncStatus.idle;
  String? lastError;
  String? lastSyncAt;

  Future<bool> get isOnline async {
    final result = await Connectivity().checkConnectivity();
    return result.any((r) => r != ConnectivityResult.none);
  }

  Future<void> syncAll() async {
    if (!await isOnline) {
      status = SyncStatus.offline;
      return;
    }
    if (!AppConfig.supabaseReady) {
      status = SyncStatus.error;
      lastError = 'Supabase belum siap';
      return;
    }
    final client = Supabase.instance.client;
    if (client.auth.currentSession == null) {
      status = SyncStatus.error;
      lastError = 'Belum login';
      return;
    }

    status = SyncStatus.syncing;
    lastError = null;
    try {
      await _pushCustomers(client);
      await _pushPsb(client);
      await _pushFinance(client);
      await _pullCustomers(client);
      await _pullPsb(client);
      await _pullFinance(client);
      await _reconcileDeletes(client);
      await _pullProfitSettings(client);
      lastSyncAt = DateTime.now().toUtc().toIso8601String();
      await _db.setMeta('last_sync_at', lastSyncAt!);
      status = SyncStatus.ok;
    } catch (e) {
      status = SyncStatus.error;
      lastError = e.toString();
      rethrow;
    }
  }

  Future<void> _pushCustomers(SupabaseClient client) async {
    final dirty = await _db.dirtyCustomers();
    for (final row in dirty) {
      if (row.deletedLocally == 1) {
        await client.from('customers').delete().eq('id', row.id);
        await _db.hardDeleteCustomer(row.id);
        continue;
      }
      await client.from('customers').upsert(row.toRemoteMap());
      await _db.upsertCustomer(row.copyWith(dirty: 0));
    }
  }

  Future<void> _pushPsb(SupabaseClient client) async {
    final dirty = await _db.dirtyPsb();
    for (final row in dirty) {
      if (row.deletedLocally == 1) {
        await client.from('psb_orders').delete().eq('id', row.id);
        await _db.hardDeletePsb(row.id);
        continue;
      }
      await client.from('psb_orders').upsert(row.toRemoteMap());
      await _db.upsertPsb(row.copyWith(dirty: 0));
    }
  }

  Future<void> _pushFinance(SupabaseClient client) async {
    final dirty = await _db.dirtyFinance();
    for (final row in dirty) {
      if (row.deletedLocally == 1) {
        await client.from('finance_entries').delete().eq('id', row.id);
        await _db.hardDeleteFinance(row.id);
        continue;
      }
      await client.from('finance_entries').upsert(row.toRemoteMap());
      await _db.upsertFinance(row.copyWith(dirty: 0));
    }
  }

  Future<void> _pullCustomers(SupabaseClient client) async {
    final since = await _db.meta('last_sync_at');
    final rows = since != null
        ? await client
            .from('customers')
            .select()
            .gt('updated_at', since)
            .order('updated_at')
        : await client.from('customers').select().order('updated_at');
    for (final raw in rows as List) {
      final map = Map<String, dynamic>.from(raw as Map);
      final remote = CustomerRow(
        id: map['id'] as String,
        name: map['name'] as String,
        nik: map['nik'] as String?,
        phone: map['phone'] as String?,
        address: map['address'] as String?,
        packageName: map['package_name'] as String?,
        monthlyFee: (map['monthly_fee'] as num?)?.toInt() ?? 0,
        wifiSsid: map['wifi_ssid'] as String?,
        pppoeUser: map['pppoe_user'] as String?,
        status: (map['status'] as String?) ?? 'aktif',
        ispPartnerId: map['isp_partner_id'] as String?,
        installedAt: map['installed_at'] as String?,
        createdAt:
            map['created_at'] as String? ?? DateTime.now().toUtc().toIso8601String(),
        updatedAt:
            map['updated_at'] as String? ?? DateTime.now().toUtc().toIso8601String(),
        dirty: 0,
      );
      final local = await _db.customerById(remote.id);
      if (local == null || local.dirty == 0) {
        await _db.upsertCustomer(remote);
      } else if (_isRemoteNewer(remote.updatedAt, local.updatedAt)) {
        await _db.upsertCustomer(remote);
      }
    }
  }

  Future<void> _pullPsb(SupabaseClient client) async {
    final since = await _db.meta('last_sync_at');
    final rows = since != null
        ? await client
            .from('psb_orders')
            .select()
            .gt('updated_at', since)
            .order('updated_at')
        : await client.from('psb_orders').select().order('updated_at');
    for (final raw in rows as List) {
      final map = Map<String, dynamic>.from(raw as Map);
      final remote = PsbRow(
        id: map['id'] as String,
        customerName: map['customer_name'] as String,
        nik: map['nik'] as String?,
        phone: map['phone'] as String?,
        address: map['address'] as String? ?? '',
        packageName: map['package_name'] as String?,
        packagePrice: (map['package_price'] as num?)?.toInt() ?? 0,
        fee: (map['fee'] as num?)?.toInt() ?? 0,
        installDate: map['install_date'] as String?,
        cableDistance: map['cable_distance'] as String?,
        wifiSsid: map['wifi_ssid'] as String?,
        pppoeUser: map['pppoe_user'] as String?,
        wifiPassword: map['wifi_password'] as String?,
        status: (map['status'] as String?) ?? 'lead',
        notes: map['notes'] as String?,
        ispPartnerId: map['isp_partner_id'] as String?,
        customerId: map['customer_id'] as String?,
        createdAt:
            map['created_at'] as String? ?? DateTime.now().toUtc().toIso8601String(),
        updatedAt:
            map['updated_at'] as String? ?? DateTime.now().toUtc().toIso8601String(),
        dirty: 0,
      );
      final local = await _db.psbById(remote.id);
      if (local == null || local.dirty == 0) {
        await _db.upsertPsb(remote);
      } else if (_isRemoteNewer(remote.updatedAt, local.updatedAt)) {
        await _db.upsertPsb(remote);
      }
    }
  }

  Future<void> _pullFinance(SupabaseClient client) async {
    final since = await _db.meta('last_sync_at');
    final rows = since != null
        ? await client
            .from('finance_entries')
            .select()
            .gt('updated_at', since)
            .order('updated_at')
        : await client.from('finance_entries').select().order('updated_at');
    for (final raw in rows as List) {
      final map = Map<String, dynamic>.from(raw as Map);
      final now = DateTime.now().toUtc().toIso8601String();
      final remote = FinanceRow(
        id: map['id'] as String,
        category: map['category'] as String,
        type: (map['type'] as String?) ?? 'masuk',
        amount: (map['amount'] as num?)?.toInt() ?? 0,
        amountTunai: (map['amount_tunai'] as num?)?.toInt() ?? 0,
        amountTransfer: (map['amount_transfer'] as num?)?.toInt() ?? 0,
        paymentMethod: (map['payment_method'] as String?) ?? 'tunai',
        description: map['description'] as String? ?? '',
        reference: map['reference'] as String?,
        occurredAt: map['occurred_at'] as String? ?? now,
        inputAt: map['input_at'] as String? ?? now,
        createdAt: map['created_at'] as String? ?? now,
        updatedAt: map['updated_at'] as String? ?? now,
        dirty: 0,
      );
      final local = await _db.financeById(remote.id);
      if (local == null || local.dirty == 0) {
        await _db.upsertFinance(remote);
      } else if (_isRemoteNewer(remote.updatedAt, local.updatedAt)) {
        await _db.upsertFinance(remote);
      }
    }
  }

  Future<void> _reconcileDeletes(SupabaseClient client) async {
    final customers = await client.from('customers').select('id');
    await _db.purgeCustomersMissingFrom({
      for (final r in customers as List) (r as Map)['id'] as String,
    });

    final psb = await client.from('psb_orders').select('id');
    await _db.purgePsbMissingFrom({
      for (final r in psb as List) (r as Map)['id'] as String,
    });

    final finance = await client.from('finance_entries').select('id');
    await _db.purgeFinanceMissingFrom({
      for (final r in finance as List) (r as Map)['id'] as String,
    });
  }

  Future<void> _pullProfitSettings(SupabaseClient client) async {
    final rows = await client.from('profit_share_settings').select().limit(1);
    if (rows.isEmpty) return;
    final map = Map<String, dynamic>.from(rows.first as Map);
    await _db.setProfitRates(
      ProfitShareRates(
        ppnRate: (map['ppn_rate'] as num?)?.toDouble() ?? 0.11,
        bhpUsoRate: (map['bhp_uso_rate'] as num?)?.toDouble() ?? 0.0175,
        saganetShare: (map['saganet_share'] as num?)?.toDouble() ?? 0.65,
        ispShare: (map['isp_share'] as num?)?.toDouble() ?? 0.35,
      ),
      id: map['id'] as String? ?? 'default',
    );
  }

  bool _isRemoteNewer(String remote, String local) {
    return DateTime.parse(remote).isAfter(DateTime.parse(local));
  }
}

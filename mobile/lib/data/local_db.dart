import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import 'package:saganet_mobile/data/models.dart';
import 'package:saganet_mobile/finance_math.dart';

class LocalDb {
  LocalDb._();
  static final LocalDb instance = LocalDb._();

  Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    final dir = await getApplicationDocumentsDirectory();
    final path = p.join(dir.path, 'saganet_offline.db');
    _db = await openDatabase(
      path,
      version: 2,
      onCreate: (db, version) async {
        await _createV1(db);
        await _createV2(db);
      },
      onUpgrade: (db, oldVersion, newVersion) async {
        if (oldVersion < 2) await _createV2(db);
      },
    );
    return _db!;
  }

  Future<void> _createV1(Database db) async {
    await db.execute('''
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nik TEXT,
  phone TEXT,
  address TEXT,
  package_name TEXT,
  monthly_fee INTEGER NOT NULL DEFAULT 0,
  wifi_ssid TEXT,
  pppoe_user TEXT,
  status TEXT NOT NULL DEFAULT 'aktif',
  isp_partner_id TEXT,
  installed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0,
  deleted_locally INTEGER NOT NULL DEFAULT 0
)''');
    await db.execute('''
CREATE TABLE IF NOT EXISTS psb_orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  nik TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  package_name TEXT,
  package_price INTEGER NOT NULL DEFAULT 0,
  fee INTEGER NOT NULL DEFAULT 0,
  install_date TEXT,
  cable_distance TEXT,
  wifi_ssid TEXT,
  pppoe_user TEXT,
  wifi_password TEXT,
  status TEXT NOT NULL DEFAULT 'lead',
  notes TEXT,
  isp_partner_id TEXT,
  customer_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0,
  deleted_locally INTEGER NOT NULL DEFAULT 0
)''');
    await db.execute('''
CREATE TABLE IF NOT EXISTS isp_partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  phone TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
)''');
    await db.execute('''
CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)''');
  }

  Future<void> _createV2(Database db) async {
    await db.execute('''
CREATE TABLE IF NOT EXISTS finance_entries (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  amount_tunai INTEGER NOT NULL DEFAULT 0,
  amount_transfer INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'tunai',
  description TEXT NOT NULL,
  reference TEXT,
  occurred_at TEXT NOT NULL,
  input_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  dirty INTEGER NOT NULL DEFAULT 0,
  deleted_locally INTEGER NOT NULL DEFAULT 0
)''');
    await db.execute('''
CREATE TABLE IF NOT EXISTS profit_share_settings (
  id TEXT PRIMARY KEY,
  ppn_rate REAL NOT NULL,
  bhp_uso_rate REAL NOT NULL,
  saganet_share REAL NOT NULL,
  isp_share REAL NOT NULL
)''');
  }

  Future<String?> meta(String key) async {
    final db = await database;
    final rows = await db.query(
      'sync_meta',
      where: 'key = ?',
      whereArgs: [key],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return rows.first['value'] as String?;
  }

  Future<void> setMeta(String key, String value) async {
    final db = await database;
    await db.insert(
      'sync_meta',
      {'key': key, 'value': value},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<CustomerRow>> listCustomers({String? query, String? status}) async {
    final db = await database;
    final where = <String>['deleted_locally = 0'];
    final args = <Object?>[];
    if (status != null && status.isNotEmpty && status != 'semua') {
      where.add('status = ?');
      args.add(status);
    }
    if (query != null && query.trim().isNotEmpty) {
      where.add('(name LIKE ? OR phone LIKE ? OR address LIKE ?)');
      final q = '%${query.trim()}%';
      args.addAll([q, q, q]);
    }
    final rows = await db.query(
      'customers',
      where: where.join(' AND '),
      whereArgs: args,
      orderBy: 'updated_at DESC',
    );
    return rows.map(CustomerRow.fromMap).toList();
  }

  Future<void> upsertCustomer(CustomerRow row) async {
    final db = await database;
    await db.insert(
      'customers',
      row.toLocalMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> hardDeleteCustomer(String id) async {
    final db = await database;
    await db.delete('customers', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> purgeCustomersMissingFrom(Set<String> remoteIds) async {
    final db = await database;
    final rows = await db.query('customers', columns: ['id', 'dirty']);
    for (final r in rows) {
      final id = r['id'] as String;
      if ((r['dirty'] as int?) == 1) continue;
      if (!remoteIds.contains(id)) {
        await db.delete('customers', where: 'id = ?', whereArgs: [id]);
      }
    }
  }

  Future<List<CustomerRow>> dirtyCustomers() async {
    final db = await database;
    final rows = await db.query('customers', where: 'dirty = 1');
    return rows.map(CustomerRow.fromMap).toList();
  }

  Future<CustomerRow?> customerById(String id) async {
    final db = await database;
    final rows = await db.query(
      'customers',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return CustomerRow.fromMap(rows.first);
  }

  Future<int> countCustomers({String? status}) async {
    final db = await database;
    if (status == null) {
      final r = await db.rawQuery(
        'SELECT COUNT(*) AS c FROM customers WHERE deleted_locally = 0',
      );
      return Sqflite.firstIntValue(r) ?? 0;
    }
    final r = await db.rawQuery(
      'SELECT COUNT(*) AS c FROM customers WHERE deleted_locally = 0 AND status = ?',
      [status],
    );
    return Sqflite.firstIntValue(r) ?? 0;
  }

  Future<List<PsbRow>> listPsb({String? query, String? status}) async {
    final db = await database;
    final where = <String>['deleted_locally = 0'];
    final args = <Object?>[];
    if (status != null && status.isNotEmpty && status != 'semua') {
      where.add('status = ?');
      args.add(status);
    }
    if (query != null && query.trim().isNotEmpty) {
      where.add('(customer_name LIKE ? OR phone LIKE ? OR address LIKE ?)');
      final q = '%${query.trim()}%';
      args.addAll([q, q, q]);
    }
    final rows = await db.query(
      'psb_orders',
      where: where.join(' AND '),
      whereArgs: args,
      orderBy: 'updated_at DESC',
    );
    return rows.map(PsbRow.fromMap).toList();
  }

  Future<void> upsertPsb(PsbRow row) async {
    final db = await database;
    await db.insert(
      'psb_orders',
      row.toLocalMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> hardDeletePsb(String id) async {
    final db = await database;
    await db.delete('psb_orders', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> purgePsbMissingFrom(Set<String> remoteIds) async {
    final db = await database;
    final rows = await db.query('psb_orders', columns: ['id', 'dirty']);
    for (final r in rows) {
      final id = r['id'] as String;
      if ((r['dirty'] as int?) == 1) continue;
      if (!remoteIds.contains(id)) {
        await db.delete('psb_orders', where: 'id = ?', whereArgs: [id]);
      }
    }
  }

  Future<List<PsbRow>> dirtyPsb() async {
    final db = await database;
    final rows = await db.query('psb_orders', where: 'dirty = 1');
    return rows.map(PsbRow.fromMap).toList();
  }

  Future<PsbRow?> psbById(String id) async {
    final db = await database;
    final rows = await db.query(
      'psb_orders',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return PsbRow.fromMap(rows.first);
  }

  Future<int> countPsb({String? status}) async {
    final db = await database;
    if (status == null) {
      final r = await db.rawQuery(
        'SELECT COUNT(*) AS c FROM psb_orders WHERE deleted_locally = 0',
      );
      return Sqflite.firstIntValue(r) ?? 0;
    }
    final r = await db.rawQuery(
      'SELECT COUNT(*) AS c FROM psb_orders WHERE deleted_locally = 0 AND status = ?',
      [status],
    );
    return Sqflite.firstIntValue(r) ?? 0;
  }

  Future<List<FinanceRow>> listFinance({
    String? category,
    String? query,
    String? dateFrom,
    String? dateTo,
  }) async {
    final db = await database;
    final where = <String>['deleted_locally = 0'];
    final args = <Object?>[];
    if (category != null && category.isNotEmpty) {
      where.add('category = ?');
      args.add(category);
    }
    if (dateFrom != null && dateFrom.isNotEmpty) {
      where.add('substr(occurred_at,1,10) >= ?');
      args.add(dateFrom);
    }
    if (dateTo != null && dateTo.isNotEmpty) {
      where.add('substr(occurred_at,1,10) <= ?');
      args.add(dateTo);
    }
    if (query != null && query.trim().isNotEmpty) {
      where.add('(description LIKE ? OR reference LIKE ?)');
      final q = '%${query.trim()}%';
      args.addAll([q, q]);
    }
    final rows = await db.query(
      'finance_entries',
      where: where.join(' AND '),
      whereArgs: args,
      orderBy: 'occurred_at DESC',
    );
    return rows.map(FinanceRow.fromMap).toList();
  }

  Future<void> upsertFinance(FinanceRow row) async {
    final db = await database;
    await db.insert(
      'finance_entries',
      row.toLocalMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> hardDeleteFinance(String id) async {
    final db = await database;
    await db.delete('finance_entries', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> purgeFinanceMissingFrom(Set<String> remoteIds) async {
    final db = await database;
    final rows = await db.query('finance_entries', columns: ['id', 'dirty']);
    for (final r in rows) {
      final id = r['id'] as String;
      if ((r['dirty'] as int?) == 1) continue;
      if (!remoteIds.contains(id)) {
        await db.delete('finance_entries', where: 'id = ?', whereArgs: [id]);
      }
    }
  }

  Future<List<FinanceRow>> dirtyFinance() async {
    final db = await database;
    final rows = await db.query('finance_entries', where: 'dirty = 1');
    return rows.map(FinanceRow.fromMap).toList();
  }

  Future<FinanceRow?> financeById(String id) async {
    final db = await database;
    final rows = await db.query(
      'finance_entries',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return FinanceRow.fromMap(rows.first);
  }

  Future<int> countFinance() async {
    final db = await database;
    final r = await db.rawQuery(
      'SELECT COUNT(*) AS c FROM finance_entries WHERE deleted_locally = 0',
    );
    return Sqflite.firstIntValue(r) ?? 0;
  }

  Future<void> setProfitRates(ProfitShareRates rates, {String id = 'default'}) async {
    final db = await database;
    await db.insert(
      'profit_share_settings',
      {
        'id': id,
        'ppn_rate': rates.ppnRate,
        'bhp_uso_rate': rates.bhpUsoRate,
        'saganet_share': rates.saganetShare,
        'isp_share': rates.ispShare,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<ProfitShareRates> getProfitRates() async {
    final db = await database;
    final rows = await db.query('profit_share_settings', limit: 1);
    if (rows.isEmpty) return const ProfitShareRates();
    final m = rows.first;
    return ProfitShareRates(
      ppnRate: (m['ppn_rate'] as num?)?.toDouble() ?? 0.11,
      bhpUsoRate: (m['bhp_uso_rate'] as num?)?.toDouble() ?? 0.0175,
      saganetShare: (m['saganet_share'] as num?)?.toDouble() ?? 0.65,
      ispShare: (m['isp_share'] as num?)?.toDouble() ?? 0.35,
    );
  }

  Future<int> countDirty() async {
    final db = await database;
    final r = await db.rawQuery(
      'SELECT '
      '(SELECT COUNT(*) FROM customers WHERE dirty = 1) + '
      '(SELECT COUNT(*) FROM psb_orders WHERE dirty = 1) + '
      '(SELECT COUNT(*) FROM finance_entries WHERE dirty = 1) AS c',
    );
    return Sqflite.firstIntValue(r) ?? 0;
  }
}

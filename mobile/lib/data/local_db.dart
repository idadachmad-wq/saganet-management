import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import 'package:saganet_mobile/data/models.dart';

/// SQLite lokal (mirror Supabase). MVP memakai sqflite agar tanpa build_runner;
/// schema & sync LWW setara rencana Drift.
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
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
CREATE TABLE customers (
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
CREATE TABLE psb_orders (
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
CREATE TABLE isp_partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  phone TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
)''');
        await db.execute('''
CREATE TABLE sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)''');
      },
    );
    return _db!;
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

  Future<int> countCustomers() async {
    final db = await database;
    final r = await db.rawQuery(
      'SELECT COUNT(*) AS c FROM customers WHERE deleted_locally = 0',
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

  Future<int> countPsb() async {
    final db = await database;
    final r = await db.rawQuery(
      'SELECT COUNT(*) AS c FROM psb_orders WHERE deleted_locally = 0',
    );
    return Sqflite.firstIntValue(r) ?? 0;
  }

  Future<int> countDirty() async {
    final db = await database;
    final r = await db.rawQuery(
      'SELECT '
      '(SELECT COUNT(*) FROM customers WHERE dirty = 1) + '
      '(SELECT COUNT(*) FROM psb_orders WHERE dirty = 1) AS c',
    );
    return Sqflite.firstIntValue(r) ?? 0;
  }
}

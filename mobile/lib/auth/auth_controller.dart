import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:saganet_mobile/rbac.dart';

class AuthController extends ChangeNotifier {
  AuthController();

  final _storage = const FlutterSecureStorage();
  static const _roleKey = 'saganet_role';
  static const _nameKey = 'saganet_name';

  AppRole role = AppRole.teknisi;
  String displayName = 'Pengguna';
  bool ready = false;
  String? error;

  bool get isLoggedIn => Supabase.instance.client.auth.currentSession != null;

  Permissions get permissions => Permissions.forRole(role);

  Future<void> restore() async {
    final session = Supabase.instance.client.auth.currentSession;
    final storedRole = await _storage.read(key: _roleKey);
    final storedName = await _storage.read(key: _nameKey);
    if (storedRole != null) role = parseRole(storedRole);
    if (storedName != null) displayName = storedName;
    if (session != null) {
      await _refreshProfile(online: true);
    }
    ready = true;
    notifyListeners();
  }

  Future<void> signIn(String email, String password) async {
    error = null;
    notifyListeners();
    try {
      await Supabase.instance.client.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );
      await _refreshProfile(online: true);
      notifyListeners();
    } catch (e) {
      error = 'Login gagal. Periksa email/password atau koneksi.';
      notifyListeners();
      rethrow;
    }
  }

  Future<void> signOut() async {
    try {
      await Supabase.instance.client.auth.signOut();
    } catch (_) {}
    await _storage.delete(key: _roleKey);
    await _storage.delete(key: _nameKey);
    role = AppRole.teknisi;
    displayName = 'Pengguna';
    notifyListeners();
  }

  Future<void> _refreshProfile({required bool online}) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    if (online) {
      try {
        final row = await Supabase.instance.client
            .from('profiles')
            .select('name, role')
            .eq('id', user.id)
            .maybeSingle();
        if (row != null) {
          role = parseRole(row['role'] as String?);
          displayName = (row['name'] as String?)?.isNotEmpty == true
              ? row['name'] as String
              : (user.email?.split('@').first ?? 'Pengguna');
          await _storage.write(key: _roleKey, value: row['role'] as String? ?? 'teknisi');
          await _storage.write(key: _nameKey, value: displayName);
          return;
        }
      } catch (_) {
        // fall through to cached role
      }
    }

    displayName = (await _storage.read(key: _nameKey)) ??
        user.email?.split('@').first ??
        'Pengguna';
    final cached = await _storage.read(key: _roleKey);
    if (cached != null) role = parseRole(cached);
  }
}

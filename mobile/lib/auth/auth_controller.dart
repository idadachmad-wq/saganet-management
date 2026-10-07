import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:saganet_mobile/config.dart';
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

  bool get isLoggedIn {
    if (!AppConfig.supabaseReady) return false;
    try {
      return Supabase.instance.client.auth.currentSession != null;
    } catch (_) {
      return false;
    }
  }

  Permissions get permissions => Permissions.forRole(role);

  Future<void> restore() async {
    final storedRole = await _storage.read(key: _roleKey);
    final storedName = await _storage.read(key: _nameKey);
    if (storedRole != null) role = parseRole(storedRole);
    if (storedName != null) displayName = storedName;

    if (!AppConfig.supabaseReady) {
      ready = true;
      notifyListeners();
      return;
    }

    try {
      final session = Supabase.instance.client.auth.currentSession;
      if (session != null) {
        await _refreshProfile(online: true);
      }
    } catch (e) {
      debugPrint('restore session: $e');
    }

    ready = true;
    notifyListeners();
  }

  Future<void> signIn(String email, String password) async {
    if (!AppConfig.supabaseReady) {
      error = 'Supabase belum dikonfigurasi di build APK.';
      notifyListeners();
      throw StateError(error!);
    }
    error = null;
    notifyListeners();
    try {
      final cleaned = email.trim().toLowerCase();
      await Supabase.instance.client.auth.signInWithPassword(
        email: cleaned,
        password: password,
      );
      await _refreshProfile(online: true);
      notifyListeners();
    } on AuthException catch (e) {
      final detail = e.message.trim();
      if (detail.toLowerCase().contains('invalid login credentials') ||
          detail.toLowerCase().contains('invalid_credentials')) {
        error =
            'Email/password salah, atau akun belum ada di Supabase Authentication.';
      } else if (detail.toLowerCase().contains('email not confirmed')) {
        error = 'Email belum dikonfirmasi di Supabase.';
      } else {
        error = detail.isNotEmpty ? detail : 'Login gagal.';
      }
      notifyListeners();
      rethrow;
    } catch (e) {
      final raw = e.toString();
      if (raw.contains('SocketException') ||
          raw.contains('Failed host lookup') ||
          raw.contains('Network is unreachable') ||
          raw.contains('ClientException')) {
        error = 'Tidak bisa terhubung ke server. Cek Wi-Fi / kuota data.';
      } else {
        error = 'Login gagal: $raw';
      }
      notifyListeners();
      rethrow;
    }
  }

  Future<void> signOut() async {
    if (AppConfig.supabaseReady) {
      try {
        await Supabase.instance.client.auth.signOut();
      } catch (_) {}
    }
    await _storage.delete(key: _roleKey);
    await _storage.delete(key: _nameKey);
    role = AppRole.teknisi;
    displayName = 'Pengguna';
    notifyListeners();
  }

  Future<void> _refreshProfile({required bool online}) async {
    if (!AppConfig.supabaseReady) return;
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
          await _storage.write(
            key: _roleKey,
            value: row['role'] as String? ?? 'teknisi',
          );
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

/// Compile-time config. Isi via:
/// `flutter run --dart-define-from-file=dart_defines.json`
/// atau `--dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...`
class AppConfig {
  static const appName = 'SaGa-Net Offline';
  static const appVersion = '0.2.0';
  static const buildNumber = '2';

  static const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );
  static const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  /// Di-set true setelah `Supabase.initialize` sukses.
  static bool supabaseReady = false;

  static bool get hasSupabaseConfig =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;
}

import 'package:flutter/material.dart';
import 'package:saganet_mobile/auth/auth_controller.dart';
import 'package:saganet_mobile/config.dart';
import 'package:saganet_mobile/data/local_db.dart';
import 'package:saganet_mobile/data/sync_engine.dart';
import 'package:saganet_mobile/screens/home_shell.dart';
import 'package:saganet_mobile/screens/login_screen.dart';
import 'package:saganet_mobile/theme.dart';

class SagaApp extends StatefulWidget {
  const SagaApp({super.key});

  @override
  State<SagaApp> createState() => _SagaAppState();
}

class _SagaAppState extends State<SagaApp> {
  final auth = AuthController();
  final db = LocalDb.instance;
  late final SyncEngine sync = SyncEngine(db);
  bool _bootstrapped = false;
  String? _bootError;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    try {
      if (!AppConfig.hasSupabaseConfig || !AppConfig.supabaseReady) {
        _bootError =
            'APK belum berisi konfigurasi Supabase.\n\n'
            'Build ulang dengan:\n'
            'flutter build apk --release \\\n'
            '--dart-define-from-file=dart_defines.json';
        return;
      }

      await db.database;
      await auth.restore();
      auth.addListener(_onAuth);
    } catch (e) {
      _bootError = e.toString();
    } finally {
      if (mounted) setState(() => _bootstrapped = true);
    }
  }

  void _onAuth() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    auth.removeListener(_onAuth);
    auth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConfig.appName,
      theme: SagaTheme.light(),
      darkTheme: SagaTheme.dark(),
      home: !_bootstrapped
          ? const _BrandSplash()
          : _bootError != null
              ? Scaffold(
                  body: Container(
                    width: double.infinity,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [SagaColors.mintCanvas, SagaColors.brandSoft],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                    child: SafeArea(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.error_outline,
                                  size: 48, color: Color(0xFFB91C1C)),
                              const SizedBox(height: 16),
                              Text(
                                _bootError!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  height: 1.4,
                                  color: SagaColors.ink,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                )
              : auth.isLoggedIn
                  ? HomeShell(auth: auth, db: db, sync: sync)
                  : LoginScreen(auth: auth),
    );
  }
}

class _BrandSplash extends StatelessWidget {
  const _BrandSplash();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [SagaColors.brand, SagaColors.teal, Color(0xFF059669)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'SaGa-Net',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Workspace Offline',
                style: TextStyle(color: Colors.white70, fontSize: 16),
              ),
              const SizedBox(height: 28),
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 48),
              Text(
                'v${AppConfig.appVersion}+${AppConfig.buildNumber}',
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:saganet_mobile/auth/auth_controller.dart';
import 'package:saganet_mobile/config.dart';
import 'package:saganet_mobile/data/local_db.dart';
import 'package:saganet_mobile/data/sync_engine.dart';
import 'package:saganet_mobile/screens/home_shell.dart';
import 'package:saganet_mobile/screens/login_screen.dart';
import 'package:saganet_mobile/theme.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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
      if (AppConfig.hasSupabase) {
        await Supabase.initialize(
          url: AppConfig.supabaseUrl,
          anonKey: AppConfig.supabaseAnonKey,
          authOptions: const FlutterAuthClientOptions(
            authFlowType: AuthFlowType.pkce,
          ),
        );
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
      title: 'SaGa-Net Offline',
      theme: SagaTheme.light(),
      darkTheme: SagaTheme.dark(),
      home: !_bootstrapped
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : _bootError != null
              ? Scaffold(
                  body: Center(child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text('Gagal mulai: $_bootError'),
                  )),
                )
              : !AppConfig.hasSupabase
                  ? const Scaffold(
                      body: Center(
                        child: Padding(
                          padding: EdgeInsets.all(24),
                          child: Text(
                            'Jalankan dengan:\n'
                            'flutter run \\\n'
                            '--dart-define=SUPABASE_URL=... \\\n'
                            '--dart-define=SUPABASE_ANON_KEY=...',
                            textAlign: TextAlign.center,
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

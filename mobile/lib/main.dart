import 'package:flutter/material.dart';
import 'package:saganet_mobile/app.dart';
import 'package:saganet_mobile/config.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (AppConfig.hasSupabaseConfig) {
    await Supabase.initialize(
      url: AppConfig.supabaseUrl,
      // Prefer publishableKey untuk format sb_publishable_...
      publishableKey: AppConfig.supabaseAnonKey,
    );
    AppConfig.supabaseReady = true;
  }

  runApp(const SagaApp());
}

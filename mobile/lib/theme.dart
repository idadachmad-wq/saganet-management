import 'package:flutter/material.dart';

class SagaTheme {
  static const brand = Color(0xFF16A34A);
  static const brandDark = Color(0xFF04140C);

  static ThemeData light() {
    final base = ColorScheme.fromSeed(
      seedColor: brand,
      brightness: Brightness.light,
    );
    return ThemeData(
      colorScheme: base.copyWith(primary: brand),
      useMaterial3: true,
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFFF0FDF4),
        foregroundColor: Color(0xFF052E16),
        elevation: 0,
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: brand,
        foregroundColor: Colors.white,
      ),
    );
  }

  static ThemeData dark() {
    final base = ColorScheme.fromSeed(
      seedColor: brand,
      brightness: Brightness.dark,
    );
    return ThemeData(
      colorScheme: base.copyWith(primary: const Color(0xFF4ADE80)),
      useMaterial3: true,
      scaffoldBackgroundColor: brandDark,
    );
  }
}

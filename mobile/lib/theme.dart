import 'package:flutter/material.dart';

class SagaColors {
  static const mintCanvas = Color(0xFFF0FDF6);
  static const forestNight = Color(0xFF04140C);
  static const brand = Color(0xFF16A34A);
  static const brandSoft = Color(0xFFBBF7D0);
  static const brandStrong = Color(0xFF15803D);
  static const limeGlow = Color(0xFF4ADE80);
  static const teal = Color(0xFF0D9488);
  static const ink = Color(0xFF052E16);
  static const mintText = Color(0xFFECFDF3);
  static const muted = Color(0xFF3F7A55);
  static const surface = Color(0xFFFFFFFF);
  static const border = Color(0xFFBBF7D0);
}

class SagaTheme {
  static ButtonStyle get _compactButton => ButtonStyle(
        minimumSize: const WidgetStatePropertyAll(Size(0, 44)),
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        visualDensity: VisualDensity.standard,
        padding: const WidgetStatePropertyAll(
          EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        ),
        shape: WidgetStatePropertyAll(
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );

  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: SagaColors.brand,
      brightness: Brightness.light,
      primary: SagaColors.brand,
      surface: SagaColors.surface,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: SagaColors.mintCanvas,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: SagaColors.ink,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: SagaColors.ink,
          fontSize: 20,
          fontWeight: FontWeight.w800,
        ),
      ),
      cardTheme: CardThemeData(
        color: SagaColors.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: SagaColors.border),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: SagaColors.brand,
          foregroundColor: Colors.white,
          minimumSize: const Size(0, 44),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: SagaColors.brandStrong,
          minimumSize: const Size(0, 44),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          side: const BorderSide(color: SagaColors.brand),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(style: _compactButton),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: SagaColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: SagaColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: SagaColors.brand, width: 1.5),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: SagaColors.brand,
        foregroundColor: Colors.white,
      ),
      drawerTheme: const DrawerThemeData(backgroundColor: SagaColors.mintCanvas),
      chipTheme: ChipThemeData(
        backgroundColor: SagaColors.brandSoft.withValues(alpha: 0.45),
        selectedColor: SagaColors.brandSoft,
        labelStyle: const TextStyle(color: SagaColors.ink, fontWeight: FontWeight.w600),
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  static ThemeData dark() {
    final scheme = ColorScheme.fromSeed(
      seedColor: SagaColors.brand,
      brightness: Brightness.dark,
      primary: SagaColors.limeGlow,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: SagaColors.forestNight,
    );
  }
}

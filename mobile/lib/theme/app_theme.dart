import 'package:flutter/material.dart';

// ─── Color Palette ────────────────────────────────────────────────────────────

const kBrand50  = Color(0xFFF0F9FF);
const kBrand100 = Color(0xFFE0F2FE);
const kBrand400 = Color(0xFF38BDF8);
const kBrand500 = Color(0xFF0EA5E9);
const kBrand600 = Color(0xFF0284C7);
const kBrand700 = Color(0xFF0369A1);

const kNeutral50  = Color(0xFFF8FAFC);
const kNeutral100 = Color(0xFFF1F5F9);
const kNeutral200 = Color(0xFFE2E8F0);
const kNeutral300 = Color(0xFFCBD5E1);
const kNeutral400 = Color(0xFF94A3B8);
const kNeutral500 = Color(0xFF64748B);
const kNeutral600 = Color(0xFF475569);
const kNeutral700 = Color(0xFF334155);
const kNeutral800 = Color(0xFF1E293B);
const kNeutral900 = Color(0xFF0F172A);

const kSuccess = Color(0xFF22C55E);
const kWarning = Color(0xFFF59E0B);
const kDanger  = Color(0xFFEF4444);
const kInfo    = Color(0xFF3B82F6);

// WhatsApp-style palette
const kWaGreen     = Color(0xFF25D366);
const kWaGreenDark = Color(0xFF128C7E);
const kWaTeal      = Color(0xFF075E54);
const kWaBg        = Color(0xFFF0F2F5);

// ─── Theme ────────────────────────────────────────────────────────────────────

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: kBrand500,
      brightness: Brightness.light,
    ),
    fontFamily: 'Inter',
    scaffoldBackgroundColor: kNeutral50,
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: kNeutral900,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: kNeutral900,
      ),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: kNeutral200),
      ),
      margin: EdgeInsets.zero,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: kBrand500,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w600,
          fontSize: 15,
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: kNeutral700,
        side: const BorderSide(color: kNeutral300),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(
          fontFamily: 'Inter',
          fontWeight: FontWeight.w500,
          fontSize: 14,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: false,
      border: InputBorder.none,
      enabledBorder: InputBorder.none,
      focusedBorder: InputBorder.none,
      errorBorder: InputBorder.none,
      focusedErrorBorder: InputBorder.none,
      labelStyle: const TextStyle(color: kNeutral500, fontFamily: 'Inter'),
      hintStyle: const TextStyle(color: kNeutral400, fontFamily: 'Inter'),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    dividerTheme: const DividerThemeData(color: kNeutral200, thickness: 1),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Colors.white,
      selectedItemColor: kBrand500,
      unselectedItemColor: kNeutral400,
      type: BottomNavigationBarType.fixed,
      elevation: 12,
    ),
  );
}

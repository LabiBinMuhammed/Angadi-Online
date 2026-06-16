import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'supabase_client.dart';

class LanguageService extends ChangeNotifier {
  LanguageService._();
  static final instance = LanguageService._();

  Locale _locale = const Locale('en');
  Locale get locale => _locale;

  static const String _prefKey = 'selected_language';

  // Initialize service
  Future<void> initialize() async {
    // 1. Try loading from SharedPreferences (quick startup)
    final prefs = await SharedPreferences.getInstance();
    final cachedLang = prefs.getString(_prefKey);
    if (cachedLang != null && ['en', 'ml', 'hi', 'ar'].contains(cachedLang)) {
      _locale = Locale(cachedLang);
    }

    // 2. Fetch from Supabase (runs asynchronously in background)
    _syncWithSupabase();
  }

  // Set and persist new locale
  Future<void> setLocale(Locale newLocale) async {
    final code = newLocale.languageCode;
    if (!['en', 'ml', 'hi', 'ar'].contains(code)) return;

    _locale = newLocale;
    notifyListeners();

    // 1. Persist to SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefKey, code);

    // 2. Persist to Supabase
    try {
      final user = supabase.auth.currentUser;
      if (user != null) {
        await supabase
            .from('user_profiles')
            .update({'preferred_language': code})
            .eq('user_id', user.id);
      }
    } catch (e) {
      debugPrint('Failed to sync language selection to Supabase: $e');
    }
  }

  // Sync preferred language from Supabase
  Future<void> _syncWithSupabase() async {
    try {
      final user = supabase.auth.currentUser;
      if (user == null) return;

      final res = await supabase
          .from('user_profiles')
          .select('preferred_language')
          .eq('user_id', user.id)
          .maybeSingle();

      if (res != null && res['preferred_language'] != null) {
        final code = res['preferred_language'] as String;
        if (code != _locale.languageCode && ['en', 'ml', 'hi', 'ar'].contains(code)) {
          _locale = Locale(code);
          notifyListeners();

          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(_prefKey, code);
        }
      }
    } catch (e) {
      debugPrint('Error syncing language from Supabase: $e');
    }
  }

  // Reload language preference after login
  Future<void> reloadAfterLogin() async {
    await _syncWithSupabase();
  }
}

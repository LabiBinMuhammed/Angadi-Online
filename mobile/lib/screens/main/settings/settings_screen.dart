import 'package:flutter/material.dart';

import '../../../core/language_service.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _saving = false;

  static const _languages = [
    {'code': 'en', 'label': '🇬🇧 English'},
    {'code': 'ar', 'label': '🇸🇦 العربية'},
    {'code': 'hi', 'label': '🇮🇳 हिंदी'},
    {'code': 'ml', 'label': '🇮🇳 Malayalam'},
  ];

  Future<void> _saveLang(String code) async {
    setState(() { _saving = true; });
    await LanguageService.instance.setLocale(Locale(code));
    if (mounted) setState(() => _saving = false);
  }

  Future<void> _signOut() async {
    await supabase.auth.signOut();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: LanguageService.instance,
      builder: (context, _) {
        final l10n = AppLocalizations.of(context)!;
        final currentLocaleCode = LanguageService.instance.locale.languageCode;

        return Scaffold(
          appBar: AppBar(title: Text(l10n.settingsTitle)),
          body: ListView(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Text(
                  l10n.languagePreference.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF64748B),
                    letterSpacing: 1,
                  ),
                ),
              ),
              ..._languages.map((l) => RadioListTile<String>(
                value: l['code']!,
                groupValue: currentLocaleCode,
                title: Text(l['label']!),
                activeColor: kWaGreen,
                onChanged: (val) { if (val != null) _saveLang(val); },
                secondary: _saving && currentLocaleCode == l['code']
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : null,
              )),
              const Divider(),
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: Text(
                  'APP',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF64748B),
                    letterSpacing: 1,
                  ),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.notifications_outlined),
                title: Text(l10n.orderNotificationsTitle),
                subtitle: Text(l10n.orderNotificationsSubtitle),
                trailing: Switch(value: true, onChanged: null, activeThumbColor: kWaGreen),
              ),
              ListTile(
                leading: const Icon(Icons.info_outline),
                title: Text(l10n.appVersionTitle),
                subtitle: const Text('Village Market 1.0.0'),
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.logout, color: Color(0xFFEF4444)),
                title: Text(l10n.signOut, style: const TextStyle(color: Color(0xFFEF4444))),
                onTap: _signOut,
              ),
            ],
          ),
        );
      },
    );
  }
}

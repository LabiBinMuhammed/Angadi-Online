import 'package:flutter/material.dart';

import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _lang = 'en';
  bool _saving = false;

  static const _languages = [
    {'code': 'en', 'label': '🇬🇧 English'},
    {'code': 'ar', 'label': '🇸🇦 العربية'},
    {'code': 'hi', 'label': '🇮🇳 हिंदी'},
    {'code': 'ml', 'label': '🇮🇳 Malayalam'},
  ];

  @override
  void initState() {
    super.initState();
    _loadLang();
  }

  Future<void> _loadLang() async {
    final uid = supabase.auth.currentUser!.id;
    final res = await supabase.from('user_profiles').select('preferred_language').eq('user_id', uid).maybeSingle();
    if (mounted && res != null) setState(() => _lang = res['preferred_language'] ?? 'en');
  }

  Future<void> _saveLang(String code) async {
    setState(() { _lang = code; _saving = true; });
    final uid = supabase.auth.currentUser!.id;
    await supabase.from('user_profiles').update({'preferred_language': code}).eq('user_id', uid);
    if (mounted) setState(() => _saving = false);
  }

  Future<void> _signOut() async {
    await supabase.auth.signOut();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text('LANGUAGE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B), letterSpacing: 1)),
          ),
          // ignore: deprecated_member_use
          ..._languages.map((l) => RadioListTile<String>(
            value: l['code']!,
            // ignore: deprecated_member_use
            groupValue: _lang,
            title: Text(l['label']!),
            // ignore: deprecated_member_use
            activeColor: kWaGreen,
            // ignore: deprecated_member_use
            onChanged: (val) { if (val != null) _saveLang(val); },
            secondary: _saving && _lang == l['code'] ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : null,
          )),
          const Divider(),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Text('APP', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF64748B), letterSpacing: 1)),
          ),
          const ListTile(
            leading: Icon(Icons.notifications_outlined),
            title: Text('Order notifications'),
            subtitle: Text('Enabled for all order updates'),
            trailing: Switch(value: true, onChanged: null, activeThumbColor: kWaGreen),
          ),
          const ListTile(
            leading: Icon(Icons.info_outline),
            title: Text('App version'),
            subtitle: Text('Village Market 1.0.0'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: Color(0xFFEF4444)),
            title: const Text('Sign Out', style: TextStyle(color: Color(0xFFEF4444))),
            onTap: _signOut,
          ),
        ],
      ),
    );
  }
}

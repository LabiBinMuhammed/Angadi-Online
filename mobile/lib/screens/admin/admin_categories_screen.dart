import 'package:flutter/material.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';

/// Admin Categories Screen
class AdminCategoriesScreen extends StatefulWidget {
  const AdminCategoriesScreen({super.key});
  @override
  State<AdminCategoriesScreen> createState() => _AdminCategoriesScreenState();
}

class _AdminCategoriesScreenState extends State<AdminCategoriesScreen> {
  List<Map<String, dynamic>> _categories = [];
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _loading = true;
  bool _saving  = false;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final res = await supabase.from('categories').select('*').order('name');
    if (mounted) setState(() { _categories = (res as List).cast(); _loading = false; });
  }

  Future<void> _add() async {
    if (_nameCtrl.text.isEmpty) return;
    setState(() => _saving = true);
    final res = await supabase.from('categories').insert({
      'name': _nameCtrl.text.trim(),
      'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
      'is_active': true,
    }).select('*').single();
    if (mounted) {
      setState(() { _categories.add(res); _saving = false; });
      _nameCtrl.clear(); _descCtrl.clear();
    }
  }

  Future<void> _toggle(Map<String, dynamic> cat) async {
    final next = !(cat['is_active'] as bool? ?? true);
    await supabase.from('categories').update({'is_active': next}).eq('id', cat['id']);
    setState(() {
      final idx = _categories.indexWhere((c) => c['id'] == cat['id']);
      if (idx >= 0) _categories[idx] = {..._categories[idx], 'is_active': next};
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(backgroundColor: kWaTeal, foregroundColor: Colors.white, title: const Text('Categories')),
      body: Column(
        children: [
          // Add form
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Expanded(child: TextField(
                controller: _nameCtrl,
                decoration: const InputDecoration(labelText: 'Name', isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
              )),
              const SizedBox(width: 8),
              Expanded(child: TextField(
                controller: _descCtrl,
                decoration: const InputDecoration(labelText: 'Description', isDense: true, contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
              )),
              const SizedBox(width: 8),
              IconButton(
                icon: _saving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.add_circle, color: Color(0xFF075E54), size: 32),
                onPressed: _saving ? null : _add,
              ),
            ]),
          ),
          const Divider(height: 1),
          _loading
              ? const Expanded(child: Center(child: CircularProgressIndicator()))
              : Expanded(
                  child: ListView.separated(
                    itemCount: _categories.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final cat = _categories[i];
                      final isActive = cat['is_active'] as bool? ?? true;
                      return ListTile(
                        title: Text(cat['name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: cat['description'] != null ? Text(cat['description']) : null,
                        trailing: Switch(
                          value: isActive,
                          activeThumbColor: kWaGreen,
                          onChanged: (_) => _toggle(cat),
                        ),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }
}

/// Admin Logs Screen (placeholder)
class AdminLogsScreen extends StatelessWidget {
  const AdminLogsScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(backgroundColor: kWaTeal, foregroundColor: Colors.white, title: const Text('Activity Logs')),
      body: const Center(child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('🗒️', style: TextStyle(fontSize: 48)),
          SizedBox(height: 12),
          Text('No logs yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          SizedBox(height: 8),
          Text('System logs will appear here', style: TextStyle(color: Color(0xFF64748B))),
        ],
      )),
    );
  }
}

/// Admin Settings Screen
class AdminSettingsScreen extends StatelessWidget {
  const AdminSettingsScreen({super.key});

  static const _items = [
    ('💰', 'Default credit limit', '₹500'),
    ('📦', 'Max order items',      '50'),
    ('🌐', 'Default language',     'English'),
    ('🔔', 'Notifications',        'Enabled'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(backgroundColor: kWaTeal, foregroundColor: Colors.white, title: const Text('Global Settings')),
      body: ListView.separated(
        itemCount: _items.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, i) {
          final item = _items[i];
          return ListTile(
            leading: Text(item.$1, style: const TextStyle(fontSize: 24)),
            title: Text(item.$2, style: const TextStyle(fontWeight: FontWeight.w600)),
            trailing: Chip(
              label: Text(item.$3, style: const TextStyle(fontSize: 12, color: Color(0xFF075E54))),
              backgroundColor: const Color(0xFFE0F2FE),
            ),
          );
        },
      ),
    );
  }
}

/// Admin Credit Screen
class AdminCreditScreen extends StatefulWidget {
  const AdminCreditScreen({super.key});
  @override
  State<AdminCreditScreen> createState() => _AdminCreditScreenState();
}

class _AdminCreditScreenState extends State<AdminCreditScreen> {
  List<Map<String, dynamic>> _credits = [];
  bool _loading = true;
  double _totalUsed = 0;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final res = await supabase.from('shop_user_credits').select('*, users(name, phone), shops(name)').order('used_amount', ascending: false).limit(100);
    if (mounted) {
      final list = (res as List).cast<Map<String, dynamic>>();
      setState(() {
        _credits = list;
        _totalUsed = list.fold(0.0, (sum, c) => sum + ((c['used_amount'] as num?)?.toDouble() ?? 0));
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(backgroundColor: kWaTeal, foregroundColor: Colors.white, title: const Text('Credit Monitor')),
      body: Column(
        children: [
          // Summary banner
          Container(
            padding: const EdgeInsets.all(16),
            color: kBrand100,
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Text('Total Credit Used: ', style: TextStyle(color: kBrand700)),
              Text('₹${_totalUsed.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w800, color: kBrand700, fontSize: 18)),
            ]),
          ),
          _loading
              ? const Expanded(child: Center(child: CircularProgressIndicator()))
              : Expanded(
                  child: ListView.separated(
                    itemCount: _credits.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final c = _credits[i];
                      final isBlocked = c['is_blocked'] as bool? ?? false;
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isBlocked ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
                          child: Icon(isBlocked ? Icons.block : Icons.credit_card,
                              color: isBlocked ? kDanger : kWaGreen, size: 20),
                        ),
                        title: Text((c['users'] as Map?)?['name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('${(c['shops'] as Map?)?['name'] ?? '—'} · ₹${c['used_amount'] ?? 0} used'),
                        trailing: Chip(
                          label: Text(isBlocked ? 'Blocked' : c['is_credit_enabled'] == true ? 'Active' : 'Off',
                              style: const TextStyle(fontSize: 11)),
                          backgroundColor: isBlocked
                              ? const Color(0xFFFEE2E2)
                              : c['is_credit_enabled'] == true ? const Color(0xFFDCFCE7) : kNeutral100,
                        ),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }
}

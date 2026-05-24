import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';

class AdminShopsScreen extends StatefulWidget {
  const AdminShopsScreen({super.key});
  @override
  State<AdminShopsScreen> createState() => _AdminShopsScreenState();
}

class _AdminShopsScreenState extends State<AdminShopsScreen> {
  List<Map<String, dynamic>> _shops = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final res = await supabase.from('shops').select('*, shop_owners(users(name, phone))').order('created_at', ascending: false);
    if (mounted) setState(() { _shops = (res as List).cast(); _loading = false; });
  }

  Future<void> _toggle(Map<String, dynamic> shop) async {
    final next = !(shop['is_active'] as bool? ?? true);
    await supabase.from('shops').update({'is_active': next}).eq('id', shop['id']);
    setState(() {
      final idx = _shops.indexWhere((s) => s['id'] == shop['id']);
      if (idx >= 0) _shops[idx] = {..._shops[idx], 'is_active': next};
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(backgroundColor: kWaTeal, foregroundColor: Colors.white, title: const Text('Shop Management')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.separated(
              itemCount: _shops.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, i) {
                final shop = _shops[i];
                final isActive = shop['is_active'] != false;
                final owners = (shop['shop_owners'] as List?) ?? [];
                final owner = owners.isNotEmpty ? (owners[0]['users'] as Map?) : null;
                return ListTile(
                  leading: const CircleAvatar(backgroundColor: kBrand100, child: Text('🏪')),
                  title: Text(shop['name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(owner?['name'] ?? 'No owner'),
                  trailing: Switch(
                    value: isActive,
                    activeThumbColor: kWaGreen,
                    onChanged: (_) => _toggle(shop),
                  ),
                );
              },
            ),
    );
  }
}

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});
  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  List<Map<String, dynamic>> _users = [];
  bool _loading = true;
  String _role = 'all';

  static const _roleColor = {
    'customer': Color(0xFF94A3B8), 'shop_owner': Color(0xFF3B82F6), 'admin': Color(0xFFF59E0B),
  };

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final res = await supabase.from('users').select('*').order('created_at', ascending: false);
    if (mounted) setState(() { _users = (res as List).cast(); _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _users.where((u) => _role == 'all' || u['role'] == _role).toList();
    return Scaffold(
      appBar: AppBar(backgroundColor: kWaTeal, foregroundColor: Colors.white, title: const Text('User Management')),
      body: Column(
        children: [
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: ['all', 'customer', 'shop_owner', 'admin'].map((r) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(r.replaceAll('_', ' ')),
                  selected: _role == r,
                  selectedColor: kWaGreen,
                  onSelected: (_) => setState(() => _role = r),
                ),
              )).toList(),
            ),
          ),
          _loading
              ? const Expanded(child: Center(child: CircularProgressIndicator()))
              : Expanded(
                  child: ListView.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final u = filtered[i];
                      final role = u['role'] as String? ?? 'customer';
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: (_roleColor[role] ?? kNeutral400).withAlpha(38), // ~0.15
                          child: Text((u['name'] as String? ?? '?')[0].toUpperCase(),
                              style: TextStyle(color: _roleColor[role] ?? kNeutral400, fontWeight: FontWeight.w700)),
                        ),
                        title: Text(u['name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text(u['phone'] ?? ''),
                        trailing: Chip(label: Text(role, style: const TextStyle(fontSize: 11))),
                        onTap: () => context.push('/admin/users/${u['id']}'),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }
}

class AdminOrdersScreen extends StatefulWidget {
  const AdminOrdersScreen({super.key});
  @override
  State<AdminOrdersScreen> createState() => _AdminOrdersScreenState();
}

class _AdminOrdersScreenState extends State<AdminOrdersScreen> {
  List<Map<String, dynamic>> _orders = [];
  bool _loading = true;
  String _status = 'all';

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final res = await supabase.from('orders').select('*, users(name), shops(name)').order('created_at', ascending: false).limit(100);
    if (mounted) setState(() { _orders = (res as List).cast(); _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _orders.where((o) => _status == 'all' || o['status'] == _status).toList();
    return Scaffold(
      appBar: AppBar(backgroundColor: kWaTeal, foregroundColor: Colors.white, title: const Text('All Orders')),
      body: Column(
        children: [
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: ['all', 'pending', 'packing', 'delivering', 'delivered', 'cancelled'].map((s) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(s[0].toUpperCase() + s.substring(1)),
                  selected: _status == s,
                  selectedColor: kWaGreen,
                  onSelected: (_) => setState(() => _status = s),
                ),
              )).toList(),
            ),
          ),
          _loading
              ? const Expanded(child: Center(child: CircularProgressIndicator()))
              : Expanded(
                  child: ListView.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final o = filtered[i];
                      return ListTile(
                        leading: const CircleAvatar(backgroundColor: Color(0xFFE0F2FE), child: Icon(Icons.receipt, color: Color(0xFF0369A1), size: 20)),
                        title: Text('${(o['users'] as Map?)?['name'] ?? '—'} → ${(o['shops'] as Map?)?['name'] ?? '—'}',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        subtitle: Text('#${(o['id'] as String).substring(0, 8)} · ${o['status']}'),
                        trailing: Text('₹${o['total_final_price'] ?? '—'}', style: const TextStyle(fontWeight: FontWeight.w700)),
                        onTap: () => context.push('/admin/orders/${o['id']}'),
                      );
                    },
                  ),
                ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import 'admin_drawer.dart';

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
      drawer: const AdminDrawer(currentRoute: '/admin/shops'),
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
      drawer: const AdminDrawer(currentRoute: '/admin/users'),
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
                      final phone = u['phone'] ?? '';
                      final verified = u['phone_verified'] as bool? ?? false;
                      final lastLogin = u['last_login_at'] as String?;
                      
                      String loginText = 'Never logged in';
                      if (lastLogin != null) {
                        try {
                          final dt = DateTime.parse(lastLogin).toLocal();
                          final minutes = dt.minute.toString().padLeft(2, '0');
                          final month = dt.month.toString().padLeft(2, '0');
                          final day = dt.day.toString().padLeft(2, '0');
                          loginText = 'Last login: ${dt.year}-$month-$day ${dt.hour}:$minutes';
                        } catch (_) {
                          loginText = 'Last login: $lastLogin';
                        }
                      }

                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: (_roleColor[role] ?? kNeutral400).withAlpha(38),
                          child: Text((u['name'] as String? ?? '?')[0].toUpperCase(),
                              style: TextStyle(color: _roleColor[role] ?? kNeutral400, fontWeight: FontWeight.w700)),
                        ),
                        title: Text(u['name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(phone, style: const TextStyle(fontWeight: FontWeight.w500)),
                                  const SizedBox(width: 6),
                                  Icon(
                                    verified ? Icons.verified : Icons.error_outline,
                                    size: 14,
                                    color: verified ? Colors.green : Colors.grey,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                loginText,
                                style: const TextStyle(fontSize: 11, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
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
  String _slotFilter = 'all';
  DateTime? _dateFilter;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final res = await supabase.from('orders').select('*, users(name), shops(name)').order('created_at', ascending: false).limit(100);
    if (mounted) setState(() { _orders = (res as List).cast(); _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _orders.where((o) {
      if (_status != 'all' && o['status'] != _status) return false;
      if (_slotFilter != 'all' && o['delivery_slot'] != _slotFilter) return false;
      if (_dateFilter != null) {
        if (o['delivery_date'] == null) return false;
        final oDate = DateTime.parse(o['delivery_date'] as String);
        if (oDate.year != _dateFilter!.year || oDate.month != _dateFilter!.month || oDate.day != _dateFilter!.day) return false;
      }
      return true;
    }).toList();

    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/orders'),
      appBar: AppBar(backgroundColor: kWaTeal, foregroundColor: Colors.white, title: const Text('All Orders')),
      body: Column(
        children: [
          // Status Filter Row
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: ['all', 'pending', 'accepted', 'packing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(s == 'all' ? 'All Statuses' : s[0].toUpperCase() + s.substring(1).replaceAll('_', ' ')),
                  selected: _status == s,
                  selectedColor: kWaGreen,
                  onSelected: (_) => setState(() => _status = s),
                ),
              )).toList(),
            ),
          ),

          // Date Filter Row
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: [
                FilterChip(
                  label: const Text('All Dates'),
                  selected: _dateFilter == null,
                  selectedColor: kWaGreen,
                  onSelected: (_) => setState(() => _dateFilter = null),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('Today'),
                  selected: _dateFilter != null && DateUtils.isSameDay(_dateFilter!, DateTime.now()),
                  selectedColor: kWaGreen,
                  onSelected: (_) => setState(() => _dateFilter = DateTime.now()),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('Tomorrow'),
                  selected: _dateFilter != null && DateUtils.isSameDay(_dateFilter!, DateTime.now().add(const Duration(days: 1))),
                  selectedColor: kWaGreen,
                  onSelected: (_) => setState(() => _dateFilter = DateTime.now().add(const Duration(days: 1))),
                ),
                const SizedBox(width: 8),
                ActionChip(
                  avatar: const Icon(Icons.calendar_today, size: 14),
                  label: Text(_dateFilter != null && !DateUtils.isSameDay(_dateFilter!, DateTime.now()) && !DateUtils.isSameDay(_dateFilter!, DateTime.now().add(const Duration(days: 1)))
                      ? '${_dateFilter!.day}/${_dateFilter!.month}/${_dateFilter!.year}'
                      : 'Pick Date'),
                  onPressed: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _dateFilter ?? DateTime.now(),
                      firstDate: DateTime.now().subtract(const Duration(days: 30)),
                      lastDate: DateTime.now().add(const Duration(days: 30)),
                    );
                    if (picked != null) {
                      setState(() => _dateFilter = picked);
                    }
                  },
                ),
              ],
            ),
          ),

          // Slot Filter Row
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: [
                FilterChip(
                  label: const Text('All Slots'),
                  selected: _slotFilter == 'all',
                  selectedColor: kWaGreen,
                  onSelected: (_) => setState(() => _slotFilter = 'all'),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('☀️ Morning'),
                  selected: _slotFilter == 'morning',
                  selectedColor: kWaGreen,
                  onSelected: (_) => setState(() => _slotFilter = 'morning'),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  label: const Text('🌙 Evening'),
                  selected: _slotFilter == 'evening',
                  selectedColor: kWaGreen,
                  onSelected: (_) => setState(() => _slotFilter = 'evening'),
                ),
              ],
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
                      final displayOrderNumber = o['order_number'] != null
                          ? '#${o['order_number']}'
                          : '#${(o['id'] as String).substring(0, 8)}';

                      return ListTile(
                        leading: const CircleAvatar(backgroundColor: Color(0xFFE0F2FE), child: Icon(Icons.receipt, color: Color(0xFF0369A1), size: 20)),
                        title: Text('${(o['users'] as Map?)?['name'] ?? '—'} → ${(o['shops'] as Map?)?['name'] ?? '—'} $displayOrderNumber',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('ID: ${(o['id'] as String).substring(0, 8)} · status: ${o['status'].toString().toUpperCase()}'),
                            if (o['delivery_date'] != null && o['delivery_slot'] != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 4.0),
                                child: Text(
                                  '${o['delivery_slot'] == 'morning' ? "☀️ Morning" : "🌙 Evening"} Slot (${o['delivery_date']})',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: o['delivery_slot'] == 'morning'
                                        ? const Color(0xFF16A34A)
                                        : const Color(0xFFEA580C),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        trailing: Text('₹ ${(o['total_final_price'] ?? o['total_estimated_price'] ?? 0.0).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w700)),
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

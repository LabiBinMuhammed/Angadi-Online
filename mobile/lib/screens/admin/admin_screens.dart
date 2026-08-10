import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';
import 'admin_drawer.dart';

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN SHOPS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

class AdminShopsScreen extends StatefulWidget {
  const AdminShopsScreen({super.key});
  @override
  State<AdminShopsScreen> createState() => _AdminShopsScreenState();
}

class _AdminShopsScreenState extends State<AdminShopsScreen> {
  List<Map<String, dynamic>> _shops = [];
  List<Map<String, dynamic>> _allUsers = [];
  List<Map<String, dynamic>> _locations = [];
  bool _loading = true;
  String _search = '';
  String _statusFilter = 'all';
  String _locationFilter = 'all';

  static const _shopTypes = ['grocery','dairy','meat','bakery','fruit','spice','oil','general'];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final results = await Future.wait([
      supabase.from('shops').select('*, shop_owners(users(name, phone)), locations(name)').order('created_at', ascending: false),
      supabase.from('users').select('id, name, phone, role').order('name'),
      supabase.from('locations').select('id, name').order('name'),
    ]);
    if (mounted) {
      setState(() {
        _shops    = (results[0] as List).cast();
        _allUsers = (results[1] as List).cast();
        _locations= (results[2] as List).cast();
        _loading  = false;
      });
    }
  }

  Future<void> _toggleShopActive(Map<String, dynamic> shop) async {
    final type = shop['type'] as String? ?? 'general';
    final isActive = !type.endsWith('_inactive');
    final newType = isActive ? '${type}_inactive' : type.replaceAll('_inactive', '');
    await supabase.from('shops').update({'type': newType}).eq('id', shop['id']);
    setState(() {
      final idx = _shops.indexWhere((s) => s['id'] == shop['id']);
      if (idx >= 0) _shops[idx] = {..._shops[idx], 'type': newType};
    });
  }

  Future<void> _deleteShop(Map<String, dynamic> shop) async {
    final isDark = ThemeService.instance.isDarkMode;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? kNeutral800 : Colors.white,
        title: const Text('Delete Shop'),
        content: Text('Delete "${shop['name']}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kDanger, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    await supabase.from('shops').delete().eq('id', shop['id']);
    setState(() => _shops.removeWhere((s) => s['id'] == shop['id']));
  }

  void _showCreateSheet() {
    final isDark = ThemeService.instance.isDarkMode;
    final sheetBg  = isDark ? kNeutral800 : Colors.white;
    final nameCtrl = TextEditingController();
    String? selUserId;
    String? selType;
    String? selLocationId;
    String err = '';
    bool saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, ss) => Container(
          decoration: BoxDecoration(
            color: sheetBg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: isDark ? kNeutral600 : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text('Create New Shop',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : kNeutral900)),
              const SizedBox(height: 16),

              _InputLabel('Shop Name *', isDark: isDark),
              _StyledInput(controller: nameCtrl, hint: 'e.g. Village Grocery',
                icon: HugeIcons.strokeRoundedStore01, isDark: isDark),
              const SizedBox(height: 12),

              _InputLabel('Assign Owner *', isDark: isDark),
              _StyledDropdown<String>(
                value: selUserId, hint: 'Select a user…',
                icon: HugeIcons.strokeRoundedUser, isDark: isDark,
                items: _allUsers.map((u) => DropdownMenuItem(
                  value: u['id'] as String,
                  child: Text('${u['name']} (${u['phone']})'),
                )).toList(),
                onChanged: (v) => ss(() => selUserId = v),
              ),
              const SizedBox(height: 12),

              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _InputLabel('Shop Type', isDark: isDark),
                  _StyledDropdown<String>(
                    value: selType, hint: 'Select type…',
                    icon: HugeIcons.strokeRoundedTag01, isDark: isDark,
                    items: _shopTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                    onChanged: (v) => ss(() => selType = v),
                  ),
                ])),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _InputLabel('Location', isDark: isDark),
                  _StyledDropdown<String>(
                    value: selLocationId, hint: 'Select…',
                    icon: HugeIcons.strokeRoundedMaps, isDark: isDark,
                    items: _locations.map((l) => DropdownMenuItem(
                      value: l['id'] as String, child: Text(l['name']),
                    )).toList(),
                    onChanged: (v) => ss(() => selLocationId = v),
                  ),
                ])),
              ]),

              if (err.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(err, style: const TextStyle(color: kDanger, fontSize: 13)),
              ],
              const SizedBox(height: 16),

              Row(children: [
                Expanded(child: OutlinedButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                )),
                const SizedBox(width: 12),
                Expanded(child: ElevatedButton(
                  onPressed: saving ? null : () async {
                    if (nameCtrl.text.trim().isEmpty || selUserId == null) {
                      ss(() => err = 'Name and Owner are required.');
                      return;
                    }
                    ss(() { saving = true; err = ''; });
                    try {
                      final res = await supabase.from('shops').insert({
                        'name': nameCtrl.text.trim(),
                        'type': selType ?? 'general',
                        'location_id': selLocationId,
                      }).select('*').single();
                      await supabase.from('shop_owners').insert({
                        'shop_id': res['id'],
                        'user_id': selUserId,
                        'is_primary': true,
                      });
                      final user = _allUsers.firstWhere(
                        (u) => u['id'] == selUserId, orElse: () => {});
                      setState(() => _shops.insert(0, {
                        ...res,
                        'shop_owners': [{'users': {'name': user['name'], 'phone': user['phone']}}],
                        'locations': selLocationId != null
                            ? {'name': _locations.firstWhere(
                                (l) => l['id'] == selLocationId, orElse: () => {})['name']}
                            : null,
                      }));
                      if (mounted) Navigator.pop(ctx);
                    } catch (e) {
                      ss(() { saving = false; err = e.toString(); });
                    }
                  },
                  child: saving
                      ? const SizedBox(width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Create Shop'),
                )),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark   = ThemeService.instance.isDarkMode;
    final scaffoldBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA);
    final cardBg   = isDark ? kNeutral800 : Colors.white;
    final cardBorder = isDark ? kNeutral700 : kNeutral200;
    final barBg    = isDark ? kNeutral900 : Colors.white;
    final searchBg = isDark ? kNeutral800 : kNeutral100;
    final textMain = isDark ? Colors.white : kNeutral900;
    final textMuted= isDark ? kNeutral400 : Colors.grey;

    final filtered = _shops.where((s) {
      final type = s['type'] as String? ?? 'general';
      final isActive = !type.endsWith('_inactive');
      final name = (s['name'] as String? ?? '').toLowerCase();
      final matchSearch = _search.isEmpty || name.contains(_search.toLowerCase());
      final matchStatus = _statusFilter == 'all' ? true
          : _statusFilter == 'active' ? isActive : !isActive;
      final matchLoc = _locationFilter == 'all' ? true
          : s['location_id'] == _locationFilter;
      return matchSearch && matchStatus && matchLoc;
    }).toList();

    return Scaffold(
      backgroundColor: scaffoldBg,
      drawer: const AdminDrawer(currentRoute: '/admin/shops'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Shop Management'),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 20),
                onPressed: () => context.pop())
            : Builder(builder: (c) => IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedMenu01, color: Colors.white, size: 22),
                onPressed: () => Scaffold.of(c).openDrawer())),
        actions: [
          TextButton.icon(
            onPressed: _showCreateSheet,
            icon: const Icon(Icons.add, color: Colors.white, size: 20),
            label: const Text('New', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: Column(
        children: [
          // ─── Filter Bar ──────────────────────────────────────────────────
          Container(
            color: barBg,
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
            child: Column(
              children: [
                // Search
                Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: searchBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: cardBorder),
                  ),
                  child: TextField(
                    onChanged: (v) => setState(() => _search = v),
                    style: TextStyle(fontSize: 14, color: textMain),
                    decoration: InputDecoration(
                      hintText: 'Search shops…',
                      hintStyle: TextStyle(color: textMuted, fontSize: 14),
                      prefixIcon: Icon(Icons.search, size: 18, color: textMuted),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 11),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _FilterChips(
                      options: const ['all', 'active', 'inactive'],
                      selected: _statusFilter,
                      onTap: (v) => setState(() => _statusFilter = v),
                      labels: const {'all': 'All', 'active': 'Active', 'inactive': 'Inactive'},
                      isDark: isDark,
                    ),
                    const SizedBox(width: 8),
                    if (_locations.isNotEmpty)
                      Expanded(
                        child: Container(
                          height: 32,
                          decoration: BoxDecoration(
                            color: cardBg,
                            border: Border.all(color: cardBorder),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _locationFilter,
                              isDense: true,
                              dropdownColor: cardBg,
                              style: TextStyle(fontSize: 12, color: textMain),
                              items: [
                                const DropdownMenuItem(value: 'all', child: Text('All Locations')),
                                ..._locations.map((l) => DropdownMenuItem(
                                  value: l['id'] as String,
                                  child: Text(l['name'] as String? ?? ''),
                                )),
                              ],
                              onChanged: (v) => setState(() => _locationFilter = v ?? 'all'),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          Divider(height: 1, color: cardBorder),

          // ─── List ────────────────────────────────────────────────────────
          _loading
              ? const Expanded(child: Center(child: CircularProgressIndicator()))
              : filtered.isEmpty
                  ? Expanded(child: Center(
                      child: Text('No shops found.', style: TextStyle(color: textMuted))))
                  : Expanded(
                      child: ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, i) {
                          final shop = filtered[i];
                          final type = shop['type'] as String? ?? 'general';
                          final isActive = !type.endsWith('_inactive');
                          final owners = (shop['shop_owners'] as List?) ?? [];
                          final primaryOwner = owners.isNotEmpty ? (owners[0]['users'] as Map?) : null;
                          final coOwnersCount = owners.length > 1 ? owners.length - 1 : 0;
                          final ownersText = primaryOwner != null
                              ? '${primaryOwner['name']}${coOwnersCount > 0 ? ' (+$coOwnersCount co-owner${coOwnersCount > 1 ? 's' : ''})' : ''}'
                              : 'No owner';
                          final locName = (shop['locations'] as Map?)?['name'] as String?;
                          final displayType = type.replaceAll('_inactive', '');

                          return Container(
                            decoration: BoxDecoration(
                              color: cardBg,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: cardBorder),
                              boxShadow: isDark ? [] : [
                                BoxShadow(color: Colors.black.withAlpha(8), blurRadius: 4, offset: const Offset(0, 2)),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(children: [
                                    Container(
                                      width: 44, height: 44,
                                      decoration: BoxDecoration(
                                        color: isDark ? kNeutral700 : kBrand100,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Center(child: Text('🏪', style: TextStyle(fontSize: 22))),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                        Text(shop['name'] ?? '—',
                                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: textMain)),
                                        const SizedBox(height: 2),
                                        Text(ownersText,
                                          style: TextStyle(fontSize: 13, fontWeight: coOwnersCount > 0 ? FontWeight.w600 : FontWeight.normal, color: textMuted)),
                                      ]),
                                    ),

                                    // Tappable status badge
                                    GestureDetector(
                                      onTap: () => _toggleShopActive(shop),
                                      child: _StatusBadge(isActive: isActive),
                                    ),
                                  ]),
                                  const SizedBox(height: 10),
                                  Row(children: [
                                    if (displayType.isNotEmpty) ...[
                                      _SmallBadge(displayType,
                                        color: isDark ? kNeutral700 : kNeutral100,
                                        textColor: isDark ? kNeutral300 : kNeutral600),
                                      const SizedBox(width: 6),
                                    ],
                                    if (locName != null) ...[
                                      Icon(Icons.location_on, size: 12, color: textMuted),
                                      const SizedBox(width: 2),
                                      Text(locName, style: TextStyle(fontSize: 11, color: textMuted)),
                                    ],
                                  ]),
                                  const SizedBox(height: 10),
                                  Row(children: [
                                    _ActionBtn(
                                      label: 'Delete', icon: Icons.delete_outline,
                                      color: kDanger, bgColor: const Color(0xFFFEE2E2),
                                      onTap: () => _deleteShop(shop),
                                    ),
                                    const Spacer(),
                                    _ActionBtn(
                                      label: 'Details →', icon: Icons.arrow_forward,
                                      color: kBrand500, bgColor: isDark ? kNeutral700 : kBrand100,
                                      onTap: () => context.push('/admin/shops/${shop['id']}'),
                                    ),
                                  ]),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateSheet,
        backgroundColor: kBrand500,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Create Shop'),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN USERS SCREEN
// ═══════════════════════════════════════════════════════════════════════════════

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});
  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  List<Map<String, dynamic>> _users = [];
  bool _loading = true;
  String _search = '';
  String _role = 'all';

  static const _roleColors = {
    'customer': Color(0xFF64748B),
    'shop_owner': Color(0xFF3B82F6),
    'admin': Color(0xFFF59E0B),
  };

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final res = await supabase.from('users').select('*').order('created_at', ascending: false);
    if (mounted) setState(() { _users = (res as List).cast(); _loading = false; });
  }

  Future<void> _toggleUser(Map<String, dynamic> user) async {
    final next = !(user['is_active'] as bool? ?? true);
    await supabase.from('users').update({'is_active': next}).eq('id', user['id']);
    setState(() {
      final idx = _users.indexWhere((u) => u['id'] == user['id']);
      if (idx >= 0) _users[idx] = {..._users[idx], 'is_active': next};
    });
  }

  Future<void> _deleteUser(Map<String, dynamic> user) async {
    final isDark = ThemeService.instance.isDarkMode;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? kNeutral800 : Colors.white,
        title: const Text('Delete User'),
        content: Text('Delete "${user['name']}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: kDanger, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    await supabase.from('users').delete().eq('id', user['id']);
    setState(() => _users.removeWhere((u) => u['id'] == user['id']));
  }

  Future<void> _changeUserRole(Map<String, dynamic> user, String newRole) async {
    final currentRole = user['role'] as String? ?? 'customer';
    if (currentRole == newRole) return;
    try {
      await supabase.from('users').update({'role': newRole}).eq('id', user['id']);
      if (mounted) {
        setState(() {
          final idx = _users.indexWhere((u) => u['id'] == user['id']);
          if (idx >= 0) _users[idx] = {..._users[idx], 'role': newRole};
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Updated ${user['name'] ?? "user"} to ${newRole == "shop_owner" ? "Shop Keeper" : newRole == "admin" ? "Admin" : "Customer"}'),
            backgroundColor: const Color(0xFF166534),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error updating role: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  void _showRolePickerForUser(Map<String, dynamic> user) {
    final currentRole = user['role'] as String? ?? 'customer';
    final isDark = ThemeService.instance.isDarkMode;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? kNeutral800 : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Change Role for ${user['name'] ?? "User"}',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isDark ? Colors.white : kNeutral900)),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.person_outline, color: Color(0xFF64748B)),
                title: const Text('Customer'),
                trailing: currentRole == 'customer' ? const Icon(Icons.check_circle, color: Color(0xFF64748B)) : null,
                onTap: () {
                  Navigator.pop(context);
                  _changeUserRole(user, 'customer');
                },
              ),
              ListTile(
                leading: const Icon(Icons.storefront_outlined, color: Color(0xFF3B82F6)),
                title: const Text('Shop Keeper'),
                trailing: currentRole == 'shop_owner' ? const Icon(Icons.check_circle, color: Color(0xFF3B82F6)) : null,
                onTap: () {
                  Navigator.pop(context);
                  _changeUserRole(user, 'shop_owner');
                },
              ),
              ListTile(
                leading: const Icon(Icons.admin_panel_settings_outlined, color: Color(0xFFF59E0B)),
                title: const Text('Admin'),
                trailing: currentRole == 'admin' ? const Icon(Icons.check_circle, color: Color(0xFFF59E0B)) : null,
                onTap: () {
                  Navigator.pop(context);
                  _changeUserRole(user, 'admin');
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showCreateSheet() {
    final isDark = ThemeService.instance.isDarkMode;
    final sheetBg = isDark ? kNeutral800 : Colors.white;
    final nameCtrl  = TextEditingController();
    final phoneCtrl = TextEditingController();
    String selRole = 'customer';
    String err = '';
    bool saving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, ss) => Container(
          decoration: BoxDecoration(
            color: sheetBg,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: isDark ? kNeutral600 : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text('Add New User',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700,
                  color: isDark ? Colors.white : kNeutral900)),
              const SizedBox(height: 16),

              _InputLabel('Full Name *', isDark: isDark),
              _StyledInput(controller: nameCtrl, hint: 'e.g. Arjun Kumar',
                icon: HugeIcons.strokeRoundedUser, isDark: isDark),
              const SizedBox(height: 12),

              _InputLabel('Phone Number *', isDark: isDark),
              _StyledInput(controller: phoneCtrl, hint: '+91 98765 43210',
                icon: HugeIcons.strokeRoundedCall, isDark: isDark,
                keyboardType: TextInputType.phone),
              const SizedBox(height: 12),

              _InputLabel('Role', isDark: isDark),
              _StyledDropdown<String>(
                value: selRole, hint: 'Select role…',
                icon: HugeIcons.strokeRoundedShield01, isDark: isDark,
                items: ['customer','shop_owner','admin'].map((r) => DropdownMenuItem(
                  value: r, child: Text(r.replaceAll('_', ' ')),
                )).toList(),
                onChanged: (v) => ss(() => selRole = v ?? 'customer'),
              ),

              if (err.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(err, style: const TextStyle(color: kDanger, fontSize: 13)),
              ],
              const SizedBox(height: 16),

              Row(children: [
                Expanded(child: OutlinedButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                )),
                const SizedBox(width: 12),
                Expanded(child: ElevatedButton(
                  onPressed: saving ? null : () async {
                    if (nameCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty) {
                      ss(() => err = 'Name and phone are required.');
                      return;
                    }
                    ss(() { saving = true; err = ''; });
                    try {
                      final res = await supabase.from('users').insert({
                        'name': nameCtrl.text.trim(),
                        'phone': phoneCtrl.text.trim(),
                        'role': selRole,
                        'is_active': true,
                      }).select('*').single();
                      setState(() => _users.insert(0, res as Map<String, dynamic>));
                      if (mounted) Navigator.pop(ctx);
                    } catch (e) {
                      ss(() { saving = false; err = e.toString(); });
                    }
                  },
                  child: saving
                      ? const SizedBox(width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Create User'),
                )),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark   = ThemeService.instance.isDarkMode;
    final scaffoldBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA);
    final cardBg   = isDark ? kNeutral800 : Colors.white;
    final cardBorder = isDark ? kNeutral700 : kNeutral200;
    final barBg    = isDark ? kNeutral900 : Colors.white;
    final searchBg = isDark ? kNeutral800 : kNeutral100;
    final textMain = isDark ? Colors.white : kNeutral900;
    final textMuted= isDark ? kNeutral400 : Colors.grey;

    final filtered = _users.where((u) {
      final name  = (u['name']  as String? ?? '').toLowerCase();
      final phone = (u['phone'] as String? ?? '').toLowerCase();
      final matchSearch = _search.isEmpty
          || name.contains(_search.toLowerCase())
          || phone.contains(_search.toLowerCase());
      final matchRole = _role == 'all' || u['role'] == _role;
      return matchSearch && matchRole;
    }).toList();

    return Scaffold(
      backgroundColor: scaffoldBg,
      drawer: const AdminDrawer(currentRoute: '/admin/users'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('User Management'),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 20),
                onPressed: () => context.pop())
            : Builder(builder: (c) => IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedMenu01, color: Colors.white, size: 22),
                onPressed: () => Scaffold.of(c).openDrawer())),
        actions: [
          TextButton.icon(
            onPressed: _showCreateSheet,
            icon: const Icon(Icons.add, color: Colors.white, size: 20),
            label: const Text('New', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: Column(
        children: [
          // ─── Filter Bar ──────────────────────────────────────────────────
          Container(
            color: barBg,
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
            child: Column(
              children: [
                Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: searchBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: cardBorder),
                  ),
                  child: TextField(
                    onChanged: (v) => setState(() => _search = v),
                    style: TextStyle(fontSize: 14, color: textMain),
                    decoration: InputDecoration(
                      hintText: 'Search by name or phone…',
                      hintStyle: TextStyle(color: textMuted, fontSize: 14),
                      prefixIcon: Icon(Icons.search, size: 18, color: textMuted),
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(vertical: 11),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                _FilterChips(
                  options: const ['all', 'customer', 'shop_owner', 'admin'],
                  selected: _role,
                  onTap: (v) => setState(() => _role = v),
                  labels: const {'all':'All','customer':'Customer','shop_owner':'Shop Owner','admin':'Admin'},
                  isDark: isDark,
                ),
              ],
            ),
          ),
          Divider(height: 1, color: cardBorder),

          // ─── List ────────────────────────────────────────────────────────
          _loading
              ? const Expanded(child: Center(child: CircularProgressIndicator()))
              : filtered.isEmpty
                  ? Expanded(child: Center(
                      child: Text('No users found.', style: TextStyle(color: textMuted))))
                  : Expanded(
                      child: ListView.separated(
                        padding: const EdgeInsets.all(12),
                        itemCount: filtered.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, i) {
                          final user = filtered[i];
                          final role = user['role'] as String? ?? 'customer';
                          final roleColor = _roleColors[role] ?? kNeutral400;
                          final isActive = user['is_active'] as bool? ?? true;
                          final phone = user['phone'] as String? ?? '';
                          final verified = user['phone_verified'] as bool? ?? false;
                          final initial = (user['name'] as String? ?? '?')[0].toUpperCase();

                          return Container(
                            decoration: BoxDecoration(
                              color: cardBg,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: cardBorder),
                              boxShadow: isDark ? [] : [
                                BoxShadow(color: Colors.black.withAlpha(8), blurRadius: 4, offset: const Offset(0, 2)),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(children: [
                                    Container(
                                      width: 44, height: 44,
                                      decoration: BoxDecoration(
                                        color: roleColor.withAlpha(28),
                                        shape: BoxShape.circle,
                                        border: Border.all(color: roleColor.withAlpha(60), width: 1.5),
                                      ),
                                      child: Center(child: Text(initial,
                                        style: TextStyle(color: roleColor, fontWeight: FontWeight.w700, fontSize: 18))),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                        Text(user['name'] ?? '—',
                                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: textMain)),
                                        const SizedBox(height: 2),
                                        Row(children: [
                                          Text(phone, style: TextStyle(fontSize: 13, color: textMuted)),
                                          const SizedBox(width: 4),
                                          Icon(
                                            verified ? Icons.verified : Icons.error_outline,
                                            size: 13,
                                            color: verified ? Colors.green : (isDark ? kNeutral500 : Colors.grey),
                                          ),
                                        ]),
                                      ]),
                                    ),
                                    GestureDetector(
                                      onTap: () => _showRolePickerForUser(user),
                                      child: _SmallBadge(
                                        role.replaceAll('_', ' '),
                                        color: roleColor.withAlpha(22),
                                        textColor: roleColor,
                                      ),
                                    ),
                                  ]),
                                  const SizedBox(height: 10),
                                  _RoleToggleBar(
                                    currentRole: role,
                                    isDark: isDark,
                                    onRoleSelected: (newRole) => _changeUserRole(user, newRole),
                                  ),
                                  const SizedBox(height: 10),
                                  Row(children: [
                                    GestureDetector(
                                      onTap: () => _toggleUser(user),
                                      child: _StatusBadge(isActive: isActive),
                                    ),
                                    const SizedBox(width: 8),
                                    _ActionBtn(
                                      label: 'Delete', icon: Icons.delete_outline,
                                      color: kDanger, bgColor: const Color(0xFFFEE2E2),
                                      onTap: () => _deleteUser(user),
                                    ),
                                    const Spacer(),
                                    _ActionBtn(
                                      label: 'Details →', icon: Icons.arrow_forward,
                                      color: kBrand500, bgColor: isDark ? kNeutral700 : kBrand100,
                                      onTap: () => context.push('/admin/users/${user['id']}'),
                                    ),
                                  ]),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateSheet,
        backgroundColor: kBrand500,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Add User'),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ORDERS SCREEN  (unchanged — kept as-is)
// ═══════════════════════════════════════════════════════════════════════════════

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
    final isDark = ThemeService.instance.isDarkMode;
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
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA),
      drawer: const AdminDrawer(currentRoute: '/admin/orders'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('All Orders'),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 20),
                onPressed: () => context.pop())
            : null,
      ),
      body: Column(
        children: [
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: ['all','pending','accepted','packing','ready','out_for_delivery','delivered','cancelled'].map((s) =>
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(s == 'all' ? 'All Statuses' : s[0].toUpperCase() + s.substring(1).replaceAll('_', ' ')),
                    selected: _status == s,
                    selectedColor: kWaGreen,
                    onSelected: (_) => setState(() => _status = s),
                  ),
                ),
              ).toList(),
            ),
          ),
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: [
                FilterChip(label: const Text('All Dates'), selected: _dateFilter == null,
                  selectedColor: kWaGreen, onSelected: (_) => setState(() => _dateFilter = null)),
                const SizedBox(width: 8),
                FilterChip(label: const Text('Today'),
                  selected: _dateFilter != null && DateUtils.isSameDay(_dateFilter!, DateTime.now()),
                  selectedColor: kWaGreen, onSelected: (_) => setState(() => _dateFilter = DateTime.now())),
                const SizedBox(width: 8),
                FilterChip(label: const Text('Tomorrow'),
                  selected: _dateFilter != null && DateUtils.isSameDay(_dateFilter!, DateTime.now().add(const Duration(days: 1))),
                  selectedColor: kWaGreen, onSelected: (_) => setState(() => _dateFilter = DateTime.now().add(const Duration(days: 1)))),
                const SizedBox(width: 8),
                ActionChip(
                  avatar: const Icon(Icons.calendar_today, size: 14),
                  label: Text(_dateFilter != null && !DateUtils.isSameDay(_dateFilter!, DateTime.now()) && !DateUtils.isSameDay(_dateFilter!, DateTime.now().add(const Duration(days: 1)))
                      ? '${_dateFilter!.day}/${_dateFilter!.month}/${_dateFilter!.year}' : 'Pick Date'),
                  onPressed: () async {
                    final picked = await showDatePicker(
                      context: context, initialDate: _dateFilter ?? DateTime.now(),
                      firstDate: DateTime.now().subtract(const Duration(days: 30)),
                      lastDate: DateTime.now().add(const Duration(days: 30)),
                    );
                    if (picked != null) setState(() => _dateFilter = picked);
                  },
                ),
              ],
            ),
          ),
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              children: [
                FilterChip(label: const Text('All Slots'), selected: _slotFilter == 'all',
                  selectedColor: kWaGreen, onSelected: (_) => setState(() => _slotFilter = 'all')),
                const SizedBox(width: 8),
                FilterChip(label: const Text('☀️ Morning'), selected: _slotFilter == 'morning',
                  selectedColor: kWaGreen, onSelected: (_) => setState(() => _slotFilter = 'morning')),
                const SizedBox(width: 8),
                FilterChip(label: const Text('🌙 Evening'), selected: _slotFilter == 'evening',
                  selectedColor: kWaGreen, onSelected: (_) => setState(() => _slotFilter = 'evening')),
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
                        leading: const CircleAvatar(backgroundColor: Color(0xFFE0F2FE),
                          child: Icon(Icons.receipt, color: Color(0xFF0369A1), size: 20)),
                        title: Text('${(o['users'] as Map?)?['name'] ?? '—'} → ${(o['shops'] as Map?)?['name'] ?? '—'} $displayOrderNumber',
                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('ID: ${(o['id'] as String).substring(0, 8)} · ${o['status'].toString().toUpperCase()}'),
                            if (o['delivery_date'] != null && o['delivery_slot'] != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  '${o['delivery_slot'] == 'morning' ? "☀️ Morning" : "🌙 Evening"} Slot (${o['delivery_date']})',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                                    color: o['delivery_slot'] == 'morning' ? const Color(0xFF16A34A) : const Color(0xFFEA580C)),
                                ),
                              ),
                          ],
                        ),
                        trailing: Text('₹ ${(o['total_final_price'] ?? o['total_estimated_price'] ?? 0.0).toStringAsFixed(0)}',
                            style: const TextStyle(fontWeight: FontWeight.w700)),
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

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED WIDGETS
// ═══════════════════════════════════════════════════════════════════════════════

/// Active / Inactive pill badge
class _StatusBadge extends StatelessWidget {
  final bool isActive;
  const _StatusBadge({required this.isActive});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(
      color: isActive ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      isActive ? 'Active' : 'Inactive',
      style: TextStyle(
        fontSize: 11, fontWeight: FontWeight.w700,
        color: isActive ? const Color(0xFF15803D) : const Color(0xFFB91C1C),
      ),
    ),
  );
}

/// Horizontal filter chip row
class _FilterChips extends StatelessWidget {
  final List<String> options;
  final String selected;
  final void Function(String) onTap;
  final Map<String, String> labels;
  final bool isDark;

  const _FilterChips({
    required this.options, required this.selected,
    required this.onTap, required this.labels, required this.isDark,
  });

  @override
  Widget build(BuildContext context) => Row(
    children: options.map((o) {
      final isSelected = selected == o;
      return Padding(
        padding: const EdgeInsets.only(right: 6),
        child: GestureDetector(
          onTap: () => onTap(o),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              color: isSelected ? kBrand500 : (isDark ? kNeutral700 : kNeutral100),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isSelected ? kBrand500 : (isDark ? kNeutral600 : kNeutral200)),
            ),
            child: Text(
              labels[o] ?? o,
              style: TextStyle(
                fontSize: 12, fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : (isDark ? kNeutral300 : kNeutral600),
              ),
            ),
          ),
        ),
      );
    }).toList(),
  );
}

/// Small pill badge
class _SmallBadge extends StatelessWidget {
  final String label;
  final Color color;
  final Color textColor;
  const _SmallBadge(this.label, {required this.color, required this.textColor});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(6)),
    child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textColor)),
  );
}

/// Icon action button
class _ActionBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final Color bgColor;
  final VoidCallback onTap;
  const _ActionBtn({required this.label, required this.icon, required this.color,
    required this.bgColor, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
        ],
      ),
    ),
  );
}

/// Form section label
class _InputLabel extends StatelessWidget {
  final String text;
  final bool isDark;
  const _InputLabel(this.text, {required this.isDark});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(text, style: TextStyle(
      fontSize: 13, fontWeight: FontWeight.w600,
      color: isDark ? kNeutral300 : const Color(0xFF374151),
    )),
  );
}

/// Outlined text input with icon
class _StyledInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final List<List<dynamic>> icon;
  final bool isDark;
  final TextInputType keyboardType;

  const _StyledInput({required this.controller, required this.hint,
    required this.icon, required this.isDark,
    this.keyboardType = TextInputType.text});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: isDark ? kNeutral700 : Colors.white,
      border: Border.all(color: isDark ? kNeutral600 : kNeutral200),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Row(
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 12),
          child: HugeIcon(icon: icon, size: 18, color: isDark ? kNeutral400 : kNeutral400),
        ),
        Expanded(
          child: TextField(
            controller: controller,
            keyboardType: keyboardType,
            style: TextStyle(fontSize: 14, color: isDark ? Colors.white : kNeutral900),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: isDark ? kNeutral500 : Colors.grey, fontSize: 14),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 13),
            ),
          ),
        ),
      ],
    ),
  );
}

/// Outlined dropdown with icon
class _StyledDropdown<T> extends StatelessWidget {
  final T? value;
  final String hint;
  final List<List<dynamic>> icon;
  final List<DropdownMenuItem<T>> items;
  final void Function(T?) onChanged;
  final bool isDark;

  const _StyledDropdown({required this.value, required this.hint, required this.icon,
    required this.items, required this.onChanged, required this.isDark});

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: isDark ? kNeutral700 : Colors.white,
      border: Border.all(color: isDark ? kNeutral600 : kNeutral200),
      borderRadius: BorderRadius.circular(10),
    ),
    child: Row(
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 12),
          child: HugeIcon(icon: icon, size: 18, color: kNeutral400),
        ),
        Expanded(
          child: DropdownButtonHideUnderline(
            child: DropdownButton<T>(
              value: value,
              hint: Text(hint, style: TextStyle(color: isDark ? kNeutral500 : Colors.grey, fontSize: 14)),
              isExpanded: true,
              isDense: true,
              dropdownColor: isDark ? kNeutral800 : Colors.white,
              style: TextStyle(fontSize: 14, color: isDark ? Colors.white : Colors.black87),
              padding: const EdgeInsets.only(left: 8, right: 12),
              items: items,
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    ),
  );
}

class _RoleToggleBar extends StatelessWidget {
  final String currentRole;
  final bool isDark;
  final Function(String newRole) onRoleSelected;

  const _RoleToggleBar({
    required this.currentRole,
    required this.isDark,
    required this.onRoleSelected,
  });

  @override
  Widget build(BuildContext context) {
    const roles = [
      {'id': 'customer', 'label': 'Customer', 'color': Color(0xFF64748B)},
      {'id': 'shop_owner', 'label': 'Shopkeeper', 'color': Color(0xFF3B82F6)},
      {'id': 'admin', 'label': 'Admin', 'color': Color(0xFFF59E0B)},
    ];

    final bg = isDark ? kNeutral900 : const Color(0xFFF1F5F9);
    final border = isDark ? kNeutral700 : kNeutral200;

    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: border),
      ),
      child: Row(
        children: roles.map((r) {
          final id = r['id'] as String;
          final label = r['label'] as String;
          final color = r['color'] as Color;
          final isSelected = currentRole == id;

          return Expanded(
            child: GestureDetector(
              onTap: () => onRoleSelected(id),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(vertical: 6),
                decoration: BoxDecoration(
                  color: isSelected ? color : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  label,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: isSelected
                        ? Colors.white
                        : (isDark ? kNeutral400 : kNeutral600),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}


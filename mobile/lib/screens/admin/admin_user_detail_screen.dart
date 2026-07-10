import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';

/// Admin User Detail — dark/light theme aware, matches Next.js /admin/users/[userId]
class AdminUserDetailScreen extends StatefulWidget {
  final String userId;
  const AdminUserDetailScreen({super.key, required this.userId});
  @override
  State<AdminUserDetailScreen> createState() => _AdminUserDetailScreenState();
}

class _AdminUserDetailScreenState extends State<AdminUserDetailScreen> {
  Map<String, dynamic>? _user;
  List<Map<String, dynamic>> _orders = [];
  List<Map<String, dynamic>> _shops  = [];
  bool _loading = true;

  static const _roleColors = {
    'customer':  Color(0xFF64748B),
    'shop_owner': Color(0xFF3B82F6),
    'admin':     Color(0xFFF59E0B),
  };

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final results = await Future.wait([
      supabase.from('users')
          .select('*, user_profiles(email, profile_image_url, preferred_language, gender)')
          .eq('id', widget.userId)
          .single(),
      supabase.from('orders')
          .select('id, status, created_at, total_final_price, shops(name)')
          .eq('user_id', widget.userId)
          .order('created_at', ascending: false)
          .limit(10),
      supabase.from('shop_owners')
          .select('shops(id, name)')
          .eq('user_id', widget.userId),
    ]);
    if (mounted) {
      setState(() {
        _user   = results[0] as Map<String, dynamic>;
        _orders = (results[1] as List).cast();
        _shops  = ((results[2] as List).cast<Map<String, dynamic>>())
            .map((e) => e['shops'] as Map<String, dynamic>)
            .where((s) => s.isNotEmpty)
            .toList();
        _loading = false;
      });
    }
  }

  Future<void> _toggleStatus() async {
    if (_user == null) return;
    final next = !(_user!['is_active'] as bool? ?? true);
    await supabase.from('users').update({'is_active': next}).eq('id', widget.userId);
    setState(() => _user = {..._user!, 'is_active': next});
  }

  String _formatDate(String? d) {
    if (d == null) return '—';
    try {
      final dt = DateTime.parse(d).toLocal();
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
    } catch (_) { return d; }
  }

  @override
  Widget build(BuildContext context) {
    final isDark    = ThemeService.instance.isDarkMode;
    final scaffoldBg = isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA);
    final cardBg    = isDark ? kNeutral800 : Colors.white;
    final cardBorder = isDark ? kNeutral700 : kNeutral200;
    final textMain  = isDark ? Colors.white : kNeutral900;
    final textMuted = isDark ? kNeutral400 : kNeutral500;
    final divColor  = isDark ? kNeutral700 : kNeutral200;

    final role     = _user?['role'] as String? ?? 'customer';
    final roleColor= _roleColors[role] ?? kNeutral400;
    final isActive = _user?['is_active'] as bool? ?? true;
    final name     = _user?['name'] as String? ?? '—';
    final phone    = _user?['phone'] as String? ?? '';
    final profile  = _user?['user_profiles'] as Map? ?? {};
    final email    = profile['email'] as String?;
    final lang     = profile['preferred_language'] as String?;
    final gender   = profile['gender'] as String?;

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: Text(_loading ? 'User Detail' : name),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: Colors.white, size: 20),
                onPressed: () => context.pop())
            : null,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ─── Profile Header Card ────────────────────────────────
                  Container(
                    decoration: BoxDecoration(
                      color: cardBg,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: cardBorder),
                      boxShadow: isDark ? [] : [
                        BoxShadow(color: Colors.black.withAlpha(8), blurRadius: 4, offset: const Offset(0, 2))
                      ],
                    ),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        // Avatar + name row
                        Row(children: [
                          Container(
                            width: 64, height: 64,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [roleColor.withAlpha(60), roleColor.withAlpha(30)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              border: Border.all(color: roleColor.withAlpha(80), width: 2),
                            ),
                            child: Center(
                              child: Text(
                                name.isNotEmpty ? name[0].toUpperCase() : '?',
                                style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: roleColor),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(name, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: textMain)),
                              const SizedBox(height: 4),
                              Text(phone, style: TextStyle(color: textMuted, fontSize: 14)),
                              const SizedBox(height: 6),
                              Row(children: [
                                _RoleBadge(role, color: roleColor),
                                const SizedBox(width: 8),
                                GestureDetector(
                                  onTap: _toggleStatus,
                                  child: _StatusBadge(isActive: isActive),
                                ),
                              ]),
                            ]),
                          ),
                        ]),
                        Divider(height: 28, color: divColor),
                        // Info rows
                        if (email != null) ...[
                          _InfoRow(icon: HugeIcons.strokeRoundedMail01, label: 'Email', value: email, textMain: textMain, textMuted: textMuted),
                          const SizedBox(height: 10),
                        ],
                        if (lang != null) ...[
                          _InfoRow(icon: HugeIcons.strokeRoundedGlobe, label: 'Language', value: lang, textMain: textMain, textMuted: textMuted),
                          const SizedBox(height: 10),
                        ],
                        if (gender != null) ...[
                          _InfoRow(icon: HugeIcons.strokeRoundedUser, label: 'Gender', value: gender, textMain: textMain, textMuted: textMuted),
                          const SizedBox(height: 10),
                        ],
                        _InfoRow(icon: HugeIcons.strokeRoundedCalendar01, label: 'Joined', value: _formatDate(_user?['created_at']), textMain: textMain, textMuted: textMuted),
                        const SizedBox(height: 10),
                        _InfoRow(
                          icon: isActive ? HugeIcons.strokeRoundedShield01 : HugeIcons.strokeRoundedUnavailable,
                          label: 'Status',
                          value: isActive ? 'Active' : 'Inactive',
                          textMain: textMain,
                          textMuted: textMuted,
                          valueColor: isActive ? const Color(0xFF15803D) : const Color(0xFFB91C1C),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ─── Shops Owned ─────────────────────────────────────────
                  if (_shops.isNotEmpty) ...[
                    _SectionHeader(HugeIcons.strokeRoundedStore01, 'Shops Owned (${_shops.length})', textMain: textMain),
                    const SizedBox(height: 10),
                    Container(
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: cardBorder),
                      ),
                      child: Column(
                        children: _shops.asMap().entries.map((e) {
                          final i = e.key;
                          final shop = e.value;
                          return Column(children: [
                            ListTile(
                              leading: Container(
                                width: 36, height: 36,
                                decoration: BoxDecoration(
                                  color: isDark ? kNeutral700 : kBrand100,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Center(child: Text('🏪', style: TextStyle(fontSize: 16))),
                              ),
                              title: Text(shop['name'] ?? '—',
                                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: textMain)),
                              trailing: GestureDetector(
                                onTap: () => context.push('/admin/shops/${shop['id']}'),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: isDark ? kNeutral700 : kBrand100,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text('View →',
                                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: kBrand500)),
                                ),
                              ),
                            ),
                            if (i < _shops.length - 1) Divider(height: 1, indent: 16, color: divColor),
                          ]);
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // ─── Recent Orders ────────────────────────────────────────
                  _SectionHeader(HugeIcons.strokeRoundedShoppingBag01, 'Recent Orders', textMain: textMain),
                  const SizedBox(height: 10),
                  if (_orders.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: cardBorder),
                      ),
                      child: Center(
                        child: Text('No orders yet.', style: TextStyle(color: textMuted, fontSize: 14)),
                      ),
                    )
                  else
                    Container(
                      decoration: BoxDecoration(
                        color: cardBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: cardBorder),
                      ),
                      child: Column(
                        children: _orders.asMap().entries.map((e) {
                          final i = e.key;
                          final o = e.value;
                          final shopName = (o['shops'] as Map?)?['name'] as String? ?? 'Shop';
                          final shortId  = (o['id'] as String).substring(0, 8);
                          final status   = o['status'] as String? ?? '';
                          final price    = o['total_final_price'];
                          final priceText= price != null ? '₹${price.toStringAsFixed(0)}' : '—';

                          Color statusColor = textMuted;
                          if (status == 'delivered') statusColor = kSuccess;
                          else if (status == 'cancelled') statusColor = kDanger;
                          else if (status == 'pending') statusColor = kWarning;
                          else if (['accepted','packing','ready','out_for_delivery'].contains(status)) statusColor = kInfo;

                          return Column(children: [
                            InkWell(
                              onTap: () => context.push('/admin/orders/${o['id']}'),
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(children: [
                                  Container(
                                    width: 36, height: 36,
                                    decoration: BoxDecoration(
                                      color: isDark ? const Color(0xFF0C4A6E) : const Color(0xFFE0F2FE),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Center(
                                      child: HugeIcon(icon: HugeIcons.strokeRoundedPackage, color: Color(0xFF0369A1), size: 18),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Text(shopName, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: textMain)),
                                      const SizedBox(height: 2),
                                      Row(children: [
                                        Text('#$shortId', style: TextStyle(color: textMuted, fontSize: 12)),
                                        const SizedBox(width: 6),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: statusColor.withAlpha(22),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(status, style: TextStyle(
                                            fontSize: 10, fontWeight: FontWeight.w700, color: statusColor)),
                                        ),
                                      ]),
                                    ]),
                                  ),
                                  Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                                    Text(priceText, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: textMain)),
                                    Text(_formatDate(o['created_at']), style: TextStyle(fontSize: 11, color: textMuted)),
                                  ]),
                                ]),
                              ),
                            ),
                            if (i < _orders.length - 1) Divider(height: 1, indent: 16, color: divColor),
                          ]);
                        }).toList(),
                      ),
                    ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
    );
  }
}

// ─── Shared widgets ───────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final List<List<dynamic>> icon;
  final String title;
  final Color textMain;
  const _SectionHeader(this.icon, this.title, {required this.textMain});

  @override
  Widget build(BuildContext context) => Row(
    children: [
      HugeIcon(icon: icon, size: 18, color: kBrand500),
      const SizedBox(width: 8),
      Text(title, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: textMain)),
    ],
  );
}

class _InfoRow extends StatelessWidget {
  final List<List<dynamic>> icon;
  final String label;
  final String value;
  final Color textMain;
  final Color textMuted;
  final Color? valueColor;
  const _InfoRow({required this.icon, required this.label, required this.value,
    required this.textMain, required this.textMuted, this.valueColor});

  @override
  Widget build(BuildContext context) => Row(
    children: [
      HugeIcon(icon: icon, size: 18, color: kNeutral400),
      const SizedBox(width: 12),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(fontSize: 11, color: textMuted)),
        Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500,
          color: valueColor ?? textMain)),
      ]),
    ],
  );
}

class _RoleBadge extends StatelessWidget {
  final String role;
  final Color color;
  const _RoleBadge(this.role, {required this.color});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: color.withAlpha(22), borderRadius: BorderRadius.circular(20)),
    child: Text(role.replaceAll('_', ' '),
      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
  );
}

class _StatusBadge extends StatelessWidget {
  final bool isActive;
  const _StatusBadge({required this.isActive});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: isActive ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(isActive ? 'Active' : 'Inactive',
      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
        color: isActive ? const Color(0xFF15803D) : const Color(0xFFB91C1C))),
  );
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});
  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _users = 0, _shops = 0, _orders = 0, _pending = 0;
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final results = await Future.wait([
      supabase.from('users').select('id'),
      supabase.from('shops').select('id'),
      supabase.from('orders').select('id'),
      supabase.from('orders').select('id').eq('status', 'pending'),
    ]);
    if (mounted) {
      setState(() {
        _users   = (results[0] as List).length;
        _shops   = (results[1] as List).length;
        _orders  = (results[2] as List).length;
        _pending = (results[3] as List).length;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    const kBg = Color(0xFF09090B);
    const kText = Color(0xFFF8FAFC);
    const kSubText = Color(0xFF94A3B8);

    return Scaffold(
      backgroundColor: kBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kText,
        title: const Text('Admin Console', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => context.go('/profile'), // Return to profile
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6)))
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('System Overview', style: TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: kText, letterSpacing: -1)),
                  const SizedBox(height: 6),
                  const Text('Platform metrics and management', style: TextStyle(fontSize: 16, color: kSubText)),
                  const SizedBox(height: 32),

                  // Stats Grid
                  GridView.count(
                    crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 16, crossAxisSpacing: 16, childAspectRatio: 1.1,
                    children: [
                      _StatTile(icon: Icons.people_alt_rounded, iconColor: const Color(0xFF3B82F6), val: '$_users', label: 'Total Users'),
                      _StatTile(icon: Icons.storefront_rounded, iconColor: const Color(0xFF10B981), val: '$_shops', label: 'Total Shops'),
                      _StatTile(icon: Icons.shopping_cart_rounded, iconColor: const Color(0xFF8B5CF6), val: '$_orders', label: 'Total Orders'),
                      _StatTile(icon: Icons.pending_actions_rounded, iconColor: const Color(0xFFF59E0B), val: '$_pending', label: 'Pending'),
                    ],
                  ),
                  const SizedBox(height: 36),

                  const Text('Management Tools', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: kText, letterSpacing: -0.5)),
                  const SizedBox(height: 16),
                  
                  ...[
                    (Icons.storefront_rounded, 'Shops Directory', '/admin/shops', const Color(0xFF10B981)),
                    (Icons.people_alt_rounded, 'User Accounts', '/admin/users', const Color(0xFF3B82F6)),
                    (Icons.shopping_cart_rounded, 'All Orders', '/admin/orders', const Color(0xFF8B5CF6)),
                    (Icons.category_rounded, 'Categories', '/admin/categories', const Color(0xFFEC4899)),
                    (Icons.square_foot_rounded, 'Units', '/admin/units', const Color(0xFFF59E0B)),
                    (Icons.account_balance_wallet_rounded, 'Credit Settings', '/admin/credit', const Color(0xFF14B8A6)),
                    (Icons.history_rounded, 'System Logs', '/admin/logs', const Color(0xFF64748B)),
                    (Icons.settings_rounded, 'Global Settings', '/admin/settings', const Color(0xFF94A3B8)),
                  ].map((t) => GestureDetector(
                    onTap: () => context.push(t.$3),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.03),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: t.$4.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(t.$1, color: t.$4, size: 20),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(t.$2, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: kText)),
                          ),
                          const Icon(Icons.chevron_right_rounded, color: Color(0xFF64748B)),
                        ],
                      ),
                    ),
                  )),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String val, label;
  const _StatTile({required this.icon, required this.iconColor, required this.val, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: iconColor.withValues(alpha: 0.2)),
            ),
            child: Icon(icon, color: iconColor, size: 28),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(val, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -1)),
              const SizedBox(height: 4),
              Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF94A3B8), letterSpacing: 0.5)),
            ],
          ),
        ],
      ),
    );
  }
}

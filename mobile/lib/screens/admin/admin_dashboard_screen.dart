import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/theme_service.dart';
import '../../widgets/directional_huge_icon.dart';
import 'admin_drawer.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});
  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _users = 0, _shops = 0, _orders = 0, _pending = 0;
  bool _loading = true;
  int _todayMorning = 0, _todayEvening = 0, _tomorrowMorning = 0, _tomorrowEvening = 0;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final today = DateTime.now();
    final todayStr = today.toIso8601String().split('T')[0];
    final tomorrow = today.add(const Duration(days: 1));
    final tomorrowStr = tomorrow.toIso8601String().split('T')[0];

    final results = await Future.wait<dynamic>([
      supabase.from('users').select('id'),
      supabase.from('shops').select('id'),
      supabase.from('orders').select('id'),
      supabase.from('orders').select('id').eq('status', 'pending'),
      supabase.from('orders')
          .select('delivery_date, delivery_slot')
          .inFilter('delivery_date', [todayStr, tomorrowStr])
          .not('payment_type', 'is', null)
          .neq('status', 'cancelled'),
    ]);

    final slotCounts = List<Map<String, dynamic>>.from(results[4] as List);
    if (mounted) {
      setState(() {
        _users   = (results[0] as List).length;
        _shops   = (results[1] as List).length;
        _orders  = (results[2] as List).length;
        _pending = (results[3] as List).length;

        _todayMorning = slotCounts.where((o) => o['delivery_date'] == todayStr && o['delivery_slot'] == 'morning').length;
        _todayEvening = slotCounts.where((o) => o['delivery_date'] == todayStr && o['delivery_slot'] == 'evening').length;
        _tomorrowMorning = slotCounts.where((o) => o['delivery_date'] == tomorrowStr && o['delivery_slot'] == 'morning').length;
        _tomorrowEvening = slotCounts.where((o) => o['delivery_date'] == tomorrowStr && o['delivery_slot'] == 'evening').length;

        _loading = false;
      });
    }
  }

  Widget _buildSlotMiniRow(String label, String count, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.02) : Colors.black.withOpacity(0.02),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.grey)),
          Text(
            count,
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: color),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    final kBg = isDark ? const Color(0xFF09090B) : const Color(0xFFF8FAFC);
    final kText = isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A);
    final kSubText = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Scaffold(
      backgroundColor: kBg,
      drawer: const AdminDrawer(currentRoute: '/admin/dashboard'),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kText,
        title: const Text('Admin Console', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6)))
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('System Overview', style: TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: kText, letterSpacing: -1)),
                  const SizedBox(height: 6),
                  Text('Platform metrics and management', style: TextStyle(fontSize: 16, color: kSubText)),
                  const SizedBox(height: 32),

                  // Stats Grid
                  GridView.count(
                    crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 16, crossAxisSpacing: 16, childAspectRatio: 1.1,
                    children: [
                      _StatTile(icon: HugeIcons.strokeRoundedUserGroup, iconColor: const Color(0xFF3B82F6), val: '$_users', label: 'Total Users'),
                      _StatTile(icon: HugeIcons.strokeRoundedStore01, iconColor: const Color(0xFF10B981), val: '$_shops', label: 'Total Shops'),
                      _StatTile(icon: HugeIcons.strokeRoundedShoppingCart01, iconColor: const Color(0xFF8B5CF6), val: '$_orders', label: 'Total Orders'),
                      _StatTile(icon: HugeIcons.strokeRoundedTask01, iconColor: const Color(0xFFF59E0B), val: '$_pending', label: 'Pending'),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Delivery Slot Analytics Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withOpacity(0.03) : Colors.black.withOpacity(0.03),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: isDark ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.08)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.delivery_dining, color: Color(0xFF8B5CF6), size: 24),
                            const SizedBox(width: 8),
                            Text(
                              'Delivery Slot Analytics',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: kText),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            // Today's Slots
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Today',
                                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kText),
                                  ),
                                  const SizedBox(height: 8),
                                  _buildSlotMiniRow('☀️ Morning', '$_todayMorning', const Color(0xFF16A34A), isDark),
                                  const SizedBox(height: 6),
                                  _buildSlotMiniRow('🌙 Evening', '$_todayEvening', const Color(0xFFEA580C), isDark),
                                ],
                              ),
                            ),
                            const SizedBox(width: 20),
                            // Tomorrow's Slots
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Tomorrow',
                                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kText),
                                  ),
                                  const SizedBox(height: 8),
                                  _buildSlotMiniRow('☀️ Morning', '$_tomorrowMorning', const Color(0xFF16A34A), isDark),
                                  const SizedBox(height: 6),
                                  _buildSlotMiniRow('🌙 Evening', '$_tomorrowEvening', const Color(0xFFEA580C), isDark),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  Text('Management Tools', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: kText, letterSpacing: -0.5)),
                  const SizedBox(height: 16),
                  
                  ...[
                    (HugeIcons.strokeRoundedStore01, 'Shops Directory', '/admin/shops', const Color(0xFF10B981)),
                    (HugeIcons.strokeRoundedUserGroup, 'User Accounts', '/admin/users', const Color(0xFF3B82F6)),
                    (HugeIcons.strokeRoundedShoppingCart01, 'All Orders', '/admin/orders', const Color(0xFF8B5CF6)),
                    (HugeIcons.strokeRoundedGrid, 'Categories', '/admin/categories', const Color(0xFFEC4899)),
                    (HugeIcons.strokeRoundedMoney03, 'Commission Dashboard', '/admin/commission', const Color(0xFF8B5CF6)),
                    (HugeIcons.strokeRoundedStore01, 'Shop Billing & Dues', '/admin/commission/shops', const Color(0xFF3B82F6)),
                    (HugeIcons.strokeRoundedRuler, 'Units', '/admin/units', const Color(0xFFF59E0B)),
                    (HugeIcons.strokeRoundedWallet01, 'Credit Settings', '/admin/credit', const Color(0xFF14B8A6)),
                    (HugeIcons.strokeRoundedWorkHistory, 'System Logs', '/admin/logs', const Color(0xFF64748B)),
                    (HugeIcons.strokeRoundedSettings01, 'Global Settings', '/admin/settings', const Color(0xFF94A3B8)),
                  ].map((t) => GestureDetector(
                    onTap: () => context.push(t.$3),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.black.withValues(alpha: 0.03),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.08)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: t.$4.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: HugeIcon(icon: t.$1, color: t.$4, size: 20),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Text(t.$2, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: kText)),
                          ),
                          const DirectionalHugeIcon(icon: HugeIcons.strokeRoundedArrowRight01, color: Color(0xFF64748B)),
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
  final List<List<dynamic>> icon;
  final Color iconColor;
  final String val, label;
  const _StatTile({required this.icon, required this.iconColor, required this.val, required this.label});

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeService.instance.isDarkMode;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.08)),
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
            child: HugeIcon(icon: icon, color: iconColor, size: 28),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(val, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF0F172A), letterSpacing: -1)),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B), letterSpacing: 0.5)),
            ],
          ),
        ],
      ),
    );
  }
}

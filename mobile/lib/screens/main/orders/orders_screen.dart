import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  late Future<List<Map<String, dynamic>>> _future;
  String _filter = 'all';
  String _slot = 'all';

  @override
  void initState() {
    super.initState();
    _future = _fetch();
  }

  Future<List<Map<String, dynamic>>> _fetch() async {
    final userId = supabase.auth.currentUser!.id;
    var query = supabase
        .from('orders')
        .select('id, status, created_at, total_final_price, shops(name), delivery_date, delivery_slot, order_number, shop_reviews(id)')
        .eq('user_id', userId)
        .not('payment_type', 'is', null);

    final now = DateTime.now();
    if (_filter == 'today') {
      final todayStr = DateFormat('yyyy-MM-dd').format(now);
      query = query.gte('delivery_date', todayStr);
    } else if (_filter == 'week') {
      final weekAgo = DateFormat('yyyy-MM-dd').format(now.subtract(const Duration(days: 7)));
      query = query.gte('delivery_date', weekAgo);
    } else if (_filter == 'month') {
      final monthAgo = DateFormat('yyyy-MM-dd').format(now.subtract(const Duration(days: 30)));
      query = query.gte('delivery_date', monthAgo);
    }

    if (_slot == 'morning' || _slot == 'evening') {
      query = query.eq('delivery_slot', _slot);
    }

    final res = await query.order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(res as List);
  }

  void _setFilter(String f) {
    setState(() { _filter = f; _future = _fetch(); });
  }

  void _setSlot(String s) {
    setState(() { _slot = s; _future = _fetch(); });
  }

  // ─── Status helpers ──────────────────────────────────────────────────────────
  static const _statusConfig = {
    'pending':    _StatusConfig(color: Color(0xFFF59E0B), bg: Color(0xFFFFF7ED), icon: Icons.schedule_rounded,    label: 'Pending'),
    'packing':    _StatusConfig(color: Color(0xFF0EA5E9), bg: Color(0xFFE0F2FE), icon: Icons.inventory_2_rounded, label: 'Packing'),
    'accepted':   _StatusConfig(color: Color(0xFF8B5CF6), bg: Color(0xFFEDE9FE), icon: Icons.check_circle_outline_rounded, label: 'Accepted'),
    'ready':      _StatusConfig(color: Color(0xFF6366F1), bg: Color(0xFFE0E7FF), icon: Icons.storefront_rounded,  label: 'Ready'),
    'out_for_delivery': _StatusConfig(color: Color(0xFF3B82F6), bg: Color(0xFFEFF6FF), icon: Icons.two_wheeler_rounded, label: 'On the Way'),
    'delivering': _StatusConfig(color: Color(0xFF3B82F6), bg: Color(0xFFEFF6FF), icon: Icons.local_shipping_rounded, label: 'Delivering'),
    'delivered':  _StatusConfig(color: Color(0xFF22C55E), bg: Color(0xFFF0FDF4), icon: Icons.check_circle_rounded, label: 'Delivered'),
    'cancelled':  _StatusConfig(color: Color(0xFFEF4444), bg: Color(0xFFFEF2F2), icon: Icons.cancel_rounded,       label: 'Cancelled'),
  };

  _StatusConfig _getStatus(String status) =>
      _statusConfig[status] ?? const _StatusConfig(color: Color(0xFF94A3B8), bg: Color(0xFFF8FAFC), icon: Icons.help_outline_rounded, label: 'Unknown');

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;
    final bgBase = isDark ? kNeutral900 : const Color(0xFFF0F2F5);
    final surface = isDark ? kNeutral800 : Colors.white;
    final border = isDark ? kNeutral700 : kNeutral200;
    final textBase = isDark ? Colors.white : kNeutral900;
    final textMuted = isDark ? kNeutral400 : kNeutral500;

    return Scaffold(
      backgroundColor: bgBase,
      body: SafeArea(
        child: Column(
          children: [
            // ─── Header ─────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => context.pop(),
                    child: Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: surface,
                        shape: BoxShape.circle,
                        border: Border.all(color: border),
                      ),
                      child: Icon(Icons.arrow_back_rounded, color: textBase, size: 20),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Text(l10n.myOrdersTitle,
                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800,
                        color: textBase, letterSpacing: -0.5),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ─── Time Filters ────────────────────────────────────────────────
            SizedBox(
              height: 38,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                children: [
                  for (final f in ['today', 'week', 'month', 'all'])
                    _FilterChip(
                      label: f == 'today' ? l10n.todayLabel
                           : f == 'week'  ? l10n.last7DaysLabel
                           : f == 'month' ? l10n.last30DaysLabel
                           : l10n.allTimeLabel,
                      active: _filter == f,
                      onTap: () => _setFilter(f),
                      surface: surface, border: border, textMuted: textMuted,
                    ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // ─── Slot Filters ────────────────────────────────────────────────
            SizedBox(
              height: 34,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                children: [
                                  _FilterChip(label: l10n.allSlotsLabel, active: _slot == 'all', onTap: () => _setSlot('all'), surface: surface, border: border, textMuted: textMuted, small: true),
                  _FilterChip(label: l10n.morningSlotLabel, active: _slot == 'morning', onTap: () => _setSlot('morning'), surface: surface, border: border, textMuted: textMuted, small: true),
                  _FilterChip(label: l10n.eveningSlotLabel, active: _slot == 'evening', onTap: () => _setSlot('evening'), surface: surface, border: border, textMuted: textMuted, small: true),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // ─── Order List ──────────────────────────────────────────────────
            Expanded(
              child: FutureBuilder<List<Map<String, dynamic>>>(
                future: _future,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  final orders = snapshot.data ?? [];

                  if (orders.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inventory_2_outlined, size: 72, color: textMuted),
                          const SizedBox(height: 20),
                          Text(l10n.noOrdersYet,
                              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: textBase)),
                          const SizedBox(height: 8),
                          Text(l10n.noOrdersSubtitle,
                              style: TextStyle(fontSize: 14, color: textMuted, fontWeight: FontWeight.w500)),
                          const SizedBox(height: 32),
                          GestureDetector(
                            onTap: () => context.go('/home'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                              decoration: BoxDecoration(
                                color: kWaGreen,
                                borderRadius: BorderRadius.circular(24),
                                boxShadow: [BoxShadow(color: kWaGreen.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 8))],
                              ),
                              child: Text(l10n.continueShoppingButton,
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                    itemCount: orders.length,
                    itemBuilder: (_, i) {
                      final o = orders[i];
                      final shopName = (o['shops'] as Map<String, dynamic>?)?['name'] ?? 'Shop';
                      final status = o['status'] as String;
                      final cfg = _getStatus(status);
                      final date = DateTime.parse(o['created_at'] as String);
                      final price = (o['total_final_price'] as num?)?.toDouble();
                      final orderNum = o['order_number'];
                      final delivDate = o['delivery_date'] as String?;
                      final delivSlot = o['delivery_slot'] as String?;

                      return GestureDetector(
                        onTap: () => context.push('/orders/${o['id']}'),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 14),
                          decoration: BoxDecoration(
                            color: surface,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: border),
                            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 20, offset: const Offset(0, 4))],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              children: [
                                // Top row: shop name + status icon
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(shopName,
                                                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: textBase)),
                                              if (orderNum != null) ...[
                                                const SizedBox(width: 8),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: isDark ? kNeutral700 : kNeutral100,
                                                    borderRadius: BorderRadius.circular(6),
                                                  ),
                                                  child: Text('#$orderNum',
                                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textMuted)),
                                                ),
                                              ],
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(DateFormat('d MMM yyyy, h:mm a').format(date),
                                            style: TextStyle(fontSize: 12, color: textMuted, fontWeight: FontWeight.w500)),
                                          // Slot chip
                                          if (delivDate != null && delivSlot != null) ...[
                                            const SizedBox(height: 8),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: delivSlot == 'morning' ? const Color(0xFFF0FDF4) : const Color(0xFFFFF7ED),
                                                borderRadius: BorderRadius.circular(8),
                                                border: Border.all(
                                                  color: delivSlot == 'morning' ? const Color(0xFFBBF7D0) : const Color(0xFFFED7AA),
                                                ),
                                              ),
                                              child: Text(
                                                '${delivSlot == 'morning' ? '☀️' : '🌙'} ${delivSlot == 'morning' ? 'Morning' : 'Evening'} • ${DateFormat('d MMM').format(DateTime.parse(delivDate))}',
                                                style: TextStyle(
                                                  fontSize: 11, fontWeight: FontWeight.w700,
                                                  color: delivSlot == 'morning' ? const Color(0xFF16A34A) : const Color(0xFFEA580C),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    // Status icon box
                                    Container(
                                      width: 48, height: 48,
                                      decoration: BoxDecoration(
                                        color: isDark ? cfg.color.withValues(alpha: 0.15) : cfg.bg,
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      child: Icon(cfg.icon, color: cfg.color, size: 24),
                                    ),
                                  ],
                                ),

                                const SizedBox(height: 16),
                                Divider(height: 1, color: border),
                                const SizedBox(height: 16),

                                // Bottom row: price + status badge
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(price != null ? '₹ ${price.toStringAsFixed(0)}' : '--',
                                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: kWaGreen)),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: isDark ? cfg.color.withValues(alpha: 0.15) : cfg.bg,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(cfg.label,
                                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cfg.color)),
                                    ),
                                  ],
                                ),
                                
                                // Direct leave review action
                                (() {
                                  final reviewsList = o['shop_reviews'];
                                  final hasReview = reviewsList != null && (reviewsList is List ? reviewsList.isNotEmpty : true);
                                  if (status == 'delivered' && !hasReview) {
                                    return Column(
                                      children: [
                                        const SizedBox(height: 12),
                                        SizedBox(
                                          width: double.infinity,
                                          child: FilledButton.icon(
                                            onPressed: () async {
                                              final result = await context.push<bool>('/orders/${o['id']}/review');
                                              if (result == true) {
                                                setState(() {
                                                  _future = _fetch();
                                                });
                                              }
                                            },
                                            icon: const Icon(Icons.rate_review_outlined, size: 16, color: Colors.white),
                                            label: const Text('Leave Review', style: TextStyle(fontSize: 13, color: Colors.white, fontWeight: FontWeight.w700)),
                                            style: FilledButton.styleFrom(
                                              backgroundColor: kWaGreen,
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              padding: const EdgeInsets.symmetric(vertical: 10),
                                            ),
                                          ),
                                        ),
                                      ],
                                    );
                                  }
                                  return const SizedBox.shrink();
                                })(),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Filter Chip ──────────────────────────────────────────────────────────────
class _FilterChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  final Color surface;
  final Color border;
  final Color textMuted;
  final bool small;

  const _FilterChip({
    required this.label, required this.active, required this.onTap,
    required this.surface, required this.border, required this.textMuted,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: EdgeInsets.symmetric(horizontal: small ? 12 : 16, vertical: small ? 6 : 8),
        decoration: BoxDecoration(
          color: active ? kWaGreen : surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: active ? kWaGreen : border),
        ),
        child: Text(label,
          style: TextStyle(
            fontSize: small ? 13 : 14,
            fontWeight: FontWeight.w600,
            color: active ? Colors.white : textMuted,
          ),
        ),
      ),
    );
  }
}

// ─── Status Config ────────────────────────────────────────────────────────────
class _StatusConfig {
  final Color color;
  final Color bg;
  final IconData icon;
  final String label;
  const _StatusConfig({required this.color, required this.bg, required this.icon, required this.label});
}

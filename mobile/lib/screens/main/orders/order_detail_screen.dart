import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  late Future<_Data> _future;

  @override
  void initState() {
    super.initState();
    _future = _fetch();
  }

  Future<_Data> _fetch() async {
    List<Map<String, dynamic>> replacementRequests = [];
    try {
      final res = await supabase
          .from('replacement_requests')
          .select('*, replacement_items(*, order_items(*, items(name))))')
          .eq('order_id', widget.orderId)
          .order('created_at', ascending: false);
      replacementRequests = List<Map<String, dynamic>>.from(res as List? ?? []);
    } catch (_) {
      // Gracefully ignore if replacement_requests table is missing or schema cache is not yet refreshed
    }

    final results = await Future.wait<dynamic>([
      supabase
          .from('orders')
          .select('*, shops(name)')
          .eq('id', widget.orderId)
          .eq('user_id', supabase.auth.currentUser!.id)
          .single(),
      supabase
          .from('order_items')
          .select('*, items(name), item_variants:vw_item_variants_with_fallback(label, price)')
          .eq('order_id', widget.orderId),
      supabase.from('order_addresses').select('*').eq('order_id', widget.orderId).maybeSingle(),
      supabase.from('shop_reviews').select('*').eq('order_id', widget.orderId).maybeSingle(),
    ]);

    return _Data(
      order:   results[0] as Map<String, dynamic>,
      items:   List<Map<String, dynamic>>.from(results[1] as List),
      address: results[2] as Map<String, dynamic>?,
      review:  results[3] as Map<String, dynamic>?,
      replacementRequests: replacementRequests,
    );
  }

  bool _updating = false;

  Future<void> _markAsDelivered() async {
    setState(() => _updating = true);
    try {
      await supabase
          .from('orders')
          .update({'status': 'delivered'})
          .eq('id', widget.orderId);
      setState(() {
        _future = _fetch();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error confirming delivery: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _updating = false);
      }
    }
  }

  Future<void> _cancelOrder() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Order'),
        content: const Text('Are you sure you want to cancel this order?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Yes', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _updating = true);
    try {
      await supabase
          .from('orders')
          .update({'status': 'cancelled'})
          .eq('id', widget.orderId);
      setState(() {
        _future = _fetch();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error cancelling order: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _updating = false);
      }
    }
  }
  Future<void> _cancelReplacementRequest(String requestId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Request'),
        content: const Text('Are you sure you want to cancel this complaint/replacement request?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Yes', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _updating = true);
    try {
      await supabase
          .from('replacement_requests')
          .update({'status': 'Cancelled'})
          .eq('id', requestId);
      setState(() {
        _future = _fetch();
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error cancelling request: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _updating = false);
      }
    }
  }



  // ─── Status map ─────────────────────────────────────────────────────────────
  static const _statusMap = {
    'pending':          _StatusConfig(color: Color(0xFFF59E0B), bg: Color(0xFFFFF7ED), icon: Icons.schedule_rounded,           label: 'Order Placed'),
    'packing':          _StatusConfig(color: Color(0xFF0EA5E9), bg: Color(0xFFE0F2FE), icon: Icons.inventory_2_rounded,        label: 'Preparing'),
    'accepted':         _StatusConfig(color: Color(0xFF8B5CF6), bg: Color(0xFFEDE9FE), icon: Icons.check_circle_outline_rounded, label: 'Accepted'),
    'ready':            _StatusConfig(color: Color(0xFF6366F1), bg: Color(0xFFE0E7FF), icon: Icons.storefront_rounded,         label: 'Ready to Pick'),
    'out_for_delivery': _StatusConfig(color: Color(0xFF3B82F6), bg: Color(0xFFEFF6FF), icon: Icons.two_wheeler_rounded,        label: 'Out for Delivery'),
    'delivering':       _StatusConfig(color: Color(0xFF3B82F6), bg: Color(0xFFEFF6FF), icon: Icons.local_shipping_rounded,     label: 'On the Way'),
    'delivered':        _StatusConfig(color: Color(0xFF22C55E), bg: Color(0xFFF0FDF4), icon: Icons.check_circle_rounded,       label: 'Delivered'),
    'cancelled':        _StatusConfig(color: Color(0xFFEF4444), bg: Color(0xFFFEF2F2), icon: Icons.cancel_rounded,             label: 'Cancelled'),
  };

  _StatusConfig _getStatus(String status) =>
      _statusMap[status] ?? const _StatusConfig(color: Color(0xFF94A3B8), bg: Color(0xFFF8FAFC), icon: Icons.help_outline_rounded, label: 'Unknown');

  Widget _buildSectionCard({required Widget child, required Color surface, required Color border}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: border),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 16, offset: const Offset(0, 4))],
      ),
      child: child,
    );
  }

  Widget _buildCardTitle({required IconData icon, required Color iconColor, required String title, required Color textBase}) {
    return Row(
      children: [
        Icon(icon, color: iconColor, size: 20),
        const SizedBox(width: 8),
        Text(title, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: textBase)),
      ],
    );
  }

  Widget _buildInfoRow({required String label, required String value, required Color textLight, required Color textBase}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 12, color: textLight, fontWeight: FontWeight.w600)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: textBase)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;
    final bgBase  = isDark ? kNeutral900 : const Color(0xFFF0F2F5);
    final surface = isDark ? kNeutral800 : Colors.white;
    final border  = isDark ? kNeutral700 : kNeutral200;
    final textBase = isDark ? Colors.white : kNeutral900;
    final textMuted = isDark ? kNeutral400 : kNeutral500;
    final textLight = isDark ? kNeutral400 : const Color(0xFF64748B);

    return FutureBuilder<_Data>(
      future: _future,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return Scaffold(
            backgroundColor: bgBase,
            body: const Center(child: CircularProgressIndicator()),
          );
        }

        final d = snapshot.data!;
        final order = d.order;
        final shopName = (order['shops'] as Map<String, dynamic>?)?['name'] ?? 'Shop';
        final status = order['status'] as String;
        final cfg = _getStatus(status);
        final addr = d.address;
        final price = (order['total_final_price'] as num?)?.toDouble()
                   ?? (order['total_estimated_price'] as num?)?.toDouble();
        final orderNumber = order['order_number'];
        final deliveryDate = order['delivery_date'] as String?;
        final deliverySlot = order['delivery_slot'] as String?;
        final paymentType = order['payment_type'] as String?;
        final createdAt = DateTime.parse(order['created_at'] as String);
        final isMorning = deliverySlot?.toLowerCase() == 'morning';

        return Scaffold(
          backgroundColor: bgBase,
          body: SafeArea(
            child: Column(
              children: [
                // ─── Header ─────────────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => context.canPop() ? context.pop() : context.go('/orders'),
                        child: Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(
                            color: surface, shape: BoxShape.circle,
                            border: Border.all(color: border),
                          ),
                          child: Icon(Icons.arrow_back_rounded, color: textBase, size: 20),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          orderNumber != null ? '#$orderNumber' : '#${widget.orderId.substring(0, 8).toUpperCase()}',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: textBase, letterSpacing: -0.5),
                        ),
                      ),
                      // Status badge in header
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: border),
                        ),
                        child: Text(cfg.label,
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: cfg.color)),
                      ),
                    ],
                  ),
                ),

                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 100),
                    child: Column(
                      children: [
                        // ─── Hero Card (dark green gradient) ────────────────
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: isDark
                                  ? [const Color(0xFF0F2922), const Color(0xFF1A3D2E)]
                                  : [const Color(0xFF1A4731), const Color(0xFF2E6B47)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Row(
                            children: [
                              // Status icon
                              Container(
                                width: 56, height: 56,
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.18),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Icon(cfg.icon, color: Colors.white, size: 28),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(shopName,
                                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${DateFormat('d MMMM yyyy').format(createdAt)} at ${DateFormat('h:mm a').format(createdAt)}',
                                      style: const TextStyle(fontSize: 13, color: Color(0xFFB5DEB5), fontWeight: FontWeight.w500),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),



                        // ─── Request Replacement / Complaint Quick Action Card ─────
                        if (status == 'delivered') ...[
                          _buildSectionCard(
                            surface: surface, border: border,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildCardTitle(
                                  icon: Icons.card_giftcard_rounded,
                                  iconColor: const Color(0xFF22C55E),
                                  title: 'Order Delivered Celebration 🎉',
                                  textBase: textBase,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Your order has been delivered! View your celebration summary and earned 5-Star loyalty rewards.',
                                  style: TextStyle(fontSize: 13, color: textMuted, fontWeight: FontWeight.w500),
                                ),
                                const SizedBox(height: 14),
                                GestureDetector(
                                  onTap: () {
                                    context.push('/orders/${widget.orderId}/delivered');
                                  },
                                  child: Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        colors: [Color(0xFF22C55E), Color(0xFF15803D)],
                                      ),
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF22C55E).withValues(alpha: 0.3),
                                          blurRadius: 12,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: const Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'View Delivered Celebration & Rewards ⭐',
                                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white),
                                        ),
                                        SizedBox(width: 6),
                                        Icon(Icons.arrow_forward_rounded, size: 18, color: Colors.white),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          _buildSectionCard(
                            surface: surface, border: border,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildCardTitle(
                                  icon: Icons.assignment_return_rounded,
                                  iconColor: const Color(0xFFF59E0B),
                                  title: 'Request Replacement / Complaint',
                                  textBase: textBase,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Received damaged, missing, or incorrect items? Submit a complaint or replacement request.',
                                  style: TextStyle(fontSize: 13, color: textMuted, fontWeight: FontWeight.w500),
                                ),
                                const SizedBox(height: 16),
                                GestureDetector(
                                  onTap: () async {
                                    final result = await context.push<bool>('/orders/${widget.orderId}/replacement');
                                    if (result == true) {
                                      setState(() { _future = _fetch(); });
                                    }
                                  },
                                  child: Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF59E0B),
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFFF59E0B).withValues(alpha: 0.25),
                                          blurRadius: 12,
                                          offset: const Offset(0, 4),
                                        )
                                      ],
                                    ),
                                    child: const Center(
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.assignment_return_rounded, color: Colors.white, size: 20),
                                          SizedBox(width: 8),
                                          Text(
                                            'Request Replacement / Complaint',
                                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        const SizedBox(height: 16),

                        // ─── Review prompt (if delivered and no review) ──────
                        if (status == 'delivered' && d.review == null) ...[
                          _buildSectionCard(
                            surface: surface, border: border,
                            child: Row(
                              children: [
                                Container(
                                  width: 44, height: 44,
                                  decoration: BoxDecoration(
                                    color: kWaGreen.withValues(alpha: isDark ? 0.15 : 0.1),
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: Icon(Icons.rate_review_rounded, color: kWaGreen, size: 22),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('How was your order?',
                                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textBase)),
                                      Text('Share your experience with the shop.',
                                        style: TextStyle(fontSize: 12, color: textMuted, fontWeight: FontWeight.w500)),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                GestureDetector(
                                  onTap: () async {
                                    final result = await context.push<bool>('/orders/${widget.orderId}/review');
                                    if (result == true) setState(() { _future = _fetch(); });
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                    decoration: BoxDecoration(
                                      color: kWaGreen,
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: const Text('Review',
                                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // ─── Confirm Delivery prompt (if out_for_delivery or delivering) ──────
                        if (status == 'out_for_delivery' || status == 'delivering') ...[
                          _buildSectionCard(
                            surface: surface, border: border,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildCardTitle(icon: Icons.check_circle_outline_rounded, iconColor: kWaGreen, title: 'Confirm Delivery', textBase: textBase),
                                const SizedBox(height: 8),
                                Text(
                                  'Has your order arrived? Please click the button below to confirm receipt of the delivery.',
                                  style: TextStyle(fontSize: 13, color: textMuted, fontWeight: FontWeight.w500),
                                ),
                                const SizedBox(height: 16),
                                GestureDetector(
                                  onTap: _updating ? null : _markAsDelivered,
                                  child: Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    decoration: BoxDecoration(
                                      color: kWaGreen,
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: [
                                        BoxShadow(
                                          color: kWaGreen.withValues(alpha: 0.2),
                                          blurRadius: 12,
                                          offset: const Offset(0, 4),
                                        )
                                      ],
                                    ),
                                    child: Center(
                                      child: _updating
                                          ? const SizedBox(
                                              width: 20, height: 20,
                                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                            )
                                          : const Text(
                                              'Confirm Delivery (Mark as Delivered)',
                                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                            ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // ─── Cancel Order prompt (if pending) ──────
                        if (status == 'pending') ...[
                          _buildSectionCard(
                            surface: surface, border: border,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildCardTitle(icon: Icons.cancel_outlined, iconColor: const Color(0xFFEF4444), title: 'Cancel Order', textBase: textBase),
                                const SizedBox(height: 8),
                                Text(
                                  'You can cancel this order as long as it has not been accepted by the shop.',
                                  style: TextStyle(fontSize: 13, color: textMuted, fontWeight: FontWeight.w500),
                                ),
                                const SizedBox(height: 16),
                                GestureDetector(
                                  onTap: _updating ? null : _cancelOrder,
                                  child: Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEF4444),
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFFEF4444).withValues(alpha: 0.2),
                                          blurRadius: 12,
                                          offset: const Offset(0, 4),
                                        )
                                      ],
                                    ),
                                    child: Center(
                                      child: _updating
                                          ? const SizedBox(
                                              width: 20, height: 20,
                                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                            )
                                          : const Text(
                                              'Cancel Order',
                                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                                            ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // ─── Delivery Schedule ───────────────────────────────
                        if (deliveryDate != null && deliverySlot != null) ...[
                          _buildSectionCard(
                            surface: surface, border: border,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildCardTitle(icon: Icons.schedule_rounded, iconColor: const Color(0xFF0EA5E9), title: 'Delivery Schedule', textBase: textBase),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Text(isMorning ? '☀️' : '🌙', style: const TextStyle(fontSize: 28)),
                                    const SizedBox(width: 12),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('${isMorning ? 'Morning' : 'Evening'} Slot (${isMorning ? '7 AM – 12 PM' : '4 PM – 8 PM'})',
                                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: textBase)),
                                        Text('On ${DateFormat('d MMM yyyy').format(DateTime.parse(deliveryDate))}',
                                          style: TextStyle(fontSize: 13, color: textLight, fontWeight: FontWeight.w500)),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // ─── Payment Details ─────────────────────────────────
                        _buildSectionCard(
                          surface: surface, border: border,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildCardTitle(icon: Icons.credit_card_rounded, iconColor: kWaGreen, title: 'Payment Details', textBase: textBase),
                              const SizedBox(height: 12),
                              _buildInfoRow(
                                label: 'Payment Method',
                                value: paymentType == 'credit' ? 'Pay Later' : 'Cash on Delivery',
                                textLight: textLight, textBase: textBase,
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 16),

                        // ─── Delivery Address ─────────────────────────────────
                        if (addr != null) ...[
                          _buildSectionCard(
                            surface: surface, border: border,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildCardTitle(icon: Icons.location_on_rounded, iconColor: const Color(0xFF3B82F6), title: l10n.orderDetailAddressSection, textBase: textBase),
                                const SizedBox(height: 12),
                                if (addr['label'] != null) ...[
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: isDark ? kNeutral700 : kNeutral100,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(addr['label'] as String,
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: textMuted)),
                                  ),
                                  const SizedBox(height: 8),
                                ],
                                _buildInfoRow(label: 'Contact', value: '${addr['contact_name']} · ${addr['contact_phone']}', textLight: textLight, textBase: textBase),
                                const SizedBox(height: 8),
                                _buildInfoRow(label: 'Address', value: addr['address_line_1'] as String, textLight: textLight, textBase: textBase),
                                if (addr['address_line_2'] != null && (addr['address_line_2'] as String).isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(addr['address_line_2'] as String,
                                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: textBase)),
                                ],
                                if (addr['landmark'] != null && (addr['landmark'] as String).isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(l10n.nearLandmarkLabel(addr['landmark'] ?? ''),
                                    style: TextStyle(fontSize: 13, color: textMuted)),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // ─── Order Summary ───────────────────────────────────
                        _buildSectionCard(
                          surface: surface, border: border,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildCardTitle(icon: Icons.receipt_long_rounded, iconColor: const Color(0xFFF59E0B), title: l10n.orderDetailItemsSection, textBase: textBase),
                              const SizedBox(height: 4),

                              // Items
                              ...d.items.map((oi) {
                                final itemName     = (oi['items'] as Map?)?['name'] ?? '';
                                final variantLabel = (oi['item_variants'] as Map?)?['label'] ?? '';
                                final finalPrice   = (oi['final_price'] as num?)?.toDouble() ?? 0;
                                final qty          = oi['requested_value'] ?? 1;
                                final oisStatus    = oi['status'] as String;

                                return Container(
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  decoration: BoxDecoration(
                                    border: Border(bottom: BorderSide(color: border, style: BorderStyle.solid)),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(itemName,
                                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: textBase)),
                                            const SizedBox(height: 2),
                                            Text('$variantLabel × $qty',
                                              style: TextStyle(fontSize: 13, color: textMuted, fontWeight: FontWeight.w500)),
                                            if (oisStatus != 'approved' && oisStatus != 'pending') ...[
                                              const SizedBox(height: 4),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: oisStatus == 'rejected'
                                                      ? const Color(0xFFEF4444).withValues(alpha: 0.1)
                                                      : const Color(0xFFF59E0B).withValues(alpha: 0.1),
                                                  borderRadius: BorderRadius.circular(8),
                                                ),
                                                child: Text(oisStatus.toUpperCase(),
                                                  style: TextStyle(
                                                    fontSize: 9, fontWeight: FontWeight.w700,
                                                    color: oisStatus == 'rejected' ? const Color(0xFFEF4444) : const Color(0xFFF59E0B),
                                                  )),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                      Text('₹ ${finalPrice.toStringAsFixed(0)}',
                                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textBase)),
                                    ],
                                  ),
                                );
                              }),

                              // Total
                              const SizedBox(height: 12),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(l10n.total,
                                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: textBase)),
                                  Text(price != null ? '₹ ${price.toStringAsFixed(0)}' : '—',
                                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: kWaGreen)),
                                ],
                              ),
                            ],
                          ),
                        ),

                        // ─── Review Card ────────────────────────────────────
                        if (d.review != null) ...[
                          const SizedBox(height: 16),
                          _buildSectionCard(
                            surface: isDark ? const Color(0xFF0D2918) : const Color(0xFFF0FDF4),
                            border: isDark ? const Color(0xFF1A4228) : const Color(0xFFBBF7D0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(l10n.orderDetailReviewSection,
                                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: textBase)),
                                    Row(
                                      children: List.generate(5, (index) {
                                        final ratingVal = d.review!['final_rating'] as num? ?? 0.0;
                                        return Icon(
                                          index < ratingVal.round() ? Icons.star_rounded : Icons.star_outline_rounded,
                                          color: const Color(0xFFF59E0B), size: 18,
                                        );
                                      }),
                                    ),
                                  ],
                                ),
                                if (d.review!['title'] != null && d.review!['title'].toString().isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(d.review!['title'] as String,
                                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: textBase)),
                                ],
                                if (d.review!['review'] != null && d.review!['review'].toString().isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(d.review!['review'] as String,
                                    style: TextStyle(fontSize: 13, color: textLight)),
                                ],
                              ],
                            ),
                          ),
                        ],

                        // ─── Replacement Requests History ───────────────────
                        if (d.replacementRequests.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          ...d.replacementRequests.map((req) {
                            final reqStatus = req['status'] as String? ?? 'Pending';
                            final reasonStr = req['reason'] as String? ?? '';
                            final desc = req['description'] as String?;
                            final itemsList = (req['replacement_items'] as List?) ?? [];

                            Color statusColor = const Color(0xFFF59E0B);
                            if (reqStatus == 'Approved' || reqStatus == 'Completed') statusColor = const Color(0xFF22C55E);
                            if (reqStatus == 'Rejected') statusColor = const Color(0xFFEF4444);
                            if (reqStatus == 'Cancelled') statusColor = const Color(0xFF94A3B8);

                            return Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: _buildSectionCard(
                                surface: surface, border: border,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            Icon(Icons.report_problem_rounded, color: statusColor, size: 20),
                                            const SizedBox(width: 8),
                                            Text('Complaint Request', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: textBase)),
                                          ],
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: statusColor.withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(12),
                                          ),
                                          child: Text(reqStatus.toUpperCase(),
                                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: statusColor)),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 10),
                                    Text('Reason: ${reasonStr.replaceAll('_', ' ').toUpperCase()}',
                                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: textBase)),
                                    if (desc != null && desc.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(desc, style: TextStyle(fontSize: 13, color: textMuted)),
                                    ],
                                    if (itemsList.isNotEmpty) ...[
                                      const SizedBox(height: 8),
                                      ...itemsList.map((ri) {
                                        final itemObj = (ri['order_items'] as Map?)?['items'] as Map?;
                                        final itemName = itemObj?['name'] ?? 'Item';
                                        final qty = ri['quantity'] ?? 1;
                                        return Text('• $itemName × $qty', style: TextStyle(fontSize: 13, color: textLight, fontWeight: FontWeight.w600));
                                      }),
                                    ],
                                    if (reqStatus == 'Pending') ...[
                                      const SizedBox(height: 12),
                                      GestureDetector(
                                        onTap: () => _cancelReplacementRequest(req['id'] as String),
                                        child: const Text('Cancel Request', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFFEF4444))),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            );
                          }),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}



// ─── Data model ──────────────────────────────────────────────────────────────
class _Data {
  final Map<String, dynamic> order;
  final List<Map<String, dynamic>> items;
  final Map<String, dynamic>? address;
  final Map<String, dynamic>? review;
  final List<Map<String, dynamic>> replacementRequests;
  _Data({
    required this.order,
    required this.items,
    this.address,
    this.review,
    this.replacementRequests = const [],
  });
}

class _StatusConfig {
  final Color color;
  final Color bg;
  final IconData icon;
  final String label;
  const _StatusConfig({required this.color, required this.bg, required this.icon, required this.label});
}



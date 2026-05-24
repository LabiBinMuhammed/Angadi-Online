import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/supabase_client.dart';
import 'vendor_theme_helper.dart';

class VendorUserCreditScreen extends StatefulWidget {
  final String userId;
  const VendorUserCreditScreen({super.key, required this.userId});

  @override
  State<VendorUserCreditScreen> createState() => _VendorUserCreditScreenState();
}

class _VendorUserCreditScreenState extends State<VendorUserCreditScreen> {
  Map<String, dynamic>? _credit;
  Map<String, dynamic>? _user;
  List<Map<String, dynamic>> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final uid = supabase.auth.currentUser!.id;
    final ownerRes = await supabase.from('shop_owners').select('shop_id').eq('user_id', uid).maybeSingle();
    final shopId = ownerRes?['shop_id'] as String?;

    final results = await Future.wait<dynamic>([
      supabase.from('users').select('name, phone').eq('id', widget.userId).single(),
      if (shopId != null)
        supabase.from('shop_user_credits').select('*').eq('shop_id', shopId).eq('user_id', widget.userId).maybeSingle()
      else
        Future<Map<String, dynamic>?>.value(null),
      if (shopId != null)
        supabase
            .from('orders')
            .select('id, status, created_at, total_final_price')
            .eq('shop_id', shopId)
            .eq('user_id', widget.userId)
            .order('created_at', ascending: false)
      else
        Future<List<Map<String, dynamic>>>.value([]),
    ]);

    if (mounted) {
      setState(() {
        _user = results[0] as Map<String, dynamic>?;
        _credit = results[1] as Map<String, dynamic>?;
        _orders = ((results[2] as List?) ?? []).cast<Map<String, dynamic>>();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final name = _user?['name'] ?? 'Credit Detail';
    final phone = _user?['phone'] ?? '';
    final limit = _credit?['credit_limit'];
    final used = _credit?['used_amount'] ?? 0;
    final isBlocked = _credit?['is_blocked'] as bool? ?? false;
    final isEnabled = _credit?['is_credit_enabled'] as bool? ?? false;

    String statusLabel = 'Disabled';
    Color statusColor = kVendorSubText;
    if (isBlocked) {
      statusLabel = 'Blocked';
      statusColor = const Color(0xFFF87171);
    } else if (isEnabled) {
      statusLabel = 'Active';
      statusColor = const Color(0xFF34D399);
    }

    return Scaffold(
      backgroundColor: kVendorBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: const Text('User Credit Detail', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA)))
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Customer Profile Header Card
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: vendorCardDecoration(radius: 24),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 24,
                          backgroundColor: const Color(0xFF8B5CF6).withOpacity(0.12),
                          child: const Icon(Icons.person_rounded, color: Color(0xFFC084FC), size: 28),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                              if (phone.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(
                                  phone,
                                  style: const TextStyle(fontSize: 13, color: kVendorSubText),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Stats Grid Cards
                  Row(
                    children: [
                      _MiniStat(
                        label: 'Credit Used',
                        value: '₹$used',
                        icon: Icons.credit_card_rounded,
                        iconColor: const Color(0xFFEF4444),
                      ),
                      const SizedBox(width: 12),
                      _MiniStat(
                        label: 'Credit Limit',
                        value: limit != null ? '₹$limit' : '₹∞',
                        icon: Icons.speed_rounded,
                        iconColor: const Color(0xFF3B82F6),
                      ),
                      const SizedBox(width: 12),
                      _MiniStat(
                        label: 'Account Status',
                        value: statusLabel,
                        valueColor: statusColor,
                        icon: isBlocked ? Icons.block_rounded : Icons.verified_user_rounded,
                        iconColor: statusColor,
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  // Order History List
                  const Text(
                    'Order History',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white, letterSpacing: -0.5),
                  ),
                  const SizedBox(height: 12),

                  if (_orders.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 40.0),
                        child: Column(
                          children: [
                            Icon(Icons.receipt_long_rounded, size: 48, color: kVendorSubText.withOpacity(0.3)),
                            const SizedBox(height: 12),
                            const Text(
                              'No order transactions found',
                              style: TextStyle(color: kVendorSubText, fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ..._orders.map((o) {
                      final orderId = o['id'] as String;
                      final status = o['status'] as String? ?? '';
                      final dateStr = o['created_at'] != null
                          ? DateFormat('dd MMM yyyy').format(DateTime.parse(o['created_at']))
                          : '';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: vendorCardDecoration(radius: 20),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          leading: Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.04),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.white.withOpacity(0.08)),
                            ),
                            child: const Icon(Icons.receipt_long_rounded, color: kVendorSubText, size: 18),
                          ),
                          title: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '#${orderId.substring(0, 8).toUpperCase()}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                  fontSize: 14,
                                  fontFamily: 'monospace',
                                ),
                              ),
                              Text(
                                '₹${o['total_final_price'] ?? '—'}',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF4ADE80), fontSize: 14),
                              ),
                            ],
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                if (dateStr.isNotEmpty)
                                  Text(
                                    dateStr,
                                    style: const TextStyle(color: kVendorSubText, fontSize: 12),
                                  ),
                                Text(
                                  status.toUpperCase(),
                                  style: const TextStyle(color: kVendorSubText, fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                          onTap: () => context.push('/vendor/orders/$orderId'),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label, value;
  final Color? valueColor;
  final IconData icon;
  final Color iconColor;

  const _MiniStat({
    required this.label,
    required this.value,
    this.valueColor,
    required this.icon,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        height: 104,
        decoration: vendorCardDecoration(radius: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: iconColor, size: 20),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: valueColor ?? Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 10, color: kVendorSubText),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

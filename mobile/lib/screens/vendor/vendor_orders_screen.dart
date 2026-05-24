import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/supabase_client.dart';
import 'vendor_theme_helper.dart';

class VendorOrdersScreen extends StatefulWidget {
  const VendorOrdersScreen({super.key});
  @override
  State<VendorOrdersScreen> createState() => _VendorOrdersScreenState();
}

class _VendorOrdersScreenState extends State<VendorOrdersScreen> {
  List<Map<String, dynamic>> _orders = [];
  bool _loading = true;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);

    final uid = supabase.auth.currentUser!.id;
    final ownerRes = await supabase.from('shop_owners').select('shop_id').eq('user_id', uid).maybeSingle();
    final shopId = ownerRes?['shop_id'] as String?;
    if (shopId == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }

    final res = await supabase
        .from('orders')
        .select('id, status, created_at, total_final_price, total_estimated_price, users(name, phone)')
        .eq('shop_id', shopId)
        .order('created_at', ascending: false);

    if (mounted) {
      setState(() {
        _orders = (res as List).cast<Map<String, dynamic>>();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _orders.where((o) => _filter == 'all' || o['status'] == _filter).toList();

    return Scaffold(
      backgroundColor: kVendorBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: const Text('Manage Orders', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
      ),
      body: Column(
        children: [
          // Filter Tabs Capsule row
          SizedBox(
            height: 60,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              children: ['all', 'pending', 'packing', 'delivering', 'delivered', 'cancelled'].map((f) {
                final isSelected = _filter == f;
                return GestureDetector(
                  onTap: () => setState(() => _filter = f),
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF3B82F6) : Colors.white.withOpacity(0.03),
                      borderRadius: BorderRadius.circular(99),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF3B82F6) : Colors.white.withOpacity(0.08),
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: const Color(0xFF3B82F6).withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              )
                            ]
                          : null,
                    ),
                    child: Text(
                      f[0].toUpperCase() + f.substring(1),
                      style: TextStyle(
                        color: isSelected ? Colors.white : kVendorSubText,
                        fontSize: 13,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // Orders List
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA)))
                : filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.receipt_long_outlined, size: 64, color: kVendorSubText.withOpacity(0.5)),
                            const SizedBox(height: 16),
                            Text(
                              _filter == 'all' ? 'No orders yet' : 'No $_filter orders found',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kVendorSubText),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: filtered.length,
                        itemBuilder: (context, i) {
                          final o = filtered[i];
                          final status = o['status'] as String? ?? 'pending';
                          final orderId = o['id'] as String;
                          final dateStr = o['created_at'] != null
                              ? DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.parse(o['created_at']))
                              : '';
                          
                          // Custom colors based on order status
                          Color statusColor = const Color(0xFF94A3B8);
                          VendorBadgeType badgeType = VendorBadgeType.neutral;

                          if (status == 'pending') {
                            statusColor = const Color(0xFFFACC15);
                            badgeType = VendorBadgeType.warning;
                          } else if (status == 'packing') {
                            statusColor = const Color(0xFF60A5FA);
                            badgeType = VendorBadgeType.info;
                          } else if (status == 'delivering') {
                            statusColor = const Color(0xFF60A5FA);
                            badgeType = VendorBadgeType.info;
                          } else if (status == 'delivered') {
                            statusColor = const Color(0xFF4ADE80);
                            badgeType = VendorBadgeType.success;
                          } else if (status == 'cancelled') {
                            statusColor = const Color(0xFFF87171);
                            badgeType = VendorBadgeType.danger;
                          }

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: vendorCardDecoration(radius: 20),
                            child: ListTile(
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              leading: Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: statusColor.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: statusColor.withOpacity(0.2)),
                                ),
                                child: Icon(Icons.receipt_long_rounded, color: statusColor, size: 22),
                              ),
                              title: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      (o['users'] as Map?)?['name'] ?? 'Guest Customer',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 15),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '₹${o['total_final_price'] ?? o['total_estimated_price'] ?? '—'}',
                                    style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white, fontSize: 15),
                                  ),
                                ],
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 8.0),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '#${orderId.substring(0, 8).toUpperCase()}',
                                          style: const TextStyle(fontFamily: 'monospace', color: kVendorSubText, fontSize: 12, fontWeight: FontWeight.bold),
                                        ),
                                        if (dateStr.isNotEmpty) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            dateStr,
                                            style: TextStyle(color: kVendorSubText.withOpacity(0.6), fontSize: 11),
                                          ),
                                        ],
                                      ],
                                    ),
                                    VendorBadge(label: status, type: badgeType),
                                  ],
                                ),
                              ),
                              onTap: () => context.push('/vendor/orders/$orderId').then((_) => _load()),
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

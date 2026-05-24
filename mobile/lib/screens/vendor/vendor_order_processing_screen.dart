import 'package:flutter/material.dart';
import '../../../core/supabase_client.dart';
import 'vendor_theme_helper.dart';

class VendorOrderProcessingScreen extends StatefulWidget {
  final String orderId;
  const VendorOrderProcessingScreen({super.key, required this.orderId});
  @override
  State<VendorOrderProcessingScreen> createState() => _VendorOrderProcessingScreenState();
}

class _VendorOrderProcessingScreenState extends State<VendorOrderProcessingScreen> {
  Map<String, dynamic>? _order;
  bool _loading = true;
  bool _updating = false;

  static const _flow = ['pending', 'packing', 'delivering', 'delivered'];
  static const _statusLabel = {
    'pending': '🕐 Pending',
    'packing': '📦 Packing',
    'delivering': '🚴 Delivering',
    'delivered': '✅ Delivered',
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final res = await supabase
        .from('orders')
        .select('*, users(name, phone), order_items(*, items(name, image_url))')
        .eq('id', widget.orderId)
        .single();
    if (mounted) {
      setState(() {
        _order = res;
        _loading = false;
      });
    }
  }

  Future<void> _updateStatus(String next) async {
    setState(() => _updating = true);
    await supabase.from('orders').update({'status': next}).eq('id', widget.orderId);
    if (mounted) {
      setState(() {
        _order = {...?_order, 'status': next};
        _updating = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: kVendorBg,
        body: Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA))),
      );
    }
    
    final o = _order!;
    final status = o['status'] as String;
    final currentIdx = _flow.indexOf(status);
    final nextStatus = currentIdx >= 0 && currentIdx < _flow.length - 1 ? _flow[currentIdx + 1] : null;

    // Determine status badge metadata
    VendorBadgeType badgeType = VendorBadgeType.neutral;
    if (status == 'delivered') {
      badgeType = VendorBadgeType.success;
    } else if (status == 'cancelled') {
      badgeType = VendorBadgeType.danger;
    } else if (status == 'pending') {
      badgeType = VendorBadgeType.warning;
    } else {
      badgeType = VendorBadgeType.info;
    }

    return Scaffold(
      backgroundColor: kVendorBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: Text('Order #${widget.orderId.substring(0, 8).toUpperCase()}', style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Customer Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: vendorCardDecoration(radius: 24),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 22,
                    backgroundColor: const Color(0xFF3B82F6).withOpacity(0.12),
                    child: const Icon(Icons.person_rounded, color: Color(0xFF60A5FA), size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          (o['users'] as Map?)?['name'] ?? 'Guest Customer',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          (o['users'] as Map?)?['phone'] ?? 'No phone number',
                          style: const TextStyle(color: kVendorSubText, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  VendorBadge(label: _statusLabel[status] ?? status, type: badgeType),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Progress Timeline Indicator
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              decoration: vendorCardDecoration(radius: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Order Timeline',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: _flow.asMap().entries.map((e) {
                      final done = e.key <= currentIdx;
                      return Expanded(
                        child: Column(
                          children: [
                            Container(
                              height: 6,
                              margin: const EdgeInsets.symmetric(horizontal: 4),
                              decoration: BoxDecoration(
                                color: done ? const Color(0xFF4ADE80) : Colors.white.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(3),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              e.value.toUpperCase(),
                              style: TextStyle(
                                fontSize: 9,
                                color: done ? const Color(0xFF4ADE80) : kVendorSubText,
                                fontWeight: e.key == currentIdx ? FontWeight.bold : FontWeight.normal,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Items List
            Container(
              padding: const EdgeInsets.all(20),
              decoration: vendorCardDecoration(radius: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Ordered Items',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white, letterSpacing: -0.5),
                  ),
                  const SizedBox(height: 12),
                  ...((o['order_items'] as List?) ?? []).map((oi) {
                    final item = oi['items'] as Map?;
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8.0),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: item?['image_url'] != null && (item!['image_url'] as String).isNotEmpty
                                ? Image.network(item['image_url'], width: 44, height: 44, fit: BoxFit.cover)
                                : Container(
                                    width: 44,
                                    height: 44,
                                    color: Colors.white.withOpacity(0.05),
                                    child: const Center(child: Icon(Icons.inventory_2_rounded, color: kVendorSubText, size: 20)),
                                  ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item?['name'] ?? 'Product Item',
                                  style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white, fontSize: 14),
                                ),
                                if (oi['quantity'] != null) ...[
                                  const SizedBox(height: 2),
                                  Text(
                                    'Quantity: ${oi['quantity']}',
                                    style: const TextStyle(color: kVendorSubText, fontSize: 12),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '₹${oi['final_price'] ?? oi['estimated_price'] ?? '—'}',
                            style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 14),
                          ),
                        ],
                      ),
                    );
                  }),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12.0),
                    child: Divider(color: Color(0x1AFFFFFF)),
                  ),
                  
                  // Total Display
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Total Final Price',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
                      ),
                      Text(
                        '₹${o['total_final_price'] ?? o['total_estimated_price'] ?? '—'}',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: Color(0xFF60A5FA)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),

            // Actions Buttons
            if (nextStatus != null && status != 'cancelled') ...[
              VendorGradientButton(
                onPressed: _updating ? null : () => _updateStatus(nextStatus),
                loading: _updating,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Mark as ${nextStatus[0].toUpperCase()}${nextStatus.substring(1)}'),
                    const SizedBox(width: 8),
                    const Icon(Icons.arrow_forward_rounded, size: 18),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
            if (status == 'pending') ...[
              VendorOutlineButton(
                width: double.infinity,
                onPressed: _updating ? null : () => _updateStatus('cancelled'),
                borderColor: const Color(0x4DEF4444),
                child: const Text(
                  'Cancel Order',
                  style: TextStyle(color: Color(0xFFF87171), fontWeight: FontWeight.bold),
                ),
              ),
            ],
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

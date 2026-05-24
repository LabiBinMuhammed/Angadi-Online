import 'package:flutter/material.dart';
import '../../../core/supabase_client.dart';

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
    ]);

    return _Data(
      order:      results[0] as Map<String, dynamic>,
      items:      List<Map<String, dynamic>>.from(results[1] as List),
      address:    results[2] as Map<String, dynamic>?,
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_Data>(
      future: _future,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final d     = snapshot.data!;
        final order = d.order;
        final shopName = (order['shops'] as Map<String, dynamic>?)?['name'] ?? 'Shop';
        final status   = order['status'] as String;
        final addr     = d.address;
        final price    = (order['total_final_price'] as num?)?.toDouble()
                      ?? (order['total_estimated_price'] as num?)?.toDouble();

        return Scaffold(
          appBar: AppBar(title: Text('Order #${widget.orderId.substring(0, 8).toUpperCase()}')),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Shop + status
                Card(
                  child: ListTile(
                    title: Text(shopName, style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(status.toUpperCase(),
                        style: const TextStyle(color: Color(0xFF0EA5E9), fontWeight: FontWeight.w600)),
                    trailing: price != null
                        ? Text('₹${price.toStringAsFixed(0)}',
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800))
                        : null,
                  ),
                ),
                const SizedBox(height: 12),

                // Address
                if (addr != null) ...[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('📍 Delivery Address',
                              style: TextStyle(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 8),
                          Text('${addr['contact_name']} · ${addr['contact_phone']}'),
                          Text(addr['address_line_1'] as String,
                              style: const TextStyle(color: Color(0xFF64748B))),
                          if (addr['address_line_2'] != null)
                            Text(addr['address_line_2'] as String,
                                style: const TextStyle(color: Color(0xFF64748B))),
                          if (addr['landmark'] != null)
                            Text('Near: ${addr['landmark']}',
                                style: const TextStyle(color: Color(0xFF64748B))),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Items
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('🧾 Items', style: TextStyle(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 12),
                        ...d.items.map((oi) {
                          final itemName    = (oi['items']         as Map?)?['name']  ?? '';
                          final variantLabel = (oi['item_variants'] as Map?)?['label'] ?? '';
                          final finalPrice  = (oi['final_price'] as num?)?.toDouble() ?? 0;
                          final oisStatus   = oi['status'] as String;

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(itemName, style: const TextStyle(fontWeight: FontWeight.w600)),
                                      Text(variantLabel, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                                    ],
                                  ),
                                ),
                                Text('₹${finalPrice.toStringAsFixed(0)}',
                                    style: const TextStyle(fontWeight: FontWeight.w700)),
                                if (oisStatus != 'approved') ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: oisStatus == 'rejected'
                                          ? const Color(0xFFEF4444).withValues(alpha: 0.1)
                                          : const Color(0xFFF59E0B).withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(oisStatus.toUpperCase(),
                                        style: TextStyle(
                                          fontSize: 9, fontWeight: FontWeight.w700,
                                          color: oisStatus == 'rejected'
                                              ? const Color(0xFFEF4444)
                                              : const Color(0xFFF59E0B),
                                        )),
                                  ),
                                ],
                              ],
                            ),
                          );
                        }),
                        const Divider(),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Total', style: TextStyle(fontWeight: FontWeight.w700)),
                            Text(price != null ? '₹${price.toStringAsFixed(0)}' : '—',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                          ],
                        ),
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

class _Data {
  final Map<String, dynamic> order;
  final List<Map<String, dynamic>> items;
  final Map<String, dynamic>? address;
  _Data({required this.order, required this.items, this.address});
}

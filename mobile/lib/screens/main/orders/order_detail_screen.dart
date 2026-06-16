import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:intl/intl.dart';
import 'package:go_router/go_router.dart';
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
      supabase.from('shop_reviews').select('*').eq('order_id', widget.orderId).maybeSingle(),
    ]);

    return _Data(
      order:      results[0] as Map<String, dynamic>,
      items:      List<Map<String, dynamic>>.from(results[1] as List),
      address:    results[2] as Map<String, dynamic>?,
      review:     results[3] as Map<String, dynamic>?,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
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

        final orderNumber = order['order_number'];
        final deliveryDate = order['delivery_date'];
        final deliverySlot = order['delivery_slot'] as String?;

        return Scaffold(
          appBar: AppBar(
            title: Text(orderNumber != null ? 'Order #$orderNumber' : 'Order #${widget.orderId.substring(0, 8).toUpperCase()}'),
          ),
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

                // Delivery Schedule
                if (deliveryDate != null && deliverySlot != null) ...[
                  Card(
                    child: ListTile(
                      leading: Text(
                        deliverySlot == 'morning' ? '☀️' : '🌙',
                        style: const TextStyle(fontSize: 24),
                      ),
                      title: Text(
                        '${deliverySlot == 'morning' ? "Morning" : "Evening"} Slot (${deliverySlot == 'morning' ? '7 AM - 12 PM' : '4 PM - 8 PM'})',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        'On ${DateFormat('d MMM yyyy').format(DateTime.parse(deliveryDate as String))}',
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Address
                if (addr != null) ...[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(l10n.orderDetailAddressSection,
                              style: TextStyle(fontWeight: FontWeight.w700)),
                          const SizedBox(height: 8),
                          Text('${addr['contact_name']} · ${addr['contact_phone']}'),
                          Text(addr['address_line_1'] as String,
                              style: const TextStyle(color: Color(0xFF64748B))),
                          if (addr['address_line_2'] != null)
                            Text(addr['address_line_2'] as String,
                                style: const TextStyle(color: Color(0xFF64748B))),
                          if (addr['landmark'] != null)
                            Text(l10n.nearLandmarkLabel(addr['landmark'] ?? ''),
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
                        Text(l10n.orderDetailItemsSection, style: const TextStyle(fontWeight: FontWeight.w700)),
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
                            Text(l10n.total, style: const TextStyle(fontWeight: FontWeight.w700)),
                            Text(price != null ? '₹${price.toStringAsFixed(0)}' : '—',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                // Review Card
                if (d.review != null) ...[
                  const SizedBox(height: 12),
                  Card(
                    color: Theme.of(context).brightness == Brightness.dark
                        ? const Color(0xFF1E293B)
                        : const Color(0xFFECFDF5),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                l10n.orderDetailReviewSection,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                              ),
                              Row(
                                children: List.generate(5, (index) {
                                  final ratingVal = d.review!['final_rating'] as num? ?? 0.0;
                                  return Icon(
                                    index < ratingVal.round() ? Icons.star_rounded : Icons.star_outline_rounded,
                                    color: const Color(0xFFF59E0B),
                                    size: 18,
                                  );
                                }),
                              ),
                            ],
                          ),
                          if (d.review!['title'] != null && d.review!['title'].toString().isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text(
                              d.review!['title'] as String,
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                            ),
                          ],
                          if (d.review!['review'] != null && d.review!['review'].toString().isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              d.review!['review'] as String,
                              style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          bottomNavigationBar: (status == 'delivered' && d.review == null)
              ? SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          final result = await context.push<bool>('/orders/${widget.orderId}/review');
                          if (result == true) {
                            setState(() {
                              _future = _fetch();
                            });
                          }
                        },
                        icon: const Icon(Icons.rate_review_rounded, color: Colors.white),
                        label: Text(
                          l10n.leaveShopReviewButton,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF128C7E), // kWaGreenDark
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      ),
                    ),
                  ),
                )
              : null,
        );
      },
    );
  }
}

class _Data {
  final Map<String, dynamic> order;
  final List<Map<String, dynamic>> items;
  final Map<String, dynamic>? address;
  final Map<String, dynamic>? review;
  _Data({required this.order, required this.items, this.address, this.review});
}

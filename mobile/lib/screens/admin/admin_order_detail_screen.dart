import 'package:flutter/material.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';

class AdminOrderDetailScreen extends StatefulWidget {
  final String orderId;
  const AdminOrderDetailScreen({super.key, required this.orderId});
  @override
  State<AdminOrderDetailScreen> createState() => _AdminOrderDetailScreenState();
}

class _AdminOrderDetailScreenState extends State<AdminOrderDetailScreen> {
  Map<String, dynamic>? _order;
  bool _loading = true;

  static const _statusColor = {
    'pending':          Color(0xFFF59E0B),
    'delivering':       Color(0xFFFB923C),
    'packing':          Color(0xFF3B82F6),
    'delivered':        Color(0xFF22C55E),
    'cancelled':        Color(0xFFEF4444),
  };

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final res = await supabase
        .from('orders')
        .select('*, users(name, phone), shops(name), order_items(*, items(name, image_url))')
        .eq('id', widget.orderId)
        .single();
    if (mounted) setState(() { _order = res; _loading = false; });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: kWaTeal, foregroundColor: Colors.white,
        title: Text(_order!['order_number'] != null ? 'Order #${_order!['order_number']}' : 'Order #${widget.orderId.substring(0, 8)}'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text('Customer: ${(_order!['users'] as Map?)?['name'] ?? '—'}', style: const TextStyle(fontWeight: FontWeight.w600)),
                          Chip(
                            label: Text(
                              _order!['status'] == 'packing'
                                  ? 'Completed Transaction'
                                  : _order!['status'] == 'delivering'
                                      ? 'Out for Delivery'
                                      : (_order!['status'] ?? ''),
                            ),
                            backgroundColor: (_statusColor[_order!['status']] ?? kNeutral400).withAlpha(38), // ~0.15
                            labelStyle: TextStyle(color: _statusColor[_order!['status']] ?? kNeutral400, fontWeight: FontWeight.w700, fontSize: 12),
                          ),
                        ]),
                        Text('Phone: ${(_order!['users'] as Map?)?['phone'] ?? '—'}', style: const TextStyle(color: Color(0xFF64748B))),
                        Text('Shop: ${(_order!['shops'] as Map?)?['name'] ?? '—'}', style: const TextStyle(color: Color(0xFF64748B))),
                      ]),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Delivery Slot Details
                  if (_order!['delivery_date'] != null && _order!['delivery_slot'] != null) ...[
                    Card(
                      child: ListTile(
                        leading: Text(
                          _order!['delivery_slot'] == 'morning' ? '☀️' : '🌙',
                          style: const TextStyle(fontSize: 24),
                        ),
                        title: Text(
                          '${_order!['delivery_slot'] == 'morning' ? "Morning" : "Evening"} Slot (${_order!['delivery_slot'] == 'morning' ? '7 AM - 12 PM' : '4 PM - 8 PM'})',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        subtitle: Text(
                          'Deliver on: ${_order!['delivery_date']}',
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  const Text('Items', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 8),
                  ...(((_order!['order_items'] as List?) ?? []).map((oi) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: (oi['items'] as Map?)?['image_url'] != null
                            ? Image.network(oi['items']['image_url'], width: 48, height: 48, fit: BoxFit.cover)
                            : Container(width: 48, height: 48, color: kNeutral100, child: const Center(child: Text('📦'))),
                      ),
                      title: Text((oi['items'] as Map?)?['name'] ?? 'Item', style: const TextStyle(fontWeight: FontWeight.w500)),
                      trailing: Text('₹${oi['final_price']}', style: const TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  ))),
                  const SizedBox(height: 16),

                  // Total
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        const Text('Final Total', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                        Text(
                          '₹${_order!['total_final_price'] ?? _order!['total_estimated_price'] ?? '—'}',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: kWaTeal),
                        ),
                      ]),
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}

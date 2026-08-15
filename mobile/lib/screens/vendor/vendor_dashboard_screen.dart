import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/supabase_client.dart';
import 'vendor_theme_helper.dart';
import 'vendor_drawer.dart';

class VendorDashboardScreen extends StatefulWidget {
  const VendorDashboardScreen({super.key});
  @override
  State<VendorDashboardScreen> createState() => _VendorDashboardScreenState();
}

class _VendorDashboardScreenState extends State<VendorDashboardScreen> {
  late Future<_Data> _future;

  @override
  void initState() {
    super.initState();
    _future = _fetch();
  }

  Future<_Data> _fetch() async {
    final user = supabase.auth.currentUser;
    if (user == null) {
      return _Data(shopId: null, shopName: 'Guest', items: 0, orders: 0, pending: 0, revenue: 0.0, runs: []);
    }
    final uid = user.id;

    try {
      final ownerListRes = await supabase
          .from('shop_owners')
          .select('shop_id, shops(name)')
          .eq('user_id', uid);
      
      final ownerList = (ownerListRes as List).cast<Map<String, dynamic>>();
      if (ownerList.isEmpty) {
        return _Data(shopId: null, shopName: 'Your Shop', items: 0, orders: 0, pending: 0, revenue: 0.0, runs: []);
      }

      final primaryOwner = ownerList.first;
      final shopId = primaryOwner['shop_id'] as String?;
      final shopName = (primaryOwner['shops'] as Map?)?['name'] as String? ?? 'Your Shop';

      if (shopId == null) {
        return _Data(shopId: null, shopName: shopName, items: 0, orders: 0, pending: 0, revenue: 0.0, runs: []);
      }

      final shopIds = ownerList.map((o) => o['shop_id'] as String).toList();

      final results = await Future.wait([
        supabase.from('items').select('id').inFilter('shop_id', shopIds).isFilter('deleted_at', null),
        supabase.from('orders').select('id').inFilter('shop_id', shopIds).not('payment_type', 'is', null),
        supabase.from('orders').select('id').inFilter('shop_id', shopIds).eq('status', 'pending').not('payment_type', 'is', null),
        supabase.from('orders').select('total_final_price').inFilter('shop_id', shopIds).eq('status', 'delivered').not('payment_type', 'is', null),
      ]);

      final deliveredOrders = results[3] as List;
      final totalRev = deliveredOrders.fold<double>(0.0, (sum, o) => sum + (o['total_final_price'] ?? 0).toDouble());

      // ── Delivery Runs Management Data ──
      final today = DateTime.now();
      final todayStr = today.toIso8601String().split('T')[0];
      final tomorrow = today.add(const Duration(days: 1));
      final tomorrowStr = tomorrow.toIso8601String().split('T')[0];

      List deliveryOrdersRes = [];
      List deliveryBatchesRes = [];
      try {
        deliveryOrdersRes = await supabase
            .from('orders')
            .select('id, delivery_date, delivery_slot, total_final_price, total_estimated_price, delivery_batch_id')
            .eq('shop_id', shopId)
            .inFilter('delivery_date', [todayStr, tomorrowStr])
            .not('payment_type', 'is', null)
            .neq('status', 'cancelled');
      } catch (e) {
        debugPrint('Error fetching delivery orders: $e');
      }

      try {
        deliveryBatchesRes = await supabase
            .from('delivery_batches')
            .select('id, delivery_date, delivery_slot, status')
            .eq('shop_id', shopId)
            .inFilter('delivery_date', [todayStr, tomorrowStr]);
      } catch (e) {
        debugPrint('Error fetching delivery batches: $e');
      }

      final deliveryOrders = List<Map<String, dynamic>>.from(deliveryOrdersRes);
      final deliveryBatches = List<Map<String, dynamic>>.from(deliveryBatchesRes);

      final runs = <Map<String, dynamic>>[];
      final slots = ['morning', 'evening'];
      final dates = [todayStr, tomorrowStr];

      for (final date in dates) {
        for (final slot in slots) {
          final batch = deliveryBatches.firstWhere(
            (b) => b['delivery_date'] == date && b['delivery_slot'] == slot,
            orElse: () => {},
          );

          final matchingOrders = deliveryOrders.where((o) =>
              o['delivery_date'] == date && o['delivery_slot'] == slot).toList();

          final totalValue = matchingOrders.fold<double>(0.0, (sum, o) =>
              sum + (o['total_final_price'] ?? o['total_estimated_price'] ?? 0.0).toDouble());

          runs.add({
            'date': date,
            'label': date == todayStr ? 'Today' : 'Tomorrow',
            'slot': slot,
            'batch': batch.isEmpty ? null : batch,
            'orderCount': matchingOrders.length,
            'totalValue': totalValue,
          });
        }
      }

      List unfinishedReplacementsRes = [];
      try {
        unfinishedReplacementsRes = await supabase
            .from('replacement_requests')
            .select('*, orders(order_number, users(name, phone)), replacement_items(*, order_items(*, items(name), item_variants(label))))')
            .inFilter('shop_id', shopIds)
            .inFilter('status', ['Pending', 'pending', 'Approved', 'approved', 'in_progress'])
            .order('created_at', ascending: false);
      } catch (e) {
        debugPrint('Error fetching unfinished replacements: $e');
      }

      return _Data(
        shopId: shopId,
        shopName: shopName,
        items: (results[0] as List).length,
        orders: (results[1] as List).length,
        pending: (results[2] as List).length,
        revenue: totalRev,
        runs: runs,
        unfinishedReplacements: List<Map<String, dynamic>>.from(unfinishedReplacementsRes),
      );
    } catch (e, stack) {
      debugPrint('Error fetching dashboard: $e\n$stack');
      return _Data(shopId: null, shopName: 'Your Shop', items: 0, orders: 0, pending: 0, revenue: 0.0, runs: [], unfinishedReplacements: []);
    }
  }

  Future<void> _updateReplacementStatus(String requestId, String status, String? notes) async {
    try {
      await supabase
          .from('replacement_requests')
          .update({
            'status': status,
            'notes': notes,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', requestId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Request updated to $status')),
        );
        setState(() {
          _future = _fetch();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating status: $e')),
        );
      }
    }
  }

  void _showActionDialog(Map<String, dynamic> req) {
    final notesController = TextEditingController();
    String selectedDecision = 'approve_next_shift'; // 'approve_next_shift', 'approve_now', 'reject'

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: kVendorDialogBg,
          title: Text('Resolve Replacement Request', style: TextStyle(color: kVendorText, fontWeight: FontWeight.bold, fontSize: 18)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Select Decision:', style: TextStyle(color: kVendorText, fontWeight: FontWeight.w700, fontSize: 13)),
                const SizedBox(height: 10),
                
                // Option 1: Approve & Deliver in Next Shift
                InkWell(
                  onTap: () => setDialogState(() => selectedDecision = 'approve_next_shift'),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: selectedDecision == 'approve_next_shift' ? const Color(0xFF3B82F6).withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.03),
                      border: Border.all(
                        color: selectedDecision == 'approve_next_shift' ? const Color(0xFF3B82F6) : Colors.white.withValues(alpha: 0.08),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.schedule_rounded, color: selectedDecision == 'approve_next_shift' ? const Color(0xFF60A5FA) : Colors.grey, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Approve & Deliver in Next Shift', style: TextStyle(color: kVendorText, fontWeight: FontWeight.w800, fontSize: 13)),
                              const SizedBox(height: 2),
                              Text('Batched for the next delivery shift', style: TextStyle(color: kVendorSubText, fontSize: 11)),
                            ],
                          ),
                        ),
                        if (selectedDecision == 'approve_next_shift')
                          const Icon(Icons.check_circle, color: Color(0xFF60A5FA), size: 18),
                      ],
                    ),
                  ),
                ),

                // Option 2: Approve & Deliver Now
                InkWell(
                  onTap: () => setDialogState(() => selectedDecision = 'approve_now'),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: selectedDecision == 'approve_now' ? const Color(0xFF22C55E).withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.03),
                      border: Border.all(
                        color: selectedDecision == 'approve_now' ? const Color(0xFF22C55E) : Colors.white.withValues(alpha: 0.08),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.bolt_rounded, color: selectedDecision == 'approve_now' ? const Color(0xFF4ADE80) : Colors.grey, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Approve & Deliver Now', style: TextStyle(color: kVendorText, fontWeight: FontWeight.w800, fontSize: 13)),
                              const SizedBox(height: 2),
                              Text('Immediate dispatch to customer', style: TextStyle(color: kVendorSubText, fontSize: 11)),
                            ],
                          ),
                        ),
                        if (selectedDecision == 'approve_now')
                          const Icon(Icons.check_circle, color: Color(0xFF4ADE80), size: 18),
                      ],
                    ),
                  ),
                ),

                // Option 3: Reject with Reason
                InkWell(
                  onTap: () => setDialogState(() => selectedDecision = 'reject'),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: selectedDecision == 'reject' ? const Color(0xFFEF4444).withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.03),
                      border: Border.all(
                        color: selectedDecision == 'reject' ? const Color(0xFFEF4444) : Colors.white.withValues(alpha: 0.08),
                        width: 1.5,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.cancel_outlined, color: selectedDecision == 'reject' ? const Color(0xFFF87171) : Colors.grey, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Reject Request with Reason', style: TextStyle(color: kVendorText, fontWeight: FontWeight.w800, fontSize: 13)),
                              const SizedBox(height: 2),
                              Text('Decline replacement with customer explanation', style: TextStyle(color: kVendorSubText, fontSize: 11)),
                            ],
                          ),
                        ),
                        if (selectedDecision == 'reject')
                          const Icon(Icons.check_circle, color: Color(0xFFF87171), size: 18),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 14),
                Text(
                  selectedDecision == 'reject' ? 'Rejection Reason (Required):' : 'Seller Delivery Notes (Optional):',
                  style: TextStyle(color: selectedDecision == 'reject' ? const Color(0xFFF87171) : kVendorText, fontWeight: FontWeight.w700, fontSize: 12),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: notesController,
                  maxLines: 3,
                  style: TextStyle(color: kVendorText, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: selectedDecision == 'reject' ? 'Explain why this claim is being declined...' : 'Add delivery note or instructions for customer...',
                    hintStyle: TextStyle(color: kVendorSubText, fontSize: 12),
                    filled: true,
                    fillColor: Colors.white.withValues(alpha: 0.05),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                  ),
                ),
                if (selectedDecision != 'reject') ...[
                  const SizedBox(height: 6),
                  Text(
                    'ℹ️ Once approved, the customer will confirm receipt upon delivery.',
                    style: TextStyle(color: kVendorSubText, fontSize: 11, fontStyle: FontStyle.italic),
                  ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('Cancel', style: TextStyle(color: kVendorSubText)),
            ),
            ElevatedButton(
              onPressed: () {
                final text = notesController.text.trim();
                if (selectedDecision == 'reject' && text.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter a rejection reason.')),
                  );
                  return;
                }

                Navigator.pop(ctx);
                String finalStatus = selectedDecision == 'reject' ? 'Rejected' : 'Approved';
                String finalNotes = text;
                if (selectedDecision == 'approve_next_shift') {
                  finalNotes = text.isNotEmpty ? '$text [Delivery: Next Shift]' : 'Approved for replacement. Delivery scheduled in the next shift.';
                } else if (selectedDecision == 'approve_now') {
                  finalNotes = text.isNotEmpty ? '$text [Delivery: Out Now]' : 'Approved for immediate replacement. Dispatched for delivery now.';
                }

                _updateReplacementStatus(req['id'], finalStatus, finalNotes);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: selectedDecision == 'reject' ? const Color(0xFFEF4444) : const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(selectedDecision == 'reject' ? 'Reject Claim' : 'Confirm & Approve'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUnfinishedReplacementsSection(List<Map<String, dynamic>> replacements) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 32),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const HugeIcon(icon: HugeIcons.strokeRoundedExchange01, color: Color(0xFFF59E0B), size: 22),
                const SizedBox(width: 8),
                Text(
                  'Unfinished Replacements',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: kVendorText,
                    letterSpacing: -0.5,
                  ),
                ),
                if (replacements.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.3)),
                    ),
                    child: Text(
                      '${replacements.length} Action Required',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFFF59E0B),
                      ),
                    ),
                  ),
                ],
              ],
            ),
            TextButton(
              onPressed: () => context.push('/vendor/replacements').then((_) => setState(() { _future = _fetch(); })),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('View All', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF60A5FA))),
                  SizedBox(width: 4),
                  Icon(Icons.chevron_right, size: 16, color: Color(0xFF60A5FA)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        if (replacements.isEmpty)
          Container(
            padding: const EdgeInsets.all(18),
            decoration: vendorCardDecoration(radius: 20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF22C55E).withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle, color: Color(0xFF22C55E), size: 20),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'No unfinished replacement requests',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: kVendorText),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'All replacement claims and complaints are up to date.',
                        style: TextStyle(fontSize: 11, color: kVendorSubText),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: replacements.length,
            itemBuilder: (context, index) {
              final req = replacements[index];
              final status = (req['status'] as String? ?? 'Pending');
              final isPending = status.toLowerCase() == 'pending';
              final order = req['orders'] as Map<String, dynamic>?;
              final user = order?['users'] as Map<String, dynamic>?;
              final custName = user?['name'] as String? ?? 'Customer';
              final custPhone = user?['phone'] as String?;
              final orderNum = order?['order_number'] as String? ?? (req['order_id'] as String? ?? '').substring(0, 8);
              final reason = req['reason'] as String? ?? 'Complaint';
              final desc = req['description'] as String?;
              final items = (req['replacement_items'] as List?)?.cast<Map<String, dynamic>>() ?? [];

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: vendorCardDecoration(radius: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                custName,
                                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: kVendorText),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                'Order #$orderNum${custPhone != null ? ' · $custPhone' : ''}',
                                style: TextStyle(fontSize: 12, color: kVendorSubText),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: isPending ? const Color(0xFFF59E0B).withOpacity(0.15) : const Color(0xFF3B82F6).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isPending ? const Color(0xFFF59E0B).withOpacity(0.3) : const Color(0xFF3B82F6).withOpacity(0.3),
                            ),
                          ),
                          child: Text(
                            isPending ? 'Pending Review' : 'Approved - In Progress',
                            style: TextStyle(
                              color: isPending ? const Color(0xFFFBBF24) : const Color(0xFF60A5FA),
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.03),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.white.withOpacity(0.05)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            reason.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFFF59E0B),
                              letterSpacing: 0.5,
                            ),
                          ),
                          if (desc != null && desc.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              '"$desc"',
                              style: TextStyle(fontSize: 12, color: kVendorText.withOpacity(0.85), fontStyle: FontStyle.italic),
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (items.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      Text(
                        'Requested Items:',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: kVendorSubText),
                      ),
                      const SizedBox(height: 6),
                      ...items.map((itm) {
                        final orderItem = itm['order_items'] as Map<String, dynamic>?;
                        final itemName = (orderItem?['items'] as Map?)?['name'] as String? ?? 'Item';
                        final variant = (orderItem?['item_variants'] as Map?)?['label'] as String?;
                        final qty = itm['quantity'] ?? 1;

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  '$itemName${variant != null ? ' ($variant)' : ''}',
                                  style: TextStyle(fontSize: 12, color: kVendorText, fontWeight: FontWeight.w500),
                                ),
                              ),
                              Text(
                                'Qty: $qty',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF60A5FA)),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _showActionDialog(req),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Resolve Complaint', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  Future<void> _createBatch(String date, String slot, String shopId) async {
    final l10n = AppLocalizations.of(context)!;
    try {
      final response = await http.post(
        Uri.parse('http://localhost:3000/api/vendor/delivery-batch'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'action': 'create',
          'shopId': shopId,
          'date': date,
          'slot': slot,
        }),
      );

      if (response.statusCode != 200) {
        final json = jsonDecode(response.body);
        throw Exception(json['error'] ?? 'API error ${response.statusCode}');
      }

      setState(() {
        _future = _fetch();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.runPreparedSuccess)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to prepare run: $e')),
        );
      }
    }
  }

  Future<void> _updateBatchStatus(String batchId, String status) async {
    try {
      final response = await http.post(
        Uri.parse('http://localhost:3000/api/vendor/delivery-batch'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'action': 'update_status',
          'batchId': batchId,
          'status': status,
        }),
      );

      if (response.statusCode != 200) {
        final json = jsonDecode(response.body);
        throw Exception(json['error'] ?? 'API error ${response.statusCode}');
      }

      setState(() {
        _future = _fetch();
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Run updated to: ${status.toUpperCase()}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update run: $e')),
        );
      }
    }
  }

  Widget _buildRunsSection(List<Map<String, dynamic>> runs, String shopId) {
    final l10n = AppLocalizations.of(context)!;
    if (runs.isEmpty) return const SizedBox();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 32),
        Text(
          l10n.deliveryRunsManagementTitle,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: kVendorText,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 16),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: runs.length,
          itemBuilder: (context, index) {
            final run = runs[index];
            final dateStr = run['date'] as String;
            final dateLabel = run['label'] as String;
            final slot = run['slot'] as String;
            final batch = run['batch'] as Map<String, dynamic>?;
            final count = run['orderCount'] as int;
            final val = run['totalValue'] as double;

            final isMorning = slot == 'morning';
            final batchStatus = batch?['status'] as String?;

            String statusText = l10n.runNotStarted;
            Color statusColor = Colors.grey;
            String actionLabel = l10n.runPrepare;
            Color actionColor = const Color(0xFF60A5FA);

            if (batchStatus != null) {
              if (batchStatus == 'pending') {
                statusText = l10n.runPacking;
                statusColor = Colors.amber;
                actionLabel = l10n.runStartDelivery;
                actionColor = Colors.orange;
              } else if (batchStatus == 'delivering') {
                statusText = l10n.runOutForDelivery;
                statusColor = Colors.blue;
                actionLabel = l10n.runComplete;
                actionColor = Colors.green;
              } else if (batchStatus == 'completed') {
                statusText = l10n.runCompleted;
                statusColor = Colors.green;
                actionLabel = '';
              }
            }

            final formattedDate = DateFormat('d MMM').format(DateTime.parse(dateStr));

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: vendorCardDecoration(radius: 20),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            isMorning ? Icons.wb_sunny : Icons.nightlight_round,
                            color: isMorning ? Colors.amber : Colors.orange,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '${isMorning ? "Morning" : "Evening"} Run ($dateLabel • $formattedDate)',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: kVendorText),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          statusText,
                          style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const Divider(color: Colors.white10, height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('$count', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: kVendorText)),
                              Text(l10n.ordersCountLabel, style: TextStyle(fontSize: 11, color: kVendorSubText)),
                            ],
                          ),
                          const SizedBox(width: 24),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('₹ ${val.toStringAsFixed(0)}', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: kVendorText)),
                              Text(l10n.runValueLabel, style: TextStyle(fontSize: 11, color: kVendorSubText)),
                            ],
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          if (batch != null) ...[
                            TextButton(
                              onPressed: () => context.push('/vendor/orders?date=$dateStr&slot=$slot'),
                              child: Text(l10n.viewOrdersButton, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF4CD964))),
                            ),
                            const SizedBox(width: 8),
                          ],
                          if (actionLabel.isNotEmpty)
                            ElevatedButton(
                              onPressed: (batchStatus == null && count == 0)
                                  ? null
                                  : () {
                                      if (batchStatus == null) {
                                        _createBatch(dateStr, slot, shopId);
                                      } else if (batchStatus == 'pending') {
                                        _updateBatchStatus(batch!['id'], 'delivering');
                                      } else if (batchStatus == 'delivering') {
                                        _updateBatchStatus(batch!['id'], 'completed');
                                      }
                                    },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: actionColor,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: Text(actionLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                        ],
                      )
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: kVendorBg,
      drawer: const VendorDrawer(currentRoute: '/vendor/dashboard'),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: Text(l10n.vendorPanelTitle, style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        leading: Builder(
          builder: (context) => IconButton(
            icon: const HugeIcon(icon: HugeIcons.strokeRoundedMenu01, size: 20),
            onPressed: () {
              Scaffold.of(context).openDrawer();
            },
          ),
        ),
      ),
      body: FutureBuilder<_Data>(
        future: _future,
        builder: (context, snap) {
          if (snap.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA)));
          }
          if (snap.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                    const SizedBox(height: 16),
                    Text('Failed to load dashboard data', style: TextStyle(color: kVendorText, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('${snap.error}', style: TextStyle(color: kVendorSubText, fontSize: 12), textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => setState(() { _future = _fetch(); }),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA)));
          }
          final d = snap.data!;
          return SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Dashboard',
                            style: TextStyle(
                              fontSize: 34,
                              fontWeight: FontWeight.w800,
                              color: kVendorText,
                              letterSpacing: -1,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              Text(l10n.welcomeBackTo, style: TextStyle(fontSize: 14, color: kVendorSubText)),
                              Expanded(
                                child: Text(
                                  d.shopName,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kVendorText),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (d.shopId != null) ...[
                      const SizedBox(width: 8),
                      VendorOutlineButton(
                        height: 38,
                        onPressed: () => context.push('/vendor/shop/${d.shopId}'),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const HugeIcon(icon: HugeIcons.strokeRoundedStore01, size: 16, color: Colors.white),
                            const SizedBox(width: 6),
                            Text(l10n.viewMyShopButton, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ]
                  ],
                ),
                const SizedBox(height: 32),

                // Stats Grid
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.05,
                  children: [
                    _StatCard(icon: HugeIcons.strokeRoundedPackage, iconColor: const Color(0xFF60A5FA), value: '${d.items}', label: 'Total Items'),
                    _StatCard(icon: HugeIcons.strokeRoundedShoppingBag01, iconColor: const Color(0xFFC084FC), value: '${d.orders}', label: 'Total Orders'),
                    _StatCard(icon: HugeIcons.strokeRoundedClock01, iconColor: const Color(0xFFFBBF24), value: '${d.pending}', label: 'Pending Orders'),
                    _StatCard(icon: HugeIcons.strokeRoundedTrendingUpDown, iconColor: const Color(0xFF34D399), value: '₹ ${d.revenue.toStringAsFixed(0)}', label: 'Total Revenue'),
                  ],
                ),

                // Delivery Runs Section
                if (d.shopId != null)
                  _buildRunsSection(d.runs, d.shopId!),

                // Unfinished Replacement Requests Section
                _buildUnfinishedReplacementsSection(d.unfinishedReplacements),

                // Quick Actions Header
                const SizedBox(height: 36),
                Text(
                  l10n.quickActionsTitle,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: kVendorText,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 16),
                
                // Quick Actions Grid
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.0,
                  children: [
                    _ActionCard(
                      icon: HugeIcons.strokeRoundedAddCircle,
                      iconColor: const Color(0xFF60A5FA),
                      label: l10n.addNewProductAction,
                      onTap: () => context.push('/vendor/items/new').then((_) => setState(() { _future = _fetch(); })),
                    ),
                    _ActionCard(
                      icon: HugeIcons.strokeRoundedPackage,
                      iconColor: const Color(0xFFEC4899),
                      label: l10n.viewProductsAction,
                      onTap: () => context.push('/vendor/items'),
                    ),
                    _ActionCard(
                      icon: HugeIcons.strokeRoundedShoppingBasket01,
                      iconColor: const Color(0xFFC084FC),
                      label: l10n.manageOrdersAction,
                      onTap: () => context.push('/vendor/orders').then((_) => setState(() { _future = _fetch(); })),
                    ),
                    _ActionCard(
                      icon: HugeIcons.strokeRoundedExchange01,
                      iconColor: const Color(0xFFF59E0B),
                      label: 'Replacements',
                      onTap: () => context.push('/vendor/replacements').then((_) => setState(() { _future = _fetch(); })),
                    ),
                    _ActionCard(
                      icon: HugeIcons.strokeRoundedMoney03,
                      iconColor: const Color(0xFF34D399),
                      label: l10n.commissionStatsAction,
                      onTap: () => context.push('/vendor/commission'),
                    ),
                    _ActionCard(
                      icon: HugeIcons.strokeRoundedCreditCard,
                      iconColor: const Color(0xFFFBBF24),
                      label: l10n.customerCreditAction,
                      onTap: () => context.push('/vendor/credit'),
                    ),
                    _ActionCard(
                      icon: HugeIcons.strokeRoundedStore01,
                      iconColor: const Color(0xFF14B8A6),
                      label: l10n.shopSettingsAction,
                      onTap: () => context.push('/vendor/shop').then((_) => setState(() { _future = _fetch(); })),
                    ),
                  ],
                ),
                const SizedBox(height: 40),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final List<List<dynamic>> icon;
  final Color iconColor;
  final String value, label;
  const _StatCard({required this.icon, required this.iconColor, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: vendorCardDecoration(radius: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: iconColor.withOpacity(0.2)),
            ),
            child: HugeIcon(icon: icon, color: iconColor, size: 24),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: kVendorText,
                  letterSpacing: -1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: kVendorSubText,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final List<List<dynamic>> icon;
  final Color iconColor;
  final String label;
  final VoidCallback onTap;
  const _ActionCard({required this.icon, required this.iconColor, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: vendorCardDecoration(radius: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            HugeIcon(icon: icon, color: iconColor, size: 40),
            const SizedBox(height: 14),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: kVendorText,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Data {
  final String? shopId;
  final String shopName;
  final int items, orders, pending;
  final double revenue;
  final List<Map<String, dynamic>> runs;
  final List<Map<String, dynamic>> unfinishedReplacements;
  _Data({
    required this.shopId,
    required this.shopName,
    required this.items,
    required this.orders,
    required this.pending,
    required this.revenue,
    required this.runs,
    this.unfinishedReplacements = const [],
  });
}

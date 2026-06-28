import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../widgets/directional_huge_icon.dart';
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

  static const _flow = ['pending', 'accepted', 'packing', 'ready', 'out_for_delivery', 'delivered'];
  static const _statusLabel = {
    'pending': '🕐 Pending',
    'accepted': '🤝 Accepted',
    'packing': '📦 Packing',
    'ready': '🛎️ Ready',
    'out_for_delivery': '🚴 Out for Delivery',
    'delivering': '🚴 Delivering',
    'delivered': '✅ Delivered',
    'cancelled': '❌ Cancelled',
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  final Map<String, String> _actualValues = {};

  Future<void> _load() async {
    final res = await supabase
        .from('orders')
        .select('*, users(name, phone), order_items(*, items(name, image_url), item_variants:vw_item_variants_with_fallback(label, value, unit_id, image_url))')
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

  Future<void> _updateItemStatus(Map<String, dynamic> oi, String newStatus) async {
    setState(() => _updating = true);
    try {
      double newFinalPrice = (oi['estimated_price'] as num?)?.toDouble() ?? (oi['final_price'] as num?)?.toDouble() ?? 0.0;
      double? newActualValue;

      if (newStatus == 'rejected') {
        newFinalPrice = 0.0;
      } else if (newStatus == 'adjusted') {
        final inputVal = double.tryParse(_actualValues[oi['id']] ?? '');
        if (inputVal != null && inputVal > 0) {
          newActualValue = inputVal;
          final requested = (oi['requested_value'] as num?)?.toDouble() ?? 1.0;
          final estimated = (oi['estimated_price'] as num?)?.toDouble() ?? 0.0;
          newFinalPrice = double.parse(((inputVal / requested) * estimated).toStringAsFixed(2));
        } else {
          throw Exception('Please enter a valid actual value');
        }
      } else if (newStatus == 'approved') {
        newFinalPrice = (oi['estimated_price'] as num?)?.toDouble() ?? (oi['final_price'] as num?)?.toDouble() ?? 0.0;
      }

      final updateData = <String, dynamic>{
        'status': newStatus,
        'final_price': newFinalPrice,
      };
      if (newActualValue != null) {
        updateData['actual_value'] = newActualValue;
      }

      await supabase.from('order_items').update(updateData).eq('id', oi['id']);

      // Recalculate total_final_price for the entire order
      final orderRes = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('id', widget.orderId)
          .single();

      final updatedItems = orderRes['order_items'] as List;
      final newTotal = updatedItems.fold<double>(0.0, (sum, item) => sum + ((item['final_price'] ?? 0.0) as num).toDouble());

      await supabase.from('orders').update({
        'total_final_price': newTotal,
      }).eq('id', widget.orderId);

      await _load();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Item updated to ${newStatus.toUpperCase()}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update item: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _updating = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (_loading) {
      return Scaffold(
        backgroundColor: kVendorBg,
        body: const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA))),
      );
    }
    
    final o = _order!;
    final status = o['status'] as String;
    final currentIdx = _flow.indexOf(status);
    final nextStatus = currentIdx >= 0 && currentIdx < _flow.length - 1 ? _flow[currentIdx + 1] : null;

    final orderItems = (o['order_items'] as List?) ?? [];
    final allItemsProcessed = orderItems.every((oi) => oi['status'] != 'pending');

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
        title: Text(
          o['order_number'] != null ? 'Order #${o['order_number']}' : 'Order #${widget.orderId.substring(0, 8).toUpperCase()}',
          style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5),
        ),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: kVendorText, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
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
                    backgroundColor: const Color(0xFF3B82F6).withValues(alpha: 0.12),
                    child: const HugeIcon(icon: HugeIcons.strokeRoundedUser, color: Color(0xFF60A5FA), size: 24),
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
                          style: TextStyle(color: kVendorSubText, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  VendorBadge(label: _statusLabel[status] ?? status, type: badgeType),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Delivery Slot Card
            if (o['delivery_date'] != null && o['delivery_slot'] != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: vendorCardDecoration(radius: 24),
                child: Row(
                  children: [
                    Text(
                      o['delivery_slot'] == 'morning' ? '☀️' : '🌙',
                      style: const TextStyle(fontSize: 24),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${o['delivery_slot'] == 'morning' ? "Morning" : "Evening"} Delivery Slot',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Deliver on: ${o['delivery_date']}',
                            style: TextStyle(color: kVendorSubText, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Progress Timeline Indicator
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              decoration: vendorCardDecoration(radius: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.orderTimelineTitle,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
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
                                color: done ? const Color(0xFF4ADE80) : Colors.white.withValues(alpha: 0.08),
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
                  Text(
                    l10n.orderedItemsTitle,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white, letterSpacing: -0.5),
                  ),
                  const SizedBox(height: 12),
                  ...((o['order_items'] as List?) ?? []).map((oi) {
                    final item = oi['items'] as Map?;
                    final variant = oi['item_variants'] as Map?;
                    final variantType = oi['variant_type']?.toString().toLowerCase();
                    final isDynamic = variantType == 'dynamic' || variantType == 'portion';
                    final itemStatus = oi['status'] as String? ?? 'pending';

                    final name = item?['name'] ?? 'Product Item';
                    final variantLabel = variant?['label'] ?? '';
                    final requestedVal = oi['requested_value'] ?? 1.0;
                    final actualVal = oi['actual_value'];
                    final estPrice = (oi['estimated_price'] ?? 0.0) as num;
                    final finPrice = (oi['final_price'] ?? 0.0) as num;

                    final String? variantImg = variant?['image_url'] as String?;
                    final String? itemImg = item?['image_url'] as String?;
                    final String? imageUrl = (variantImg != null && variantImg.isNotEmpty) ? variantImg : itemImg;

                    return Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: const BoxDecoration(
                        border: Border(bottom: BorderSide(color: Colors.white10, width: 0.5)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              // Image
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: imageUrl != null && imageUrl.isNotEmpty
                                    ? Image.network(imageUrl, width: 56, height: 56, fit: BoxFit.cover)
                                    : Container(
                                        width: 56,
                                        height: 56,
                                        color: Colors.white.withOpacity(0.05),
                                        child: Center(child: HugeIcon(icon: HugeIcons.strokeRoundedPackage, color: kVendorSubText, size: 24)),
                                      ),
                              ),
                              const SizedBox(width: 14),
                              // Details
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      variantLabel.isNotEmpty ? '$name ($variantLabel)' : name,
                                      style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 14),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Requested: $requestedVal',
                                      style: TextStyle(color: kVendorSubText, fontSize: 12, fontWeight: FontWeight.w500),
                                    ),
                                    if (actualVal != null) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        'Actual Packed: $actualVal',
                                        style: const TextStyle(color: Color(0xFF4ADE80), fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              // Price
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  if (itemStatus == 'rejected')
                                    Text(
                                      '₹$estPrice',
                                      style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFFF87171), fontSize: 14, decoration: TextDecoration.lineThrough),
                                    )
                                  else ...[
                                    if (estPrice != finPrice && itemStatus != 'pending')
                                      Text(
                                        '₹$estPrice',
                                        style: TextStyle(fontSize: 12, color: kVendorSubText, decoration: TextDecoration.lineThrough),
                                      ),
                                    Text(
                                      '₹$finPrice',
                                      style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF4ADE80), fontSize: 14),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                          // Actions Panel
                          if (status == 'pending') ...[
                            if (itemStatus == 'pending') ...[
                              const SizedBox(height: 12),
                              if (isDynamic) ...[
                                Row(
                                  children: [
                                    Expanded(
                                      child: SizedBox(
                                        height: 36,
                                        child: TextFormField(
                                          initialValue: _actualValues[oi['id']] ?? '',
                                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                          style: const TextStyle(color: Colors.white, fontSize: 13),
                                          decoration: InputDecoration(
                                            hintText: 'Actual weight (e.g. 0.6)',
                                            hintStyle: TextStyle(color: kVendorSubText.withOpacity(0.5), fontSize: 12),
                                            filled: true,
                                            fillColor: Colors.white.withOpacity(0.05),
                                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                            border: OutlineInputBorder(
                                              borderRadius: BorderRadius.circular(8),
                                              borderSide: BorderSide.none,
                                            ),
                                          ),
                                          onChanged: (val) {
                                            _actualValues[oi['id']!] = val;
                                          },
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      onPressed: _updating
                                          ? null
                                          : () => _updateItemStatus(oi, 'adjusted'),
                                      icon: const Icon(Icons.edit_note, color: Color(0xFF60A5FA), size: 24),
                                      tooltip: 'Adjust Price',
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                              ],
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  ElevatedButton.icon(
                                    onPressed: _updating ? null : () => _updateItemStatus(oi, 'approved'),
                                    icon: const Icon(Icons.check, size: 14, color: Colors.white),
                                    label: const Text('Approve', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF16A34A),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  OutlinedButton.icon(
                                    onPressed: _updating ? null : () => _updateItemStatus(oi, 'rejected'),
                                    icon: const Icon(Icons.close, size: 14, color: Color(0xFFF87171)),
                                    label: const Text('Reject', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFF87171))),
                                    style: OutlinedButton.styleFrom(
                                      side: const BorderSide(color: Color(0x33F87171)),
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                  ),
                                ],
                              ),
                            ] else ...[
                              const SizedBox(height: 8),
                              Align(
                                alignment: Alignment.centerRight,
                                child: VendorBadge(
                                  label: itemStatus,
                                  type: itemStatus == 'rejected'
                                      ? VendorBadgeType.danger
                                      : itemStatus == 'adjusted'
                                          ? VendorBadgeType.warning
                                          : VendorBadgeType.success,
                                ),
                              ),
                            ],
                          ] else ...[
                            const SizedBox(height: 8),
                            Align(
                              alignment: Alignment.centerRight,
                              child: VendorBadge(
                                label: itemStatus,
                                type: itemStatus == 'rejected'
                                    ? VendorBadgeType.danger
                                    : itemStatus == 'adjusted'
                                        ? VendorBadgeType.warning
                                        : VendorBadgeType.success,
                              ),
                            ),
                          ],
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
                      Text(
                        l10n.totalFinalPriceTitle,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
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
              if (status == 'pending' && !allItemsProcessed) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withOpacity(0.1),
                    border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.2)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'Please approve or adjust all items before accepting the order.',
                    style: TextStyle(color: Color(0xFFFCA5A5), fontSize: 13, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
              VendorGradientButton(
                onPressed: (_updating || (status == 'pending' && !allItemsProcessed))
                    ? null
                    : () => _updateStatus(nextStatus),
                loading: _updating,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Mark as ${nextStatus[0].toUpperCase()}${nextStatus.substring(1)}'),
                    const SizedBox(width: 8),
                    const DirectionalHugeIcon(icon: HugeIcons.strokeRoundedArrowRight01, size: 18),
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
                child: Text(
                  l10n.cancelOrderButton,
                  style: const TextStyle(color: Color(0xFFF87171), fontWeight: FontWeight.bold),
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

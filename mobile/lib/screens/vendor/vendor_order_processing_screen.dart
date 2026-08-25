import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/supabase_client.dart';
import '../../widgets/directional_huge_icon.dart';
import '../../theme/app_theme.dart';
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

  static const _flow = ['pending', 'delivering', 'packing', 'delivered'];
  static const _statusLabel = {
    'pending': '🕐 Pending',
    'delivering': '🚴 Out for Delivery',
    'packing': '📦 Completed Transaction',
    'delivered': '✅ Completed Order',
    'cancelled': '❌ Cancelled',
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  final Map<String, String> _actualValues = {};
  Map<String, dynamic>? _customerCredit;

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final res = await supabase
          .from('orders')
          .select('*, users(name, phone), order_addresses(*), order_items(*, items(name, image_url), item_variants:vw_item_variants_with_fallback(label, value, unit_id, image_url))')
          .eq('id', widget.orderId)
          .maybeSingle();

      Map<String, dynamic>? creditData;
      if (res != null) {
        final userId = res['user_id'];
        final shopId = res['shop_id'];
        if (userId != null && shopId != null) {
          final creditRes = await supabase
              .from('shop_user_credit')
              .select('*')
              .eq('user_id', userId)
              .eq('shop_id', shopId)
              .maybeSingle();
          creditData = creditRes;
        }
      }

      if (mounted) {
        setState(() {
          _order = res;
          _customerCredit = creditData;
        });
      }
    } catch (e, stack) {
      debugPrint('Error loading vendor order details: $e\n$stack');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading order details: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _updatePaymentType(String paymentType) async {
    if (_order == null) return;
    setState(() => _updating = true);
    try {
      final userId = _order!['user_id'];
      final shopId = _order!['shop_id'];

      if (paymentType == 'credit') {
        if (userId != null && shopId != null) {
          // If credit profile doesn't exist or is not enabled or is blocked, auto-initialize/enable it for this customer
          if (_customerCredit == null || _customerCredit!['is_credit_enabled'] != true || _customerCredit!['is_blocked'] == true) {
            await supabase.from('shop_user_credit').upsert({
              'shop_id': shopId,
              'user_id': userId,
              'is_credit_enabled': true,
              'is_blocked': false,
            }, onConflict: 'shop_id,user_id');
          }
        }
      }

      await supabase.from('orders').update({'payment_type': paymentType}).eq('id', widget.orderId);
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(paymentType == 'credit' ? 'Payment method set to Credit (Pay Later)' : 'Payment method set to Cash on Delivery (COD)'),
            backgroundColor: paymentType == 'credit' ? const Color(0xFFF59E0B) : const Color(0xFF10B981),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update payment method: $e'), backgroundColor: Colors.redAccent),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _updating = false);
      }
    }
  }

  Future<void> _updateStatus(String next) async {
    if (next == 'cancelled') {
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
    }
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

  Map<String, dynamic> _checkProcessingAllowed(String? deliveryDateStr, String? deliverySlot) {
    if (deliveryDateStr == null) return {'allowed': true};
    
    final now = DateTime.now();
    final year = now.year;
    final month = now.month.toString().padLeft(2, '0');
    final day = now.day.toString().padLeft(2, '0');
    final localTodayStr = '$year-$month-$day';
    
    final cleanedDeliveryDate = deliveryDateStr.split('T')[0];
    if (cleanedDeliveryDate != localTodayStr) {
      return {
        'allowed': false,
        'reason': 'This order is scheduled for delivery on $cleanedDeliveryDate. Updates are only allowed on the scheduled date.'
      };
    }
    
    if (deliverySlot?.toLowerCase() == 'evening') {
      if (now.hour < 12) {
        return {
          'allowed': false,
          'reason': 'Evening slot orders cannot be processed before 12:00 PM.'
        };
      }
    }
    
    return {'allowed': true};
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
    final addrRow = o['order_addresses'];
    Map<String, dynamic>? address;
    if (addrRow is Map) {
      address = Map<String, dynamic>.from(addrRow);
    } else if (addrRow is List && addrRow.isNotEmpty) {
      address = Map<String, dynamic>.from(addrRow.first);
    }

    final status = o['status'] as String;
    final currentIdx = _flow.indexOf(status);
    final nextStatus = currentIdx >= 0 && currentIdx < _flow.length - 1 ? _flow[currentIdx + 1] : null;

    final orderItems = (o['order_items'] as List?) ?? [];
    final allItemsProcessed = orderItems.every((oi) => oi['status'] != 'pending');
    final unadjustedDynamicItems = orderItems.where((oi) {
      final vType = oi['variant_type']?.toString().toLowerCase();
      final isDyn = vType == 'dynamic' || vType == 'portion';
      final itemSt = oi['status'] as String? ?? 'pending';
      return isDyn && itemSt != 'rejected' && (itemSt != 'adjusted' || oi['actual_value'] == null);
    }).toList();
    final allDynamicItemsAdjusted = unadjustedDynamicItems.isEmpty;

    final deliveryDateStr = o['delivery_date'] as String?;
    final deliverySlot = o['delivery_slot'] as String?;
    final allowedCheck = _checkProcessingAllowed(deliveryDateStr, deliverySlot);
    final isAllowed = allowedCheck['allowed'] as bool;
    final disallowedReason = allowedCheck['reason'] as String?;
    final canAdvanceStatus = isAllowed && allItemsProcessed && allDynamicItemsAdjusted;

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
            if (!isAllowed && disallowedReason != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                  border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.2)),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline_rounded, color: Color(0xFFF87171), size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        disallowedReason,
                        style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ],
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
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: kVendorText),
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

            if (address != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: vendorCardDecoration(radius: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const HugeIcon(icon: HugeIcons.strokeRoundedLocation01, color: Color(0xFF3B82F6), size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Delivery Address (${address['label'] ?? 'Home'})',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: kVendorText),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Receiver: ${address['contact_name'] ?? '—'} (${address['contact_phone'] ?? '—'})',
                      style: TextStyle(fontSize: 13, color: kVendorText, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'House Name: ${address['house_name'] ?? address['address_line_1'] ?? '—'}',
                      style: TextStyle(fontSize: 13, color: kVendorText),
                    ),
                    if (address['landmark'] != null && address['landmark'].toString().isNotEmpty)
                      Text(
                        'Landmark: Near ${address['landmark']}',
                        style: TextStyle(fontSize: 13, color: kVendorText),
                      ),
                    if (address['village'] != null && address['village'].toString().isNotEmpty)
                      Text(
                        'Village: ${address['village']}',
                        style: TextStyle(fontSize: 13, color: kVendorText),
                      ),
                    if (address['delivery_note'] != null && address['delivery_note'].toString().trim().isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF115E59).withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF134E5A).withValues(alpha: 0.12)),
                        ),
                        child: Text(
                          '📝 Note: ${address['delivery_note']}',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF0F766E), fontStyle: FontStyle.italic, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        if (address['latitude'] != null && address['longitude'] != null)
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () async {
                                final lat = address!['latitude'];
                                final lng = address['longitude'];
                                final url = Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
                                if (await canLaunchUrl(url)) {
                                  await launchUrl(url, mode: LaunchMode.externalApplication);
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF3B82F6),
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              icon: const Icon(Icons.map_rounded, size: 16),
                              label: const Text('Maps', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        if (address['latitude'] != null && address['longitude'] != null)
                          const SizedBox(width: 8),
                        
                        if (address['contact_phone'] != null && address['contact_phone'].toString().isNotEmpty)
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () async {
                                final phone = address!['contact_phone'];
                                final url = Uri.parse('tel:$phone');
                                if (await canLaunchUrl(url)) {
                                  await launchUrl(url);
                                }
                              },
                              style: OutlinedButton.styleFrom(
                                foregroundColor: kWaTeal,
                                side: BorderSide(color: kWaTeal),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              icon: const Icon(Icons.call, size: 16),
                              label: const Text('Call', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        const SizedBox(width: 8),

                        if (address['contact_phone'] != null && address['contact_phone'].toString().isNotEmpty)
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () async {
                                final phone = address!['contact_phone'];
                                String cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
                                if (!cleanPhone.startsWith('91') && cleanPhone.length == 10) {
                                  cleanPhone = '91$cleanPhone';
                                }
                                final url = Uri.parse('https://wa.me/$cleanPhone');
                                if (await canLaunchUrl(url)) {
                                  await launchUrl(url, mode: LaunchMode.externalApplication);
                                }
                              },
                              style: OutlinedButton.styleFrom(
                                foregroundColor: kWaGreen,
                                side: BorderSide(color: kWaGreen),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              ),
                              icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16),
                              label: const Text('WhatsApp', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Delivery Slot Section
            if (o['delivery_slot'] != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: vendorCardDecoration(radius: 24),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.12),
                      child: const HugeIcon(icon: HugeIcons.strokeRoundedCalendar03, color: Color(0xFF34D399), size: 20),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Delivery Slot: ${o['delivery_slot'].toString().toUpperCase()}',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: kVendorText),
                          ),
                          if (deliveryDateStr != null) ...[
                            const SizedBox(height: 2),
                            Text(
                              'Date: ${deliveryDateStr.split('T')[0]}',
                              style: TextStyle(color: kVendorSubText, fontSize: 12),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],

            // Status Stepper
            Container(
              padding: const EdgeInsets.all(20),
              decoration: vendorCardDecoration(radius: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Order Progress',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: kVendorText),
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
                                color: done ? const Color(0xFF4ADE80) : kVendorTransparentBorder,
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
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: kVendorText, letterSpacing: -0.5),
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
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: imageUrl != null && imageUrl.isNotEmpty
                                    ? Image.network(imageUrl, width: 56, height: 56, fit: BoxFit.cover)
                                    : Container(
                                        width: 56,
                                        height: 56,
                                        color: kVendorTransparentBg,
                                        child: Center(child: HugeIcon(icon: HugeIcons.strokeRoundedPackage, color: kVendorSubText, size: 24)),
                                      ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            variantLabel.isNotEmpty ? '$name ($variantLabel)' : name,
                                            style: TextStyle(fontWeight: FontWeight.w700, color: kVendorText, fontSize: 14),
                                          ),
                                        ),
                                        if (isDynamic) ...[
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                                              borderRadius: BorderRadius.circular(6),
                                              border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.3)),
                                            ),
                                            child: const Text(
                                              '⚖️ WEIGHT',
                                              style: TextStyle(color: Color(0xFFFBBF24), fontSize: 9, fontWeight: FontWeight.bold),
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Requested: $requestedVal ${variantLabel.isNotEmpty ? variantLabel : ''}',
                                      style: TextStyle(color: kVendorSubText, fontSize: 12, fontWeight: FontWeight.w500),
                                    ),
                                    if (actualVal != null) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        'Actual Packed: $actualVal ${variantLabel.isNotEmpty ? variantLabel : ''}',
                                        style: const TextStyle(color: Color(0xFF4ADE80), fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
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
                          if (isDynamic) ...[
                            if (itemStatus == 'rejected') ...[
                              const SizedBox(height: 8),
                              const Align(
                                alignment: Alignment.centerRight,
                                child: VendorBadge(label: 'rejected', type: VendorBadgeType.danger),
                              ),
                            ] else if (status == 'pending' || status == 'delivering') ...[
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: SizedBox(
                                      height: 38,
                                      child: TextFormField(
                                        initialValue: _actualValues[oi['id']] ?? (actualVal != null ? actualVal.toString() : ''),
                                        enabled: isAllowed,
                                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                        style: TextStyle(color: kVendorText, fontSize: 13),
                                        decoration: InputDecoration(
                                          hintText: 'Actual weight (e.g. 1.25)',
                                          hintStyle: TextStyle(color: kVendorSubText.withValues(alpha: 0.5), fontSize: 12),
                                          filled: true,
                                          fillColor: kVendorTransparentBg,
                                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                          border: OutlineInputBorder(
                                            borderRadius: BorderRadius.circular(8),
                                            borderSide: BorderSide(
                                              color: itemStatus == 'adjusted' ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                                            ),
                                          ),
                                        ),
                                        onChanged: (val) {
                                          _actualValues[oi['id']!] = val;
                                        },
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  ElevatedButton(
                                    onPressed: (_updating || !isAllowed)
                                        ? null
                                        : () => _updateItemStatus(oi, 'adjusted'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF3B82F6),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                    child: Text(itemStatus == 'adjusted' ? 'Update Wt' : 'Set Wt', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  ),
                                  if (status == 'pending') ...[
                                    const SizedBox(width: 6),
                                    IconButton(
                                      onPressed: (_updating || !isAllowed)
                                          ? null
                                          : () => _updateItemStatus(oi, 'rejected'),
                                      icon: const Icon(Icons.close, color: Color(0xFFF87171), size: 20),
                                      tooltip: 'Reject Item',
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  if (itemStatus != 'adjusted')
                                    const Text(
                                      '* Weight Required  ',
                                      style: TextStyle(color: Color(0xFFF59E0B), fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                  VendorBadge(
                                    label: itemStatus == 'adjusted' ? 'ADJUSTED' : 'PENDING WEIGHT',
                                    type: itemStatus == 'adjusted' ? VendorBadgeType.success : VendorBadgeType.warning,
                                  ),
                                ],
                              ),
                            ] else ...[
                              const SizedBox(height: 8),
                              Align(
                                alignment: Alignment.centerRight,
                                child: VendorBadge(
                                  label: itemStatus,
                                  type: itemStatus == 'adjusted' ? VendorBadgeType.success : VendorBadgeType.neutral,
                                ),
                              ),
                            ],
                          ] else ...[
                            /* Non-dynamic items */
                            if (status == 'pending') ...[
                              if (itemStatus == 'pending') ...[
                                const SizedBox(height: 12),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    ElevatedButton.icon(
                                      onPressed: (_updating || !isAllowed) ? null : () => _updateItemStatus(oi, 'approved'),
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
                                      onPressed: (_updating || !isAllowed) ? null : () => _updateItemStatus(oi, 'rejected'),
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
                                      : VendorBadgeType.success,
                                ),
                              ),
                            ],
                          ],
                        ],
                      ),
                    );
                  }),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12.0),
                    child: Divider(color: kVendorDivider),
                  ),
                  
                  // Total Display
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        l10n.totalFinalPriceTitle,
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: kVendorText),
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

            // Payment Settlement Card (Cash vs Credit)
            if (status == 'delivering' || status == 'packing' || status == 'delivered') ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: vendorCardDecoration(radius: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF3B82F6).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.payment_rounded, color: Color(0xFF60A5FA), size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Payment Settlement',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: kVendorText),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Select how this order was settled at delivery',
                                style: TextStyle(fontSize: 12, color: kVendorSubText),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Credit Info Banner
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      margin: const EdgeInsets.only(bottom: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.08),
                        border: Border.all(
                          color: const Color(0xFF10B981).withValues(alpha: 0.2),
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.account_balance_wallet_outlined,
                            size: 16,
                            color: Color(0xFF34D399),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _customerCredit == null
                                  ? 'Customer Credit: Available (Enabled on selection)'
                                  : _customerCredit!['credit_limit'] != null
                                      ? 'Credit Available: ₹${(((_customerCredit!['credit_limit'] as num?)?.toDouble() ?? 0.0) - (((_customerCredit!['used_amount'] ?? 0.0) as num).toDouble())).clamp(0.0, double.infinity).toStringAsFixed(0)} (Limit: ₹${((_customerCredit!['credit_limit'] as num?)?.toDouble() ?? 0.0).toStringAsFixed(0)})'
                                      : 'Credit Ledger: Active (Current Outstanding: ₹${(((_customerCredit!['used_amount'] ?? 0.0) as num).toDouble()).toStringAsFixed(0)})',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF34D399),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    Row(
                      children: [
                        // Cash on Delivery Button
                        Expanded(
                          child: InkWell(
                            onTap: (_updating || !isAllowed) ? null : () => _updatePaymentType('cod'),
                            borderRadius: BorderRadius.circular(14),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                              decoration: BoxDecoration(
                                color: (o['payment_type'] == 'cod' || o['payment_type'] == null)
                                    ? const Color(0xFF10B981).withValues(alpha: 0.15)
                                    : kVendorTransparentBg,
                                border: Border.all(
                                  color: (o['payment_type'] == 'cod' || o['payment_type'] == null)
                                      ? const Color(0xFF10B981)
                                      : kVendorTransparentBorder,
                                  width: (o['payment_type'] == 'cod' || o['payment_type'] == null) ? 1.5 : 1,
                                ),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  if (o['payment_type'] == 'cod' || o['payment_type'] == null) ...[
                                    const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 16),
                                    const SizedBox(width: 6),
                                  ],
                                  const Text(
                                    '💵 Cash (COD)',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Credit Button
                        Expanded(
                          child: InkWell(
                            onTap: (_updating || !isAllowed) ? null : () => _updatePaymentType('credit'),
                            borderRadius: BorderRadius.circular(14),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                              decoration: BoxDecoration(
                                color: (o['payment_type'] == 'credit')
                                    ? const Color(0xFFF59E0B).withValues(alpha: 0.15)
                                    : kVendorTransparentBg,
                                border: Border.all(
                                  color: (o['payment_type'] == 'credit')
                                      ? const Color(0xFFF59E0B)
                                      : kVendorTransparentBorder,
                                  width: (o['payment_type'] == 'credit') ? 1.5 : 1,
                                ),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  if (o['payment_type'] == 'credit') ...[
                                    const Icon(Icons.check_circle, color: Color(0xFFF59E0B), size: 16),
                                    const SizedBox(width: 6),
                                  ],
                                  const Text(
                                    '💳 Credit (Pay Later)',
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 16),

            // Actions Buttons
            if (status == 'packing') ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                  border: Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.2)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.access_time_rounded, color: Color(0xFF93C5FD), size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Transaction Completed. Waiting for Customer Confirmation.',
                        style: TextStyle(color: Color(0xFF93C5FD), fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ] else if (nextStatus != null && status != 'cancelled' && nextStatus != 'delivered') ...[
              if (status == 'pending' && !allItemsProcessed) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                    border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.2)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    'Please review all items before advancing the order.',
                    style: TextStyle(color: Color(0xFFFCA5A5), fontSize: 13, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
              if (!allDynamicItemsAdjusted) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.12),
                    border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.3)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '⚖️ Price & weight editing is compulsory for all dynamic products (${unadjustedDynamicItems.length} pending). Please enter actual packed weight before advancing order status.',
                    style: const TextStyle(color: Color(0xFFFCD34D), fontSize: 13, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
              VendorGradientButton(
                onPressed: canAdvanceStatus
                    ? () => _updateStatus(nextStatus)
                    : null,
                loading: _updating,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      status == 'pending'
                          ? 'Set Out for Delivery'
                          : status == 'delivering'
                              ? 'Complete Transaction'
                              : 'Mark as ${nextStatus[0].toUpperCase()}${nextStatus.substring(1)}',
                    ),
                    const SizedBox(width: 8),
                    const DirectionalHugeIcon(icon: HugeIcons.strokeRoundedArrowRight01, size: 18),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            if (status != 'cancelled' && status != 'delivered') ...[
              VendorOutlineButton(
                width: double.infinity,
                onPressed: (_updating || !isAllowed) ? null : () => _updateStatus('cancelled'),
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

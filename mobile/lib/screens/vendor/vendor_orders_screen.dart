import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/supabase_client.dart';
import 'vendor_theme_helper.dart';
import 'vendor_drawer.dart';


class VendorOrdersScreen extends StatefulWidget {
  final String? date;
  final String? slot;
  const VendorOrdersScreen({super.key, this.date, this.slot});

  @override
  State<VendorOrdersScreen> createState() => _VendorOrdersScreenState();
}

class _VendorOrdersScreenState extends State<VendorOrdersScreen> {
  List<Map<String, dynamic>> _orders = [];
  bool _loading = true;
  String _filter = 'all';
  String _timeFilter = 'today';
  String? _selectedDate;
  String _selectedSlot = 'all';

  @override
  void initState() {
    super.initState();
    if (widget.date != null) {
      _selectedDate = widget.date;
      _timeFilter = 'custom';
    }
    if (widget.slot != null) {
      _selectedSlot = widget.slot!.toLowerCase();
    }
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

    var query = supabase
        .from('orders')
        .select('id, status, created_at, total_final_price, total_estimated_price, users(name, phone), delivery_date, delivery_slot, order_number')
        .eq('shop_id', shopId);

    if (_selectedDate != null) {
      query = query.eq('delivery_date', _selectedDate!);
    } else {
      final now = DateTime.now();
      if (_timeFilter == 'today') {
        final todayStr = now.toIso8601String().split('T')[0];
        query = query.gte('delivery_date', todayStr);
      } else if (_timeFilter == 'week') {
        final sevenDaysAgo = now.subtract(const Duration(days: 7));
        final sevenDaysAgoStr = sevenDaysAgo.toIso8601String().split('T')[0];
        query = query.gte('delivery_date', sevenDaysAgoStr);
      } else if (_timeFilter == 'month') {
        final thirtyDaysAgo = now.subtract(const Duration(days: 30));
        final thirtyDaysAgoStr = thirtyDaysAgo.toIso8601String().split('T')[0];
        query = query.gte('delivery_date', thirtyDaysAgoStr);
      }
    }

    if (_selectedSlot != 'all') {
      query = query.eq('delivery_slot', _selectedSlot);
    }

    final res = await query.order('created_at', ascending: false);

    if (mounted) {
      setState(() {
        _orders = (res as List).cast<Map<String, dynamic>>();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final filtered = _orders.where((o) => _filter == 'all' || o['status'] == _filter).toList();

    return Scaffold(
      backgroundColor: kVendorBg,
      drawer: const VendorDrawer(currentRoute: '/vendor/orders'),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: Text(l10n.vendorManageOrdersTitle, style: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        leading: Builder(
          builder: (context) => IconButton(
            icon: const HugeIcon(icon: HugeIcons.strokeRoundedMenu01, size: 20),
            onPressed: () {
              Scaffold.of(context).openDrawer();
            },
          ),
        ),
      ),
      body: Column(
        children: [
          // Clear custom date banner if active
          if (_selectedDate != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              margin: const EdgeInsets.only(bottom: 8, left: 16, right: 16),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Viewing: $_selectedDate',
                    style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedDate = null;
                        _timeFilter = 'today';
                      });
                      _load();
                    },
                    child: Row(
                      children: [
                        const Icon(Icons.close, color: Color(0xFFF87171), size: 16),
                        const SizedBox(width: 4),
                        Text(
                          l10n.resetDateButton,
                          style: const TextStyle(color: Color(0xFFF87171), fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

          // Time Filter Tabs Capsule row (only visible when not filtering by a specific date)
          if (_selectedDate == null)
            SizedBox(
              height: 50,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
                children: [
                  ('today', l10n.todayLabel),
                  ('week', l10n.last7DaysLabel),
                  ('month', l10n.last30DaysLabel),
                  ('all', l10n.allTimeLabel),
                ].map((entry) {
                  final isSelected = _timeFilter == entry.$1;
                  return GestureDetector(
                    onTap: () {
                      if (_timeFilter != entry.$1) {
                        setState(() {
                          _timeFilter = entry.$1;
                        });
                        _load();
                      }
                    },
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      alignment: Alignment.center,
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
                        entry.$2,
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

          // Status Filter Tabs Capsule row
          SizedBox(
            height: 60,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              children: ['all', 'pending', 'accepted', 'packing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map((f) {
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
                      f == 'all' ? l10n.allStatusesFilter : f[0].toUpperCase() + f.substring(1).replaceAll('_', ' '),
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

          // Slot Filter Tabs Capsule row
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
              children: [
                ('all', l10n.allSlotsLabel),
                ('morning', l10n.morningSlotLabel),
                ('evening', l10n.eveningSlotLabel),
              ].map((entry) {
                final isSelected = _selectedSlot == entry.$1;
                return GestureDetector(
                  onTap: () {
                    if (_selectedSlot != entry.$1) {
                      setState(() {
                        _selectedSlot = entry.$1;
                      });
                      _load();
                    }
                  },
                  child: Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    alignment: Alignment.center,
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
                      entry.$2,
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
                            HugeIcon(icon: HugeIcons.strokeRoundedReceiptText, size: 64, color: kVendorSubText.withOpacity(0.5)),
                            const SizedBox(height: 16),
                            Text(
                              _filter == 'all' ? l10n.vendorNoOrders : l10n.vendorNoStatusOrders(_filter),
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kVendorSubText),
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
                          } else if (status == 'accepted') {
                            statusColor = const Color(0xFF38BDF8);
                            badgeType = VendorBadgeType.info;
                          } else if (status == 'packing') {
                            statusColor = const Color(0xFF60A5FA);
                            badgeType = VendorBadgeType.info;
                          } else if (status == 'ready') {
                            statusColor = const Color(0xFF818CF8);
                            badgeType = VendorBadgeType.info;
                          } else if (status == 'out_for_delivery') {
                            statusColor = const Color(0xFFFB923C);
                            badgeType = VendorBadgeType.info;
                          } else if (status == 'delivering') {
                            statusColor = const Color(0xFFFB923C);
                            badgeType = VendorBadgeType.info;
                          } else if (status == 'delivered') {
                            statusColor = const Color(0xFF4ADE80);
                            badgeType = VendorBadgeType.success;
                          } else if (status == 'cancelled') {
                            statusColor = const Color(0xFFF87171);
                            badgeType = VendorBadgeType.danger;
                          }

                          final displayOrderNumber = o['order_number'] != null
                              ? '#${o['order_number']}'
                              : '#${orderId.substring(0, 8).toUpperCase()}';

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
                                child: HugeIcon(icon: HugeIcons.strokeRoundedReceiptText, color: statusColor, size: 22),
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
                                    '₹ ${(o['total_final_price'] ?? o['total_estimated_price'] ?? 0.0).toStringAsFixed(0)}',
                                    style: const TextStyle(fontWeight: FontWeight.w800, color: Colors.white, fontSize: 15),
                                  ),
                                ],
                              ),
                              subtitle: Padding(
                                padding: const EdgeInsets.only(top: 8.0),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Text(
                                                displayOrderNumber,
                                                style: TextStyle(fontFamily: 'monospace', color: kVendorSubText, fontSize: 12, fontWeight: FontWeight.bold),
                                              ),
                                              if (o['delivery_slot'] != null) ...[
                                                const SizedBox(width: 6),
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: o['delivery_slot'] == 'morning'
                                                        ? const Color(0xFF16A34A).withOpacity(0.12)
                                                        : const Color(0xFFEA580C).withOpacity(0.12),
                                                    borderRadius: BorderRadius.circular(6),
                                                    border: Border.all(
                                                      color: o['delivery_slot'] == 'morning'
                                                          ? const Color(0xFF16A34A).withOpacity(0.3)
                                                          : const Color(0xFFEA580C).withOpacity(0.3),
                                                    ),
                                                  ),
                                                  child: Text(
                                                    o['delivery_slot'] == 'morning' ? l10n.morningTimeLabel : l10n.eveningTimeLabel,
                                                    style: TextStyle(
                                                      fontSize: 9,
                                                      fontWeight: FontWeight.w700,
                                                      color: o['delivery_slot'] == 'morning'
                                                          ? const Color(0xFF4ADE80)
                                                          : const Color(0xFFFB923C),
                                                    ),
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                          if (o['delivery_date'] != null) ...[
                                            const SizedBox(height: 2),
                                            Text(
                                              l10n.vendorDeliverOnLabel(DateFormat('dd MMM yyyy').format(DateTime.parse(o['delivery_date'] as String))),
                                              style: TextStyle(color: kVendorSubText.withOpacity(0.6), fontSize: 11),
                                            ),
                                          ] else if (dateStr.isNotEmpty) ...[
                                            const SizedBox(height: 2),
                                            Text(
                                              dateStr,
                                              style: TextStyle(color: kVendorSubText.withOpacity(0.6), fontSize: 11),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    VendorBadge(
                                      label: status.replaceAll('_', ' '),
                                      type: badgeType,
                                    ),
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

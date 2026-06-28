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
    final uid = supabase.auth.currentUser!.id;
    final ownerRes = await supabase
        .from('shop_owners')
        .select('shop_id, shops(name)')
        .eq('user_id', uid)
        .maybeSingle();
    
    final shopId = ownerRes?['shop_id'] as String?;
    final shopName = (ownerRes?['shops'] as Map?)?['name'] as String? ?? 'Your Shop';

    if (shopId == null) {
      return _Data(shopId: null, shopName: shopName, items: 0, orders: 0, pending: 0, revenue: 0.0, runs: []);
    }

    final results = await Future.wait([
      supabase.from('items').select('id').eq('shop_id', shopId).isFilter('deleted_at', null),
      supabase.from('orders').select('id').eq('shop_id', shopId).not('payment_type', 'is', null),
      supabase.from('orders').select('id').eq('shop_id', shopId).eq('status', 'pending').not('payment_type', 'is', null),
      supabase.from('orders').select('total_final_price').eq('shop_id', shopId).eq('status', 'delivered').not('payment_type', 'is', null),
    ]);

    final deliveredOrders = results[3] as List;
    final totalRev = deliveredOrders.fold<double>(0.0, (sum, o) => sum + (o['total_final_price'] ?? 0).toDouble());

    // ── Delivery Runs Management Data ──
    final today = DateTime.now();
    final todayStr = today.toIso8601String().split('T')[0];
    final tomorrow = today.add(const Duration(days: 1));
    final tomorrowStr = tomorrow.toIso8601String().split('T')[0];

    // Query orders for today and tomorrow
    final deliveryOrdersRes = await supabase
        .from('orders')
        .select('id, delivery_date, delivery_slot, total_final_price, total_estimated_price, delivery_batch_id')
        .eq('shop_id', shopId)
        .inFilter('delivery_date', [todayStr, tomorrowStr])
        .not('payment_type', 'is', null)
        .neq('status', 'cancelled');

    // Query existing batches
    final deliveryBatchesRes = await supabase
        .from('delivery_batches')
        .select('id, delivery_date, delivery_slot, status')
        .eq('shop_id', shopId)
        .inFilter('delivery_date', [todayStr, tomorrowStr]);

    final deliveryOrders = List<Map<String, dynamic>>.from(deliveryOrdersRes as List);
    final deliveryBatches = List<Map<String, dynamic>>.from(deliveryBatchesRes as List);

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

    return _Data(
      shopId: shopId,
      shopName: shopName,
      items: (results[0] as List).length,
      orders: (results[1] as List).length,
      pending: (results[2] as List).length,
      revenue: totalRev,
      runs: runs,
    );
  }

  Future<void> _createBatch(String date, String slot, String shopId) async {
    final l10n = AppLocalizations.of(context)!;
    try {
      final res = await supabase.from('delivery_batches').insert({
        'shop_id': shopId,
        'delivery_date': date,
        'delivery_slot': slot,
        'status': 'pending',
      }).select('id').single();

      final batchId = res['id'] as String;

      // Link orders
      await supabase.from('orders').update({
        'delivery_batch_id': batchId,
      }).eq('shop_id', shopId)
        .eq('delivery_date', date)
        .eq('delivery_slot', slot)
        .not('payment_type', 'is', null)
        .neq('status', 'cancelled')
        .isFilter('delivery_batch_id', null);

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
      await supabase.from('delivery_batches').update({
        'status': status,
      }).eq('id', batchId);

      final orderStatusMap = {
        'pending': 'accepted',
        'delivering': 'out_for_delivery',
        'completed': 'delivered',
      };

      final orderStatus = orderStatusMap[status];
      if (orderStatus != null) {
        await supabase.from('orders').update({
          'status': orderStatus,
        }).eq('delivery_batch_id', batchId);
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
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Colors.white),
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
                              Text('$count', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
                              Text(l10n.ordersCountLabel, style: TextStyle(fontSize: 11, color: kVendorSubText)),
                            ],
                          ),
                          const SizedBox(width: 24),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('₹ ${val.toStringAsFixed(0)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.white)),
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
                        onPressed: () => context.push('/home/shop/${d.shopId}'),
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
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
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
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Color(0xFFE2E8F0),
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
  _Data({required this.shopId, required this.shopName, required this.items, required this.orders, required this.pending, required this.revenue, required this.runs});
}

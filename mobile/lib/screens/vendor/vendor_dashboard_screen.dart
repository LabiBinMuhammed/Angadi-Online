import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import 'vendor_theme_helper.dart';

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
      return _Data(shopId: null, shopName: shopName, items: 0, orders: 0, pending: 0);
    }

    final results = await Future.wait([
      supabase.from('items').select('id').eq('shop_id', shopId).isFilter('deleted_at', null),
      supabase.from('orders').select('id').eq('shop_id', shopId),
      supabase.from('orders').select('id').eq('shop_id', shopId).eq('status', 'pending'),
    ]);

    return _Data(
      shopId: shopId,
      shopName: shopName,
      items: (results[0] as List).length,
      orders: (results[1] as List).length,
      pending: (results[2] as List).length,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kVendorBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: const Text('Vendor Panel', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 20),
          onPressed: () => context.go('/profile'),
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
                          const Text(
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
                              const Text('Welcome back to ', style: TextStyle(fontSize: 14, color: kVendorSubText)),
                              Expanded(
                                child: Text(
                                  d.shopName,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: kVendorText),
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
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.storefront_rounded, size: 16, color: Colors.white),
                            SizedBox(width: 6),
                            Text('View My Shop', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
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
                    _StatCard(icon: Icons.inventory_2_rounded, iconColor: const Color(0xFF60A5FA), value: '${d.items}', label: 'Total Items'),
                    _StatCard(icon: Icons.shopping_bag_rounded, iconColor: const Color(0xFFC084FC), value: '${d.orders}', label: 'Total Orders'),
                    _StatCard(icon: Icons.schedule_rounded, iconColor: const Color(0xFFFBBF24), value: '${d.pending}', label: 'Pending Orders'),
                    const _StatCard(icon: Icons.trending_up_rounded, iconColor: Color(0xFF34D399), value: '₹0', label: 'Total Revenue'),
                  ],
                ),
                const SizedBox(height: 36),

                // Quick Actions Header
                const Text(
                  'Quick Actions',
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
                      icon: Icons.add_circle_rounded,
                      iconColor: const Color(0xFF60A5FA),
                      label: 'Add New Product',
                      onTap: () => context.push('/vendor/items/new').then((_) => setState(() { _future = _fetch(); })),
                    ),
                    _ActionCard(
                      icon: Icons.shopping_basket_rounded,
                      iconColor: const Color(0xFFC084FC),
                      label: 'Manage Orders',
                      onTap: () => context.push('/vendor/orders').then((_) => setState(() { _future = _fetch(); })),
                    ),
                    _ActionCard(
                      icon: Icons.credit_card_rounded,
                      iconColor: const Color(0xFFFBBF24),
                      label: 'Customer Credit',
                      onTap: () => context.push('/vendor/credit'),
                    ),
                    _ActionCard(
                      icon: Icons.storefront_rounded,
                      iconColor: const Color(0xFF34D399),
                      label: 'Manage Items',
                      onTap: () => context.push('/vendor/items').then((_) => setState(() { _future = _fetch(); })),
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
  final IconData icon;
  final Color iconColor;
  final String value, label;
  const _StatCard({required this.icon, required this.iconColor, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
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
            child: Icon(icon, color: iconColor, size: 24),
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
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: const TextStyle(
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
  final IconData icon;
  final Color iconColor;
  final String label;
  final VoidCallback onTap;
  const _ActionCard({required this.icon, required this.iconColor, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: vendorCardDecoration(radius: 24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: iconColor, size: 40),
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
  _Data({required this.shopId, required this.shopName, required this.items, required this.orders, required this.pending});
}

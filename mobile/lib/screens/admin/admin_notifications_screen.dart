import 'package:flutter/material.dart';
import 'admin_drawer.dart';
import '../../../theme/app_theme.dart';

class AdminNotificationsScreen extends StatelessWidget {
  const AdminNotificationsScreen({super.key});

  static const List<Map<String, dynamic>> _configs = [
    { 'key': 'order_placed', 'label': 'Order Placed', 'icon': Icons.shopping_bag, 'enabled': true, 'target': 'Customer + Shop' },
    { 'key': 'order_packing', 'label': 'Order Packing', 'icon': Icons.inventory_2, 'enabled': true, 'target': 'Customer' },
    { 'key': 'order_delivery', 'label': 'Out for Delivery', 'icon': Icons.local_shipping, 'enabled': true, 'target': 'Customer' },
    { 'key': 'order_done', 'label': 'Order Delivered', 'icon': Icons.check_circle, 'enabled': true, 'target': 'Customer' },
    { 'key': 'credit_low', 'label': 'Credit Alert', 'icon': Icons.credit_card, 'enabled': false, 'target': 'Customer' },
    { 'key': 'new_order', 'label': 'New Order (Shop)', 'icon': Icons.notifications_active, 'enabled': true, 'target': 'Shop Owner' },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AdminDrawer(currentRoute: '/admin/notifications'),
      appBar: AppBar(
        backgroundColor: kWaTeal,
        foregroundColor: Colors.white,
        title: const Text('Notification Control'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ListView.separated(
                itemCount: _configs.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (context, i) {
                  final c = _configs[i];
                  final enabled = c['enabled'] as bool;
                  return ListTile(
                    leading: CircleAvatar(
                      backgroundColor: const Color(0xFFF0FDF4),
                      child: Icon(c['icon'] as IconData, color: const Color(0xFF16A34A)),
                    ),
                    title: Text(c['label'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('Target: ${c['target']}'),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: enabled ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        enabled ? 'Enabled' : 'Disabled',
                        style: TextStyle(
                          color: enabled ? const Color(0xFF15803D) : const Color(0xFFB91C1C),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
              child: Text(
                'Notification toggle controls will connect to your notification provider in a future update.',
                style: TextStyle(color: Colors.grey, fontSize: 13, fontStyle: FontStyle.italic),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

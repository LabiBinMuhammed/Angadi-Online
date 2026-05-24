import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _fetch();
  }

  Future<List<Map<String, dynamic>>> _fetch() async {
    final userId = supabase.auth.currentUser!.id;
    final res = await supabase
        .from('orders')
        .select('id, status, created_at, shops(name)')
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(30);
    return (res as List).cast<Map<String, dynamic>>();
  }

  static const _statusIcon = {
    'pending': '🕐', 'packing': '📦', 'delivering': '🚴', 'delivered': '✅', 'cancelled': '❌',
  };
  static const _statusMsg = {
    'pending': 'Your order has been placed',
    'packing': 'Shop is preparing your order',
    'delivering': 'Your order is on the way!',
    'delivered': 'Order delivered successfully 🎉',
    'cancelled': 'Order was cancelled',
  };

  String _timeAgo(String dateStr) {
    final diff = DateTime.now().difference(DateTime.parse(dateStr));
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snap) {
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final orders = snap.data!;
          if (orders.isEmpty) {
            return const Center(child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [Text('🔔', style: TextStyle(fontSize: 48)), SizedBox(height: 12), Text('No notifications yet')],
            ));
          }
          return ListView.separated(
            itemCount: orders.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, i) {
              final o = orders[i];
              final isUnread = o['status'] == 'pending' || o['status'] == 'delivering';
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: isUnread ? kWaTeal : kNeutral100,
                  child: Text(
                    _statusIcon[o['status']] ?? '📦',
                    style: const TextStyle(fontSize: 18),
                  ),
                ),
                title: Text(
                  (o['shops'] as Map?)?['name'] ?? 'Shop',
                  style: TextStyle(fontWeight: isUnread ? FontWeight.w700 : FontWeight.w500),
                ),
                subtitle: Text(_statusMsg[o['status']] ?? o['status']),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(_timeAgo(o['created_at']), style: const TextStyle(fontSize: 11, color: kNeutral400)),
                    if (isUnread)
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        width: 8, height: 8,
                        decoration: const BoxDecoration(color: kWaGreen, shape: BoxShape.circle),
                      ),
                  ],
                ),
                tileColor: isUnread ? const Color(0xFFF0FDF4) : null,
                onTap: () => context.push('/orders/${o['id']}'),
              );
            },
          );
        },
      ),
    );
  }
}

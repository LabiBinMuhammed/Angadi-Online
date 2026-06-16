import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:village_market/l10n/app_localizations.dart';
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
  String _getStatusMsg(String status, AppLocalizations l10n) {
    switch (status) {
      case 'pending': return l10n.orderNotificationPlaced;
      case 'packing': return l10n.orderNotificationPreparing;
      case 'delivering': return l10n.orderNotificationOnWay;
      case 'delivered': return l10n.orderNotificationDelivered;
      case 'cancelled': return l10n.orderNotificationCancelled;
      default: return status;
    }
  }

  String _timeAgo(String dateStr) {
    final l10n = AppLocalizations.of(context)!;
    final diff = DateTime.now().difference(DateTime.parse(dateStr));
    if (diff.inMinutes < 60) return l10n.minutesAgo(diff.inMinutes);
    if (diff.inHours < 24) return l10n.hoursAgo(diff.inHours);
    return l10n.daysAgo(diff.inDays);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.notificationsTitle)),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snap) {
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final orders = snap.data!;
          if (orders.isEmpty) {
            return Center(child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [const Text('🔔', style: TextStyle(fontSize: 48)), const SizedBox(height: 12), Text(l10n.noNotificationsYet)],
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
                subtitle: Text(_getStatusMsg(o['status'] ?? 'pending', l10n)),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(_timeAgo(o['created_at']), style: const TextStyle(fontSize: 11, color: kNeutral400)),
                    if (isUnread)
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        width: 8, height: 8,
                        decoration: BoxDecoration(color: kWaGreen, shape: BoxShape.circle),
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

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../../core/supabase_client.dart';


class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
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
        .select('id, status, created_at, total_final_price, shops(name)')
        .eq('user_id', userId)
        .order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(res as List);
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'delivered':  return const Color(0xFF22C55E);
      case 'cancelled':  return const Color(0xFFEF4444);
      case 'delivering': return const Color(0xFF3B82F6);
      default:           return const Color(0xFFF59E0B);
    }
  }

  String _getStatusLabel(String status, AppLocalizations l10n) {
    switch (status) {
      case 'pending': return l10n.orderStatusPending;
      case 'packing': return l10n.orderStatusPacking;
      case 'delivering': return l10n.orderStatusDelivering;
      case 'delivered': return l10n.orderStatusDelivered;
      case 'cancelled': return l10n.orderStatusCancelled;
      default: return status.toUpperCase();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final localeCode = Localizations.localeOf(context).languageCode;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.myOrdersTitle)),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final orders = snapshot.data ?? [];
          if (orders.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('📦', style: TextStyle(fontSize: 60)),
                  const SizedBox(height: 16),
                  Text(l10n.noOrdersYet, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => context.go('/home'),
                    child: Text(l10n.continueShoppingButton),
                  ),
                ],
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: orders.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final o = orders[i];
              final shopName = (o['shops'] as Map<String, dynamic>?)?['name'] ?? 'Shop';
              final status   = o['status'] as String;
              final date     = DateTime.parse(o['created_at'] as String);
              final price    = (o['total_final_price'] as num?)?.toDouble();

              return GestureDetector(
                onTap: () => context.push('/orders/${o['id']}'),
                child: Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    title: Text(shopName, style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(DateFormat.yMMMd(localeCode).format(date),
                        style: const TextStyle(fontSize: 12)),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        if (price != null)
                          Text('₹${price.toStringAsFixed(0)}',
                              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                        Container(
                          margin: const EdgeInsets.only(top: 4),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: _statusColor(status).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(_getStatusLabel(status, l10n),
                              style: TextStyle(
                                color: _statusColor(status),
                                fontSize: 10, fontWeight: FontWeight.w700,
                              )),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

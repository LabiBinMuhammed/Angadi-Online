import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';

/// Admin User Detail
class AdminUserDetailScreen extends StatefulWidget {
  final String userId;
  const AdminUserDetailScreen({super.key, required this.userId});
  @override
  State<AdminUserDetailScreen> createState() => _AdminUserDetailScreenState();
}

class _AdminUserDetailScreenState extends State<AdminUserDetailScreen> {
  Map<String, dynamic>? _user;
  List<Map<String, dynamic>> _orders = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    final results = await Future.wait([
      supabase.from('users').select('*, user_profiles(email, profile_image_url, preferred_language)').eq('id', widget.userId).single(),
      supabase.from('orders').select('id, status, created_at, total_final_price, shops(name)').eq('user_id', widget.userId).order('created_at', ascending: false).limit(10),
    ]);
    if (mounted) {
      setState(() {
        _user   = results[0] as Map<String, dynamic>;
        _orders = (results[1] as List).cast();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(backgroundColor: kWaTeal, foregroundColor: Colors.white, title: Text(_user?['name'] ?? 'User Detail')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Avatar + info
                  Row(children: [
                    CircleAvatar(
                      radius: 32, backgroundColor: kWaTeal,
                      child: Text((_user?['name'] as String? ?? '?')[0].toUpperCase(),
                          style: const TextStyle(fontSize: 24, color: Colors.white, fontWeight: FontWeight.w800)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(_user?['name'] ?? '—', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      Text(_user?['phone'] ?? '', style: const TextStyle(color: Color(0xFF64748B))),
                      Chip(
                        label: Text(_user?['role'] ?? ''),
                        backgroundColor: kBrand100,
                        labelStyle: const TextStyle(fontSize: 11, color: kBrand700),
                        padding: EdgeInsets.zero,
                      ),
                    ])),
                  ]),
                  const SizedBox(height: 20),

                  const Text('Recent Orders', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                  const SizedBox(height: 8),
                  if (_orders.isEmpty)
                    const Text('No orders yet.', style: TextStyle(color: Color(0xFF64748B)))
                  else
                    ..._orders.map((o) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: const Icon(Icons.receipt_long, color: Color(0xFF0369A1)),
                        title: Text('${(o['shops'] as Map?)?['name'] ?? 'Shop'}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('#${(o['id'] as String).substring(0, 8)} · ${o['status']}'),
                        trailing: Text('₹${o['total_final_price'] ?? '—'}', style: const TextStyle(fontWeight: FontWeight.w700)),
                        onTap: () => context.push('/admin/orders/${o['id']}'),
                      ),
                    )),
                ],
              ),
            ),
    );
  }
}

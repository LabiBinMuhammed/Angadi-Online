import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';

class AddressesScreen extends StatefulWidget {
  const AddressesScreen({super.key});

  @override
  State<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends State<AddressesScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _fetch();
  }

  Future<List<Map<String, dynamic>>> _fetch() async {
    final userId = supabase.auth.currentUser!.id;
    final res = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', ascending: false);
    return List<Map<String, dynamic>>.from(res as List);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.myAddressesTitle),
        actions: [
          IconButton(
            icon: const HugeIcon(icon: HugeIcons.strokeRoundedAdd01),
            onPressed: () {}, 
            tooltip: l10n.addAddressButton,
          ),
        ],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final addresses = snapshot.data ?? [];
          if (addresses.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('📍', style: TextStyle(fontSize: 60)),
                  const SizedBox(height: 16),
                  Text(l10n.noAddressesSaved,
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {}, 
                    child: Text(l10n.addAddressButton),
                  ),
                ],
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: addresses.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final a = addresses[i];
              final isDefault = a['is_default'] as bool? ?? false;
              return Card(
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  leading: const HugeIcon(icon: HugeIcons.strokeRoundedLocation01, color: Color(0xFF0EA5E9)),
                  title: Row(children: [
                    Text(a['label'] as String,
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    if (isDefault) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(l10n.defaultAddressBadge,
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700,
                                color: Color(0xFF166534))),
                      ),
                    ],
                  ]),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${a['contact_name']} · ${a['contact_phone']}'),
                      Text(a['address_line_1'] as String,
                          style: const TextStyle(color: Color(0xFF64748B))),
                    ],
                  ),
                  trailing: IconButton(
                    icon: const HugeIcon(icon: HugeIcons.strokeRoundedPencilEdit02, size: 18),
                    onPressed: () {}, 
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

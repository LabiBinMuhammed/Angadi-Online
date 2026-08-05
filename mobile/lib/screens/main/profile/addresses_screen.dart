import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
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
            onPressed: () {
              context.push('/profile/addresses/new').then((_) => setState(() {
                _future = _fetch();
              }));
            }, 
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
                    onPressed: () {
                      context.push('/profile/addresses/new').then((_) => setState(() {
                        _future = _fetch();
                      }));
                    }, 
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
              
              // Get icon for address label
              IconData labelIcon = Icons.home_rounded;
              final String lbl = (a['label'] as String).toLowerCase();
              if (lbl.contains('work') || lbl.contains('office')) {
                labelIcon = Icons.work_rounded;
              } else if (lbl.contains('hostel')) {
                labelIcon = Icons.apartment_rounded;
              } else if (lbl.contains('other')) {
                labelIcon = Icons.location_on_rounded;
              }

              return Card(
                child: ListTile(
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  leading: HugeIcon(
                    icon: labelIcon == Icons.home_rounded
                        ? HugeIcons.strokeRoundedHome01
                        : labelIcon == Icons.work_rounded
                            ? HugeIcons.strokeRoundedBriefcase01
                            : HugeIcons.strokeRoundedLocation01,
                    color: const Color(0xFF0EA5E9),
                  ),
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
                      const SizedBox(height: 6),
                      Text('${a['contact_name']} · ${a['contact_phone']}',
                          style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1E293B))),
                      const SizedBox(height: 4),
                      Text(
                        a['house_name'] as String? ?? a['address_line_1'] as String? ?? '',
                        style: const TextStyle(color: Color(0xFF334155), fontWeight: FontWeight.w500),
                      ),
                      if (a['landmark'] != null && (a['landmark'] as String).isNotEmpty)
                        Text(
                          'Near: ${a['landmark']}',
                          style: const TextStyle(color: Color(0xFF475569)),
                        ),
                      if (a['village'] != null && (a['village'] as String).isNotEmpty)
                        Text(
                          a['village'] as String,
                          style: const TextStyle(color: Color(0xFF475569)),
                        )
                      else if (a['address_line_2'] != null && (a['address_line_2'] as String).isNotEmpty)
                        Text(
                          a['address_line_2'] as String,
                          style: const TextStyle(color: Color(0xFF475569)),
                        ),
                      if (a['delivery_note'] != null && (a['delivery_note'] as String).trim().isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          '📝 Note: ${a['delivery_note']}',
                          style: const TextStyle(color: Color(0xFF0F766E), fontSize: 13, fontStyle: FontStyle.italic),
                        ),
                      ],
                    ],
                  ),
                  trailing: IconButton(
                    icon: const HugeIcon(icon: HugeIcons.strokeRoundedPencilEdit02, size: 18),
                    onPressed: () {
                      context.push('/profile/addresses/${a['id']}').then((_) => setState(() {
                        _future = _fetch();
                      }));
                    }, 
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

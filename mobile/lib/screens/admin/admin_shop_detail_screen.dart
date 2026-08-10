import 'package:flutter/material.dart';
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';

class AdminShopDetailScreen extends StatefulWidget {
  final String shopId;
  const AdminShopDetailScreen({super.key, required this.shopId});

  @override
  State<AdminShopDetailScreen> createState() => _AdminShopDetailScreenState();
}

class _AdminShopDetailScreenState extends State<AdminShopDetailScreen> {
  Map<String, dynamic>? _shop;
  List<Map<String, dynamic>> _items = [];
  List<Map<String, dynamic>> _categories = [];
  String _categoryFilter = 'all';
  String _statusFilter = 'all';
  bool _loading = true;

  List<Map<String, dynamic>> _allUsers = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final results = await Future.wait([
      supabase
          .from('shops')
          .select('*, shop_owners(user_id, users(id, name, phone)), locations(name)')
          .eq('id', widget.shopId)
          .maybeSingle(),
      supabase
          .from('items')
          .select('*, item_images(image_url), item_sell_config(*), item_variants:vw_item_variants_with_fallback(*)')
          .eq('shop_id', widget.shopId)
          .isFilter('deleted_at', null)
          .order('name'),
      supabase
          .from('categories')
          .select('id, name')
          .order('name'),
      supabase
          .from('users')
          .select('id, name, phone, role')
          .order('name'),
    ]);

    if (mounted) {
      setState(() {
        final shopData = results[0] as Map<String, dynamic>?;
        if (shopData != null) {
          final type = shopData['type'] as String?;
          shopData['is_active'] = type == null || !type.endsWith('_inactive');
        }
        _shop = shopData;
        _items = (results[1] as List).cast();
        _categories = (results[2] as List).cast();
        _allUsers = (results[3] as List).cast();
        _loading = false;
      });
    }
  }

  Future<void> _addCoOwner() async {
    final currentOwners = (_shop?['shop_owners'] as List?) ?? [];
    if (currentOwners.length >= 3) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('A shop can have at most 3 owners. Maximum limit reached.')),
      );
      return;
    }

    final existingUserIds = currentOwners.map((o) => o['user_id'] ?? o['users']?['id']).toSet();
    final availableUsers = _allUsers.where((u) => !existingUserIds.contains(u['id'])).toList();

    if (availableUsers.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No available users to add as co-owner.')),
      );
      return;
    }

    String? selectedUserId;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        return StatefulWidgetBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Add Shop Co-Owner (Max 3)'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Select a registered user to collaborate on this shop:'),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: selectedUserId,
                    isExpanded: true,
                    hint: const Text('-- Select User --'),
                    items: availableUsers.map((u) {
                      return DropdownMenuItem<String>(
                        value: u['id'] as String,
                        child: Text('${u['name']} (${u['phone'] ?? 'No phone'})'),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setDialogState(() {
                        selectedUserId = val;
                      });
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: selectedUserId != null ? () => Navigator.pop(context, true) : null,
                  style: ElevatedButton.styleFrom(backgroundColor: kWaGreenDark),
                  child: const Text('Add Co-Owner'),
                ),
              ],
            );
          },
        );
      },
    );

    if (confirm == true && selectedUserId != null) {
      try {
        await supabase.from('shop_owners').insert({
          'shop_id': widget.shopId,
          'user_id': selectedUserId,
        });

        // Upgrade user role if needed
        await supabase.from('users').update({'role': 'shop_owner'}).eq('id', selectedUserId!);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Co-owner added successfully!')),
        );
        _load();
      } catch (err) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to add co-owner: $err')),
        );
      }
    }
  }

  Future<void> _removeCoOwner(String userId, String userName) async {
    final currentOwners = (_shop?['shop_owners'] as List?) ?? [];
    if (currentOwners.length <= 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cannot remove the only owner of a shop.')),
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Co-Owner'),
        content: Text('Are you sure you want to remove $userName from this shop?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: kDanger),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await supabase
            .from('shop_owners')
            .delete()
            .eq('shop_id', widget.shopId)
            .eq('user_id', userId);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Co-owner removed successfully.')),
        );
        _load();
      } catch (err) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to remove co-owner: $err')),
        );
      }
    }
  }


  Future<void> _toggleShopActive(bool val) async {
    final type = _shop!['type'] as String?;
    String newType;
    if (val) {
      newType = type != null ? type.replaceAll('_inactive', '') : 'general';
    } else {
      newType = type != null 
          ? (type.endsWith('_inactive') ? type : '${type}_inactive') 
          : 'general_inactive';
    }
    
    await supabase.from('shops').update({'type': newType}).eq('id', widget.shopId);
    setState(() {
      if (_shop != null) {
        _shop!['type'] = newType;
        _shop!['is_active'] = val;
      }
    });
  }

  Future<void> _toggleItemActive(Map<String, dynamic> item, bool val) async {
    await supabase.from('items').update({'is_active': val}).eq('id', item['id']);
    setState(() {
      final idx = _items.indexWhere((i) => i['id'] == item['id']);
      if (idx >= 0) {
        _items[idx] = {..._items[idx], 'is_active': val};
      }
    });
  }

  Future<void> _deleteShop() async {
    final name = _shop?['name'] ?? 'this shop';
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete Shop'),
          content: Text('Delete shop "$name"? This cannot be undone.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: kDanger,
                foregroundColor: Colors.white,
              ),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirm == true) {
      try {
        await supabase.from('shops').delete().eq('id', widget.shopId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Shop "$name" has been deleted.')),
          );
          Navigator.pop(context);
        }
      } catch (err) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting shop: $err')),
          );
        }
      }
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '—';
    try {
      final date = DateTime.parse(dateStr);
      final months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return '${date.day} ${months[date.month - 1]} ${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_shop == null) {
      return const Scaffold(
        body: Center(child: Text('Shop not found')),
      );
    }

    final owners = (_shop!['shop_owners'] as List?) ?? [];
    final owner = owners.isNotEmpty ? (owners[0]['users'] as Map?) : null;
    final locName = _shop!['locations']?['name'] ?? '—';
    final shopActive = _shop!['is_active'] != false;
    final filteredItems = _items.where((item) {
      final matchesCategory = _categoryFilter == 'all' || item['category_id'] == _categoryFilter;
      final matchesStatus = _statusFilter == 'all'
          ? true
          : _statusFilter == 'active'
              ? item['is_active'] == true
              : item['is_active'] != true;
      return matchesCategory && matchesStatus;
    }).toList();

    final isDark = ThemeService.instance.isDarkMode;
    return Scaffold(
      backgroundColor: isDark ? kNeutral900 : const Color(0xFFFAFAFA),
      appBar: AppBar(
        title: Text(_shop!['name'] ?? 'Shop Detail'),
        leading: Navigator.canPop(context)
            ? IconButton(
                icon: const HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, size: 20),
                onPressed: () => context.pop(),
              )
            : null,
        actions: [
          IconButton(
            icon: const HugeIcon(icon: HugeIcons.strokeRoundedDelete02, color: kDanger),
            tooltip: 'Delete Shop',
            onPressed: _deleteShop,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Metadata Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const CircleAvatar(
                          radius: 24,
                          backgroundColor: kBrand100,
                          child: Text('🏪', style: TextStyle(fontSize: 22)),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _shop!['name'] ?? '—',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 4),
                              Chip(
                                label: Text((_shop!['type'] as String? ?? 'general').replaceAll('_inactive', '')),
                                padding: EdgeInsets.zero,
                                labelStyle: const TextStyle(fontSize: 10),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    _InfoRow(icon: HugeIcons.strokeRoundedUser, label: 'Owner', val: owner?['name'] ?? '—'),
                    const SizedBox(height: 12),
                    _InfoRow(icon: HugeIcons.strokeRoundedCall, label: 'Contact', val: owner?['phone'] ?? '—'),
                    const SizedBox(height: 12),
                    _InfoRow(icon: HugeIcons.strokeRoundedMaps, label: 'Location', val: locName),
                    const SizedBox(height: 12),
                    _InfoRow(
                      icon: HugeIcons.strokeRoundedCalendar01,
                      label: 'Created On',
                      val: _formatDate(_shop!['created_at']),
                    ),
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Shop Status',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'Allow customers to order',
                              style: TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                          ],
                        ),
                        InkWell(
                          onTap: () => _toggleShopActive(!shopActive),
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: shopActive ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              shopActive ? 'Active' : 'Inactive',
                              style: TextStyle(
                                color: shopActive ? const Color(0xFF15803D) : const Color(0xFFB91C1C),
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Shop Owners & Collaborators Card (Max 3)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const HugeIcon(icon: HugeIcons.strokeRoundedUserGroup, size: 20, color: kWaGreenDark),
                            const SizedBox(width: 8),
                            Text(
                              'Shop Owners (${owners.length}/3)',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        if (owners.length < 3)
                          OutlinedButton.icon(
                            onPressed: _addCoOwner,
                            icon: const HugeIcon(icon: HugeIcons.strokeRoundedUserAdd01, size: 16),
                            label: const Text('Add Co-Owner', style: TextStyle(fontSize: 12)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: kWaGreenDark,
                              side: const BorderSide(color: kWaGreenDark),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            ),
                          )
                        else
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade200,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('Max 3 Limit', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black84)),
                          ),
                      ],
                    ),
                    const Divider(height: 20),
                    ...List.generate(owners.length, (idx) {
                      final u = owners[idx]['users'] as Map?;
                      final uid = (owners[idx]['user_id'] ?? u?['id']) as String?;
                      final uName = u?['name'] as String? ?? 'Unknown User';
                      final uPhone = u?['phone'] as String? ?? 'No phone';

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: isDark ? kNeutral800 : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(uName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: idx == 0 ? Colors.green.shade100 : Colors.blue.shade100,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        idx == 0 ? 'Primary' : 'Co-Owner ${idx + 1}',
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          color: idx == 0 ? Colors.green.shade800 : Colors.blue.shade800,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 2),
                                Text('📱 $uPhone', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              ],
                            ),
                            if (owners.length > 1 && uid != null)
                              IconButton(
                                icon: const HugeIcon(icon: HugeIcons.strokeRoundedUserRemove01, color: kDanger, size: 18),
                                tooltip: 'Remove Co-Owner',
                                onPressed: () => _removeCoOwner(uid, uName),
                              ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),


            // Products list header
            Row(
              children: [
                const HugeIcon(icon: HugeIcons.strokeRoundedShoppingBag01, color: kBrand500),
                const SizedBox(width: 8),
                Text(
                  'Products List (${filteredItems.length})',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Side-by-Side Category and Status Filters
            Row(
              children: [
                Expanded(
                  child: Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButtonFormField<String>(
                          value: _categoryFilter,
                          decoration: const InputDecoration(
                            labelText: 'Category',
                            border: InputBorder.none,
                            isDense: true,
                          ),
                          items: [
                            const DropdownMenuItem(
                              value: 'all',
                              child: Text('All Categories'),
                            ),
                            ..._categories.map((cat) {
                              return DropdownMenuItem(
                                value: cat['id'].toString(),
                                child: Text(cat['name'] ?? 'Unknown'),
                              );
                            }),
                          ],
                          onChanged: (val) {
                            setState(() {
                              _categoryFilter = val ?? 'all';
                            });
                          },
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButtonFormField<String>(
                          value: _statusFilter,
                          decoration: const InputDecoration(
                            labelText: 'Status',
                            border: InputBorder.none,
                            isDense: true,
                          ),
                          items: const [
                            DropdownMenuItem(value: 'all', child: Text('All Status')),
                            DropdownMenuItem(value: 'active', child: Text('Listed')),
                            DropdownMenuItem(value: 'inactive', child: Text('Hidden')),
                          ],
                          onChanged: (val) {
                            setState(() {
                              _statusFilter = val ?? 'all';
                            });
                          },
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (filteredItems.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Text(
                    'No products match the selected filters.',
                    style: TextStyle(color: Colors.grey),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: filteredItems.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, i) {
                  final item = filteredItems[i];
                  final rawConfig = item['item_sell_config'];
                  Map<String, dynamic>? config;
                  if (rawConfig is List && rawConfig.isNotEmpty) {
                    config = rawConfig[0] as Map<String, dynamic>?;
                  } else if (rawConfig is Map) {
                    config = rawConfig as Map<String, dynamic>?;
                  }
                  
                  final itemActive = item['is_active'] == true;
                  final imagesList = (item['item_images'] as List?) ?? [];
                  final imgUrl = imagesList.isNotEmpty ? imagesList[0]['image_url'] as String? : null;

                  String priceDisplay = '—';
                  if (config != null) {
                    final sellMode = config['sell_mode']?.toString().toLowerCase();
                    final priceVal = config['price_per_base_unit'];
                    if ((sellMode == 'manual' || sellMode == 'dynamic') && priceVal != null) {
                      priceDisplay = '₹$priceVal / base unit';
                    } else if (priceVal != null) {
                      priceDisplay = '₹$priceVal';
                    } else {
                      priceDisplay = _getVariantsPriceDisplay(item);
                    }
                  } else {
                    priceDisplay = _getVariantsPriceDisplay(item);
                  }

                  return Card(
                    child: ListTile(
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: imgUrl != null
                            ? Image.network(imgUrl, width: 44, height: 44, fit: BoxFit.cover)
                            : Container(
                                width: 44,
                                height: 44,
                                color: kNeutral100,
                                child: const HugeIcon(icon: HugeIcons.strokeRoundedPackage, color: kNeutral400),
                              ),
                      ),
                      title: Text(item['name'] ?? '—', style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(priceDisplay),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: itemActive ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              itemActive ? 'Listed' : 'Hidden',
                              style: TextStyle(
                                color: itemActive ? const Color(0xFF15803D) : const Color(0xFF475569),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              side: BorderSide(color: Colors.grey.shade300),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            onPressed: () => _toggleItemActive(item, !itemActive),
                            icon: HugeIcon(icon: itemActive ? HugeIcons.strokeRoundedViewOff : HugeIcons.strokeRoundedView,
                              size: 14,
                              color: Colors.grey.shade700),
                            label: Text(
                              itemActive ? 'Hide' : 'Show',
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  String _getVariantsPriceDisplay(Map<String, dynamic> item) {
    final variants = (item['item_variants'] as List?) ?? [];
    if (variants.isNotEmpty) {
      final prices = variants
          .map((v) => v['price'])
          .where((p) => p != null)
          .map((p) => double.tryParse(p.toString()) ?? 0.0)
          .toList();
      if (prices.isNotEmpty) {
        final min = prices.reduce((a, b) => a < b ? a : b);
        final max = prices.reduce((a, b) => a > b ? a : b);
        return min == max 
            ? '₹${min.toStringAsFixed(0)}' 
            : '₹${min.toStringAsFixed(0)} - '
              '₹${max.toStringAsFixed(0)}';
      }
    }
    return '—';
  }
}

class _InfoRow extends StatelessWidget {
  final List<List<dynamic>> icon;
  final String label, val;
  const _InfoRow({required this.icon, required this.label, required this.val});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        HugeIcon(icon: icon, size: 20, color: kWaGreenDark),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
            Text(val, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
          ],
        ),
      ],
    );
  }
}

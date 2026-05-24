import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import 'vendor_theme_helper.dart';

class VendorItemsScreen extends StatefulWidget {
  const VendorItemsScreen({super.key});
  @override
  State<VendorItemsScreen> createState() => _VendorItemsScreenState();
}

class _VendorItemsScreenState extends State<VendorItemsScreen> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _shopId;
  String _filter = 'all';
  String _searchQuery = '';
  final _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
    _searchCtrl.addListener(() {
      setState(() {
        _searchQuery = _searchCtrl.text;
      });
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() => _loading = true);
    
    final uid = supabase.auth.currentUser!.id;
    final ownerRes = await supabase.from('shop_owners').select('shop_id').eq('user_id', uid).maybeSingle();
    _shopId = ownerRes?['shop_id'] as String?;
    if (_shopId == null) {
      if (mounted) setState(() => _loading = false);
      return;
    }

    final res = await supabase
        .from('items')
        .select('*, categories(name)')
        .eq('shop_id', _shopId!)
        .isFilter('deleted_at', null)
        .order('updated_at', ascending: false);

    if (mounted) {
      setState(() {
        _items = (res as List).cast<Map<String, dynamic>>();
        _loading = false;
      });
    }
  }

  Future<void> _toggleActive(Map<String, dynamic> item) async {
    final currentStatus = item['status'] as String? ?? (item['is_active'] == true ? 'published' : 'draft');
    final nextStatus = currentStatus == 'published' ? 'hidden' : 'published';
    final nextIsActive = (nextStatus == 'published');
    
    await supabase.from('items').update({
      'is_active': nextIsActive,
      'status': nextStatus,
    }).eq('id', item['id']);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Item marked as ${nextStatus == 'published' ? 'Live' : 'Hidden'}'),
        backgroundColor: const Color(0xFF1E293B),
      ),
    );
    _load();
  }

  Future<void> _deleteItem(Map<String, dynamic> item) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Delete Product', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: Text('Permanently delete "${item['name']}"? This cannot be undone.', style: const TextStyle(color: kVendorSubText)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: kVendorSubText)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await supabase.from('items').update({
        'deleted_at': DateTime.now().toIso8601String()
      }).eq('id', item['id']);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Product deleted successfully'), backgroundColor: Color(0xFF1E293B)),
      );
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _items.where((i) {
      final name = (i['name'] as String? ?? '').toLowerCase();
      final matchesSearch = name.contains(_searchQuery.toLowerCase());
      
      final status = i['status'] as String? ?? (i['is_active'] == true ? 'published' : 'draft');
      
      bool matchesFilter = false;
      if (_filter == 'all') {
        matchesFilter = true;
      } else if (_filter == 'active') {
        matchesFilter = (status == 'published');
      } else if (_filter == 'draft') {
        matchesFilter = (status == 'draft' || status == 'incomplete');
      } else if (_filter == 'inactive') {
        matchesFilter = (status == 'hidden' || status == 'rejected' || status == 'out_of_stock');
      }
      return matchesSearch && matchesFilter;
    }).toList();

    return Scaffold(
      backgroundColor: kVendorBg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: kVendorText,
        title: const Text('Manage Products', style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: -0.5)),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, size: 26, color: Color(0xFF60A5FA)),
            onPressed: () => context.push('/vendor/items/new').then((_) => _load()),
          ),
        ],
      ),
      body: Column(
        children: [
          // Toolbar (Search & Filter Capsule buttons)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              children: [
                // Search Input Field
                TextField(
                  controller: _searchCtrl,
                  style: const TextStyle(color: Colors.white, fontSize: 15),
                  decoration: vendorInputDecoration(
                    hintText: 'Search products by name...',
                    prefixIcon: const Icon(Icons.search_rounded, color: kVendorSubText),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded, color: kVendorSubText),
                            onPressed: () => _searchCtrl.clear(),
                          )
                        : null,
                  ),
                ),
                const SizedBox(height: 12),
                
                // Capsule Filters Row
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterButton(
                        label: 'All',
                        selected: _filter == 'all',
                        onTap: () => setState(() => _filter = 'all'),
                      ),
                      _FilterButton(
                        label: 'Live',
                        selected: _filter == 'active',
                        onTap: () => setState(() => _filter = 'active'),
                      ),
                      _FilterButton(
                        label: 'Draft',
                        selected: _filter == 'draft',
                        onTap: () => setState(() => _filter = 'draft'),
                      ),
                      _FilterButton(
                        label: 'Inactive',
                        selected: _filter == 'inactive',
                        onTap: () => setState(() => _filter = 'inactive'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Content body
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF60A5FA)))
                : filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inventory_2_outlined, size: 64, color: kVendorSubText.withOpacity(0.5)),
                            const SizedBox(height: 16),
                            const Text(
                              'No products found',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kVendorSubText),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: filtered.length,
                        itemBuilder: (context, i) {
                          final item = filtered[i];
                          final status = item['status'] as String? ?? (item['is_active'] == true ? 'published' : 'draft');
                          final categoryName = (item['categories'] as Map?)?['name'] as String? ?? 'Uncategorized';
                          
                          // Determine status badge metadata
                          VendorBadgeType badgeType = VendorBadgeType.neutral;
                          String badgeLabel = 'Draft';

                          if (status == 'published') {
                            badgeType = VendorBadgeType.success;
                            badgeLabel = 'Live';
                          } else if (status == 'incomplete') {
                            badgeType = VendorBadgeType.warning;
                            badgeLabel = 'Incomplete';
                          } else if (status == 'ready') {
                            badgeType = VendorBadgeType.info;
                            badgeLabel = 'Ready';
                          } else if (status == 'hidden') {
                            badgeType = VendorBadgeType.neutral;
                            badgeLabel = 'Hidden';
                          } else if (status == 'rejected') {
                            badgeType = VendorBadgeType.danger;
                            badgeLabel = 'Rejected';
                          } else if (status == 'out_of_stock') {
                            badgeType = VendorBadgeType.warning;
                            badgeLabel = 'Out Of Stock';
                          }

                          return Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(14),
                            decoration: vendorCardDecoration(radius: 20),
                            child: Row(
                              children: [
                                // Image Thumbnail
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: item['image_url'] != null && (item['image_url'] as String).isNotEmpty
                                      ? Image.network(
                                          item['image_url'],
                                          width: 48,
                                          height: 48,
                                          fit: BoxFit.cover,
                                        )
                                      : Container(
                                          width: 48,
                                          height: 48,
                                          color: Colors.white.withOpacity(0.05),
                                          child: const Center(
                                            child: Icon(Icons.inventory_2_rounded, color: kVendorSubText, size: 22),
                                          ),
                                        ),
                                ),
                                const SizedBox(width: 14),

                                // Product Info
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item['name'] ?? '—',
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 15,
                                          color: Colors.white,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: Colors.white.withOpacity(0.05),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              categoryName,
                                              style: const TextStyle(fontSize: 10, color: kVendorSubText),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          VendorBadge(label: badgeLabel, type: badgeType),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 12),

                                // Actions (Toggle, Edit, Delete)
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    // Power Toggle
                                    _ActionButton(
                                      icon: Icons.power_settings_new_rounded,
                                      color: status == 'published' ? const Color(0xFF60A5FA) : kVendorSubText,
                                      onPressed: () => _toggleActive(item),
                                      tooltip: status == 'published' ? 'Deactivate' : 'Go Live',
                                    ),
                                    const SizedBox(width: 6),
                                    // Edit
                                    _ActionButton(
                                      icon: Icons.edit_rounded,
                                      color: Colors.white.withOpacity(0.7),
                                      onPressed: () => context.push('/vendor/items/${item['id']}').then((_) => _load()),
                                      tooltip: 'Edit',
                                    ),
                                    const SizedBox(width: 6),
                                    // Delete
                                    _ActionButton(
                                      icon: Icons.delete_rounded,
                                      color: const Color(0xFFF87171),
                                      bgColor: const Color(0x26EF4444),
                                      borderColor: const Color(0x4DEF4444),
                                      onPressed: () => _deleteItem(item),
                                      tooltip: 'Delete',
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}

class _FilterButton extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterButton({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF3B82F6) : Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(99),
          border: Border.all(
            color: selected ? const Color(0xFF3B82F6) : Colors.white.withOpacity(0.08),
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: const Color(0xFF3B82F6).withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : kVendorSubText,
            fontSize: 13,
            fontWeight: selected ? FontWeight.bold : FontWeight.w500,
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final Color? bgColor;
  final Color? borderColor;
  final VoidCallback onPressed;
  final String tooltip;

  const _ActionButton({
    required this.icon,
    required this.color,
    this.bgColor,
    this.borderColor,
    required this.onPressed,
    required this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: bgColor ?? Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: borderColor ?? Colors.white.withOpacity(0.12)),
          ),
          child: Center(
            child: Icon(icon, color: color, size: 16),
          ),
        ),
      ),
    );
  }
}

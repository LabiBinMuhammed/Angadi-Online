import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../core/supabase_client.dart';
import '../../theme/theme_service.dart';
import 'vendor_drawer.dart';
import 'vendor_theme_helper.dart';

class VendorCatalogCategoriesScreen extends StatefulWidget {
  const VendorCatalogCategoriesScreen({super.key});

  @override
  State<VendorCatalogCategoriesScreen> createState() => _VendorCatalogCategoriesScreenState();
}

class _VendorCatalogCategoriesScreenState extends State<VendorCatalogCategoriesScreen> {
  bool _loading = true;
  String? _shopId;
  String? _shopName;
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _filteredCategories = [];
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
    _searchCtrl.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchCtrl.text.trim().toLowerCase();
    setState(() {
      if (query.isEmpty) {
        _filteredCategories = List.from(_categories);
      } else {
        _filteredCategories = _categories.where((cat) {
          final name = (cat['name'] as String? ?? '').toLowerCase();
          return name.contains(query);
        }).toList();
      }
    });
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final user = supabase.auth.currentUser;
      if (user == null) {
        if (mounted) context.go('/auth/login');
        return;
      }

      // Get vendor's shop
      final ownersRes = await supabase
          .from('shop_owners')
          .select('shop_id, shops(id, name)')
          .eq('user_id', user.id);

      if ((ownersRes as List).isEmpty) {
        if (mounted) setState(() => _loading = false);
        return;
      }

      final firstOwner = ownersRes.first;
      _shopId = firstOwner['shop_id'] as String;
      final shopData = firstOwner['shops'] as Map<String, dynamic>?;
      _shopName = shopData?['name'] as String? ?? 'Shop';

      // 1. Fetch categories
      final catsRes = await supabase
          .from('categories')
          .select('id, name, display_order')
          .eq('is_active', true)
          .order('display_order', ascending: true);

      // 2. Fetch demo item counts per category
      final demoRes = await supabase
          .from('demo_items')
          .select('id, category_id')
          .range(0, 4999);

      // 3. Fetch shop's items with demo_item_id
      final shopItemsRes = await supabase
          .from('items')
          .select('id, category_id, demo_item_id')
          .eq('shop_id', _shopId!)
          .isFilter('deleted_at', null)
          .not('demo_item_id', 'is', null)
          .range(0, 4999);

      final demoMap = <String, int>{};
      for (final d in (demoRes as List)) {
        final catId = d['category_id'] as String?;
        if (catId != null) {
          demoMap[catId] = (demoMap[catId] ?? 0) + 1;
        }
      }

      final addedMap = <String, int>{};
      for (final s in (shopItemsRes as List)) {
        final catId = s['category_id'] as String?;
        if (catId != null) {
          addedMap[catId] = (addedMap[catId] ?? 0) + 1;
        }
      }

      final list = <Map<String, dynamic>>[];
      for (final c in (catsRes as List)) {
        final id = c['id'] as String;
        final totalDemo = demoMap[id] ?? 0;
        final added = addedMap[id] ?? 0;
        list.add({
          'id': id,
          'name': c['name'] ?? '',
          'totalDemo': totalDemo,
          'added': added,
          'percent': totalDemo > 0 ? ((added / totalDemo) * 100).round() : 0,
        });
      }

      if (mounted) {
        setState(() {
          _categories = list;
          _filteredCategories = List.from(list);
          _loading = false;
        });
      }
    } catch (e, stack) {
      debugPrint('Error loading categories: $e\n$stack');
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  dynamic _getCategoryIcon(String name) {
    final n = name.toLowerCase();
    if (n.contains('vegetable') || n.contains('veg')) return HugeIcons.strokeRoundedPackage;
    if (n.contains('fruit')) return HugeIcons.strokeRoundedApple;
    if (n.contains('milk') || n.contains('dairy')) return HugeIcons.strokeRoundedCoffee01;
    if (n.contains('bakery') || n.contains('bread')) return HugeIcons.strokeRoundedCroissant;
    if (n.contains('beverage') || n.contains('tea')) return HugeIcons.strokeRoundedCoffee02;
    return HugeIcons.strokeRoundedPackage;
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: ThemeService.instance,
      builder: (context, _) {
        final canPop = Navigator.of(context).canPop();

        return Scaffold(
          backgroundColor: kVendorBg,
          drawer: const VendorDrawer(currentRoute: '/vendor/catalog'),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: canPop
            ? IconButton(
                icon: HugeIcon(icon: HugeIcons.strokeRoundedArrowLeft01, color: kVendorText, size: 20),
                onPressed: () => context.pop(),
              )
            : Builder(
                builder: (ctx) => IconButton(
                  icon: const HugeIcon(icon: HugeIcons.strokeRoundedMenu01, size: 20),
                  onPressed: () => Scaffold.of(ctx).openDrawer(),
                ),
              ),
        title: Text(
          'Catalog Album',
          style: TextStyle(color: kVendorText, fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                children: [
                  // Banner Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: kVendorCardBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: kVendorCardBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF3B82F6).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  HugeIcon(icon: HugeIcons.strokeRoundedBookOpen01, color: Color(0xFF60A5FA), size: 14),
                                  SizedBox(width: 6),
                                  Text(
                                    'MY CATALOG',
                                    style: TextStyle(color: Color(0xFF60A5FA), fontSize: 11, fontWeight: FontWeight.w800),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Add & manage products',
                          style: TextStyle(color: kVendorText, fontSize: 22, fontWeight: FontWeight.w900),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _shopName != null ? 'Quickly set up products for $_shopName' : 'Quickly set up your shop products category by category',
                          style: TextStyle(color: kVendorSubText, fontSize: 13),
                        ),
                        const SizedBox(height: 16),

                        // Search Categories
                        TextField(
                          controller: _searchCtrl,
                          style: TextStyle(color: kVendorText, fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Search categories...',
                            hintStyle: TextStyle(color: kVendorSubText, fontSize: 14),
                            prefixIcon: HugeIcon(icon: HugeIcons.strokeRoundedSearch01, color: kVendorSubText, size: 18),
                            suffixIcon: _searchCtrl.text.isNotEmpty
                                ? IconButton(
                                    icon: HugeIcon(icon: HugeIcons.strokeRoundedCancel01, color: kVendorSubText, size: 16),
                                    onPressed: () => _searchCtrl.clear(),
                                  )
                                : null,
                            filled: true,
                            fillColor: kVendorInputBg,
                            contentPadding: const EdgeInsets.symmetric(vertical: 12),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(color: kVendorCardBorder),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(color: kVendorCardBorder),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Category Cards
                  if (_filteredCategories.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      alignment: Alignment.center,
                      child: Text('No categories found', style: TextStyle(color: kVendorSubText, fontSize: 14)),
                    )
                  else
                    ..._filteredCategories.map((cat) {
                      final name = cat['name'] as String;
                      final added = cat['added'] as int;
                      final total = cat['totalDemo'] as int;
                      final percent = cat['percent'] as int;
                      final isComplete = total > 0 && added >= total;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: kVendorCardBg,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: isComplete
                                ? const Color(0xFF22C55E).withValues(alpha: 0.3)
                                : kVendorCardBorder,
                          ),
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            borderRadius: BorderRadius.circular(18),
                            onTap: () {
                              context.push('/vendor/catalog/${cat['id']}').then((_) => _loadData());
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Center(
                                          child: HugeIcon(
                                            icon: _getCategoryIcon(name),
                                            color: const Color(0xFF60A5FA),
                                            size: 22,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              name,
                                              style: TextStyle(color: kVendorText, fontSize: 16, fontWeight: FontWeight.bold),
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              '$added / $total added',
                                              style: TextStyle(color: kVendorSubText, fontSize: 13, fontWeight: FontWeight.w600),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: isComplete
                                              ? const Color(0xFF22C55E).withValues(alpha: 0.12)
                                              : const Color(0xFF3B82F6).withValues(alpha: 0.12),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          '$percent%',
                                          style: TextStyle(
                                            color: isComplete ? const Color(0xFF22C55E) : const Color(0xFF60A5FA),
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  // Progress Bar
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(6),
                                    child: LinearProgressIndicator(
                                      value: total > 0 ? (added / total).clamp(0.0, 1.0) : 0.0,
                                      minHeight: 6,
                                      backgroundColor: Colors.white.withValues(alpha: 0.06),
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        isComplete ? const Color(0xFF22C55E) : const Color(0xFF3B82F6),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
        );
      },
    );
  }
}

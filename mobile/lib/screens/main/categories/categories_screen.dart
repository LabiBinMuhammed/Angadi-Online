import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../models/models.dart';
import '../../../core/cart_service.dart';

const _kBg = Color(0xFFFAFAFA);
const _kGreenDark = Color(0xFF32B84A);
const _kText = Color(0xFF1A1A1A);
const _kSub = Color(0xFF555555);
const _kSubLighter = Color(0xFF888888);

String _getCatIcon(String name) {
  final n = name.toLowerCase();
  if (n.contains('vegetable') || n.contains('veg')) return '🥦';
  if (n.contains('fruit')) return '🍎';
  if (n.contains('dairy')) return '🥛';
  if (n.contains('grain') || n.contains('rice') || n.contains('wheat')) return '🌾';
  if (n.contains('spice')) return '🌶️';
  if (n.contains('bakery') || n.contains('bread')) return '🍞';
  if (n.contains('oil')) return '🫙';
  if (n.contains('meat') || n.contains('fish')) return '🥩';
  if (n.contains('snack')) return '🍿';
  if (n.contains('personal') || n.contains('care')) return '🧴';
  if (n.contains('beverage') || n.contains('drink')) return '🥤';
  return '📦';
}

Color _getCatColor(String name) {
  final n = name.toLowerCase();
  if (n.contains('vegetable') || n.contains('veg')) return const Color(0xFFE8F9EC);
  if (n.contains('fruit')) return const Color(0xFFFCEDEF);
  if (n.contains('dairy')) return const Color(0xFFEBF5FF);
  if (n.contains('grain') || n.contains('rice') || n.contains('wheat')) return const Color(0xFFFFF9E6);
  if (n.contains('spice')) return const Color(0xFFFFF0EB);
  if (n.contains('bakery') || n.contains('bread')) return const Color(0xFFFBF1E6);
  if (n.contains('oil')) return const Color(0xFFF7F1EB);
  if (n.contains('meat') || n.contains('fish')) return const Color(0xFFFCEEF0);
  if (n.contains('snack')) return const Color(0xFFFDF5EB);
  if (n.contains('personal') || n.contains('care')) return const Color(0xFFF4E9F9);
  if (n.contains('beverage') || n.contains('drink')) return const Color(0xFFE6F7F8);
  return const Color(0xFFF4F5F7);
}

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  bool _loading = true;
  List<Category> _categories = [];
  List<Shop> _shops = [];
  List<Item> _items = [];
  Map<String, double> _itemPrices = {};
  String _searchQuery = '';
  
  Category? _selectedCategory;
  final Map<String, int> _itemQtys = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final res = await Future.wait([
        supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
        supabase.from('shops').select('id, name').order('name'),
        supabase.from('items').select('id, shop_id, name, description, category_id, has_variants, is_active, item_images(*)').eq('is_active', true).isFilter('deleted_at', null).order('name'),
        supabase.from('item_variants').select('item_id, price').eq('is_active', true).eq('is_default', true),
      ]);

      final cats = (res[0] as List).map((j) => Category.fromJson(j)).toList();
      final shops = (res[1] as List).map((j) => Shop.fromJson(j)).toList();
      final items = (res[2] as List).map((j) => Item.fromJson(j)).toList();
      
      final Map<String, double> prices = {};
      for (var v in (res[3] as List)) {
        final itemId = v['item_id'] as String;
        final price = (v['price'] as num?)?.toDouble() ?? 1.8;
        prices[itemId] = price;
      }

      if (mounted) {
        setState(() {
          _categories = cats;
          _shops = shops;
          _items = items;
          _itemPrices = prices;
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading categories data: $e');
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  void _updateQty(String id, int qty) {
    setState(() {
      _itemQtys[id] = qty.clamp(1, 999);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _kBg,
      body: SafeArea(
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: _kGreenDark))
            : AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                transitionBuilder: (child, animation) {
                  return FadeTransition(
                    opacity: animation,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.0, 0.05),
                        end: Offset.zero,
                      ).animate(animation),
                      child: child,
                    ),
                  );
                },
                child: _selectedCategory == null
                    ? _buildCategoriesGrid()
                    : _buildCategoryDetails(),
              ),
      ),
    );
  }

  Widget _buildCategoriesGrid() {
    final filteredCats = _categories.where((c) {
      final hasProduct = _items.any((i) => i.categoryId == c.id);
      return hasProduct && c.name.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    return SingleChildScrollView(
      key: const ValueKey('grid'),
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Title
          const Padding(
            padding: EdgeInsets.fromLTRB(24, 24, 24, 8),
            child: Text(
              'Categories',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: _kText,
                letterSpacing: -1,
              ),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              'Explore fresh products by category',
              style: TextStyle(
                fontSize: 15,
                color: _kSubLighter,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),

          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
            child: Container(
              height: 54,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: const Color(0xFFF0F2F5),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Row(
                children: [
                  const Icon(Icons.search, color: Colors.grey),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      onChanged: (v) => setState(() => _searchQuery = v),
                      decoration: const InputDecoration(
                        hintText: 'Search categories...',
                        hintStyle: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Grid
          filteredCats.isEmpty
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(child: Text('No categories found', style: TextStyle(color: _kSubLighter))),
                )
              : GridView.builder(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 100),
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.1,
                  ),
                  itemCount: filteredCats.length,
                  itemBuilder: (context, index) {
                    final cat = filteredCats[index];
                    final count = _items.where((i) => i.categoryId == cat.id).length;
                    final bg = _getCatColor(cat.name);
                    final emoji = _getCatIcon(cat.name);

                    return GestureDetector(
                      onTap: () => setState(() => _selectedCategory = cat),
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: bg,
                          borderRadius: BorderRadius.circular(28),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.01),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              width: 50,
                              height: 50,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  emoji,
                                  style: const TextStyle(fontSize: 26),
                                ),
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  cat.name,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: _kText,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '$count items',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: _kSub,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ],
      ),
    );
  }

  Widget _buildCategoryDetails() {
    final cat = _selectedCategory!;
    final catItems = _items.where((i) => i.categoryId == cat.id).toList();

    return Column(
      key: const ValueKey('details'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 16),
          child: Row(
            children: [
              GestureDetector(
                onTap: () => setState(() => _selectedCategory = null),
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.arrow_back, color: _kText),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      cat.name,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: _kText,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${catItems.length} products available',
                      style: const TextStyle(
                        fontSize: 13,
                        color: _kSubLighter,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: _getCatColor(cat.name),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    _getCatIcon(cat.name),
                    style: const TextStyle(fontSize: 22),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Items List
        Expanded(
          child: catItems.isEmpty
              ? const Center(child: Text('No items in this category yet.', style: TextStyle(color: _kSubLighter)))
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 100),
                  physics: const BouncingScrollPhysics(),
                  itemCount: catItems.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final item = catItems[index];
                    final shop = _shops.firstWhere((s) => s.id == item.shopId, orElse: () => Shop(id: item.shopId, name: 'Shop'));
                    final price = _itemPrices[item.id] ?? 1.8;
                    final qty = _itemQtys[item.id] ?? 1;

                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 15,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          // Item Image/Emoji
                          GestureDetector(
                            onTap: () => context.push('/home/item/${item.id}'),
                            child: Container(
                              width: 80,
                              height: 80,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF9FAFB),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Center(
                                child: item.imageUrl != null
                                    ? ClipRRect(
                                        borderRadius: BorderRadius.circular(16),
                                        child: Image.network(item.imageUrl!, fit: BoxFit.cover),
                                      )
                                    : Text(
                                        _getCatIcon(cat.name),
                                        style: const TextStyle(fontSize: 32),
                                      ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),

                          // Product and Shop Info
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: _kText,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.storefront_outlined, size: 13, color: _kSubLighter),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        shop.name,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: _kSubLighter,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  '\$ ${price.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w900,
                                    color: _kGreenDark,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Add to Cart controls
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Row(
                                children: [
                                  GestureDetector(
                                    onTap: () => _updateQty(item.id, qty - 1),
                                    child: Container(
                                      width: 26,
                                      height: 26,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(color: Colors.grey[300]!),
                                      ),
                                      child: const Icon(Icons.remove, size: 14, color: _kSub),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '$qty',
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(width: 8),
                                  GestureDetector(
                                    onTap: () => _updateQty(item.id, qty + 1),
                                    child: Container(
                                      width: 26,
                                      height: 26,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(color: Colors.grey[300]!),
                                      ),
                                      child: const Icon(Icons.add, size: 14, color: _kSub),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: () async {
                                  final scName = item.name;
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Adding $scName to cart...'),
                                      duration: const Duration(milliseconds: 500),
                                    ),
                                  );
                                  await CartService.instance.addItemById(item.id, quantity: qty.toDouble());
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('$scName added to cart!'),
                                        duration: const Duration(seconds: 1),
                                      ),
                                    );
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: _kGreenDark,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                  elevation: 0,
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.add_shopping_cart, size: 14),
                                    SizedBox(width: 6),
                                    Text('Add', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                                  ],
                                ),
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
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../models/models.dart';

class ShopScreen extends StatefulWidget {
  final String shopId;
  const ShopScreen({super.key, required this.shopId});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  late Future<_ShopData> _dataFuture;

  @override
  void initState() {
    super.initState();
    _dataFuture = _fetch();
  }

  Future<_ShopData> _fetch() async {
    final results = await Future.wait([
      supabase.from('shops').select('id, name, type').eq('id', widget.shopId).single(),
      supabase
          .from('items')
          .select('id, shop_id, name, description, category_id, has_variants, is_active, item_images(*)')
          .eq('shop_id', widget.shopId)
          .eq('is_active', true)
          .isFilter('deleted_at', null)
          .order('name'),
      supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
    ]);
    return _ShopData(
      shop:       Shop.fromJson(results[0] as Map<String, dynamic>),
      items:      (results[1] as List).map((j) => Item.fromJson(j)).toList(),
      categories: (results[2] as List).map((j) => Category.fromJson(j)).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_ShopData>(
      future: _dataFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final d = snapshot.data!;
        final activeCategoryIds = d.items.map((item) => item.categoryId).toSet();
        final filteredCategories = d.categories.where((cat) => activeCategoryIds.contains(cat.id)).toList();
        return Scaffold(
          appBar: AppBar(title: Text(d.shop.name)),
          body: Column(
            children: [
              // Category pills
              if (filteredCategories.isNotEmpty)
                SizedBox(
                  height: 48,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    scrollDirection: Axis.horizontal,
                    itemCount: filteredCategories.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (_, i) {
                      final cat = filteredCategories[i];
                      return OutlinedButton(
                        onPressed: () =>
                            context.push('/home/shop/${widget.shopId}/category/${cat.id}'),
                        child: Text(cat.name),
                      );
                    },
                  ),
                ),

              // Items
              Expanded(
                child: d.items.isEmpty
                    ? const Center(child: Text('No items in this shop'))
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: .85,
                        ),
                        itemCount: d.items.length,
                        itemBuilder: (_, i) => _ItemCard(item: d.items[i]),
                      ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ItemCard extends StatelessWidget {
  final Item item;
  const _ItemCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/home/item/${item.id}'),
      child: Card(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                ),
                child: Center(
                  child: item.imageUrl != null
                      ? Image.network(item.imageUrl!, fit: BoxFit.cover)
                      : const Text('📦', style: TextStyle(fontSize: 36)),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Text(item.name,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                  maxLines: 2, overflow: TextOverflow.ellipsis),
            ),
          ],
        ),
      ),
    );
  }
}

class _ShopData {
  final Shop shop;
  final List<Item> items;
  final List<Category> categories;
  _ShopData({required this.shop, required this.items, required this.categories});
}

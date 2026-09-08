import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../../core/supabase_client.dart';
import '../../../models/models.dart';
import '../../../core/language_service.dart';
import '../../../widgets/product_card.dart';

class ShopCategoryScreen extends StatefulWidget {
  final String shopId;
  final String categoryId;
  const ShopCategoryScreen({super.key, required this.shopId, required this.categoryId});

  @override
  State<ShopCategoryScreen> createState() => _ShopCategoryScreenState();
}

class _ShopCategoryScreenState extends State<ShopCategoryScreen> {
  late Future<_Data> _future;

  @override
  void initState() {
    super.initState();
    _future = _fetch();
  }

  Future<_Data> _fetch() async {
    final results = await Future.wait([
      supabase.from('categories').select('*, category_translations(*)').eq('id', widget.categoryId).single(),
      supabase
          .from('items')
          .select('*, item_translations(*), item_sell_config(*), item_variants:vw_item_variants_with_fallback(*, variant_translations(*)), item_images(*)')
          .eq('shop_id', widget.shopId)
          .eq('category_id', widget.categoryId)
          .eq('is_active', true)
          .isFilter('deleted_at', null)
          .order('name'),
      supabase.from('categories').select('*, category_translations(*)').eq('is_active', true).order('display_order'),
      supabase.from('units').select('*'),
    ]);
    final category = Category.fromJson(results[0] as Map<String, dynamic>);
    final itemsList = (results[1] as List).map((j) => Item.fromJson(j)).toList();
    final filteredItems = category.isActive ? itemsList : <Item>[];
    final cats = (results[2] as List).map((j) => Category.fromJson(j)).toList();
    final unitsList = (results[3] as List).map((j) => Unit.fromJson(j)).toList();
    return _Data(
      category:   category,
      items:      filteredItems,
      categories: cats,
      units:      unitsList,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return FutureBuilder<_Data>(
      future: _future,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final d = snapshot.data!;
        return Scaffold(
          appBar: AppBar(title: Text(d.category.getLocalizedName(LanguageService.instance.locale.languageCode))),
          body: d.items.isEmpty
              ? Center(child: Text(l10n.noItemsInCategory))
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.65,
                  ),
                  itemCount: d.items.length,
                  itemBuilder: (_, i) {
                    final item = d.items[i];
                    return ProductCard(
                      item: item,
                      isLiked: false,
                      onLikeToggle: () {},
                      units: d.units,
                      categories: d.categories,
                      onTap: () => context.push('/home/item/${item.id}'),
                    );
                  },
                ),
        );
      },
    );
  }
}

class _Data {
  final Category category;
  final List<Item> items;
  final List<Category> categories;
  final List<Unit> units;
  _Data({required this.category, required this.items, required this.categories, required this.units});
}

import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../../core/supabase_client.dart';
import '../../../models/models.dart';
import '../../../core/language_service.dart';

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
      supabase.from('categories').select('id, name, is_active, category_translations(*)').eq('id', widget.categoryId).single(),
      supabase
          .from('items')
          .select('id, shop_id, name, description, category_id, has_variants, is_active, item_images(*), item_translations(*)')
          .eq('shop_id', widget.shopId)
          .eq('category_id', widget.categoryId)
          .eq('is_active', true)
          .isFilter('deleted_at', null)
          .order('name'),
    ]);
    final category = Category.fromJson(results[0] as Map<String, dynamic>);
    final itemsList = (results[1] as List).map((j) => Item.fromJson(j)).toList();
    final filteredItems = category.isActive ? itemsList : <Item>[];
    return _Data(
      category: category,
      items:    filteredItems,
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
                    crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: .85,
                  ),
                  itemCount: d.items.length,
                  itemBuilder: (_, i) {
                    final item = d.items[i];
                    return GestureDetector(
                      onTap: null,
                      child: Card(
                        child: Column(children: [
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
                            child: Align(
                              alignment: Alignment.centerLeft,
                              child: Text(item.getLocalizedName(LanguageService.instance.locale.languageCode),
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                  maxLines: 2, overflow: TextOverflow.ellipsis),
                            ),
                          ),
                        ]),
                      ),
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
  _Data({required this.category, required this.items});
}

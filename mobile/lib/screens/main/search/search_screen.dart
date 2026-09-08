import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:village_market/l10n/app_localizations.dart';
import '../../../core/language_service.dart';
import '../../../core/supabase_client.dart';
import '../../../models/models.dart';
import '../../../theme/app_theme.dart';
import '../../../widgets/app_cached_image.dart';
import '../home/home_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _controller = TextEditingController();
  final _focus = FocusNode();
  List<Shop> _shopResults = [];
  List<Item> _itemResults = [];
  Map<String, String> _shopNames = {};
  List<String> _recent = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _focus.requestFocus();
    _controller.addListener(_onSearchChanged);
  }

  void _onSearchChanged() {
    final q = _controller.text.trim();
    if (q.isEmpty) {
      setState(() {
        _shopResults = [];
        _itemResults = [];
      });
      return;
    }
    _search(q);
  }

  Future<void> _search(String q) async {
    setState(() => _loading = true);
    try {
      final shopsRes = await supabase
          .from('shops')
          .select('id, name, type, logo_url')
          .ilike('name', '%$q%')
          .limit(10);
      final List<Shop> shops = (shopsRes as List)
          .map((j) => Shop.fromJson(j))
          .where((s) => !(s.type?.endsWith('_inactive') ?? false))
          .toList();

      final itemsRes = await supabase
          .from('items')
          .select('*, item_images(*), item_sell_config(*), item_variants:vw_item_variants_with_fallback(*), item_translations(*), shops(id, name)')
          .eq('is_active', true)
          .isFilter('deleted_at', null)
          .limit(100);

      final List<dynamic> itemsData = itemsRes as List;
      final Map<String, String> shopNameMap = {};
      final List<Item> matchedItems = [];

      for (final j in itemsData) {
        final item = Item.fromJson(Map<String, dynamic>.from(j));
        if (j['shops'] != null) {
          shopNameMap[item.id] = j['shops']['name']?.toString() ?? '';
        }
        if (matchesItemSearch(item, q)) {
          matchedItems.add(item);
        }
      }

      if (mounted) {
        setState(() {
          _shopResults = shops;
          _itemResults = matchedItems;
          _shopNames = shopNameMap;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _saveRecent(String term) {
    setState(() {
      _recent = [term, ..._recent.where((r) => r != term)].take(6).toList();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final q = _controller.text.trim();
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          focusNode: _focus,
          decoration: InputDecoration(
            hintText: l10n.searchItemsPlaceholder,
            border: InputBorder.none,
            hintStyle: const TextStyle(color: kNeutral400),
            filled: false,
          ),
          style: const TextStyle(fontSize: 16),
          textInputAction: TextInputAction.search,
        ),
        actions: [
          if (q.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear),
              onPressed: () {
                _controller.clear();
                setState(() {
                  _shopResults = [];
                  _itemResults = [];
                });
              },
            ),
        ],
      ),
      body: q.isEmpty
          ? _recent.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('🔍', style: TextStyle(fontSize: 48)),
                      const SizedBox(height: 12),
                      Text(l10n.searchForShopsLabel, style: const TextStyle(fontSize: 16)),
                    ],
                  ),
                )
              : Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(l10n.recentSearchesTitle, style: const TextStyle(fontWeight: FontWeight.w700)),
                          TextButton(
                            onPressed: () => setState(() => _recent = []),
                            child: Text(l10n.clearButtonLabel),
                          ),
                        ],
                      ),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _recent
                            .map((r) => ActionChip(
                                  label: Text(r),
                                  onPressed: () {
                                    _controller.text = r;
                                    _search(r);
                                  },
                                ))
                            .toList(),
                      ),
                    ],
                  ),
                )
          : _loading
              ? const Center(child: CircularProgressIndicator())
              : (_shopResults.isEmpty && _itemResults.isEmpty)
                  ? Center(child: Text(l10n.noItemsFound))
                  : ListView(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      children: [
                        if (_itemResults.isNotEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                            child: Text(
                              'Products (${_itemResults.length})',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: kNeutral500, letterSpacing: 0.5),
                            ),
                          ),
                          ..._itemResults.map((item) {
                            final shopName = _shopNames[item.id] ?? '';
                            final imageUrl = item.imageUrl;
                            final price = item.effectivePrice;

                            return ListTile(
                              leading: Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(10),
                                  color: kNeutral100,
                                ),
                                clipBehavior: Clip.antiAlias,
                                child: imageUrl != null && imageUrl.isNotEmpty
                                    ? AppCachedImage(imageUrl: imageUrl, fit: BoxFit.cover)
                                    : const Icon(Icons.inventory_2_outlined, color: kNeutral400),
                              ),
                              title: Text(
                                item.getLocalizedName(LanguageService.instance.locale.languageCode),
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                              ),
                              subtitle: shopName.isNotEmpty
                                  ? Row(
                                      children: [
                                        const Icon(Icons.storefront, size: 13, color: kNeutral400),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(shopName, style: const TextStyle(fontSize: 12, color: kNeutral500), overflow: TextOverflow.ellipsis),
                                        ),
                                      ],
                                    )
                                  : null,
                              trailing: price > 0
                                  ? Text('₹${price.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: kBrand700))
                                  : const Icon(Icons.chevron_right, color: kNeutral400),
                              onTap: () {
                                _saveRecent(q);
                                if (item.shopId.isNotEmpty) {
                                  context.push('/home/shop/${item.shopId}');
                                } else {
                                  context.push('/home/item/${item.id}');
                                }
                              },
                            );
                          }),
                          const Divider(height: 24),
                        ],
                        if (_shopResults.isNotEmpty) ...[
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                            child: Text(
                              'Shops (${_shopResults.length})',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: kNeutral500, letterSpacing: 0.5),
                            ),
                          ),
                          ..._shopResults.map((shop) {
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: kBrand100,
                                backgroundImage: shop.logoUrl != null && shop.logoUrl!.isNotEmpty
                                    ? NetworkImage(shop.logoUrl!)
                                    : null,
                                child: shop.logoUrl == null || shop.logoUrl!.isEmpty
                                    ? const Text('🏪')
                                    : null,
                              ),
                              title: Text(shop.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                              subtitle: Text(shop.type ?? l10n.generalStoreFallback),
                              trailing: const Icon(Icons.chevron_right, color: kNeutral400),
                              onTap: () {
                                _saveRecent(q);
                                context.push('/home/shop/${shop.id}');
                              },
                            );
                          }),
                        ],
                      ],
                    ),
    );
  }
}

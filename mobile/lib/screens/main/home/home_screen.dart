import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' hide Category;
import 'package:hugeicons/hugeicons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../models/models.dart';
import '../../../core/cart_service.dart';
import '../../../theme/theme_service.dart';
import '../../../core/language_service.dart';
import '../../../core/location_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../../widgets/tutorial/tutorial_manager.dart';
import '../../../widgets/tutorial/tutorial_step.dart';
import '../../../widgets/product_card.dart';
import '../../../widgets/loyalty_tracker_widget.dart';
import 'package:intl/intl.dart';

// ── Colors ────────────────────────────────────────────────────────────────────
Color get _kBg => ThemeService.instance.isDarkMode ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA);
const _kGreen = Color(0xFF4CD964);
const _kGreenDark = Color(0xFF32B84A);
Color get _kText => ThemeService.instance.isDarkMode ? Colors.white : const Color(0xFF1A1A1A);
Color get _kSub => ThemeService.instance.isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF555555);
Color get _kSubLighter => ThemeService.instance.isDarkMode ? const Color(0xFF64748B) : const Color(0xFF888888);
Color get _kCardBg => ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : Colors.white;
Color get _kBorder => ThemeService.instance.isDarkMode ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
Color get _kInputBg => ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFF0F2F5);


String _initials(String name) {
  final parts = name.trim().split(' ');
  if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  return name.substring(0, name.length.clamp(0, 2)).toUpperCase();
}

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

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _loading = true;
  String _userName = 'Guest';
  
  String? _userRole;
  
  List<Shop> _shops = [];
  Map<String, List<Item>> _allItems = {};
  List<Category> _categories = [];
  List<Unit> _units = [];
  
  String? _selectedShopId;
  String _shopSearch = '';
  String _itemSearch = '';
  String? _selectedCategory;
  
  List<Item> _itemSearchResults = [];
  bool _searchingItems = false;
  Timer? _itemSearchDebounce;
  
  final Set<String> _likedItems = {};
  Set<String> _pinnedShopIds = {};
  final Map<String, String> _selectedVariantIds = {};
  final Map<String, double> _localQtys = {};
  final Map<String, TextEditingController> _qtyControllers = {};

  final GlobalKey _locationKey = GlobalKey();
  final GlobalKey _searchKey = GlobalKey();
  final GlobalKey _shopCardKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _loadData();
    LocationService.instance.addListener(_onLocationChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startHomeTutorial();
    });
  }

  void _startHomeTutorial() {
    TutorialManager.instance.start(
      context,
      'home_tutorial',
      [
        TutorialStep(
          targetKey: _locationKey,
          title: (l10n) => l10n.tutorialHomeLocationTitle,
          description: (l10n) => l10n.tutorialHomeLocationDesc,
          arrowPosition: TutorialArrowPosition.top,
        ),
        TutorialStep(
          targetKey: _searchKey,
          title: (l10n) => l10n.tutorialHomeSearchTitle,
          description: (l10n) => l10n.tutorialHomeSearchDesc,
          arrowPosition: TutorialArrowPosition.top,
        ),
        TutorialStep(
          targetKey: _shopCardKey,
          title: (l10n) => l10n.tutorialHomeShopCardTitle,
          description: (l10n) => l10n.tutorialHomeShopCardDesc,
          arrowPosition: TutorialArrowPosition.bottom,
        ),
      ],
    );
  }

  @override
  void dispose() {
    _itemSearchDebounce?.cancel();
    LocationService.instance.removeListener(_onLocationChanged);
    for (var controller in _qtyControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _onItemSearchChanged(String query) {
    setState(() {
      _itemSearch = query;
    });

    if (_itemSearchDebounce?.isActive ?? false) _itemSearchDebounce!.cancel();

    if (query.trim().isEmpty) {
      setState(() {
        _itemSearchResults = [];
        _searchingItems = false;
      });
      return;
    }

    _itemSearchDebounce = Timer(const Duration(milliseconds: 300), () async {
      setState(() => _searchingItems = true);
      
      final lang = LanguageService.instance.locale.languageCode;
      String base = 'http://localhost:3000';
      if (kIsWeb) {
        final uri = Uri.parse(Uri.base.toString());
        base = '${uri.scheme}://${uri.host}:3000';
      } else {
        if (defaultTargetPlatform == TargetPlatform.android) {
          base = 'http://10.0.2.2:3000';
        } else {
          base = 'http://localhost:3000';
        }
      }
      var urlStr = '$base/api/search?q=${Uri.encodeComponent(query.trim())}&lang=$lang';
      if (_selectedShopId != null) {
        urlStr += '&shopId=$_selectedShopId';
      }
      
      try {
        final response = await http.get(Uri.parse(urlStr));
        if (response.statusCode == 200) {
          final List<dynamic> data = jsonDecode(response.body);
          if (mounted) {
            setState(() {
              _itemSearchResults = data.map((json) => Item.fromJson(Map<String, dynamic>.from(json))).toList();
              _searchingItems = false;
            });
          }
        } else {
          if (mounted) setState(() => _searchingItems = false);
        }
      } catch (e) {
        print('Search error: $e');
        if (mounted) setState(() => _searchingItems = false);
      }
    });
  }

  void _onLocationChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _loadData() async {
    final user = supabase.auth.currentUser;
    if (user != null) {
      _userName = user.userMetadata?['name'] ?? 'Yona';
      try {
        final profile = await supabase.from('users').select('role').eq('id', user.id).single();
        _userRole = profile['role'] as String?;
      } catch (e) {
        _userRole = user.userMetadata?['role'] as String?;
      }
    }

    try {
      final res = await Future.wait([
        supabase.from('shops').select('id, name, type, location_id').order('name'),
        supabase.from('items').select('*, item_translations(*), item_sell_config(*), item_variants:vw_item_variants_with_fallback(*, variant_translations(*)), item_images(*)').eq('is_active', true).isFilter('deleted_at', null).order('name'),
        supabase.from('categories').select('id, name, category_translations(*)').eq('is_active', true).order('name'),
        supabase.from('units').select('*'),
      ]);

      final shops = (res[0] as List).map((j) => Shop.fromJson(j)).toList();
      final itemsList = (res[1] as List).map((j) => Item.fromJson(j)).toList();
      final cats = (res[2] as List).map((j) => Category.fromJson(j)).toList();
      final unitsList = (res[3] as List).map((j) => Unit.fromJson(j)).toList();

      List<String> pinnedShopIds = [];
      List<String> favoriteItemIds = [];
      if (user != null) {
        try {
          final pinnedRes = await supabase.from('customer_pinned_shops').select('shop_id').eq('user_id', user.id);
          pinnedShopIds = (pinnedRes as List).map((p) => p['shop_id'] as String).toList();
        } catch (e) {
          debugPrint('Error loading pinned shop IDs: $e');
        }

        try {
          final favsRes = await supabase.from('customer_favorite_items').select('item_id').eq('user_id', user.id);
          favoriteItemIds = (favsRes as List).map((f) => f['item_id'] as String).toList();
        } catch (e) {
          debugPrint('Error loading favorite item IDs: $e');
        }
      }

      final activeCategoryIds = cats.map((c) => c.id).toSet();
      final filteredItemsList = itemsList.where((item) =>
        item.categoryId == null || activeCategoryIds.contains(item.categoryId)
      ).toList();

      Map<String, List<Item>> itemsMap = {};
      for (var item in filteredItemsList) {
        itemsMap[item.shopId] = (itemsMap[item.shopId] ?? [])..add(item);
      }

      for (var item in filteredItemsList) {
        if (item.itemVariants.isNotEmpty) {
          final defaultVariant = item.itemVariants.firstWhere(
            (v) => v.isDefault,
            orElse: () => item.itemVariants.first,
          );
          _selectedVariantIds[item.id] = defaultVariant.id;
        }
        
        final config = item.itemSellConfig.isNotEmpty ? item.itemSellConfig.first : null;
        if (config?.sellMode == SellMode.manual) {
          _localQtys[item.id] = 1.0;
          _qtyControllers[item.id] = TextEditingController(text: '1.0');
        } else {
          _localQtys[item.id] = 1.0;
        }
      }

      if (mounted) {
        setState(() {
          _shops = shops;
          _allItems = itemsMap;
          _categories = cats;
          _units = unitsList;
          _pinnedShopIds = Set<String>.from(pinnedShopIds);
          _likedItems.clear();
          _likedItems.addAll(favoriteItemIds);
        });
      }
    } catch (e) {
      debugPrint('Error loading home data: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.failedToLoadHomeData(e.toString()))),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _toggleLike(String id) async {
    final user = supabase.auth.currentUser;
    if (user == null) return;

    final isLiked = _likedItems.contains(id);
    
    String itemName = 'Product';
    _allItems.forEach((shopId, items) {
      final found = items.firstWhere(
        (i) => i.id == id,
        orElse: () => const Item(id: '', shopId: '', name: '', hasVariants: false, isActive: false),
      );
      if (found.id.isNotEmpty) {
        itemName = found.name;
      }
    });

    setState(() {
      if (isLiked) {
        _likedItems.remove(id);
      } else {
        _likedItems.add(id);
      }
    });

    try {
      if (isLiked) {
        await supabase.from('customer_favorite_items').delete().eq('user_id', user.id).eq('item_id', id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(AppLocalizations.of(context)!.removedFromFavoritesMessage(itemName))),
          );
        }
      } else {
        await supabase.from('customer_favorite_items').insert({'user_id': user.id, 'item_id': id});
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(AppLocalizations.of(context)!.addedToFavoritesMessage(itemName))),
          );
        }
      }
    } catch (e) {
      debugPrint('Error toggling favorite: $e');
      setState(() {
        if (isLiked) {
          _likedItems.add(id);
        } else {
          _likedItems.remove(id);
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.failedToUpdateFavoriteStatus)),
        );
      }
    }
  }

  Future<void> _togglePinShop(String shopId, String shopName) async {
    final user = supabase.auth.currentUser;
    if (user == null) return;

    final isPinned = _pinnedShopIds.contains(shopId);

    if (!isPinned && _pinnedShopIds.length >= 3) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.pinLimitReached)),
        );
      }
      return;
    }

    setState(() {
      if (isPinned) {
        _pinnedShopIds.remove(shopId);
      } else {
        _pinnedShopIds.add(shopId);
      }
    });

    try {
      if (isPinned) {
        await supabase.from('customer_pinned_shops').delete().eq('user_id', user.id).eq('shop_id', shopId);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(AppLocalizations.of(context)!.unpinnedSuccessfully(shopName))),
          );
        }
      } else {
        await supabase.from('customer_pinned_shops').insert({'user_id': user.id, 'shop_id': shopId});
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(AppLocalizations.of(context)!.pinnedSuccessfully(shopName))),
          );
        }
      }
    } catch (e) {
      debugPrint('Error toggling shop pin: $e');
      setState(() {
        if (isPinned) {
          _pinnedShopIds.add(shopId);
        } else {
          _pinnedShopIds.remove(shopId);
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.failedToUpdatePinStatus)),
        );
      }
    }
  }

  String _formatQty(double qty) {
    if (qty % 1 == 0) {
      return qty.toInt().toString();
    } else {
      return qty.toStringAsFixed(1);
    }
  }

  CartItem? _findCartItem(Item item, ItemVariant variant) {
    final config = item.itemSellConfig.isNotEmpty ? item.itemSellConfig.first : null;
    final isManualOrDynamic = config?.sellMode == SellMode.manual || config?.sellMode == SellMode.dynamic;
    
    for (var cartItem in CartService.instance.items) {
      if (cartItem.item.id == item.id) {
        if (isManualOrDynamic) {
          return cartItem;
        } else {
          if (cartItem.variant.id == variant.id) {
            return cartItem;
          }
        }
      }
    }
    return null;
  }

  Widget _buildItemCard(Item item) {
    final l10n = AppLocalizations.of(context)!;
    final isLiked = _likedItems.contains(item.id);
    
    final config = item.itemSellConfig.isNotEmpty ? item.itemSellConfig.first : null;
    final selectedVariantId = _selectedVariantIds[item.id];
    final selectedVariant = item.itemVariants.firstWhere(
      (v) => v.id == selectedVariantId,
      orElse: () => item.itemVariants.isNotEmpty ? item.itemVariants.first : const ItemVariant(id: '', itemId: '', variantType: VariantType.manual, label: '', isDefault: false, isActive: true),
    );
    
    final activeImageUrl = (selectedVariant.id.isNotEmpty && selectedVariant.imageUrl != null && selectedVariant.imageUrl!.trim().isNotEmpty)
        ? selectedVariant.imageUrl!.trim()
        : (item.imageUrl != null && item.imageUrl!.trim().isNotEmpty)
            ? item.imageUrl!.trim()
            : null;
    
    final cartItem = _findCartItem(item, selectedVariant);
    
    double price;
    String priceUnit = '';
    if (config?.sellMode == SellMode.manual) {
      final qty = cartItem?.quantity ?? _localQtys[item.id] ?? 1.0;
      price = (config?.pricePerBaseUnit ?? 0.0) * qty;
      final unitSymbol = _units.firstWhere((u) => u.id == config?.baseUnitId, orElse: () => const Unit(id: '', name: '', symbol: 'kg', unitGroupId: '', baseMultiplier: 1.0)).symbol;
      priceUnit = ' / $unitSymbol';
    } else if (config?.sellMode == SellMode.dynamic) {
      price = (config?.pricePerBaseUnit ?? 0.0) * (selectedVariant.value ?? 1.0);
    } else {
      price = selectedVariant.price ?? 0.0;
    }

    // Synchronize TextEditingController value with current quantity
    final controller = _qtyControllers[item.id];
    if (controller != null) {
      final currentQty = cartItem?.quantity ?? _localQtys[item.id] ?? 1.0;
      final formatted = _formatQty(currentQty);
      final parsed = double.tryParse(controller.text);
      if (parsed != currentQty && controller.text != formatted) {
        controller.text = formatted;
      }
    }

    return Container(
      decoration: BoxDecoration(
        color: _kCardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: _kBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 24,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: Stack(
        children: [
          GestureDetector(
            onTap: () => context.push('/home/shop/${item.shopId}'),
            behavior: HitTestBehavior.opaque,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 52),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    height: 100,
                    child: Center(
                      child: activeImageUrl != null
                          ? Image.network(activeImageUrl, fit: BoxFit.contain)
                          : Text(
                              _getCatIcon(
                                _categories.firstWhere(
                                  (c) => c.id == item.categoryId,
                                  orElse: () => const Category(id: '', name: ''),
                                ).name,
                              ),
                              style: const TextStyle(fontSize: 48),
                            ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          item.getLocalizedName(LanguageService.instance.locale.languageCode),
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: _kText),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('₹${price.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: _kGreen)),
                          if (priceUnit.isNotEmpty)
                            Text(priceUnit, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: _kSub)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Conditional Selector
                  if (config?.sellMode == SellMode.manual)
                    const SizedBox(height: 28)
                  else if ((config?.sellMode == SellMode.dynamic ||
                          config?.sellMode == SellMode.portion ||
                          ((config == null || config.sellMode == SellMode.packed) && item.itemVariants.length > 1)) &&
                      item.itemVariants.isNotEmpty)
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: item.itemVariants.map((v) {
                        final isActive = v.id == selectedVariantId;
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedVariantIds[item.id] = v.id;
                            });
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isActive ? _kGreen : _kBorder,
                                width: isActive ? 1.5 : 1,
                              ),
                              color: isActive ? const Color(0xFFE8F9EC) : _kCardBg,
                            ),
                            child: Text(
                              v.getLocalizedLabel(LanguageService.instance.locale.languageCode),
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: isActive ? _kGreenDark : (ThemeService.instance.isDarkMode ? const Color(0xFF94A3B8) : const Color(0xFF4B5563)),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    )
                  else
                    const SizedBox(height: 28), // Spacer for packed mode to keep layout aligned
                ],
              ),
            ),
          ),
          // Heart
          Positioned(
            top: 14,
            right: 14,
            child: GestureDetector(
              onTap: () => _toggleLike(item.id),
              child: Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: _kCardBg,
                  shape: BoxShape.circle,
                  border: Border.all(color: _kBorder),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 12,
                    )
                  ],
                ),
                child: Icon(isLiked ? Icons.favorite : Icons.favorite_border, color: isLiked ? Colors.redAccent : Colors.grey, size: 14),
              ),
            ),
          ),
          // Bottom Action (Counter / Add button)
          Positioned(
            bottom: 8,
            right: 8,
            left: 8,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (config?.sellMode == SellMode.manual) ...[
                   if (cartItem != null)
                     Expanded(
                       child: Row(
                         children: [
                           Expanded(
                             child: Container(
                               height: 32,
                               padding: const EdgeInsets.symmetric(horizontal: 8),
                               decoration: BoxDecoration(
                                 color: _kGreen.withValues(alpha: 0.1),
                                 borderRadius: BorderRadius.circular(16),
                               ),
                               child: Row(
                                 children: [
                                   Expanded(
                                     child: TextField(
                                       controller: _qtyControllers[item.id],
                                       keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                       style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _kGreenDark),
                                       decoration: const InputDecoration(
                                         contentPadding: EdgeInsets.zero,
                                         isDense: true,
                                         border: InputBorder.none,
                                       ),
                                       onChanged: (val) {
                                         final parsed = double.tryParse(val) ?? 0.0;
                                         if (parsed > 0) {
                                           CartService.instance.updateQuantity(cartItem.variant.id, parsed);
                                           _localQtys[item.id] = parsed;
                                         }
                                       },
                                     ),
                                   ),
                                   const SizedBox(width: 4),
                                   Text(
                                     _units.firstWhere((u) => u.id == config?.baseUnitId, orElse: () => const Unit(id: '', name: '', symbol: 'kg', unitGroupId: '', baseMultiplier: 1.0)).symbol,
                                     style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _kGreenDark),
                                   ),
                                 ],
                               ),
                             ),
                           ),
                           const SizedBox(width: 8),
                           GestureDetector(
                             onTap: () {
                               CartService.instance.removeItem(cartItem.variant.id);
                             },
                             child: Container(
                               width: 32,
                               height: 32,
                               decoration: BoxDecoration(
                                 color: Colors.red[50],
                                 borderRadius: BorderRadius.circular(16),
                               ),
                               child: const Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                             ),
                           ),
                         ],
                       ),
                     )
                   else
                     Expanded(
                       child: Row(
                         children: [
                           Expanded(
                             child: Container(
                               height: 32,
                               padding: const EdgeInsets.symmetric(horizontal: 8),
                               decoration: BoxDecoration(
                                 color: ThemeService.instance.isDarkMode ? const Color(0xFF27272A) : Colors.grey[100],
                                 borderRadius: BorderRadius.circular(16),
                               ),
                               child: Row(
                                 children: [
                                   Expanded(
                                     child: TextField(
                                       controller: _qtyControllers[item.id],
                                       keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                       style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _kText),
                                       decoration: const InputDecoration(
                                         contentPadding: EdgeInsets.zero,
                                         isDense: true,
                                         border: InputBorder.none,
                                       ),
                                       onChanged: (val) {
                                         final parsed = double.tryParse(val) ?? 0.0;
                                         if (parsed > 0) {
                                           setState(() {
                                             _localQtys[item.id] = parsed;
                                           });
                                         }
                                       },
                                     ),
                                   ),
                                   const SizedBox(width: 4),
                                   Text(
                                     _units.firstWhere((u) => u.id == config?.baseUnitId, orElse: () => const Unit(id: '', name: '', symbol: 'kg', unitGroupId: '', baseMultiplier: 1.0)).symbol,
                                     style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _kSub),
                                   ),
                                 ],
                               ),
                             ),
                           ),
                           const SizedBox(width: 8),
                           GestureDetector(
                              onTap: () async {
                                final currentQty = _localQtys[item.id] ?? 1.0;
                                final scName = item.getLocalizedName(LanguageService.instance.locale.languageCode);
                               ScaffoldMessenger.of(context).showSnackBar(
                                 SnackBar(
                                   content: Text(l10n.addingToCartMessage(scName)),
                                   duration: const Duration(milliseconds: 500),
                                 ),
                               );
                               CartService.instance.addItem(
                                 item,
                                 selectedVariant,
                                 quantity: currentQty,
                                 sellConfig: config,
                               );
                               if (context.mounted) {
                                 ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                 ScaffoldMessenger.of(context).showSnackBar(
                                   SnackBar(
                                     content: Text(l10n.addedToCartMessage(scName)),
                                     duration: const Duration(seconds: 1),
                                   ),
                                 );
                               }
                             },
                             child: Container(
                               height: 32,
                               padding: const EdgeInsets.symmetric(horizontal: 12),
                               decoration: BoxDecoration(
                                 color: _kGreen,
                                 borderRadius: BorderRadius.circular(16),
                               ),
                               child: Center(
                                 child: Text(
                                   l10n.addButtonLabel,
                                   style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                 ),
                               ),
                             ),
                           ),
                         ],
                       ),
                     ),
                 ] else ...[
                   if (cartItem != null)
                     Expanded(
                       child: Container(
                         height: 32,
                         padding: const EdgeInsets.symmetric(horizontal: 8),
                         decoration: BoxDecoration(
                           color: _kGreen.withValues(alpha: 0.1),
                           borderRadius: BorderRadius.circular(16),
                           border: Border.all(color: _kGreen.withValues(alpha: 0.3)),
                         ),
                         child: Row(
                           mainAxisAlignment: MainAxisAlignment.spaceBetween,
                           children: [
                             GestureDetector(
                               onTap: () {
                                 final newQty = cartItem.quantity - 1.0;
                                 if (newQty < 0.01) {
                                   CartService.instance.removeItem(cartItem.variant.id);
                                 } else {
                                   CartService.instance.updateQuantity(cartItem.variant.id, newQty);
                                 }
                               },
                               child: const Icon(Icons.remove, size: 16, color: _kGreenDark),
                             ),
                             Text(
                               _formatQty(cartItem.quantity),
                               style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: _kGreenDark),
                             ),
                             GestureDetector(
                               onTap: () {
                                 final newQty = cartItem.quantity + 1.0;
                                 CartService.instance.updateQuantity(cartItem.variant.id, newQty);
                               },
                               child: const Icon(Icons.add, size: 16, color: _kGreenDark),
                                 ),
                           ],
                         ),
                       ),
                     )
                   else ...[
                     Expanded(
                       child: Container(
                         height: 32,
                         padding: const EdgeInsets.symmetric(horizontal: 4),
                         decoration: BoxDecoration(
                           color: ThemeService.instance.isDarkMode ? const Color(0xFF27272A) : Colors.grey[100],
                           borderRadius: BorderRadius.circular(16),
                         ),
                         child: Row(
                           mainAxisAlignment: MainAxisAlignment.spaceBetween,
                           children: [
                             GestureDetector(
                               onTap: () {
                                 final currentQty = _localQtys[item.id] ?? 1.0;
                                 final newQty = (currentQty - 1.0).clamp(1.0, 999.0);
                                 setState(() {
                                   _localQtys[item.id] = newQty;
                                 });
                               },
                               child: Icon(Icons.remove, size: 14, color: _kSub),
                             ),
                             Text(
                               _formatQty(_localQtys[item.id] ?? 1.0),
                               style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _kText),
                             ),
                             GestureDetector(
                               onTap: () {
                                 final currentQty = _localQtys[item.id] ?? 1.0;
                                 final newQty = currentQty + 1.0;
                                 setState(() {
                                   _localQtys[item.id] = newQty;
                                 });
                               },
                               child: Icon(Icons.add, size: 14, color: _kSub),
                             ),
                           ],
                         ),
                       ),
                     ),
                     const SizedBox(width: 8),
                     GestureDetector(
                        onTap: () async {
                          final currentQty = _localQtys[item.id] ?? 1.0;
                          final scName = item.getLocalizedName(LanguageService.instance.locale.languageCode);
                         ScaffoldMessenger.of(context).showSnackBar(
                           SnackBar(
                             content: Text(l10n.addingToCartMessage(scName)),
                             duration: const Duration(milliseconds: 500),
                           ),
                         );
                         CartService.instance.addItem(
                           item,
                           selectedVariant,
                           quantity: currentQty,
                           sellConfig: config,
                         );
                         if (context.mounted) {
                           ScaffoldMessenger.of(context).hideCurrentSnackBar();
                           ScaffoldMessenger.of(context).showSnackBar(
                             SnackBar(
                               content: Text(l10n.addedToCartMessage(scName)),
                               duration: const Duration(seconds: 1),
                             ),
                           );
                         }
                       },
                       child: Container(
                         height: 32,
                         padding: const EdgeInsets.symmetric(horizontal: 12),
                         decoration: BoxDecoration(
                           color: _kGreen,
                           borderRadius: BorderRadius.circular(16),
                         ),
                         child: Center(
                           child: Text(
                             l10n.addButtonLabel,
                             style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                           ),
                         ),
                       ),
                     ),
                   ],
                 ],
               ],
             ),
           ),
         ],
       ),
     );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: _kBg,
      body: SafeArea(
        child: _loading 
            ? const Center(child: CircularProgressIndicator(color: _kGreenDark))
            : _selectedShopId == null
                ? _buildLeftPanel(l10n)
                : _buildRightPanel(l10n),
      ),
    );
  }

  Widget _buildLeftPanel(AppLocalizations l10n) {
    final selectedLocId = LocationService.instance.selectedLocationId;
    final filteredShops = _shops.where((s) {
      final matchesSearch = s.name.toLowerCase().contains(_shopSearch.toLowerCase());
      final matchesLocation = selectedLocId == null || s.locationId == selectedLocId;
      return matchesSearch && matchesLocation;
    }).toList();
    filteredShops.sort((a, b) {
      final aPinned = _pinnedShopIds.contains(a.id) ? 1 : 0;
      final bPinned = _pinnedShopIds.contains(b.id) ? 1 : 0;
      return bPinned.compareTo(aPinned);
    });

    return Column(
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: () => context.push('/profile/location'),
                child: Container(
                  key: _locationKey,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: _kCardBg,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2))],
                    border: Border.all(color: _kBorder),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.location_on, color: _kGreenDark, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        LocationService.instance.selectedLocationName ?? 'All Locations',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: _kText),
                      ),
                      const SizedBox(width: 4),
                      HugeIcon(icon: HugeIcons.strokeRoundedArrowDown01, size: 16, color: _kText),
                    ],
                  ),
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_userRole == 'shop_owner' || _userRole == 'admin') ...[
                    GestureDetector(
                      onTap: () => context.push('/vendor/dashboard'),
                      child: Container(
                        width: 36,
                        height: 36,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: ThemeService.instance.isDarkMode ? const Color(0x1F60A5FA) : const Color(0x152563EB),
                          shape: BoxShape.circle,
                          border: Border.all(color: ThemeService.instance.isDarkMode ? const Color(0x3D60A5FA) : const Color(0x3D2563EB)),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 4, offset: const Offset(0, 1.5))],
                        ),
                        child: HugeIcon(
                          icon: HugeIcons.strokeRoundedStore01,
                          color: ThemeService.instance.isDarkMode ? const Color(0xFF60A5FA) : const Color(0xFF2563EB),
                          size: 16,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  if (_userRole == 'admin') ...[
                    GestureDetector(
                      onTap: () => context.push('/admin/dashboard'),
                      child: Container(
                        width: 36,
                        height: 36,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: ThemeService.instance.isDarkMode ? const Color(0x1F818CF8) : const Color(0x154F46E5),
                          shape: BoxShape.circle,
                          border: Border.all(color: ThemeService.instance.isDarkMode ? const Color(0x3D818CF8) : const Color(0x3D4F46E5)),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 4, offset: const Offset(0, 1.5))],
                        ),
                        child: HugeIcon(
                          icon: HugeIcons.strokeRoundedSecurityCheck,
                          color: ThemeService.instance.isDarkMode ? const Color(0xFF818CF8) : const Color(0xFF4F46E5),
                          size: 16,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  GestureDetector(
                    onTap: () => context.push('/profile/recent-purchases'),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: _kCardBg,
                        shape: BoxShape.circle,
                        border: Border.all(color: _kBorder),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 4, offset: const Offset(0, 1.5))],
                      ),
                      alignment: Alignment.center,
                      child: HugeIcon(icon: HugeIcons.strokeRoundedClock01, color: _kSub, size: 16),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => context.push('/notifications'),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: _kCardBg,
                        shape: BoxShape.circle,
                        border: Border.all(color: _kBorder),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 4, offset: const Offset(0, 1.5))],
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          HugeIcon(icon: HugeIcons.strokeRoundedNotification01, color: _kSub, size: 16),
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: Colors.redAccent,
                                shape: BoxShape.circle,
                                border: Border.all(color: ThemeService.instance.isDarkMode ? _kCardBg : Colors.white, width: 2),
                              ),
                            ),
                          )
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),

        // Scrollable content
        Expanded(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Greeting
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                '${l10n.heyGreeting} ${_userName == 'Guest' ? l10n.guestUser : _userName}',
                                style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: _kText, letterSpacing: -0.5),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text('👋', style: TextStyle(fontSize: 24)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(l10n.findGroceriesSubtitle, style: TextStyle(fontSize: 15, color: _kSubLighter, fontWeight: FontWeight.w500)),

                      ],
                    ),
                  ),
                ),

                // 5-STAR REWARDS CLUB TRACKER & SCRATCH CARD WIDGET
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 24),
                  child: LoyaltyTrackerWidget(),
                ),

                // Search Shops
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          key: _searchKey,
                          height: 54,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(color: _kInputBg, borderRadius: BorderRadius.circular(18), border: Border.all(color: _kBorder)),
                          child: Row(
                            children: [
                              Icon(Icons.search, color: _kSubLighter),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextField(
                                  onChanged: (v) => setState(() => _shopSearch = v),
                                  style: TextStyle(color: _kText, fontWeight: FontWeight.w500),
                                  decoration: InputDecoration(hintText: l10n.searchShopsPlaceholder, hintStyle: TextStyle(color: _kSubLighter, fontWeight: FontWeight.w500), border: InputBorder.none),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        width: 54,
                        height: 54,
                        decoration: BoxDecoration(
                          color: _kGreen,
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [BoxShadow(color: _kGreen.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))],
                        ),
                        child: const Icon(Icons.tune, color: Colors.white),
                      )
                    ],
                  ),
                ),


                filteredShops.isEmpty
                ? Padding(
                    padding: const EdgeInsets.symmetric(vertical: 40),
                    child: Center(child: Text(l10n.noShopsFound, style: TextStyle(color: _kSubLighter))),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(24, 10, 24, 24),
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filteredShops.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final shop = filteredShops[index];
                      
                      final bgColors = ThemeService.instance.isDarkMode 
                          ? [const Color(0xFF1E293B), const Color(0xFF27272A)] 
                          : [const Color(0xFFFCEDEF), const Color(0xFFF4E9F9)];
                      final bg = bgColors[index % bgColors.length];
                      final shopItemsCount = _allItems[shop.id]?.length ?? 0;
                      final shopType = (shop.type ?? '').toLowerCase();
                      final subtitle = shopType == 'general'
                          ? l10n.greatDeals
                          : shopType == 'organic'
                              ? l10n.bestOrganic
                              : shopType.isNotEmpty
                                  ? shopType[0].toUpperCase() + shopType.substring(1)
                                  : '';

                      final isNarrow = MediaQuery.of(context).size.width < 380;

                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedShopId = shop.id;
                            _selectedCategory = null;
                          });
                        },
                        child: Container(
                          key: index == 0 ? _shopCardKey : null,
                          padding: EdgeInsets.all(isNarrow ? 14 : 18),
                          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(24), border: Border.all(color: _kBorder)),
                          child: Row(
                            children: [
                              Container(
                                width: isNarrow ? 56 : 72,
                                height: isNarrow ? 56 : 72,
                                decoration: BoxDecoration(
                                  color: _kCardBg,
                                  shape: BoxShape.circle,
                                  border: Border.all(color: _kBorder),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.08),
                                      blurRadius: 10,
                                      offset: const Offset(0, 4),
                                    )
                                  ],
                                ),
                                child: shop.logoUrl != null
                                    ? ClipOval(child: Image.network(shop.logoUrl!, fit: BoxFit.cover))
                                    : Center(child: Text(_initials(shop.name), style: TextStyle(fontSize: isNarrow ? 18 : 22, fontWeight: FontWeight.bold, color: Colors.grey))),
                              ),
                              SizedBox(width: isNarrow ? 12 : 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            shop.name,
                                            style: TextStyle(
                                              fontSize: isNarrow ? 15 : 17,
                                              fontWeight: FontWeight.w800,
                                              color: _kText,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        IconButton(
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                          icon: Icon(
                                            _pinnedShopIds.contains(shop.id) ? Icons.bookmark : Icons.bookmark_outline,
                                            color: _pinnedShopIds.contains(shop.id) ? const Color(0xFFEC4899) : Colors.grey,
                                            size: 20,
                                          ),
                                          onPressed: () => _togglePinShop(shop.id, shop.name),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      '$shopItemsCount ${l10n.productsLabel}',
                                      style: TextStyle(fontSize: isNarrow ? 12 : 13, color: _kSub, fontWeight: FontWeight.w500),
                                    ),
                                    if (subtitle.isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Text(
                                        subtitle,
                                        style: TextStyle(fontSize: isNarrow ? 11 : 12, color: ThemeService.instance.isDarkMode ? const Color(0xFF94A3B8) : Colors.grey[700], fontWeight: FontWeight.w500),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ],
                                ),
                              )
                            ],
                          ),
                        ),
                      );

                    },
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRightPanel(AppLocalizations l10n) {
    final shop = _shops.firstWhere((s) => s.id == _selectedShopId, orElse: () => _shops.first);
    final shopItemsCount = _allItems[shop.id]?.length ?? 0;
    
    final shopItems = _allItems[shop.id] ?? [];
    final activeCategoryIds = shopItems.map((item) => item.categoryId).toSet();
    final shopCategories = _categories.where((cat) => activeCategoryIds.contains(cat.id)).toList();

    List<Item> itemsToShow;
    if (_itemSearch.isNotEmpty) {
      final queryLower = _itemSearch.toLowerCase().trim();
      itemsToShow = shopItems.where((item) {
        // 1. Base name & description match
        if (item.name.toLowerCase().contains(queryLower)) return true;
        if (item.description?.toLowerCase().contains(queryLower) ?? false) return true;

        // 2. Localized translations match (name, description, keywords)
        if (item.itemTranslations != null) {
          for (var t in item.itemTranslations!) {
            final tName = t['name']?.toString().toLowerCase() ?? '';
            final tDesc = t['description']?.toString().toLowerCase() ?? '';
            if (tName.contains(queryLower)) return true;
            if (tDesc.contains(queryLower)) return true;
          }
        }
        return false;
      }).toList();

      if (_selectedCategory != null) {
        itemsToShow = itemsToShow.where((i) => i.categoryId == _selectedCategory).toList();
      }
    } else {
      itemsToShow = List.from(shopItems);
      if (_selectedCategory != null) {
        itemsToShow = itemsToShow.where((i) => i.categoryId == _selectedCategory).toList();
      }
    }

    return Column(
      children: [
        // Top Shop Header
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 20),
          child: Row(
            children: [
              GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedShopId = null;
                    _selectedCategory = null;
                  });
                },
                child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(color: _kCardBg, borderRadius: BorderRadius.circular(12), border: Border.all(color: _kBorder), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))]),
                  child: Icon(Icons.arrow_back, color: _kText),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                    color: ThemeService.instance.isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFFCEDEF),
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: _kBorder),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 60, height: 60,
                        decoration: BoxDecoration(color: _kCardBg, shape: BoxShape.circle, border: Border.all(color: _kBorder), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 12, offset: const Offset(0, 6))]),
                        child: shop.logoUrl != null
                            ? ClipOval(child: Image.network(shop.logoUrl!, fit: BoxFit.cover))
                            : Center(child: Text(_initials(shop.name), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey))),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(shop.name, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: _kText)),
                            const SizedBox(height: 4),
                            Text(l10n.productsCount(shopItemsCount), style: TextStyle(fontSize: 13, color: _kSub, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                      if (_shops.isNotEmpty && shop.id != 'dummy1' && shop.id != 'dummy2')
                        IconButton(
                          icon: const Icon(Icons.rate_review_outlined),
                          color: _kGreenDark,
                          tooltip: l10n.shopReviewsTooltip,
                          onPressed: () {
                            context.push('/home/shop/${shop.id}?tab=reviews');
                          },
                        ),
                    ],
                  ),
                ),
              )
            ],
          ),
        ),

        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Item Search
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                  child: Container(
                    height: 50,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(color: _kInputBg, borderRadius: BorderRadius.circular(18), border: Border.all(color: _kBorder)),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            onChanged: _onItemSearchChanged,
                            style: TextStyle(color: _kText, fontWeight: FontWeight.w500),
                            decoration: InputDecoration(hintText: l10n.searchItemsPlaceholder, hintStyle: TextStyle(color: _kSubLighter, fontWeight: FontWeight.w500), border: InputBorder.none),
                          ),
                        ),
                        Icon(Icons.search, color: _kGreen),
                      ],
                    ),
                  ),
                ),

                // Categories
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(l10n.categoriesTitle, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: _kText, letterSpacing: -0.5)),
                      if (_selectedCategory != null)
                        GestureDetector(
                          onTap: () => setState(() => _selectedCategory = null),
                          child: Text(l10n.clearLabel, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.redAccent)),
                        )
                      else
                        Text(
                          DateFormat.MMMd(Localizations.localeOf(context).toString()).format(DateTime.now()).toUpperCase(),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.grey),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 100,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    scrollDirection: Axis.horizontal,
                    itemCount: shopCategories.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 16),
                    itemBuilder: (context, index) {
                      final cat = shopCategories[index];
                      final bgColors = ThemeService.instance.isDarkMode
                          ? [const Color(0xFF27272A), const Color(0xFF1E293B)]
                          : [const Color(0xFFF4F5F7), const Color(0xFFFDF6F0), const Color(0xFFFDF5EB), const Color(0xFFFCEEF0)];
                      final isSelected = _selectedCategory == cat.id;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedCategory = isSelected ? null : cat.id),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          transform: Matrix4.diagonal3Values(isSelected ? 1.05 : 1.0, isSelected ? 1.05 : 1.0, 1.0),
                          child: Column(
                            children: [
                              Container(
                                width: 64, height: 64,
                                decoration: BoxDecoration(
                                  color: isSelected ? const Color(0xFFE8F9EC) : bgColors[index % bgColors.length],
                                  borderRadius: BorderRadius.circular(22),
                                  border: Border.all(color: isSelected ? _kGreen : _kBorder, width: 2),
                                ),
                                child: Center(child: Text(_getCatIcon(cat.name), style: const TextStyle(fontSize: 28))),
                              ),
                              const SizedBox(height: 10),
                              Text(cat.name, style: TextStyle(fontSize: 13, fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600, color: isSelected ? _kText : _kSub)),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 24),

                // Items Grid
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(_selectedShopId != null ? l10n.shopItemsTitle : l10n.popularTitle, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: _kText, letterSpacing: -0.5)),
                ),
                const SizedBox(height: 16),
                
                if (_searchingItems)
                  const Padding(
                    padding: EdgeInsets.all(48),
                    child: Center(
                      child: CircularProgressIndicator(color: _kGreen),
                    ),
                  )
                else if (itemsToShow.isEmpty)
                  Padding(padding: const EdgeInsets.all(24), child: Center(child: Text(l10n.noItemsFound, style: TextStyle(color: _kSubLighter))))
                else
                  ListenableBuilder(
                    listenable: CartService.instance,
                    builder: (context, _) {
                      final leftItems = <Item>[];
                      final rightItems = <Item>[];
                      for (int i = 0; i < itemsToShow.length; i++) {
                        if (i % 2 == 0) {
                          leftItems.add(itemsToShow[i]);
                        } else {
                          rightItems.add(itemsToShow[i]);
                        }
                      }

                      return Padding(
                        padding: const EdgeInsets.fromLTRB(24, 0, 24, 100),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                children: leftItems.map((item) {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 16),
                                    child: ProductCard(
                                      item: item,
                                      isLiked: _likedItems.contains(item.id),
                                      onLikeToggle: () => _toggleLike(item.id),
                                      units: _units,
                                      categories: _categories,
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                children: rightItems.map((item) {
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 16),
                                    child: ProductCard(
                                      item: item,
                                      isLiked: _likedItems.contains(item.id),
                                      onLikeToggle: () => _toggleLike(item.id),
                                      units: _units,
                                      categories: _categories,
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/supabase_client.dart';
import '../../../models/models.dart';
import '../../../core/cart_service.dart';

// ── Colors ────────────────────────────────────────────────────────────────────
const _kBg = Color(0xFFFAFAFA);
const _kGreen = Color(0xFF4CD964);
const _kGreenDark = Color(0xFF32B84A);
const _kYellow = Color(0xFFFBCC5C);
const _kText = Color(0xFF1A1A1A);
const _kSub = Color(0xFF555555);
const _kSubLighter = Color(0xFF888888);

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
  String? _avatarUrl;
  
  String? _userRole;
  
  List<Shop> _shops = [];
  Map<String, List<Item>> _allItems = {};
  List<Category> _categories = [];
  List<Unit> _units = [];
  
  String? _selectedShopId;
  String _shopSearch = '';
  String _itemSearch = '';
  String? _selectedCategory;
  
  final Set<String> _likedItems = {};
  final Map<String, String> _selectedVariantIds = {};
  final Map<String, double> _localQtys = {};
  final Map<String, TextEditingController> _qtyControllers = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    for (var controller in _qtyControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _loadData() async {
    final user = supabase.auth.currentUser;
    if (user != null) {
      _userName = user.userMetadata?['name'] ?? 'Yona';
      _avatarUrl = user.userMetadata?['avatar_url'];
      try {
        final profile = await supabase.from('users').select('role').eq('id', user.id).single();
        _userRole = profile['role'] as String?;
      } catch (e) {
        _userRole = user.userMetadata?['role'] as String?;
      }
    }

    final res = await Future.wait([
      supabase.from('shops').select('id, name, type').order('name'),
      supabase.from('items').select('*, item_sell_config(*), item_variants:vw_item_variants_with_fallback(*), item_images(*)').eq('is_active', true).isFilter('deleted_at', null).order('name'),
      supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
      supabase.from('units').select('*'),
    ]);

    final shops = (res[0] as List).map((j) => Shop.fromJson(j)).toList();
    final itemsList = (res[1] as List).map((j) => Item.fromJson(j)).toList();
    final cats = (res[2] as List).map((j) => Category.fromJson(j)).toList();
    final unitsList = (res[3] as List).map((j) => Unit.fromJson(j)).toList();

    Map<String, List<Item>> itemsMap = {};
    for (var item in itemsList) {
      itemsMap[item.shopId] = (itemsMap[item.shopId] ?? [])..add(item);
    }

    for (var item in itemsList) {
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
        _loading = false;
      });
    }
  }

  void _toggleLike(String id) {
    setState(() {
      if (_likedItems.contains(id)) {
        _likedItems.remove(id);
      } else {
        _likedItems.add(id);
      }
    });
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
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
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
            onTap: () => context.push('/home/item/${item.id}'),
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
                          item.name,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: _kText),
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
                            Text(priceUnit, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.grey)),
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
                                color: isActive ? _kGreen : const Color(0xFFE2E8F0),
                                width: isActive ? 1.5 : 1,
                              ),
                              color: isActive ? const Color(0xFFE8F9EC) : Colors.white,
                            ),
                            child: Text(
                              v.label,
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: isActive ? _kGreenDark : const Color(0xFF4B5563),
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
                  color: Colors.white,
                  shape: BoxShape.circle,
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
                                       style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _kGreenDark),
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
                                 color: Colors.grey[100],
                                 borderRadius: BorderRadius.circular(16),
                               ),
                               child: Row(
                                 children: [
                                   Expanded(
                                     child: TextField(
                                       controller: _qtyControllers[item.id],
                                       keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                       style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _kText),
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
                                     style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _kSub),
                                   ),
                                 ],
                               ),
                             ),
                           ),
                           const SizedBox(width: 8),
                           GestureDetector(
                             onTap: () async {
                               final currentQty = _localQtys[item.id] ?? 1.0;
                               final scName = item.name;
                               ScaffoldMessenger.of(context).showSnackBar(
                                 SnackBar(
                                   content: Text('Adding $scName to cart...'),
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
                                     content: Text('$scName added to cart!'),
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
                               child: const Center(
                                 child: Text(
                                   'Add',
                                   style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
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
                           color: Colors.grey[100],
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
                               child: const Icon(Icons.remove, size: 14, color: _kSub),
                             ),
                             Text(
                               _formatQty(_localQtys[item.id] ?? 1.0),
                               style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: _kText),
                             ),
                             GestureDetector(
                               onTap: () {
                                 final currentQty = _localQtys[item.id] ?? 1.0;
                                 final newQty = currentQty + 1.0;
                                 setState(() {
                                   _localQtys[item.id] = newQty;
                                 });
                               },
                               child: const Icon(Icons.add, size: 14, color: _kSub),
                             ),
                           ],
                         ),
                       ),
                     ),
                     const SizedBox(width: 8),
                     GestureDetector(
                       onTap: () async {
                         final currentQty = _localQtys[item.id] ?? 1.0;
                         final scName = item.name;
                         ScaffoldMessenger.of(context).showSnackBar(
                           SnackBar(
                             content: Text('Adding $scName to cart...'),
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
                               content: Text('$scName added to cart!'),
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
                         child: const Center(
                           child: Text(
                             'Add',
                             style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
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
    return Scaffold(
      backgroundColor: _kBg,
      body: SafeArea(
        child: _loading 
            ? const Center(child: CircularProgressIndicator(color: _kGreenDark))
            : _selectedShopId == null
                ? _buildLeftPanel()
                : _buildRightPanel(),
      ),
    );
  }

  Widget _buildLeftPanel() {
    final filteredShops = _shops.where((s) => s.name.toLowerCase().contains(_shopSearch.toLowerCase())).toList();

    return Column(
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              GestureDetector(
                onTap: () => context.push('/profile'),
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.orange[200],
                    shape: BoxShape.circle,
                    image: _avatarUrl != null ? DecorationImage(image: NetworkImage(_avatarUrl!), fit: BoxFit.cover) : null,
                  ),
                  child: _avatarUrl == null 
                      ? Center(child: Text(_initials(_userName), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)))
                      : null,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2))],
                  border: Border.all(color: Colors.grey[200]!),
                ),
                child: const Row(
                  children: [
                    Text('Home', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    SizedBox(width: 4),
                    Icon(Icons.keyboard_arrow_down, size: 16),
                  ],
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_userRole == 'shop_owner') ...[
                    GestureDetector(
                      onTap: () => context.push('/vendor/dashboard'),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))],
                        ),
                        child: const Icon(Icons.storefront_outlined, color: _kSub),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  GestureDetector(
                    onTap: () => context.push('/notifications'),
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))],
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          const Icon(Icons.notifications_none, color: _kSub),
                          Positioned(
                            top: 12,
                            right: 12,
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
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
                            Text('Hey $_userName', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: _kText, letterSpacing: -0.5)),
                            const SizedBox(width: 8),
                            const Text('👋', style: TextStyle(fontSize: 24)),
                          ],
                        ),
                        const SizedBox(height: 6),
                        const Text('Find fresh groceries you want', style: TextStyle(fontSize: 15, color: _kSubLighter, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                ),

                // Search Shops
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 54,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(color: const Color(0xFFF0F2F5), borderRadius: BorderRadius.circular(18)),
                          child: Row(
                            children: [
                              const Icon(Icons.search, color: Colors.grey),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextField(
                                  onChanged: (v) => setState(() => _shopSearch = v),
                                  decoration: const InputDecoration(hintText: 'Search shops...', hintStyle: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500), border: InputBorder.none),
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

                // Shops List
                filteredShops.isEmpty 
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(child: Text('No shops found.', style: TextStyle(color: _kSubLighter))),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(24, 10, 24, 24),
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filteredShops.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final shop = filteredShops[index];
                      
                      final bgColors = [const Color(0xFFFCEDEF), const Color(0xFFF4E9F9)];
                      final bg = bgColors[index % bgColors.length];
                      final shopItemsCount = _allItems[shop.id]?.length ?? (index == 0 ? 122 : 75);
                      final subtitle = index == 0 ? 'Best organic fresh vegetables' : 'Great deals on fruit';

                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedShopId = shop.id;
                            _selectedCategory = null;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(24)),
                          child: Row(
                            children: [
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 12, offset: const Offset(0, 6))]),
                                child: shop.logoUrl != null
                                    ? ClipOval(child: Image.network(shop.logoUrl!, fit: BoxFit.cover))
                                    : Center(child: Text(_initials(shop.name), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.grey))),
                              ),
                              const SizedBox(width: 20),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(shop.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: _kText)),
                                    const SizedBox(height: 6),
                                    Text('$shopItemsCount products', style: const TextStyle(fontSize: 14, color: _kSub, fontWeight: FontWeight.w500)),
                                    const SizedBox(height: 8),
                                    Container(height: 1, color: Colors.black.withValues(alpha: 0.05)),
                                    const SizedBox(height: 8),
                                    Text(subtitle, style: TextStyle(fontSize: 13, color: Colors.grey[800], fontWeight: FontWeight.w500)),
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

  Widget _buildRightPanel() {
    final shop = _shops.firstWhere((s) => s.id == _selectedShopId, orElse: () => _shops.first);
    final shopItemsCount = _allItems[shop.id]?.length ?? 122;
    
    final shopItems = _allItems[shop.id] ?? [];
    final activeCategoryIds = shopItems.map((item) => item.categoryId).toSet();
    final shopCategories = _categories.where((cat) => activeCategoryIds.contains(cat.id)).toList();

    List<Item> itemsToShow = List.from(shopItems);
    if (_selectedCategory != null) {
      itemsToShow = itemsToShow.where((i) => i.categoryId == _selectedCategory).toList();
    }
    if (_itemSearch.isNotEmpty) {
      itemsToShow = itemsToShow.where((i) => i.name.toLowerCase().contains(_itemSearch.toLowerCase())).toList();
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
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 2))]),
                  child: const Icon(Icons.arrow_back, color: _kText),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(color: const Color(0xFFFCEDEF), borderRadius: BorderRadius.circular(24)),
                  child: Row(
                    children: [
                      Container(
                        width: 60, height: 60,
                        decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 12, offset: const Offset(0, 6))]),
                        child: shop.logoUrl != null
                            ? ClipOval(child: Image.network(shop.logoUrl!, fit: BoxFit.cover))
                            : Center(child: Text(_initials(shop.name), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey))),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(shop.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: _kText)),
                            const SizedBox(height: 4),
                            Text('$shopItemsCount products', style: const TextStyle(fontSize: 13, color: _kSub, fontWeight: FontWeight.w500)),
                          ],
                        ),
                      )
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
                    decoration: BoxDecoration(color: const Color(0xFFF5F7F5), borderRadius: BorderRadius.circular(18)),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            onChanged: (v) => setState(() => _itemSearch = v),
                            decoration: const InputDecoration(hintText: 'Search items...', hintStyle: TextStyle(color: Colors.grey, fontWeight: FontWeight.w500), border: InputBorder.none),
                          ),
                        ),
                        const Icon(Icons.search, color: _kGreen),
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
                      const Text('Categories', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: _kText, letterSpacing: -0.5)),
                      if (_selectedCategory != null)
                        GestureDetector(
                          onTap: () => setState(() => _selectedCategory = null),
                          child: const Text('CLEAR', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.redAccent)),
                        )
                      else
                        const Text('NOV 07', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.grey)),
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
                      final bgColors = [const Color(0xFFF4F5F7), const Color(0xFFFDF6F0), const Color(0xFFFDF5EB), const Color(0xFFFCEEF0)];
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
                                  border: Border.all(color: isSelected ? _kGreen : Colors.transparent, width: 2),
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
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 24),
                  child: Text('Shop Items', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: _kText, letterSpacing: -0.5)),
                ),
                const SizedBox(height: 16),
                
                if (itemsToShow.isEmpty)
                  const Padding(padding: EdgeInsets.all(24), child: Center(child: Text('No items found.', style: TextStyle(color: _kSubLighter))))
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
                                    child: _buildItemCard(item),
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
                                    child: _buildItemCard(item),
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

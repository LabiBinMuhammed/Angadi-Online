import 'package:flutter/material.dart';
import 'package:village_market/l10n/app_localizations.dart';
import 'package:go_router/go_router.dart';
import 'package:hugeicons/hugeicons.dart';
import '../../../core/supabase_client.dart';
import '../../../core/cart_service.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/theme_service.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  bool _isLoading = true;
  List<dynamic> _favorites = [];
  final Map<String, bool> _addingToCart = {};

  @override
  void initState() {
    super.initState();
    _fetchFavorites();
  }

  Future<void> _fetchFavorites() async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return;

    try {
      final response = await supabase
          .from('customer_favorite_items')
          .select('''
            id,
            item:items(
              id,
              name,
              is_active,
              status,
              shop_id,
              shops(name),
              item_images(image_url, is_primary, sort_order),
              item_variants(id, price, is_default)
            )
          ''')
          .eq('user_id', userId);

      final List<dynamic> rawList = response as List<dynamic>;
      final processedList = rawList.where((f) => f['item'] != null).map((f) {
        final item = f['item'];
        
        // Find primary image or fallback
        final images = item['item_images'] as List<dynamic>? ?? [];
        String? imageUrl;
        if (images.isNotEmpty) {
          final primary = images.firstWhere((img) => img['is_primary'] == true, orElse: () => null);
          if (primary != null) {
            imageUrl = primary['image_url'] as String?;
          } else {
            // Sort by sort_order
            final sorted = List.from(images);
            sorted.sort((a, b) => (a['sort_order'] as num? ?? 0).compareTo(b['sort_order'] as num? ?? 0));
            imageUrl = sorted.first['image_url'] as String?;
          }
        }

        // Find variant price
        final variants = item['item_variants'] as List<dynamic>? ?? [];
        double price = 0.0;
        String? variantId;
        if (variants.isNotEmpty) {
          final def = variants.firstWhere((v) => v['is_default'] == true, orElse: () => variants.first);
          price = (def['price'] as num?)?.toDouble() ?? 0.0;
          variantId = def['id'] as String?;
        }

        return {
          'id': f['id'],
          'item': {
            'id': item['id'] as String,
            'name': item['name'] as String,
            'price': price,
            'image_url': imageUrl,
            'shop_id': item['shop_id'] as String,
            'shop_name': (item['shops'] as Map<String, dynamic>?)?['name'] as String? ?? 'Angadi Shop',
            'is_active': item['is_active'] as bool? ?? true,
            'status': item['status'] as String? ?? 'ready',
            'variant_id': variantId,
          }
        };
      }).toList();

      setState(() {
        _favorites = processedList;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error fetching favorites: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _removeFavorite(String itemId, String itemName) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return;

    // Optimistic UI update
    final previousList = List.from(_favorites);
    setState(() {
      _favorites.removeWhere((f) => f['item']['id'] == itemId);
    });

    try {
      await supabase
          .from('customer_favorite_items')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', itemId);

      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.removedFromFavoritesMessage(itemName))),
        );
      }
    } catch (e) {
      debugPrint('Error removing favorite: $e');
      setState(() {
        _favorites = previousList;
      });
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.failedToUpdateFavoriteStatus)),
        );
      }
    }
  }

  Future<void> _addToCart(dynamic favItem) async {
    final l10n = AppLocalizations.of(context)!;
    final item = favItem['item'];
    final itemId = item['id'] as String;
    final itemName = item['name'] as String;
    final variantId = item['variant_id'] as String?;
    final isActive = item['is_active'] as bool? ?? true;
    final status = item['status'] as String? ?? 'ready';

    if (!isActive || status == 'out_of_stock') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.outOfStockMessage(itemName))),
      );
      return;
    }

    setState(() => _addingToCart[itemId] = true);

    try {
      await CartService.instance.addItemById(itemId, variantId: variantId);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.addedToCartMessage(itemName))),
        );
      }
    } catch (e) {
      debugPrint('Error adding to cart: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.failedToAddToCart)),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _addingToCart[itemId] = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final isDark = ThemeService.instance.isDarkMode;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: isDark ? Colors.white : kNeutral900, size: 20),
          onPressed: () => context.pop(),
        ),
        title: Text(
          l10n.favoriteProductsTitle,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w800,
            color: isDark ? Colors.white : kNeutral900,
          ),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator(color: kWaGreenDark))
          : _favorites.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      HugeIcon(icon: HugeIcons.strokeRoundedFavourite, size: 64, color: isDark ? kNeutral600 : kNeutral400),
                      const SizedBox(height: 16),
                      Text(
                        l10n.noFavoritesYet,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: isDark ? Colors.white : kNeutral900,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        l10n.noFavoritesSubtitle,
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? kNeutral400 : kNeutral600,
                        ),
                      ),
                      const SizedBox(height: 32),
                      ElevatedButton(
                        onPressed: () => context.go('/home'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: kWaGreen,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(24),
                          ),
                          shadowColor: kWaGreen.withOpacity(0.3),
                        ),
                        child: Text(
                          l10n.browseProductsButton,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _favorites.length,
                  itemBuilder: (context, index) {
                    final fav = _favorites[index];
                    final item = fav['item'];
                    final itemId = item['id'] as String;
                    final itemName = item['name'] as String;
                    final shopName = item['shop_name'] as String;
                    final price = item['price'] as double;
                    final imageUrl = item['image_url'] as String?;
                    final isActive = item['is_active'] as bool? ?? true;
                    final status = item['status'] as String? ?? 'ready';
                    final isAvailable = isActive && status != 'out_of_stock';
                    final isAdding = _addingToCart[itemId] ?? false;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? kNeutral800 : Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: isDark ? kNeutral700 : kNeutral200),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.02),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 65,
                            height: 65,
                            decoration: BoxDecoration(
                              color: isDark ? kNeutral700 : kNeutral200,
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: imageUrl != null && imageUrl.isNotEmpty
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(16),
                                    child: Image.network(imageUrl, fit: BoxFit.cover),
                                  )
                                : Center(
                                    child: Text(
                                      itemName[0].toUpperCase(),
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white70 : kNeutral700,
                                      ),
                                    ),
                                  ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  itemName,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: isDark ? Colors.white : kNeutral900,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  shopName,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: isDark ? kNeutral400 : kNeutral600,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  '₹${price.toStringAsFixed(0)}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 16,
                                    color: isDark ? Colors.white : kNeutral900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: HugeIcon(icon: HugeIcons.strokeRoundedDelete02, color: kDanger, size: 20),
                                onPressed: () => _removeFavorite(itemId, itemName),
                              ),
                              IconButton(
                                icon: isAdding
                                    ? SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(color: kWaGreen, strokeWidth: 2),
                                      )
                                    : HugeIcon(
                                        icon: HugeIcons.strokeRoundedShoppingCart01,
                                        color: isAvailable ? kWaGreen : (isDark ? kNeutral600 : kNeutral400),
                                        size: 20,
                                      ),
                                onPressed: isAvailable && !isAdding ? () => _addToCart(fav) : null,
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}

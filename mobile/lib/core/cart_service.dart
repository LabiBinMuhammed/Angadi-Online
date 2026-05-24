import 'package:flutter/material.dart';
import '../models/models.dart';
import 'supabase_client.dart';

class CartService extends ChangeNotifier {
  static final CartService instance = CartService._internal();
  CartService._internal();

  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  double get subtotal => _items.fold(0.0, (sum, item) => sum + item.subtotal);
  double get discount => 5.2; // Keep fixed discount matching current screen UI
  double get finalTotal => (subtotal - discount).clamp(0.0, double.infinity);

  void addItem(Item item, ItemVariant variant, {double quantity = 1.0, ItemSellConfig? sellConfig}) {
    final isManualOrDynamic = sellConfig?.sellMode == SellMode.manual || sellConfig?.sellMode == SellMode.dynamic;
    final index = _items.indexWhere((i) =>
        i.item.id == item.id &&
        (isManualOrDynamic ? true : i.variant.id == variant.id));

    if (index != -1) {
      _items[index].quantity += quantity;
    } else {
      _items.add(CartItem(item: item, variant: variant, quantity: quantity, sellConfig: sellConfig));
    }
    notifyListeners();
  }

  Future<void> addItemById(String itemId, {double quantity = 1.0, String? variantId}) async {
    try {
      final itemRes = await supabase.from('items').select('*, item_sell_config(*), item_variants:vw_item_variants_with_fallback(*), item_images(*)').eq('id', itemId).single();
      final item = Item.fromJson(itemRes);

      if (item.itemVariants.isEmpty) return;

      final variant = variantId != null
          ? item.itemVariants.firstWhere((v) => v.id == variantId, orElse: () => item.itemVariants.first)
          : item.itemVariants.firstWhere((v) => v.isDefault, orElse: () => item.itemVariants.first);

      final config = item.itemSellConfig.isNotEmpty ? item.itemSellConfig.first : null;

      addItem(item, variant, quantity: quantity, sellConfig: config);
    } catch (e) {
      debugPrint('Error adding item by ID to cart: $e');
    }
  }

  void updateQuantity(String variantId, double quantity) {
    if (quantity < 0.01) {
      removeItem(variantId);
      return;
    }
    final index = _items.indexWhere((i) => i.variant.id == variantId);
    if (index != -1) {
      _items[index].quantity = quantity;
      notifyListeners();
    }
  }

  void removeItem(String variantId) {
    _items.removeWhere((i) => i.variant.id == variantId);
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }
}

import 'package:flutter/material.dart';
import '../models/models.dart';
import 'supabase_client.dart';

class CartService extends ChangeNotifier {
  static final CartService instance = CartService._internal();

  CartService._internal() {
    _init();
  }

  final List<CartItem> _items = [];
  DateTime _selectedDate = DateTime.now();
  String _selectedSlot = 'morning';
  String? _lastUserId;

  List<CartItem> get items => List.unmodifiable(_items);
  DateTime get selectedDate => _selectedDate;
  String get selectedSlot => _selectedSlot;

  void _init() {
    final user = supabase.auth.currentUser;
    if (user != null) {
      _lastUserId = user.id;
      _loadCartFromDatabase();
    }

    supabase.auth.onAuthStateChange.listen((data) {
      final user = data.session?.user;
      if (user != null) {
        if (_lastUserId != user.id) {
          _lastUserId = user.id;
          _loadCartFromDatabase();
        }
      } else {
        _lastUserId = null;
        _items.clear();
        notifyListeners();
      }
    });
  }

  Future<void> _loadCartFromDatabase() async {
    final user = supabase.auth.currentUser;
    if (user == null) return;
    try {
      final response = await supabase
          .from('orders')
          .select('*, order_items(*, items(*, item_sell_config(*), item_variants:vw_item_variants_with_fallback(*), item_images(*)))')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .isFilter('payment_type', null);

      final orders = response as List<dynamic>;
      _items.clear();
      for (final order in orders) {
        if (order['delivery_date'] != null) {
          _selectedDate = DateTime.parse(order['delivery_date'] as String);
        }
        if (order['delivery_slot'] != null) {
          _selectedSlot = (order['delivery_slot'] as String).toLowerCase();
        }

        final orderItems = order['order_items'] as List<dynamic>? ?? [];
        for (final oItem in orderItems) {
          final itemData = oItem['items'];
          if (itemData == null) continue;
          final item = Item.fromJson(itemData);
          if (item.itemVariants.isEmpty) continue;

          final String? variantId = oItem['variant_id'] as String?;
          final variant = variantId != null
              ? item.itemVariants.firstWhere((v) => v.id == variantId, orElse: () => item.itemVariants.first)
              : item.itemVariants.firstWhere((v) => v.isDefault, orElse: () => item.itemVariants.first);

          final config = item.itemSellConfig.isNotEmpty ? item.itemSellConfig.first : null;
          final qty = (oItem['requested_value'] as num?)?.toDouble() ?? 1.0;

          _items.add(CartItem(
            item: item,
            variant: variant,
            quantity: qty,
            sellConfig: config,
          ));
        }
      }
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading cart from database: $e');
    }
  }

  Future<void> setSelectedDate(DateTime date) async {
    _selectedDate = date;
    notifyListeners();

    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;

    try {
      final dateStr = date.toIso8601String().split('T')[0];
      await supabase
          .from('orders')
          .update({'delivery_date': dateStr})
          .eq('user_id', uid)
          .eq('status', 'pending')
          .isFilter('payment_type', null);
    } catch (e) {
      debugPrint('Error updating delivery date in database: $e');
    }
  }

  Future<void> setSelectedSlot(String slot) async {
    _selectedSlot = slot.toLowerCase();
    notifyListeners();

    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;

    try {
      await supabase
          .from('orders')
          .update({'delivery_slot': slot.toLowerCase()})
          .eq('user_id', uid)
          .eq('status', 'pending')
          .isFilter('payment_type', null);
    } catch (e) {
      debugPrint('Error updating delivery slot in database: $e');
    }
  }

  double get subtotal => _items.fold(0.0, (sum, item) => sum + item.subtotal);
  double get discount => 0.0;
  double get finalTotal => (subtotal - discount).clamp(0.0, double.infinity);

  Future<void> addItem(Item item, ItemVariant variant, {double quantity = 1.0, ItemSellConfig? sellConfig}) async {
    // 1. Optimistic Local Update
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

    // 2. DB Update
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;

    try {
      final shopId = item.shopId;
      
      // Find or create pending order for this user and shop
      var orderRes = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', uid)
          .eq('shop_id', shopId)
          .eq('status', 'pending')
          .isFilter('payment_type', null)
          .maybeSingle();

      String orderId;
      if (orderRes == null) {
        final todayStr = DateTime.now().toIso8601String().split('T')[0];
        final newOrder = await supabase.from('orders').insert({
          'user_id': uid,
          'shop_id': shopId,
          'status': 'pending',
          'total_estimated_price': 0,
          'total_final_price': 0,
          'delivery_date': todayStr,
          'delivery_slot': 'morning'
        }).select('id').single();
        orderId = newOrder['id'] as String;
      } else {
        orderId = orderRes['id'] as String;
      }

      // Check if item already exists in this order
      final existingItemRes = await supabase
          .from('order_items')
          .select('id, requested_value')
          .eq('order_id', orderId)
          .eq('item_id', item.id)
          .maybeSingle();

      final unitPrice = isManualOrDynamic 
          ? (sellConfig?.pricePerBaseUnit ?? 0.0)
          : (variant.price ?? 0.0);

      if (existingItemRes != null) {
        final existingId = existingItemRes['id'] as String;
        final existingQty = (existingItemRes['requested_value'] as num?)?.toDouble() ?? 0.0;
        final newQty = existingQty + quantity;

        await supabase
            .from('order_items')
            .update({
              'requested_value': newQty,
              'final_price': unitPrice * newQty,
            })
            .eq('id', existingId);
      } else {
        await supabase.from('order_items').insert({
          'order_id': orderId,
          'item_id': item.id,
          'variant_id': variant.id,
          'variant_type': variant.variantType.toString().split('.').last.toLowerCase(),
          'requested_value': quantity,
          'estimated_price': unitPrice,
          'final_price': unitPrice * quantity,
          'status': 'pending'
        });
      }

      // Recalculate totals for this order
      await _recalculateOrderTotals(orderId);
      
      // Reload to ensure precise state
      await _loadCartFromDatabase();
    } catch (e) {
      debugPrint('Error adding item to database cart: $e');
    }
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

      await addItem(item, variant, quantity: quantity, sellConfig: config);
    } catch (e) {
      debugPrint('Error adding item by ID to cart: $e');
    }
  }

  Future<void> updateQuantity(String variantId, double quantity) async {
    if (quantity < 0.01) {
      await removeItem(variantId);
      return;
    }

    // 1. Optimistic Local Update
    final index = _items.indexWhere((i) => i.variant.id == variantId);
    if (index != -1) {
      _items[index].quantity = quantity;
      notifyListeners();
    }

    // 2. DB Update
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;

    try {
      final pendingOrders = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', uid)
          .eq('status', 'pending')
          .isFilter('payment_type', null);
      
      final orderIds = (pendingOrders as List<dynamic>).map((o) => o['id'] as String).toList();
      if (orderIds.isEmpty) return;

      final orderItemRes = await supabase
          .from('order_items')
          .select('id, order_id, estimated_price')
          .inFilter('order_id', orderIds)
          .eq('variant_id', variantId)
          .maybeSingle();

      if (orderItemRes != null) {
        final orderItemId = orderItemRes['id'] as String;
        final orderId = orderItemRes['order_id'] as String;
        final unitPrice = (orderItemRes['estimated_price'] as num?)?.toDouble() ?? 0.0;

        await supabase
            .from('order_items')
            .update({
              'requested_value': quantity,
              'final_price': unitPrice * quantity,
            })
            .eq('id', orderItemId);

        await _recalculateOrderTotals(orderId);
        await _loadCartFromDatabase();
      }
    } catch (e) {
      debugPrint('Error updating quantity in database cart: $e');
    }
  }

  Future<void> removeItem(String variantId) async {
    // 1. Optimistic Local Update
    _items.removeWhere((i) => i.variant.id == variantId);
    notifyListeners();

    // 2. DB Update
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;

    try {
      final pendingOrders = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', uid)
          .eq('status', 'pending')
          .isFilter('payment_type', null);

      final orderIds = (pendingOrders as List<dynamic>).map((o) => o['id'] as String).toList();
      if (orderIds.isEmpty) return;

      final orderItemRes = await supabase
          .from('order_items')
          .select('id, order_id')
          .inFilter('order_id', orderIds)
          .eq('variant_id', variantId)
          .maybeSingle();

      if (orderItemRes != null) {
        final orderItemId = orderItemRes['id'] as String;
        final orderId = orderItemRes['order_id'] as String;

        await supabase
            .from('order_items')
            .delete()
            .eq('id', orderItemId);

        final remainingItems = await supabase
            .from('order_items')
            .select('id')
            .eq('order_id', orderId);

        if ((remainingItems as List).isEmpty) {
          await supabase
              .from('orders')
              .update({'status': 'cancelled'})
              .eq('id', orderId);
        } else {
          await _recalculateOrderTotals(orderId);
        }

        await _loadCartFromDatabase();
      }
    } catch (e) {
      debugPrint('Error removing item from database cart: $e');
    }
  }

  Future<void> clearCart() async {
    // 1. Optimistic Local Update
    _items.clear();
    notifyListeners();

    // 2. DB Update
    final uid = supabase.auth.currentUser?.id;
    if (uid == null) return;

    try {
      await supabase
          .from('orders')
          .update({'status': 'cancelled'})
          .eq('user_id', uid)
          .eq('status', 'pending')
          .isFilter('payment_type', null);
      
      await _loadCartFromDatabase();
    } catch (e) {
      debugPrint('Error clearing database cart: $e');
    }
  }

  Future<void> _recalculateOrderTotals(String orderId) async {
    final remainingItems = await supabase
        .from('order_items')
        .select('requested_value, estimated_price')
        .eq('order_id', orderId);

    final itemsList = remainingItems as List<dynamic>;
    final total = itemsList.fold<double>(0.0, (acc, item) {
      final qty = (item['requested_value'] as num?)?.toDouble() ?? 0.0;
      final price = (item['estimated_price'] as num?)?.toDouble() ?? 0.0;
      return acc + (qty * price);
    });

    await supabase.from('orders').update({
      'total_estimated_price': total,
      'total_final_price': total,
    }).eq('id', orderId);
  }
}

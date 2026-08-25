import 'supabase_client.dart';

class AdminService {
  static final AdminService _instance = AdminService._internal();
  factory AdminService() => _instance;
  AdminService._internal();

  /// Cascade Toggle User Active / Inactive
  Future<Map<String, dynamic>> toggleUserActive(String userId, bool isActive) async {
    try {
      // 1. Update public.users
      await supabase.from('users').update({'is_active': isActive}).eq('id', userId);

      // 2. Fetch all shops owned by this user
      final ownerships = await supabase.from('shop_owners').select('shop_id').eq('user_id', userId);
      for (final own in (ownerships as List)) {
        final shopId = own['shop_id'] as String;
        // Check if sole owner
        final allOwners = await supabase.from('shop_owners').select('id').eq('shop_id', shopId);
        if ((allOwners as List).length <= 1) {
          await toggleShopActive(shopId, isActive);
        }
      }

      // 3. Cascade customer records
      if (!isActive) {
        try { await supabase.from('user_addresses').update({'is_active': false}).eq('user_id', userId); } catch (_) {}
        try { await supabase.from('shop_user_credit').update({'is_blocked': true, 'is_credit_enabled': false}).eq('user_id', userId); } catch (_) {}
        try {
          await supabase.from('orders').update({'status': 'cancelled'}).eq('user_id', userId).eq('status', 'pending');
        } catch (_) {}
      } else {
        try { await supabase.from('user_addresses').update({'is_active': true}).eq('user_id', userId); } catch (_) {}
        try { await supabase.from('shop_user_credit').update({'is_blocked': false, 'is_credit_enabled': true}).eq('user_id', userId); } catch (_) {}
      }

      return {'success': true};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Cascade Toggle Shop Active / Inactive
  Future<Map<String, dynamic>> toggleShopActive(String shopId, bool isActive) async {
    try {
      final shop = await supabase.from('shops').select('type').eq('id', shopId).maybeSingle();
      final currentType = (shop?['type'] as String?) ?? 'grocery';
      final newType = isActive
          ? (currentType.endsWith('_inactive') ? currentType.replaceAll('_inactive', '') : currentType)
          : (currentType.endsWith('_inactive') ? currentType : '${currentType}_inactive');

      await supabase.from('shops').update({'type': newType}).eq('id', shopId);

      if (!isActive) {
        await supabase.from('items').update({'is_active': false, 'deleted_at': DateTime.now().toIso8601String()}).eq('shop_id', shopId);
        final shopItems = await supabase.from('items').select('id').eq('shop_id', shopId);
        final itemIds = (shopItems as List).map((i) => i['id']).toList();
        if (itemIds.isNotEmpty) {
          await supabase.from('item_variants').update({'is_active': false}).filter('item_id', 'in', itemIds);
        }
        await supabase.from('orders').update({'status': 'cancelled'}).eq('shop_id', shopId).eq('status', 'pending');
        try { await supabase.from('shop_user_credit').update({'is_credit_enabled': false}).eq('shop_id', shopId); } catch (_) {}
      } else {
        await supabase.from('items').update({'is_active': true, 'deleted_at': null}).eq('shop_id', shopId);
        final shopItems = await supabase.from('items').select('id').eq('shop_id', shopId);
        final itemIds = (shopItems as List).map((i) => i['id']).toList();
        if (itemIds.isNotEmpty) {
          await supabase.from('item_variants').update({'is_active': true}).filter('item_id', 'in', itemIds);
        }
        try { await supabase.from('shop_user_credit').update({'is_credit_enabled': true}).eq('shop_id', shopId); } catch (_) {}
      }

      return {'success': true};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Cascade Delete User
  Future<Map<String, dynamic>> deleteUser(String userId) async {
    try {
      // 1. Delete owned shops if sole owner
      final ownerships = await supabase.from('shop_owners').select('shop_id').eq('user_id', userId);
      for (final own in (ownerships as List)) {
        final shopId = own['shop_id'] as String;
        final allOwners = await supabase.from('shop_owners').select('id').eq('shop_id', shopId);
        if ((allOwners as List).length <= 1) {
          await deleteShop(shopId);
        } else {
          await supabase.from('shop_owners').delete().eq('shop_id', shopId).eq('user_id', userId);
        }
      }

      // 2. Delete customer artifacts
      try { await supabase.from('customer_favorite_items').delete().eq('user_id', userId); } catch (_) {}
      try { await supabase.from('customer_pinned_shops').delete().eq('user_id', userId); } catch (_) {}
      try { await supabase.from('shop_user_credit').delete().eq('user_id', userId); } catch (_) {}
      try { await supabase.from('feedbacks').delete().eq('user_id', userId); } catch (_) {}
      try { await supabase.from('reviews').delete().eq('user_id', userId); } catch (_) {}
      try { await supabase.from('user_profiles').delete().eq('user_id', userId); } catch (_) {}
      try { await supabase.from('user_addresses').delete().eq('user_id', userId); } catch (_) {}

      // 3. Delete user orders
      final userOrders = await supabase.from('orders').select('id').eq('user_id', userId);
      final orderIds = (userOrders as List).map((o) => o['id']).toList();
      if (orderIds.isNotEmpty) {
        final orderItems = await supabase.from('order_items').select('id').filter('order_id', 'in', orderIds);
        final oiIds = (orderItems as List).map((oi) => oi['id']).toList();
        if (oiIds.isNotEmpty) {
          try { await supabase.from('price_adjustment_logs').delete().filter('order_item_id', 'in', oiIds); } catch (_) {}
        }
        try { await supabase.from('replacement_requests').delete().filter('order_id', 'in', orderIds); } catch (_) {}
        try { await supabase.from('replacements').delete().filter('order_id', 'in', orderIds); } catch (_) {}
        await supabase.from('order_addresses').delete().filter('order_id', 'in', orderIds);
        await supabase.from('order_items').delete().filter('order_id', 'in', orderIds);
        await supabase.from('orders').delete().filter('id', 'in', orderIds);
      }

      // 4. Delete public.users row
      await supabase.from('users').delete().eq('id', userId);

      return {'success': true};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  /// Cascade Delete Shop
  Future<Map<String, dynamic>> deleteShop(String shopId) async {
    try {
      // 1. Fetch item ids
      final shopItems = await supabase.from('items').select('id').eq('shop_id', shopId);
      final itemIds = (shopItems as List).map((i) => i['id']).toList();
      if (itemIds.isNotEmpty) {
        try { await supabase.from('customer_favorite_items').delete().filter('item_id', 'in', itemIds); } catch (_) {}
        try { await supabase.from('item_images').delete().filter('item_id', 'in', itemIds); } catch (_) {}
        try { await supabase.from('item_variants').delete().filter('item_id', 'in', itemIds); } catch (_) {}
        try { await supabase.from('item_sell_config').delete().filter('item_id', 'in', itemIds); } catch (_) {}
      }

      // 2. Fetch shop orders
      final shopOrders = await supabase.from('orders').select('id').eq('shop_id', shopId);
      final orderIds = (shopOrders as List).map((o) => o['id']).toList();
      if (orderIds.isNotEmpty) {
        final orderItems = await supabase.from('order_items').select('id').filter('order_id', 'in', orderIds);
        final oiIds = (orderItems as List).map((oi) => oi['id']).toList();
        if (oiIds.isNotEmpty) {
          try { await supabase.from('price_adjustment_logs').delete().filter('order_item_id', 'in', oiIds); } catch (_) {}
        }
        try { await supabase.from('replacement_requests').delete().filter('order_id', 'in', orderIds); } catch (_) {}
        try { await supabase.from('replacements').delete().filter('order_id', 'in', orderIds); } catch (_) {}
        await supabase.from('order_addresses').delete().filter('order_id', 'in', orderIds);
        await supabase.from('order_items').delete().filter('order_id', 'in', orderIds);
        await supabase.from('orders').delete().filter('id', 'in', orderIds);
      }

      // 3. Delete items
      if (itemIds.isNotEmpty) {
        await supabase.from('items').delete().filter('id', 'in', itemIds);
      }

      // 4. Delete shop dependencies
      try { await supabase.from('shop_user_credit').delete().eq('shop_id', shopId); } catch (_) {}
      try { await supabase.from('shop_subscription').delete().eq('shop_id', shopId); } catch (_) {}
      try { await supabase.from('shop_commission_records').delete().eq('shop_id', shopId); } catch (_) {}
      try { await supabase.from('commission_records').delete().eq('shop_id', shopId); } catch (_) {}
      try { await supabase.from('customer_pinned_shops').delete().eq('shop_id', shopId); } catch (_) {}
      try { await supabase.from('feedbacks').delete().eq('shop_id', shopId); } catch (_) {}
      try { await supabase.from('reviews').delete().eq('shop_id', shopId); } catch (_) {}
      try { await supabase.from('shop_working_days').delete().eq('shop_id', shopId); } catch (_) {}
      try { await supabase.from('shop_deliveries').delete().eq('shop_id', shopId); } catch (_) {}

      // 5. Delete owners and shop
      await supabase.from('shop_owners').delete().eq('shop_id', shopId);
      await supabase.from('shops').delete().eq('id', shopId);

      return {'success': true};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}

final adminService = AdminService();

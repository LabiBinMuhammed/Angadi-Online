'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * 1. Update User Role
 */
export async function updateUserRoleAction(userId: string, newRole: string) {
  try {
    const supabase = getAdminClient()

    const { error: dbError } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (dbError) {
      return { success: false, error: dbError.message }
    }

    try {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole }
      })
    } catch (_) {}

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * Internal Helper: Cascade Delete Shop
 */
async function cascadeDeleteShop(supabase: any, shopId: string) {
  // 1. Fetch all items of this shop
  const { data: shopItems } = await supabase
    .from('items')
    .select('id')
    .eq('shop_id', shopId)

  const itemIds = (shopItems || []).map((i: any) => i.id)

  if (itemIds.length > 0) {
    // Delete item images, variants, sell_configs, favorite links
    await supabase.from('customer_favorite_items').delete().in('item_id', itemIds)
    await supabase.from('item_images').delete().in('item_id', itemIds)
    await supabase.from('item_variants').delete().in('item_id', itemIds)
    await supabase.from('item_sell_config').delete().in('item_id', itemIds)
  }

  // 2. Fetch all orders of this shop
  const { data: shopOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('shop_id', shopId)

  const orderIds = (shopOrders || []).map((o: any) => o.id)

  if (orderIds.length > 0) {
    // Fetch order items to clean logs
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('id')
      .in('order_id', orderIds)
    
    const oiIds = (orderItems || []).map((oi: any) => oi.id)
    if (oiIds.length > 0) {
      try {
        await supabase.from('price_adjustment_logs').delete().in('order_item_id', oiIds)
      } catch (_) {}
    }

    try {
      await supabase.from('replacement_requests').delete().in('order_id', orderIds)
    } catch (_) {}
    try {
      await supabase.from('replacements').delete().in('order_id', orderIds)
    } catch (_) {}

    await supabase.from('order_addresses').delete().in('order_id', orderIds)
    await supabase.from('order_items').delete().in('order_id', orderIds)
    await supabase.from('orders').delete().in('id', orderIds)
  }

  // 3. Delete items
  if (itemIds.length > 0) {
    await supabase.from('items').delete().in('id', itemIds)
  }

  // 4. Delete shop dependencies
  try { await supabase.from('shop_user_credit').delete().eq('shop_id', shopId) } catch (_) {}
  try { await supabase.from('shop_subscription').delete().eq('shop_id', shopId) } catch (_) {}
  try { await supabase.from('shop_commission_records').delete().eq('shop_id', shopId) } catch (_) {}
  try { await supabase.from('commission_records').delete().eq('shop_id', shopId) } catch (_) {}
  try { await supabase.from('customer_pinned_shops').delete().eq('shop_id', shopId) } catch (_) {}
  try { await supabase.from('feedbacks').delete().eq('shop_id', shopId) } catch (_) {}
  try { await supabase.from('reviews').delete().eq('shop_id', shopId) } catch (_) {}
  try { await supabase.from('shop_working_days').delete().eq('shop_id', shopId) } catch (_) {}
  try { await supabase.from('shop_deliveries').delete().eq('shop_id', shopId) } catch (_) {}

  // 5. Delete shop owners and shop record
  await supabase.from('shop_owners').delete().eq('shop_id', shopId)
  await supabase.from('shops').delete().eq('id', shopId)
}

/**
 * Internal Helper: Cascade Toggle Shop Active / Inactive
 */
async function cascadeToggleShop(supabase: any, shopId: string, isActive: boolean) {
  // 1. Update shop type status
  const { data: shop } = await supabase.from('shops').select('type').eq('id', shopId).single()
  const currentType = shop?.type || 'general'
  const newType = isActive
    ? (currentType.endsWith('_inactive') ? currentType.slice(0, -9) : currentType)
    : (currentType.endsWith('_inactive') ? currentType : currentType + '_inactive')

  await supabase.from('shops').update({ type: newType }).eq('id', shopId)

  // 2. Cascade toggle all products of this shop
  if (!isActive) {
    // Deactivate items
    await supabase
      .from('items')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('shop_id', shopId)

    // Deactivate variants
    const { data: shopItems } = await supabase.from('items').select('id').eq('shop_id', shopId)
    const itemIds = (shopItems || []).map((i: any) => i.id)
    if (itemIds.length > 0) {
      await supabase.from('item_variants').update({ is_active: false }).in('item_id', itemIds)
    }

    // Cancel pending orders
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('shop_id', shopId)
      .eq('status', 'pending')

    // Disable credit
    try {
      await supabase.from('shop_user_credit').update({ is_credit_enabled: false }).eq('shop_id', shopId)
    } catch (_) {}
  } else {
    // Reactivate items
    await supabase
      .from('items')
      .update({ is_active: true, deleted_at: null })
      .eq('shop_id', shopId)

    // Reactivate default variants
    const { data: shopItems } = await supabase.from('items').select('id').eq('shop_id', shopId)
    const itemIds = (shopItems || []).map((i: any) => i.id)
    if (itemIds.length > 0) {
      await supabase.from('item_variants').update({ is_active: true }).in('item_id', itemIds)
    }

    // Enable credit
    try {
      await supabase.from('shop_user_credit').update({ is_credit_enabled: true }).eq('shop_id', shopId)
    } catch (_) {}
  }
}

/**
 * 2. Delete Shop Action
 */
export async function adminDeleteShopAction(shopId: string) {
  try {
    const supabase = getAdminClient()
    await cascadeDeleteShop(supabase, shopId)
    revalidatePath('/admin/shops')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * 3. Toggle Shop Active / Inactive Action
 */
export async function adminToggleShopActiveAction(shopId: string, isActive: boolean) {
  try {
    const supabase = getAdminClient()
    await cascadeToggleShop(supabase, shopId, isActive)
    revalidatePath('/admin/shops')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * 4. Delete User Action (with sole-ownership shop cascade)
 */
export async function adminDeleteUserAction(userId: string) {
  try {
    const supabase = getAdminClient()

    // 1. Check all shops owned by this user
    const { data: ownerships } = await supabase
      .from('shop_owners')
      .select('shop_id')
      .eq('user_id', userId)

    for (const own of (ownerships || [])) {
      // Check if user is the ONLY owner of this shop
      const { data: allOwners } = await supabase
        .from('shop_owners')
        .select('id')
        .eq('shop_id', own.shop_id)

      if (!allOwners || allOwners.length <= 1) {
        // User is the sole owner -> delete entire shop cascade
        await cascadeDeleteShop(supabase, own.shop_id)
      } else {
        // Multi-owner shop -> remove user's ownership link
        await supabase
          .from('shop_owners')
          .delete()
          .eq('shop_id', own.shop_id)
          .eq('user_id', userId)
      }
    }

    // 2. Delete customer-specific data
    try { await supabase.from('customer_favorite_items').delete().eq('user_id', userId) } catch (_) {}
    try { await supabase.from('customer_pinned_shops').delete().eq('user_id', userId) } catch (_) {}
    try { await supabase.from('shop_user_credit').delete().eq('user_id', userId) } catch (_) {}
    try { await supabase.from('feedbacks').delete().eq('user_id', userId) } catch (_) {}
    try { await supabase.from('reviews').delete().eq('user_id', userId) } catch (_) {}
    try { await supabase.from('user_profiles').delete().eq('user_id', userId) } catch (_) {}
    try { await supabase.from('user_addresses').delete().eq('user_id', userId) } catch (_) {}

    // 3. Delete orders placed by this customer
    const { data: userOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)

    const orderIds = (userOrders || []).map((o: any) => o.id)
    if (orderIds.length > 0) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('id')
        .in('order_id', orderIds)
      
      const oiIds = (orderItems || []).map((oi: any) => oi.id)
      if (oiIds.length > 0) {
        try {
          await supabase.from('price_adjustment_logs').delete().in('order_item_id', oiIds)
        } catch (_) {}
      }

      try {
        await supabase.from('replacement_requests').delete().in('order_id', orderIds)
      } catch (_) {}

      await supabase.from('order_addresses').delete().in('order_id', orderIds)
      await supabase.from('order_items').delete().in('order_id', orderIds)
      await supabase.from('orders').delete().in('id', orderIds)
    }

    // 4. Delete public.users record
    const { error: userDelErr } = await supabase.from('users').delete().eq('id', userId)
    if (userDelErr) {
      throw new Error(`Failed to delete user row: ${userDelErr.message}`)
    }

    // 5. Delete Supabase Auth record
    try {
      await supabase.auth.admin.deleteUser(userId)
    } catch (_) {}

    revalidatePath('/admin/users')
    revalidatePath('/admin/shops')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

/**
 * 5. Toggle User Active / Inactive Action
 */
export async function adminToggleUserActiveAction(userId: string, isActive: boolean) {
  try {
    const supabase = getAdminClient()

    // 1. Update public.users status
    const { error: updErr } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)

    if (updErr) {
      throw new Error(`Failed to toggle user status: ${updErr.message}`)
    }

    // 2. Handle ownership shop deactivation/activation
    const { data: ownerships } = await supabase
      .from('shop_owners')
      .select('shop_id')
      .eq('user_id', userId)

    for (const own of (ownerships || [])) {
      const { data: allOwners } = await supabase
        .from('shop_owners')
        .select('id')
        .eq('shop_id', own.shop_id)

      if (!allOwners || allOwners.length <= 1) {
        await cascadeToggleShop(supabase, own.shop_id, isActive)
      }
    }

    // 3. User addresses and credit handling
    if (!isActive) {
      await supabase.from('user_addresses').update({ is_active: false }).eq('user_id', userId)
      try {
        await supabase.from('shop_user_credit').update({ is_blocked: true, is_credit_enabled: false }).eq('user_id', userId)
      } catch (_) {}

      // Cancel customer's pending orders
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('user_id', userId)
        .eq('status', 'pending')
    } else {
      await supabase.from('user_addresses').update({ is_active: true }).eq('user_id', userId)
      try {
        await supabase.from('shop_user_credit').update({ is_blocked: false, is_credit_enabled: true }).eq('user_id', userId)
      } catch (_) {}
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin/shops')
    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

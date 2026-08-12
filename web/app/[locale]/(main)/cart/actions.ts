'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function cancelOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/cart')
  revalidatePath('/orders')
}

export async function removeOrderItem(orderId: string, orderItemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  // Verify order belongs to user and is pending
  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order || order.status !== 'pending') throw new Error('Cannot edit this order')

  const { error } = await supabase
    .from('order_items')
    .delete()
    .eq('id', orderItemId)
    .eq('order_id', orderId)

  if (error) throw error

  // Recalculate total
  const { data: remainingItems } = await supabase
    .from('order_items')
    .select('requested_value, estimated_price')
    .eq('order_id', orderId)

  if (!remainingItems || remainingItems.length === 0) {
    // Cancel order if no items left
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
  } else {
    const total = remainingItems.reduce((acc, item) => acc + (item.requested_value || 0) * (item.estimated_price || 0), 0)
    await supabase.from('orders').update({ total_estimated_price: total, total_final_price: total }).eq('id', orderId)
  }

  revalidatePath('/cart')
}

export async function updateOrderItemQty(orderId: string, orderItemId: string, newQty: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order || order.status !== 'pending') throw new Error('Cannot edit this order')

  if (newQty <= 0) {
    return removeOrderItem(orderId, orderItemId)
  }

  const { data: itemData } = await supabase
    .from('order_items')
    .select('estimated_price')
    .eq('id', orderItemId)
    .single()

  const unitPrice = itemData?.estimated_price || 0

  const { error } = await supabase
    .from('order_items')
    .update({ 
      requested_value: newQty,
      final_price: unitPrice * newQty
    })
    .eq('id', orderItemId)
    .eq('order_id', orderId)

  if (error) throw error

  // Recalculate total
  const { data: remainingItems } = await supabase
    .from('order_items')
    .select('requested_value, estimated_price')
    .eq('order_id', orderId)

  const total = remainingItems?.reduce((acc, item) => acc + (item.requested_value || 0) * (item.estimated_price || 0), 0) || 0
  await supabase.from('orders').update({ total_estimated_price: total, total_final_price: total }).eq('id', orderId)

  revalidatePath('/cart')
}

export async function updateOrderItemVariant(orderId: string, orderItemId: string, newVariantId: string, newPrice: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { data: order } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order || order.status !== 'pending') throw new Error('Cannot edit this order')

  const { data: v } = await supabase
    .from('item_variants')
    .select('variant_type')
    .eq('id', newVariantId)
    .single()

  const { data: itemData } = await supabase
    .from('order_items')
    .select('requested_value')
    .eq('id', orderItemId)
    .single()

  const qty = itemData?.requested_value || 1

  let dbVariantType = 'Fixed'
  if (v?.variant_type) {
    const vt = v.variant_type.toLowerCase()
    if (vt === 'manual') dbVariantType = 'Manual'
    else if (vt === 'dynamic') dbVariantType = 'Dynamic'
    else if (vt === 'portion') dbVariantType = 'Portion'
    else dbVariantType = 'Fixed'
  }

  const { error } = await supabase
    .from('order_items')
    .update({ 
      variant_id: newVariantId,
      variant_type: dbVariantType,
      estimated_price: newPrice,
      final_price: newPrice * qty
    })
    .eq('id', orderItemId)
    .eq('order_id', orderId)

  if (error) throw error

  // Recalculate total
  const { data: remainingItems } = await supabase
    .from('order_items')
    .select('requested_value, estimated_price')
    .eq('order_id', orderId)

  const total = remainingItems?.reduce((acc, item) => acc + (item.requested_value || 0) * (item.estimated_price || 0), 0) || 0
  await supabase.from('orders').update({ total_estimated_price: total, total_final_price: total }).eq('id', orderId)

  revalidatePath('/cart')
}


export async function addToCart(shopId: string, itemId: string, qty: number, price: number, variantId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  // Check if shop has level 3 restriction
  const { data: sub } = await supabase
    .from('shop_subscription')
    .select('restriction_level')
    .eq('shop_id', shopId)
    .maybeSingle()
  if (sub && sub.restriction_level >= 3) {
    throw new Error('This shop is temporarily unable to accept new orders due to outstanding dues.')
  }

  // Ensure user exists in public.users
  const { data: publicUser } = await supabase.from('users').select('id').eq('id', user.id).maybeSingle()
  if (!publicUser) {
    await supabase.from('users').insert({
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      role: 'customer',
      is_active: true
    })
  }

  let finalVariantId = variantId
  let variantType: string | undefined

  if (finalVariantId) {
    const { data: v } = await supabase.from('item_variants').select('variant_type').eq('id', finalVariantId).maybeSingle()
    variantType = v?.variant_type
  } else {
    // Find the default variant for the item
    const { data: defaultVariant } = await supabase
      .from('item_variants')
      .select('id, variant_type')
      .eq('item_id', itemId)
      .eq('is_default', true)
      .maybeSingle()

    finalVariantId = defaultVariant?.id
    variantType = defaultVariant?.variant_type

    if (!finalVariantId) {
      const { data: anyVariant } = await supabase
        .from('item_variants')
        .select('id, variant_type')
        .eq('item_id', itemId)
        .limit(1)
        .maybeSingle()
      finalVariantId = anyVariant?.id
      variantType = anyVariant?.variant_type
    }
  }

  // Fallback: If item has no variants in DB, auto-create a default variant
  if (!finalVariantId) {
    const { data: newVariant } = await supabase
      .from('item_variants')
      .insert({
        item_id: itemId,
        variant_type: 'Manual',
        label: 'Default',
        value: 1,
        price: price || 0,
        is_default: true,
        is_active: true
      })
      .select('id, variant_type')
      .single()

    if (newVariant) {
      finalVariantId = newVariant.id
      variantType = newVariant.variant_type
    }
  }

  if (!finalVariantId) {
    throw new Error('Item has no variants configured.')
  }

  // Normalize variantType for order_items schema
  let dbVariantType = 'Fixed'
  if (variantType) {
    const vt = variantType.toLowerCase()
    if (vt === 'manual') dbVariantType = 'Manual'
    else if (vt === 'dynamic') dbVariantType = 'Dynamic'
    else if (vt === 'portion') dbVariantType = 'Portion'
    else dbVariantType = 'Fixed'
  }

  // Find or create pending draft cart order (must not have payment_type set)
  let { data: order } = await supabase
    .from('orders')
    .select('id, total_estimated_price')
    .eq('user_id', user.id)
    .eq('shop_id', shopId)
    .eq('status', 'pending')
    .is('payment_type', null)
    .limit(1)
    .maybeSingle()

  if (!order) {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        shop_id: shopId,
        status: 'pending',
        payment_type: null,
        total_estimated_price: 0,
        total_final_price: 0,
        delivery_date: todayStr,
        delivery_slot: 'morning'
      })
      .select('id, total_estimated_price')
      .single()

    if (orderError) throw new Error(orderError.message)
    order = newOrder
  }


  // Upsert item in order
  const { data: existingItem } = await supabase
    .from('order_items')
    .select('id, requested_value, estimated_price')
    .eq('order_id', order.id)
    .eq('item_id', itemId)
    .maybeSingle()

  if (existingItem) {
    const newQty = existingItem.requested_value + qty
    const unitPrice = existingItem.estimated_price || price
    await supabase
      .from('order_items')
      .update({ 
        requested_value: newQty,
        final_price: unitPrice * newQty
      })
      .eq('id', existingItem.id)
  } else {
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        item_id: itemId,
        variant_id: finalVariantId,
        variant_type: dbVariantType,
        requested_value: qty,
        estimated_price: price,
        final_price: price * qty,
        status: 'pending'
      })
    if (itemError) throw new Error(itemError.message)
  }

  // Recalculate totals
  const { data: remainingItems } = await supabase
    .from('order_items')
    .select('requested_value, estimated_price')
    .eq('order_id', order.id)

  const total = remainingItems?.reduce((acc, item) => acc + (item.requested_value || 0) * (item.estimated_price || 0), 0) || 0
  await supabase.from('orders').update({ total_estimated_price: total, total_final_price: total }).eq('id', order.id)

  revalidatePath('/cart')
  revalidatePath('/home')
}

export async function updateDeliverySchedule(date: string, slot: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { error } = await supabase
    .from('orders')
    .update({
      delivery_date: date,
      delivery_slot: slot.toLowerCase()
    })
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .is('payment_type', null)

  if (error) throw new Error(error.message)
  revalidatePath('/cart')
}

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

  const { error } = await supabase
    .from('order_items')
    .update({ requested_value: newQty })
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

  // Ensure user exists in public.users
  const { data: publicUser } = await supabase.from('users').select('id').eq('id', user.id).single()
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
    const { data: v } = await supabase.from('item_variants').select('variant_type').eq('id', finalVariantId).single()
    variantType = v?.variant_type
  } else {
    // Find the default variant for the item
    const { data: defaultVariant } = await supabase
      .from('item_variants')
      .select('id, variant_type')
      .eq('item_id', itemId)
      .eq('is_default', true)
      .single()

    finalVariantId = defaultVariant?.id
    variantType = defaultVariant?.variant_type

    if (!finalVariantId) {
      const { data: anyVariant } = await supabase
        .from('item_variants')
        .select('id, variant_type')
        .eq('item_id', itemId)
        .limit(1)
        .single()
      finalVariantId = anyVariant?.id
      variantType = anyVariant?.variant_type
    }
  }

  if (!finalVariantId) {
    throw new Error('Item has no variants configured.')
  }

  // Find or create pending order
  let { data: order } = await supabase
    .from('orders')
    .select('id, total_estimated_price')
    .eq('user_id', user.id)
    .eq('shop_id', shopId)
    .eq('status', 'pending')
    .single()

  if (!order) {
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        shop_id: shopId,
        status: 'pending',
        total_estimated_price: 0,
        total_final_price: 0
      })
      .select('id, total_estimated_price')
      .single()

    if (orderError) throw new Error(orderError.message)
    order = newOrder
  }

  // Upsert item in order
  const { data: existingItem } = await supabase
    .from('order_items')
    .select('id, requested_value')
    .eq('order_id', order.id)
    .eq('item_id', itemId)
    .single()

  if (existingItem) {
    await supabase
      .from('order_items')
      .update({ requested_value: existingItem.requested_value + qty })
      .eq('id', existingItem.id)
  } else {
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        item_id: itemId,
        variant_id: finalVariantId,
        variant_type: variantType,
        requested_value: qty,
        estimated_price: price,
        final_price: price,
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

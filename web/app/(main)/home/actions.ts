'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitOrder(shopId: string, items: any[], total: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be logged in to place an order')
  }

  // Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      shop_id: shopId,
      total_estimated_price: total,
      total_final_price: total,
      status: 'pending',
    })
    .select('id')
    .single()

  if (orderError) throw orderError

  // Insert order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    item_id: item.itemId,
    variant_id: item.variantId || null,
    requested_value: item.qty,
    estimated_price: item.price,
    final_price: item.price,
    auto_approved: false,
    status: 'pending'
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) {
    // Attempt rollback
    await supabase.from('orders').delete().eq('id', order.id)
    throw itemsError
  }

  revalidatePath('/cart')
  return order.id
}

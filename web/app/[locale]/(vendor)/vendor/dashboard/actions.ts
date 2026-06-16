'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDeliveryBatch(shopId: string, dateStr: string, slot: string) {
  const supabase = await createClient()

  // 1. Create the delivery batch
  const { data: batch, error: batchErr } = await supabase
    .from('delivery_batches')
    .insert({
      shop_id: shopId,
      delivery_date: dateStr,
      delivery_slot: slot.toLowerCase(),
      status: 'pending'
    })
    .select('id')
    .single()

  if (batchErr) {
    throw new Error(`Failed to create delivery batch: ${batchErr.message}`)
  }

  // 2. Link all current active orders for this slot/date to the batch
  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      delivery_batch_id: batch.id
    })
    .eq('shop_id', shopId)
    .eq('delivery_date', dateStr)
    .eq('delivery_slot', slot.toLowerCase())
    .not('payment_type', 'is', null)
    .neq('status', 'cancelled')
    .is('delivery_batch_id', null)

  if (updateErr) {
    console.error('Error linking orders to batch:', updateErr)
  }

  revalidatePath('/vendor/dashboard')
  return batch.id
}

export async function updateBatchStatus(batchId: string, status: 'pending' | 'delivering' | 'completed') {
  const supabase = await createClient()

  // 1. Update batch status
  const { error: batchErr } = await supabase
    .from('delivery_batches')
    .update({ status })
    .eq('id', batchId)

  if (batchErr) {
    throw new Error(`Failed to update batch: ${batchErr.message}`)
  }

  // 2. Update status of all orders in this batch
  const orderStatusMap: Record<string, string> = {
    pending: 'accepted',
    delivering: 'out_for_delivery',
    completed: 'delivered'
  }

  const orderStatus = orderStatusMap[status]
  if (orderStatus) {
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ status: orderStatus })
      .eq('delivery_batch_id', batchId)

    if (updateErr) {
      console.error('Error updating orders status:', updateErr)
    }
  }

  revalidatePath('/vendor/dashboard')
}

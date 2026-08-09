import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aadutygzgrbexxuznqlr.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHV0eWd6Z3JiZXh4dXpucWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTU3MiwiZXhwIjoyMDkzNjgxNTcyfQ.omCGKMc8gneLLbPM5_D0oyQgPgaBE3szA7WGmm8rfaQ'
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, shopId, date, slot, batchId, status } = body

    if (action === 'create') {
      if (!shopId || !date || !slot) {
        return NextResponse.json({ error: 'Missing required parameters: shopId, date, slot' }, { status: 400 })
      }

      // 1. Check if a batch already exists for this date and slot
      const { data: existingBatches } = await supabaseAdmin
        .from('delivery_batches')
        .select('id')
        .eq('shop_id', shopId)
        .eq('delivery_date', date)
        .eq('delivery_slot', slot.toLowerCase())

      let targetBatchId: string

      if (existingBatches && existingBatches.length > 0) {
        targetBatchId = existingBatches[0].id
      } else {
        // Create new delivery batch bypassing RLS with Admin client
        const { data: batch, error: batchErr } = await supabaseAdmin
          .from('delivery_batches')
          .insert({
            shop_id: shopId,
            delivery_date: date,
            delivery_slot: slot.toLowerCase(),
            status: 'pending'
          })
          .select('id')
          .single()

        if (batchErr) {
          return NextResponse.json({ error: batchErr.message }, { status: 500 })
        }
        targetBatchId = batch.id
      }

      // 2. Link orders to batch
      const { error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({ delivery_batch_id: targetBatchId })
        .eq('shop_id', shopId)
        .eq('delivery_date', date)
        .eq('delivery_slot', slot.toLowerCase())
        .not('payment_type', 'is', null)
        .neq('status', 'cancelled')
        .is('delivery_batch_id', null)

      if (updateErr) {
        console.error('Error linking orders to batch:', updateErr)
      }

      return NextResponse.json({ success: true, batchId: targetBatchId })
    } else if (action === 'update_status') {
      if (!batchId || !status) {
        return NextResponse.json({ error: 'Missing batchId or status' }, { status: 400 })
      }

      const { error: batchErr } = await supabaseAdmin
        .from('delivery_batches')
        .update({ status })
        .eq('id', batchId)

      if (batchErr) {
        return NextResponse.json({ error: batchErr.message }, { status: 500 })
      }

      const orderStatusMap: Record<string, string> = {
        pending: 'accepted',
        delivering: 'out_for_delivery',
        completed: 'delivered'
      }

      const orderStatus = orderStatusMap[status]
      if (orderStatus) {
        await supabaseAdmin
          .from('orders')
          .update({ status: orderStatus })
          .eq('delivery_batch_id', batchId)
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}

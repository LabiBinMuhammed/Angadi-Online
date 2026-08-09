import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, orderId, nextStatus, itemId, newStatus, actualValue, paymentType } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400, headers: corsHeaders() })
    }

    if (action === 'update_order_status') {
      // If accepting pending order, auto-approve any pending items
      if (nextStatus === 'accepted') {
        const { data: pendingItems } = await supabaseAdmin
          .from('order_items')
          .select('id, estimated_price, final_price')
          .eq('order_id', orderId)
          .eq('status', 'pending')

        if (pendingItems && pendingItems.length > 0) {
          for (const item of pendingItems) {
            const finalP = item.estimated_price ?? item.final_price ?? 0
            await supabaseAdmin
              .from('order_items')
              .update({ status: 'approved', final_price: finalP })
              .eq('id', item.id)
          }
        }

        // Recalculate order final total
        const { data: allItems } = await supabaseAdmin
          .from('order_items')
          .select('final_price')
          .eq('order_id', orderId)

        const total = allItems?.reduce((sum, item) => sum + Number(item.final_price || 0), 0) || 0
        await supabaseAdmin
          .from('orders')
          .update({ status: nextStatus, total_final_price: total })
          .eq('id', orderId)
      } else {
        await supabaseAdmin
          .from('orders')
          .update({ status: nextStatus })
          .eq('id', orderId)
      }

      // Fetch fresh order with items
      const { data: updatedOrder } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single()

      return NextResponse.json({ success: true, order: updatedOrder }, { headers: corsHeaders() })
    }

    if (action === 'update_item_status') {
      if (!itemId || !newStatus) {
        return NextResponse.json({ error: 'itemId and newStatus required' }, { status: 400, headers: corsHeaders() })
      }

      const { data: item } = await supabaseAdmin
        .from('order_items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404, headers: corsHeaders() })
      }

      let newFinalPrice = item.estimated_price ?? item.final_price ?? 0
      let newActualVal = item.actual_value

      if (newStatus === 'rejected') {
        newFinalPrice = 0
      } else if (newStatus === 'adjusted') {
        const val = Number(actualValue)
        if (!isNaN(val) && item.requested_value && item.estimated_price) {
          newActualVal = val
          newFinalPrice = Number(((val / item.requested_value) * item.estimated_price).toFixed(2))
        }
      } else if (newStatus === 'approved') {
        newFinalPrice = item.estimated_price ?? item.final_price ?? 0
      }

      const updatePayload: any = { status: newStatus, final_price: newFinalPrice }
      if (newActualVal !== undefined) updatePayload.actual_value = newActualVal

      await supabaseAdmin.from('order_items').update(updatePayload).eq('id', itemId)

      // Recalculate order total
      const { data: allItems } = await supabaseAdmin
        .from('order_items')
        .select('final_price')
        .eq('order_id', orderId)

      const newTotal = allItems?.reduce((sum, oi) => sum + Number(oi.final_price || 0), 0) || 0
      await supabaseAdmin.from('orders').update({ total_final_price: newTotal }).eq('id', orderId)

      const { data: updatedOrder } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single()

      return NextResponse.json({ success: true, order: updatedOrder }, { headers: corsHeaders() })
    }

    if (action === 'update_payment_type') {
      await supabaseAdmin.from('orders').update({ payment_type: paymentType }).eq('id', orderId)
      
      const { data: updatedOrder } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single()

      return NextResponse.json({ success: true, order: updatedOrder }, { headers: corsHeaders() })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders() })
  } catch (err: any) {
    console.error('Vendor orders API error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500, headers: corsHeaders() })
  }
}

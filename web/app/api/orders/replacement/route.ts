import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

const REASON_MAP: Record<string, string> = {
  wrong_item: 'Wrong Item',
  damaged: 'Damaged',
  quality_issue: 'Poor Quality',
  poor_quality: 'Poor Quality',
  expired: 'Expired',
  missing_item: 'Missing Item',
  other: 'Other',
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { orderId, reason, description, customerImages, items } = body

    if (!orderId || !reason || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'orderId, reason, and items are required.' }, { status: 400 })
    }

    // Map reason to valid DB constraint value
    const dbReason = REASON_MAP[reason.toLowerCase()] || 'Other'

    // 1. Fetch order details to get shopId and verify owner
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('shop_id, user_id, status')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized order access.' }, { status: 403 })
    }

    // 2. Insert replacement request using Admin client
    const { data: request, error: requestErr } = await supabaseAdmin
      .from('replacement_requests')
      .insert({
        order_id: orderId,
        user_id: user.id,
        shop_id: order.shop_id,
        reason: dbReason,
        description: description ? String(description).trim() : null,
        status: 'Pending',
        customer_images: Array.isArray(customerImages) ? customerImages : []
      })
      .select()
      .single()

    if (requestErr) {
      return NextResponse.json({ error: requestErr.message }, { status: 400 })
    }

    // 3. Insert replacement items
    const replacementItemsData = items.map((item: any) => ({
      replacement_request_id: request.id,
      order_item_id: item.orderItemId || item.order_item_id,
      quantity: Number(item.quantity) || 1
    }))

    const { error: itemsErr } = await supabaseAdmin
      .from('replacement_items')
      .insert(replacementItemsData)

    if (itemsErr) {
      // Rollback request insertion
      await supabaseAdmin.from('replacement_requests').delete().eq('id', request.id)
      return NextResponse.json({ error: itemsErr.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, requestId: request.id })
  } catch (err: any) {
    console.error('Replacement API error:', err)
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 })
  }
}

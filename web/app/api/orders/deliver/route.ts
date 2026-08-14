import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    // Verify order exists
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update status to delivered using Admin client with full privileges
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({ status: 'delivered', updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (updateErr) throw updateErr

    // Automatically award 1 Star if order >= ₹150
    let starResult = null
    try {
      const { awardOrderStarIfEligible } = await import('@/lib/loyalty')
      starResult = await awardOrderStarIfEligible(orderId)
    } catch (starErr) {
      console.error('Error awarding star on delivery:', starErr)
    }

    return NextResponse.json({ success: true, starResult })
  } catch (err: any) {
    console.error('Confirm delivery API error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update order status' }, { status: 500 })
  }
}

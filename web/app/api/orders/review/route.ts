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

    const body = await req.json()
    const {
      shopId,
      orderId,
      product_quality_rating,
      delivery_experience_rating,
      order_accuracy_rating,
      overall_experience_rating,
      product_quality_description,
      delivery_experience_description,
      order_accuracy_description,
      overall_experience_description,
    } = body

    if (!shopId || !orderId) {
      return NextResponse.json({ error: 'shopId and orderId are required' }, { status: 400 })
    }

    const payload = {
      shop_id: shopId,
      user_id: user.id,
      order_id: orderId,
      product_quality_rating: product_quality_rating || 5,
      delivery_experience_rating: delivery_experience_rating || 5,
      delivery_timeliness_rating: delivery_experience_rating || 5,
      order_accuracy_rating: order_accuracy_rating || 5,
      overall_experience_rating: overall_experience_rating || 5,
      product_quality_description: product_quality_description || null,
      product_quality_review: product_quality_description || null,
      delivery_experience_description: delivery_experience_description || null,
      delivery_timeliness_review: delivery_experience_description || null,
      order_accuracy_description: order_accuracy_description || null,
      order_accuracy_review: order_accuracy_description || null,
      overall_experience_description: overall_experience_description || null,
      overall_experience_review: overall_experience_description || null,
      title: null,
      review: null,
      updated_at: new Date().toISOString()
    }

    const { error: upsertErr } = await supabaseAdmin
      .from('shop_reviews')
      .upsert(payload, { onConflict: 'order_id' })

    if (upsertErr) throw upsertErr

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Review submit error:', err)
    return NextResponse.json({ error: err.message || 'Failed to submit review' }, { status: 500 })
  }
}

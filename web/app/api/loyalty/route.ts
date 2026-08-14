import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getUserLoyalty, claimScratchCardReward, awardOrderStarIfEligible } from '@/lib/loyalty'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const loyalty = await getUserLoyalty(user.id)
    return NextResponse.json({ success: true, loyalty })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch loyalty status' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { action, orderId } = body

    if (action === 'award_order' && orderId) {
      const result = await awardOrderStarIfEligible(orderId)
      return NextResponse.json({ success: true, result })
    }

    if (action === 'claim_scratch_card') {
      const result = await claimScratchCardReward(user.id)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to process loyalty request' }, { status: 500 })
  }
}

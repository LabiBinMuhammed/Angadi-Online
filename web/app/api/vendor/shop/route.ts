import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aadutygzgrbexxuznqlr.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZHV0eWd6Z3JiZXh4dXpucWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODEwNTU3MiwiZXhwIjoyMDkzNjgxNTcyfQ.omCGKMc8gneLLbPM5_D0oyQgPgaBE3szA7WGmm8rfaQ'
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// POST: Create a new shop and link to vendor
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, name, type, locationId, logoUrl, bannerUrl, description, openingTime, closingTime } = body

    if (!userId || !name) {
      return NextResponse.json({ error: 'Missing required parameters: userId and name' }, { status: 400, headers: corsHeaders })
    }

    // 0. Sync user in public.users if not present
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!existingUser) {
      const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (authUser) {
        await supabaseAdmin.from('users').insert({
          id: userId,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'Vendor',
          role: authUser.user_metadata?.role || 'shop_owner',
          phone: authUser.user_metadata?.phone || `no-phone-${userId.substring(0, 8)}`,
          is_active: true
        })
      }
    }

    // 1. Create shop with fallback if extra columns missing in DB
    const fullPayload: any = {
      name,
      type: type || null,
      location_id: locationId || null,
    }
    if (logoUrl) fullPayload.logo_url = logoUrl.trim()
    if (bannerUrl) fullPayload.banner_url = bannerUrl.trim()
    if (description) fullPayload.description = description.trim()
    if (openingTime) fullPayload.opening_time = openingTime.trim()
    if (closingTime) fullPayload.closing_time = closingTime.trim()

    let shopData: any = null
    let { data: resData, error: shopErr } = await supabaseAdmin
      .from('shops')
      .insert(fullPayload)
      .select()
      .single()

    if (shopErr && (shopErr.message.includes('column') || shopErr.message.includes('schema cache'))) {
      const fallbackPayload = { name, type: type || null, location_id: locationId || null }
      const fallbackRes = await supabaseAdmin
        .from('shops')
        .insert(fallbackPayload)
        .select()
        .single()
      resData = fallbackRes.data
      shopErr = fallbackRes.error
    }

    if (shopErr) {
      return NextResponse.json({ error: shopErr.message }, { status: 400, headers: corsHeaders })
    }
    shopData = resData

    // 2. Link shop in shop_owners
    const { error: linkErr } = await supabaseAdmin
      .from('shop_owners')
      .insert({ shop_id: shopData.id, user_id: userId })

    if (linkErr) {
      await supabaseAdmin.from('shops').delete().eq('id', shopData.id)
      return NextResponse.json({ error: linkErr.message }, { status: 400, headers: corsHeaders })
    }

    return NextResponse.json({ success: true, shop: shopData }, { headers: corsHeaders })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500, headers: corsHeaders })
  }
}

// PUT: Update an existing shop
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { shopId, name, type, locationId, isActive, logoUrl, bannerUrl, description, openingTime, closingTime } = body

    if (!shopId || !name) {
      return NextResponse.json({ error: 'Missing required parameters: shopId and name' }, { status: 400, headers: corsHeaders })
    }

    let finalType = type ? type.replace('_inactive', '') : null
    if (finalType && isActive === false) {
      finalType = `${finalType}_inactive`
    }

    const fullPayload: any = {
      name,
      type: finalType,
      location_id: locationId || null,
    }
    if (logoUrl !== undefined) fullPayload.logo_url = logoUrl ? logoUrl.trim() : null
    if (bannerUrl !== undefined) fullPayload.banner_url = bannerUrl ? bannerUrl.trim() : null
    if (description !== undefined) fullPayload.description = description ? description.trim() : null
    if (openingTime !== undefined) fullPayload.opening_time = openingTime ? openingTime.trim() : null
    if (closingTime !== undefined) fullPayload.closing_time = closingTime ? closingTime.trim() : null

    let { data, error } = await supabaseAdmin
      .from('shops')
      .update(fullPayload)
      .eq('id', shopId)
      .select()
      .single()

    if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
      const fallbackPayload = { name, type: finalType, location_id: locationId || null }
      const fallbackRes = await supabaseAdmin
        .from('shops')
        .update(fallbackPayload)
        .eq('id', shopId)
        .select()
        .single()
      data = fallbackRes.data
      error = fallbackRes.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders })
    }

    return NextResponse.json({ success: true, shop: data }, { headers: corsHeaders })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500, headers: corsHeaders })
  }
}

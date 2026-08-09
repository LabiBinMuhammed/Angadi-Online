'use server'

import { createClient } from '@supabase/supabase-js'

export async function createShopAction(
  userId: string,
  name: string,
  type: string | null,
  locationId: string | null,
  extraFields?: {
    logoUrl?: string | null
    bannerUrl?: string | null
    description?: string | null
    openingTime?: string | null
    closingTime?: string | null
  }
) {
  // Use the service role key to bypass RLS for the initial shop creation and linking
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 0. Ensure the user exists in the public.users table (Sync if missing)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (!existingUser) {
      const { data: { user: authUser }, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (!authErr && authUser) {
        const { error: insertErr } = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'Vendor',
            role: authUser.user_metadata?.role || 'shop_owner',
            phone: authUser.user_metadata?.phone || `no-phone-${userId.substring(0, 8)}`,
            is_active: true
          })
          
        if (insertErr) {
          return { error: `User sync failed: ${insertErr.message}` }
        }
      } else {
        return { error: 'Failed to retrieve auth user for sync' }
      }
    }

    // 1. Create new shop (with automatic fallback if extra columns are missing in DB schema)
    const shopInsertPayload: any = {
      name,
      type: type || null,
      location_id: locationId || null,
    }
    if (extraFields?.logoUrl) shopInsertPayload.logo_url = extraFields.logoUrl.trim()
    if (extraFields?.bannerUrl) shopInsertPayload.banner_url = extraFields.bannerUrl.trim()
    if (extraFields?.description) shopInsertPayload.description = extraFields.description.trim()
    if (extraFields?.openingTime) shopInsertPayload.opening_time = extraFields.openingTime.trim()
    if (extraFields?.closingTime) shopInsertPayload.closing_time = extraFields.closingTime.trim()

    let shopData: any = null
    let { data: resData, error: shopErr } = await supabaseAdmin
      .from('shops')
      .insert(shopInsertPayload)
      .select()
      .single()

    if (shopErr && (shopErr.message.includes('column') || shopErr.message.includes('schema cache'))) {
      // Fallback: DB schema missing extra columns
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
      return { error: shopErr.message }
    }
    shopData = resData

    // 2. Link shop to this vendor
    const { error: linkErr } = await supabaseAdmin
      .from('shop_owners')
      .insert({ shop_id: shopData.id, user_id: userId })

    if (linkErr) {
      await supabaseAdmin.from('shops').delete().eq('id', shopData.id)
      return { error: linkErr.message }
    }

    return { success: true, shop: shopData }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}

export async function updateShopAction(
  shopId: string,
  name: string,
  type: string | null,
  locationId: string | null,
  isActive: boolean,
  extraFields?: {
    logoUrl?: string | null
    bannerUrl?: string | null
    description?: string | null
    openingTime?: string | null
    closingTime?: string | null
  }
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    let finalType = type ? type.replace('_inactive', '') : null
    if (finalType && !isActive) {
      finalType = `${finalType}_inactive`
    }

    const shopUpdatePayload: any = {
      name,
      type: finalType,
      location_id: locationId || null,
    }
    if (extraFields?.logoUrl !== undefined) shopUpdatePayload.logo_url = extraFields.logoUrl ? extraFields.logoUrl.trim() : null
    if (extraFields?.bannerUrl !== undefined) shopUpdatePayload.banner_url = extraFields.bannerUrl ? extraFields.bannerUrl.trim() : null
    if (extraFields?.description !== undefined) shopUpdatePayload.description = extraFields.description ? extraFields.description.trim() : null
    if (extraFields?.openingTime !== undefined) shopUpdatePayload.opening_time = extraFields.openingTime ? extraFields.openingTime.trim() : null
    if (extraFields?.closingTime !== undefined) shopUpdatePayload.closing_time = extraFields.closingTime ? extraFields.closingTime.trim() : null

    let { data, error } = await supabaseAdmin
      .from('shops')
      .update(shopUpdatePayload)
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
      return { error: error.message }
    }

    return { success: true, shop: data }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}

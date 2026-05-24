'use server'

import { createClient } from '@supabase/supabase-js'

export async function createShopAction(
  userId: string,
  name: string,
  type: string | null,
  locationId: string | null
) {
  // Use the service role key to bypass RLS for the initial shop creation and linking
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 0. Ensure the user exists in the public.users table (Sync if missing)
    // This prevents the "violates foreign key constraint shop_owners_user_id_fkey" error
    // if the Supabase auth trigger hasn't populated the public.users table yet.
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

    // 1. Create new shop
    const { data: shopData, error: shopErr } = await supabaseAdmin
      .from('shops')
      .insert({
        name,
        type: type || null,
        location_id: locationId || null,
      })
      .select()
      .single()

    if (shopErr) {
      return { error: shopErr.message }
    }

    // 2. Link shop to this vendor
    const { error: linkErr } = await supabaseAdmin
      .from('shop_owners')
      .insert({ shop_id: shopData.id, user_id: userId })

    if (linkErr) {
      // Rollback shop creation if linking fails
      await supabaseAdmin.from('shops').delete().eq('id', shopData.id)
      return { error: linkErr.message }
    }

    return { success: true, shop: shopData }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred' }
  }
}

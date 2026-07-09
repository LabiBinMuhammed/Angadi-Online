'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Helper to verify that the logged-in user is a vendor of the specified shop.
 */
async function verifyVendorAccess(shopId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if they own the shop
  const { data: ownerRecord, error } = await supabase
    .from('shop_owners')
    .select('shop_id')
    .eq('user_id', user.id)
    .eq('shop_id', shopId)
    .maybeSingle()

  if (error || !ownerRecord) {
    throw new Error('Unauthorized: You do not own this shop')
  }

  return user.id
}

/**
 * Records a customer repayment.
 */
export async function recordRepaymentAction(
  shopId: string,
  userId: string,
  amount: number,
  notes: string
) {
  await verifyVendorAccess(shopId)
  const supabase = await createClient()

  // Invoke RPC record_customer_repayment
  const { data, error } = await supabase.rpc('record_customer_repayment', {
    p_shop_id: shopId,
    p_user_id: userId,
    p_amount: amount,
    p_notes: notes
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/[locale]/(vendor)/vendor/credit', 'layout')
  revalidatePath(`/[locale]/(vendor)/vendor/credit/${userId}`, 'page')
  return data
}

/**
 * Grants credit to a customer or activates their credit account.
 */
export async function grantCreditAction(
  shopId: string,
  userId: string,
  limit: number
) {
  await verifyVendorAccess(shopId)
  const supabase = await createClient()

  // Check if a row already exists
  const { data: existing, error: fetchErr } = await supabase
    .from('shop_user_credit')
    .select('id')
    .eq('shop_id', shopId)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchErr) throw fetchErr

  if (existing) {
    // If it exists, enable it and update limit
    const { error: updateErr } = await supabase
      .from('shop_user_credit')
      .update({
        is_credit_enabled: true,
        credit_limit: limit,
        is_blocked: false
      })
      .eq('id', existing.id)

    if (updateErr) throw updateErr
  } else {
    // Insert new row
    const { error: insertErr } = await supabase
      .from('shop_user_credit')
      .insert({
        shop_id: shopId,
        user_id: userId,
        is_credit_enabled: true,
        credit_limit: limit,
        used_amount: 0,
        is_blocked: false
      })

    if (insertErr) throw insertErr
  }

  revalidatePath('/[locale]/(vendor)/vendor/credit', 'layout')
  return { success: true }
}

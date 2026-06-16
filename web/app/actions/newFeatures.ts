'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Toggles a shop's pinned status for the current user.
 */
export async function togglePinnedShop(shopId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if already pinned
  const { data: existing, error: fetchErr } = await supabase
    .from('customer_pinned_shops')
    .select('id')
    .eq('user_id', user.id)
    .eq('shop_id', shopId)
    .maybeSingle()

  if (fetchErr) throw fetchErr

  if (existing) {
    // Unpin
    const { error: deleteErr } = await supabase
      .from('customer_pinned_shops')
      .delete()
      .eq('user_id', user.id)
      .eq('shop_id', shopId)

    if (deleteErr) throw deleteErr
    
    revalidatePath('/[locale]/(main)/home', 'layout')
    revalidatePath('/[locale]/(main)/pinned-shops', 'page')
    return { pinned: false }
  } else {
    // Pin (Check count first)
    const { count, error: countErr } = await supabase
      .from('customer_pinned_shops')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countErr) throw countErr
    if (count !== null && count >= 3) {
      throw new Error('LimitReached')
    }

    const { error: insertErr } = await supabase
      .from('customer_pinned_shops')
      .insert({ user_id: user.id, shop_id: shopId })

    if (insertErr) throw insertErr

    revalidatePath('/[locale]/(main)/home', 'layout')
    revalidatePath('/[locale]/(main)/pinned-shops', 'page')
    return { pinned: true }
  }
}

/**
 * Toggles an item's favorite status for the current user.
 */
export async function toggleFavoriteItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if already favorited
  const { data: existing, error: fetchErr } = await supabase
    .from('customer_favorite_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .maybeSingle()

  if (fetchErr) throw fetchErr

  if (existing) {
    // Unfavorite
    const { error: deleteErr } = await supabase
      .from('customer_favorite_items')
      .delete()
      .eq('user_id', user.id)
      .eq('item_id', itemId)

    if (deleteErr) throw deleteErr

    revalidatePath('/[locale]/(main)/home', 'layout')
    revalidatePath('/[locale]/(main)/favorites', 'page')
    return { favorited: false }
  } else {
    // Favorite
    const { error: insertErr } = await supabase
      .from('customer_favorite_items')
      .insert({ user_id: user.id, item_id: itemId })

    if (insertErr) throw insertErr

    revalidatePath('/[locale]/(main)/home', 'layout')
    revalidatePath('/[locale]/(main)/favorites', 'page')
    return { favorited: true }
  }
}

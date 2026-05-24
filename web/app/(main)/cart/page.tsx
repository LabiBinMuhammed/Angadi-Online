import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CartPageClient from './CartPageClient'

export const metadata: Metadata = { title: 'Cart' }

export default async function CartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div className="p-4">Please log in to view your cart.</div>
  }

  let pendingOrders = []
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, total_estimated_price, total_final_price, status, created_at,
        shops (id, name),
        order_items (
          id, item_id, variant_id, requested_value, estimated_price, actual_value, final_price, status,
          items (id, name),
          item_variants:vw_item_variants_with_fallback (id, label, image_url)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      return <div className="p-4">Error loading cart: {error.message}</div>
    }
    pendingOrders = data || []
  } catch (err: any) {
    console.error(err)
    return <div className="p-4">Exception: {err.message}</div>
  }

  return <CartPageClient initialOrders={pendingOrders} />
}

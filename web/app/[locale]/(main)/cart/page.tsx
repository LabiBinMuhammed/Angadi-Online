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
        id, shop_id, total_estimated_price, total_final_price, status, created_at, delivery_date, delivery_slot,
        shops (id, name),
        order_items (
          id, item_id, variant_id, requested_value, estimated_price, actual_value, final_price, status,
          items (
            id,
            name,
            image_url,
            item_sell_config (
              id,
              sell_mode,
              price_per_base_unit,
              base_unit_id
            ),
            item_variants:vw_item_variants_with_fallback (
              id, label, image_url, price, value, is_default, variant_type
            )
          ),
          item_variants:vw_item_variants_with_fallback (id, label, image_url, price, value, variant_type)
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .is('payment_type', null)
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

  let units: any[] = []
  try {
    const { data: unitsData } = await supabase.from('units').select('*')
    units = unitsData || []
  } catch (err) {
    console.error('Error loading units:', err)
  }

  // Fetch shop delivery settings and order counts for capacity check
  const activeOrders = pendingOrders.filter((o: any) => o.status === 'pending' && !o.payment_type)
  const shopIds = activeOrders.map((o: any) => o.shop_id).filter(Boolean)

  let deliverySettings: any[] = []
  let placedOrders: any[] = []

  if (shopIds.length > 0) {
    try {
      const { data: settingsData } = await supabase
        .from('shop_delivery_settings')
        .select('*')
        .in('shop_id', shopIds)
      
      deliverySettings = settingsData || []

      const todayStr = new Date().toISOString().split('T')[0]
      const maxDateStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data: countsData } = await supabase
        .from('orders')
        .select('shop_id, delivery_date, delivery_slot')
        .in('shop_id', shopIds)
        .not('payment_type', 'is', null)
        .neq('status', 'cancelled')
        .gte('delivery_date', todayStr)
        .lte('delivery_date', maxDateStr)

      placedOrders = countsData || []
    } catch (err) {
      console.error('Error loading delivery settings/counts:', err)
    }
  }

  return (
    <CartPageClient 
      initialOrders={pendingOrders} 
      deliverySettings={deliverySettings}
      placedOrders={placedOrders}
      units={units}
    />
  )
}


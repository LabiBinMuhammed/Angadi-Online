import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Shop, Item, Category, Unit } from '@/types'
import HomeClient from './HomeClient'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Village Market — Home',
  description: 'Browse nearby shops and order fresh items from your local village market.',
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let role: string | undefined
  let addresses: any[] = []
  if (user) {
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    role = (data as any)?.role || user.user_metadata?.role

    const { data: addrs } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      
    if (addrs) addresses = addrs
  }

  const cookieStore = await cookies()
  const locationId = cookieStore.get('selected_location_id')?.value

  if (!locationId) {
    redirect('/location')
  }

  const [{ data: shops }, { data: items }, { data: categories }, locationData, { data: units }] = await Promise.all([
    supabase
      .from('shops')
      .select('id, name, type, location_id, created_at, updated_at, shop_owners(users(name))')
      .eq('location_id', locationId)
      .order('name'),
    supabase
      .from('items')
      .select('*, item_images(image_url), item_sell_config(*), item_variants:vw_item_variants_with_fallback(*)')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('categories')
      .select('id, name, description, is_active, updated_at')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('locations')
      .select('name')
      .eq('id', locationId)
      .single(),
    supabase
      .from('units')
      .select('*')
  ])

  const shopList = (shops ?? []) as Shop[]
  const itemList = (items ?? []) as Item[]
  const catList  = (categories ?? []) as Category[]
  const unitList = (units ?? []) as Unit[]
  const locationName = (locationData?.data as any)?.name || 'Village Market'

  // Find pending orders and their items
  let initialCartItems: any[] = []
  if (user) {
    const { data: pendingOrders } = await supabase
      .from('orders')
      .select('id, order_items(*)')
      .eq('user_id', user.id)
      .eq('status', 'pending')
    
    if (pendingOrders) {
      initialCartItems = pendingOrders.flatMap((o: any) => 
        o.order_items?.map((item: any) => ({ 
          ...item, 
          orderId: o.id 
        })) || []
      )
    }
  }

  // Group items by shop_id for O(1) lookup in the client
  const itemsByShop: Record<string, Item[]> = {}
  for (const item of itemList) {
    const sid = (item as any).shop_id as string
    if (!itemsByShop[sid]) itemsByShop[sid] = []
    itemsByShop[sid].push(item)
  }

  return (
    <HomeClient
      shops={shopList}
      allItems={itemsByShop}
      categories={catList}
      units={unitList}
      initialCartItems={initialCartItems}
      user={user}
      role={role}
      locationName={locationName}
      addresses={addresses}
    />
  )
}

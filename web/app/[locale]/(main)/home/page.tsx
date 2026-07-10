import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Shop, Item, Category, Unit } from '@/types'
import HomeClient from './HomeClient'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Angadi Online — Home',
  description: 'Browse nearby shops and order fresh items from your local Angadi Online marketplace.',
}

export default async function HomePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  let role: string | undefined
  let addresses: any[] = []
  
  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  role = (data as any)?.role || user.user_metadata?.role

  const { data: addrs } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
      
  if (addrs) addresses = addrs

  const cookieStore = await cookies()
  let locationId = cookieStore.get('selected_location_id')?.value

  if (!locationId) {
    // 1. Try to get default/any location from addresses
    if (addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.is_default && a.location_id) || addresses.find(a => a.location_id)
      if (defaultAddr) {
        locationId = defaultAddr.location_id
      }
    }

    // 2. Fallback to first location from DB
    if (!locationId) {
      const { data: firstLoc } = await supabase
        .from('locations')
        .select('id')
        .order('name')
        .limit(1)
        .maybeSingle()
      if (firstLoc) {
        locationId = firstLoc.id
      }
    }

    // 3. If still no location, redirect
    if (!locationId) {
      redirect('/location')
    }
  }

  const [{ data: shops }, { data: items }, { data: categories }, locationData, { data: units }] = await Promise.all([
    supabase
      .from('shops')
      .select('id, name, type, location_id, created_at, updated_at, shop_owners(users(name)), shop_subscription(restriction_level)')
      .eq('location_id', locationId),
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
      .order('display_order', { ascending: true }),
    supabase
      .from('locations')
      .select('name')
      .eq('id', locationId)
      .single(),
    supabase
      .from('units')
      .select('*')
  ])

  const activeShops = ((shops ?? []) as Shop[]).filter(s => !s.type?.endsWith('_inactive'))
  const shopList = [...activeShops].sort((a: any, b: any) => {
    const aLevel = (a.shop_subscription as any)?.restriction_level || 0
    const bLevel = (b.shop_subscription as any)?.restriction_level || 0
    
    if (aLevel >= 2 && bLevel < 2) return 1
    if (aLevel < 2 && bLevel >= 2) return -1
    return a.name.localeCompare(b.name)
  })
  const catList  = (categories ?? []) as Category[]
  const activeCategoryIds = new Set(catList.map(c => c.id))
  const itemList = ((items ?? []) as Item[]).filter(item => 
    !item.category_id || activeCategoryIds.has(item.category_id)
  )
  const unitList = (units ?? []) as Unit[]
  const locationName = (locationData?.data as any)?.name || 'Angadi Online'

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

  // Fetch initial pinned shops and favorite items if user is logged in
  let initialPinnedShopIds: string[] = []
  let initialFavoriteItemIds: string[] = []

  if (user) {
    try {
      const [{ data: pinned }, { data: favorites }] = await Promise.all([
        supabase.from('customer_pinned_shops').select('shop_id').eq('user_id', user.id),
        supabase.from('customer_favorite_items').select('item_id').eq('user_id', user.id)
      ])
      if (pinned) initialPinnedShopIds = pinned.map((p: any) => p.shop_id)
      if (favorites) initialFavoriteItemIds = favorites.map((f: any) => f.item_id)
    } catch (e) {
      console.error('Failed to pre-fetch pinned shops / favorite items:', e)
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
    <Suspense fallback={<div>Loading...</div>}>
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
        initialPinnedShopIds={initialPinnedShopIds}
        initialFavoriteItemIds={initialFavoriteItemIds}
      />
    </Suspense>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CategorySelector, { type CategoryWithStats } from '@/components/vendor/album/CategorySelector'

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages: any = {}
  try {
    messages = require(`../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../messages/en.json')
  }
  const title = messages?.vendor_album?.my_catalog_title || 'Catalog Album'
  return { title: `${title} — Vendor Panel` }
}

export default async function VendorCatalogPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/auth/login`)
  }

  // Get vendor's shop
  const { data: shopOwners } = await supabase
    .from('shop_owners')
    .select('shop_id, shops(id, name)')
    .eq('user_id', user.id)

  const primaryShop = shopOwners?.[0]?.shops as any
  const primaryShopId = primaryShop?.id || shopOwners?.[0]?.shop_id

  if (!primaryShopId) {
    redirect(`/${locale}/vendor/shop`)
  }

  // Fetch all active categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  // Fetch counts of demo items per category (up to 5000 items)
  const { data: allDemoItems } = await supabase
    .from('demo_items')
    .select('id, category_id')
    .range(0, 4999)

  // Fetch vendor's added shop items with demo_item_id
  const { data: shopItems } = await supabase
    .from('items')
    .select('id, category_id, demo_item_id')
    .eq('shop_id', primaryShopId)
    .is('deleted_at', null)
    .not('demo_item_id', 'is', null)
    .range(0, 4999)

  // Aggregate stats per category
  const demoCountsByCat = new Map<string, number>()
  for (const di of allDemoItems || []) {
    if (di.category_id) {
      demoCountsByCat.set(di.category_id, (demoCountsByCat.get(di.category_id) || 0) + 1)
    }
  }

  const addedCountsByCat = new Map<string, number>()
  for (const si of shopItems || []) {
    if (si.category_id) {
      addedCountsByCat.set(si.category_id, (addedCountsByCat.get(si.category_id) || 0) + 1)
    }
  }

  const categoriesWithStats: CategoryWithStats[] = (categories || []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    display_order: cat.display_order ?? 0,
    totalDemoItems: demoCountsByCat.get(cat.id) || 0,
    addedShopItems: addedCountsByCat.get(cat.id) || 0
  }))

  return (
    <CategorySelector
      categories={categoriesWithStats}
      shopName={primaryShop?.name}
    />
  )
}

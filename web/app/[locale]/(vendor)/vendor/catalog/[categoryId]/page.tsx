import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProductAlbum from '@/components/vendor/album/ProductAlbum'
import type { Category, DemoItem, DemoSellConfig, DemoVariant, Unit, Item } from '@/types'

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; categoryId: string }>
}): Promise<Metadata> {
  const { categoryId } = await params
  const supabase = await createClient()
  const { data: category } = await supabase
    .from('categories')
    .select('name')
    .eq('id', categoryId)
    .single()

  return {
    title: `${category?.name || 'Category Album'} — Vendor Catalog`
  }
}

export default async function VendorCategoryAlbumPage({
  params
}: {
  params: Promise<{ locale: string; categoryId: string }>
}) {
  const { locale, categoryId } = await params
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
    .select('shop_id')
    .eq('user_id', user.id)

  const primaryShopId = shopOwners?.[0]?.shop_id

  if (!primaryShopId) {
    redirect(`/${locale}/vendor/shop`)
  }

  // Fetch category info
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .single()

  if (catError || !category) {
    notFound()
  }

  // Parallel fetch of demo items, configs, variants, units, and shop's existing items
  const [demoItemsRes, unitsRes, shopItemsRes] = await Promise.all([
    supabase
      .from('demo_items')
      .select('*')
      .eq('category_id', categoryId)
      .order('display_order', { ascending: true }),
    supabase.from('units').select('*'),
    supabase
      .from('items')
      .select('*, item_sell_config(*), item_variants(*)')
      .eq('shop_id', primaryShopId)
      .eq('category_id', categoryId)
      .is('deleted_at', null)
  ])

  const demoItems = (demoItemsRes.data ?? []) as DemoItem[]
  const demoItemIds = demoItems.map((d) => d.id)

  // Fetch configs and variants for these demo items
  const [demoConfigsRes, demoVariantsRes] = await Promise.all([
    demoItemIds.length > 0
      ? supabase.from('demo_sell_config').select('*').in('demo_item_id', demoItemIds)
      : Promise.resolve({ data: [] }),
    demoItemIds.length > 0
      ? supabase
          .from('demo_variants')
          .select('*')
          .in('demo_item_id', demoItemIds)
          .order('display_order', { ascending: true })
      : Promise.resolve({ data: [] })
  ])

  return (
    <ProductAlbum
      shopId={primaryShopId}
      category={category as Category}
      demoItems={demoItems}
      demoConfigs={(demoConfigsRes.data ?? []) as DemoSellConfig[]}
      demoVariants={(demoVariantsRes.data ?? []) as DemoVariant[]}
      units={(unitsRes.data ?? []) as Unit[]}
      existingShopItems={(shopItemsRes.data ?? []) as Item[]}
    />
  )
}

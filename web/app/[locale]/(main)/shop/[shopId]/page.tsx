import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Shop, Item, Category } from '@/types'
import ShopPageClient from './ShopPageClient'
import { Video, Phone, Search, MoreVertical } from 'lucide-react'

type Props = { params: Promise<{ shopId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopId } = await params
  const supabase = await createClient()
  const { data: shop } = await supabase.from('shops').select('name').eq('id', shopId).single()
  
  const shopName = shop?.name ?? 'Shop'
  const description = `Explore products and buy fresh produce, groceries, and more from ${shopName} at Angadi Online.`

  return { 
    title: `${shopName} | Angadi Online`,
    description,
  }
}

export default async function ShopPage({ params }: Props) {
  const { shopId } = await params
  const supabase = await createClient()

  const [
    { data: shop },
    { data: items },
    { data: categories },
    { data: units },
    { data: subscription },
    { data: ratingSummary },
    { data: reviews }
  ] = await Promise.all([
    supabase.from('shops').select('*').eq('id', shopId).single(),
    supabase.from('items')
      .select('*, item_images(image_url), item_sell_config(*), item_variants:vw_item_variants_with_fallback(*)')
      .eq('shop_id', shopId).eq('is_active', true).is('deleted_at', null).order('name'),
    supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
    supabase.from('units').select('*'),
    supabase.from('shop_subscription').select('restriction_level').eq('shop_id', shopId).maybeSingle(),
    supabase.from('shop_rating_summary').select('*').eq('shop_id', shopId).maybeSingle(),
    supabase.from('shop_reviews').select('*, users(name)').eq('shop_id', shopId).order('created_at', { ascending: false })
  ])

  if (!shop || shop.type?.endsWith('_inactive')) notFound()

  const shopData  = shop as Shop
  const itemList  = (items ?? []) as Item[]
  const catList   = (categories ?? []) as Category[]
  const unitList  = (units ?? []) as any[]
  const summary   = (ratingSummary ?? { average_rating: 0, total_reviews: 0, stars: 0 }) as any
  const reviewList = (reviews ?? []) as any[]
  const initials  = shopData.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  return (
    <div className="shop-page-wrapper">
      <ShopPageClient
        items={itemList}
        categories={catList}
        shopId={shopId}
        shopName={shopData.name}
        units={unitList}
        restrictionLevel={subscription?.restriction_level ?? 0}
        ratingSummary={summary}
        reviews={reviewList}
        logoUrl={shopData.logo_url}
        initials={initials}
        distance={shopData.distance}
      />
    </div>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Shop, Item, Category } from '@/types'
import ShopCatalogClient from './ShopCatalogClient'
import { Video, Phone, Search, MoreVertical } from 'lucide-react'

type Props = { params: Promise<{ shopId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shopId } = await params
  const supabase = await createClient()
  const { data: shop } = await supabase.from('shops').select('name').eq('id', shopId).single()
  return { title: shop?.name ?? 'Shop' }
}

export default async function ShopPage({ params }: Props) {
  const { shopId } = await params
  const supabase = await createClient()

  const [{ data: shop }, { data: items }, { data: categories }, { data: units }] = await Promise.all([
    supabase.from('shops').select('*').eq('id', shopId).single(),
    supabase.from('items')
      .select('*, item_sell_config(*), item_variants:vw_item_variants_with_fallback(*)')
      .eq('shop_id', shopId).eq('is_active', true).is('deleted_at', null).order('name'),
    supabase.from('categories').select('id, name').eq('is_active', true).order('name'),
    supabase.from('units').select('*')
  ])

  if (!shop) notFound()

  const shopData  = shop as Shop
  const itemList  = (items ?? []) as Item[]
  const catList   = (categories ?? []) as Category[]
  const unitList  = (units ?? []) as any[]
  const initials  = shopData.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  return (
    <div className="shop-page-wrapper">
      {/* ── WA-style Shop Header ─────────────────────────────── */}
      <div className="shop-chat-header">
        <div className="shop-chat-header-left">
          {/* Avatar */}
          <div className="shop-chat-avatar">
            {shopData.logo_url
              ? <img src={shopData.logo_url} alt={shopData.name} />
              : initials}
          </div>
          {/* Info */}
          <div className="shop-chat-info">
            <h1 className="shop-chat-name">{shopData.name}</h1>
            <p className="shop-chat-status">
              <span className="shop-open-dot" />
              Open
              {shopData.distance && ` · ${shopData.distance} away`}
              {' · '}
              <span className="shop-click-info">click here for shop info</span>
            </p>
          </div>
        </div>

        {/* Right action icons */}
        <div className="shop-chat-actions">
          <button className="shop-chat-icon-btn" aria-label="Video call"><Video size={20} /></button>
          <button className="shop-chat-icon-btn" aria-label="Voice call"><Phone size={20} /></button>
          <button className="shop-chat-icon-btn" aria-label="Search"><Search size={20} /></button>
          <button className="shop-chat-icon-btn" aria-label="More options"><MoreVertical size={20} /></button>
        </div>
      </div>

      {/* ── Catalog Client (categories + grid + cart) ─────────── */}
      <ShopCatalogClient
        items={itemList}
        categories={catList}
        shopId={shopId}
        shopName={shopData.name}
        units={unitList}
      />
    </div>
  )
}

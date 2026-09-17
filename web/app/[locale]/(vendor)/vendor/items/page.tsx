import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import VendorItemsClient from './VendorItemsClient'
import type { Item, Category } from '@/types'
import { Plus, BookOpen } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../messages/en.json')
  }
  const t = (key: string) => {
    const parts = key.split('.')
    let curr = messages as any
    for (const part of parts) {
      if (!curr) return key
      curr = curr[part]
    }
    return typeof curr === 'string' ? curr : key
  }
  return { title: `${t('vendor_dashboard.manage_products_title') || 'Manage Items'} — ${t('vendor_dashboard.vendor_panel_title') || 'Vendor Panel'}` }
}

export default async function VendorItemsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages: any = {}
  try {
    messages = require(`../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../messages/en.json')
  }
  const t = (key: string) => {
    const parts = key.split('.')
    let curr = messages
    for (const part of parts) {
      if (!curr) return key
      curr = curr[part]
    }
    if (typeof curr === 'string') return curr
    try {
      const enMessages = require('../../../../../messages/en.json')
      let fallback = enMessages
      for (const part of parts) {
        if (!fallback) return key
        fallback = fallback[part]
      }
      if (typeof fallback === 'string') return fallback
    } catch (e) {}
    return key
  }

  const { data: shopOwners } = await supabase
    .from('shop_owners')
    .select('shop_id')
    .eq('user_id', user!.id)

  const shopIds = shopOwners?.map(o => o.shop_id) || []
  const primaryShopId = shopIds[0]

  const [itemsRes, categoriesRes] = await Promise.all([
    shopIds.length > 0
      ? supabase
          .from('items')
          .select('*, item_images(image_url, is_primary)')
          .in('shop_id', shopIds)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from('categories').select('id, name').eq('is_active', true),
  ])

  return (
    <>
      <div className="vp-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="vp-title" style={{ fontSize: '1.5rem', marginBottom: '0.15rem' }}>{t('vendor_dashboard.manage_products_title') || 'Manage Items'}</h1>
          <p className="vp-subtitle" style={{ fontSize: '0.85rem' }}>{t('vendor_dashboard.manage_shop_settings_subtitle') || 'View and control your product catalog'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/vendor/catalog" className="vp-btn vp-btn-outline" id="open-album-btn" style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderColor: 'rgba(59,130,246,0.4)', color: '#60a5fa' }}>
            <BookOpen size={16} /> {t('vendor_nav.catalog_album') || 'Catalog Album'}
          </Link>
          <Link href="/vendor/items/new" className="vp-btn vp-btn-primary" id="add-item-btn" style={{ padding: '0.5rem 1.25rem', fontSize: '0.88rem' }}>
            <Plus size={16} /> {t('vendor_dashboard.add_new_product_action') || 'Add Item'}
          </Link>
        </div>
      </div>
      <VendorItemsClient
        items={(itemsRes.data ?? []) as Item[]}
        shopId={primaryShopId ?? ''}
        categories={(categoriesRes.data ?? []) as Category[]}
      />
    </>
  )
}

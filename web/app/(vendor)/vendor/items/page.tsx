import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import VendorItemsClient from './VendorItemsClient'
import type { Item, Category } from '@/types'
import { Plus } from 'lucide-react'

export const metadata: Metadata = { title: 'Manage Items — Vendor Panel' }

export default async function VendorItemsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
      <div className="vp-header">
        <div>
          <h1 className="vp-title">Manage Items</h1>
          <p className="vp-subtitle">View and control your product catalog</p>
        </div>
        <Link href="/vendor/items/new" className="vp-btn vp-btn-primary" id="add-item-btn">
          <Plus size={18} /> Add Item
        </Link>
      </div>
      <VendorItemsClient
        items={(itemsRes.data ?? []) as Item[]}
        shopId={primaryShopId ?? ''}
        categories={(categoriesRes.data ?? []) as Category[]}
      />
    </>
  )
}

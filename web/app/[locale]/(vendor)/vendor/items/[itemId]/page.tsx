import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ItemFormClient from '../ItemFormClient'
import type { Item, Category } from '@/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Edit Item' }

export default async function EditItemPage({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: item }, { data: shopOwners }, { data: categories }] = await Promise.all([
    supabase.from('items').select('*, item_images(*), item_variants(*), item_sell_config(*)').eq('id', itemId).single(),
    supabase.from('shop_owners').select('shop_id').eq('user_id', user!.id),
    supabase.from('categories').select('id, name').eq('is_active', true).order('display_order', { ascending: true }),
  ])

  if (!item) notFound()

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="vp-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <Link href="/vendor/items" className="vp-btn vp-btn-outline vp-btn-sm" style={{ marginBottom: '1rem', display: 'inline-flex', padding: '0.4rem 0.8rem' }}>
            <ArrowLeft size={16} /> Back to Items
          </Link>
          <h1 className="vp-title">Edit Item</h1>
          <p className="vp-subtitle">Update your product details</p>
        </div>
      </div>
      <ItemFormClient
        item={item as Item}
        shopId={shopOwners?.[0]?.shop_id ?? ''}
        categories={(categories ?? []) as Category[]}
      />
    </div>
  )

}

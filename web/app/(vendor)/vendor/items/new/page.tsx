import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ItemFormClient from '../ItemFormClient'
import type { Category, DemoItem, Unit, DemoSellConfig, DemoVariant } from '@/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Add Item' }

export default async function AddItemPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: shopOwner } = await supabase
    .from('shop_owners').select('shop_id').eq('user_id', user!.id).maybeSingle()
  const shopId = (shopOwner as any)?.shop_id ?? ''

  const [categoriesRes, demoItemsRes, unitsRes, demoConfigsRes, demoVariantsRes] = await Promise.all([
    supabase.from('categories').select('id, name').eq('is_active', true),
    supabase.from('demo_items').select('*'),
    supabase.from('units').select('*'),
    supabase.from('demo_sell_config').select('*'),
    supabase.from('demo_variants').select('*')
  ])

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="vp-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <Link href="/vendor/items" className="vp-btn vp-btn-outline vp-btn-sm" style={{ marginBottom: '1rem', display: 'inline-flex', padding: '0.4rem 0.8rem' }}>
            <ArrowLeft size={16} /> Back to Items
          </Link>
          <h1 className="vp-title">Add New Item</h1>
          <p className="vp-subtitle">Create a new product for your catalog</p>
        </div>
      </div>
      <ItemFormClient 
        item={null} 
        shopId={shopId} 
        categories={(categoriesRes.data ?? []) as Category[]} 
        demoItems={(demoItemsRes.data ?? []) as DemoItem[]}
        units={(unitsRes.data ?? []) as Unit[]}
        demoConfigs={(demoConfigsRes.data ?? []) as DemoSellConfig[]}
        demoVariants={(demoVariantsRes.data ?? []) as DemoVariant[]}
      />
    </div>
  )
}

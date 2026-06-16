import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Store, User, Phone, MapPin, Tag, Calendar, ShoppingBag, Eye, EyeOff } from 'lucide-react'
import ShopDetailClient from './ShopDetailClient'

export const metadata: Metadata = { title: 'Admin - Shop Details' }

export default async function AdminShopDetailPage({
  params
}: {
  params: Promise<{ shopId: string }>
}) {
  const { shopId } = await params
  const supabase = await createClient()

  // Fetch shop details, items, categories, subscription, and reports
  const [{ data: shop }, { data: items }, { data: categories }, { data: subscription }, { data: reports }] = await Promise.all([
    supabase
      .from('shops')
      .select('*, shop_owners(users(name, phone)), locations(name)')
      .eq('id', shopId)
      .maybeSingle(),
    supabase
      .from('items')
      .select('*, item_images(image_url), item_sell_config(*), item_variants:vw_item_variants_with_fallback(*)')
      .eq('shop_id', shopId)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('categories')
      .select('id, name')
      .order('name'),
    supabase
      .from('shop_subscription')
      .select('*')
      .eq('shop_id', shopId)
      .maybeSingle(),
    supabase
      .from('monthly_commission_reports')
      .select('*')
      .eq('shop_id', shopId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
  ])

  if (!shop) {
    notFound()
  } else {
    (shop as any).is_active = !(shop as any).type?.endsWith('_inactive')
  }

  return (
    <>
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link href="/admin/shops" className="btn btn-ghost" style={{ padding: '.5rem', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        <h1 className="panel-page-title" style={{ margin: 0 }}>Shop Details</h1>
      </div>

      <ShopDetailClient 
        shop={shop as any} 
        initialItems={(items ?? []) as any[]} 
        categories={(categories ?? []) as any[]}
        subscription={subscription}
        reports={reports || []}
      />
    </>
  )
}

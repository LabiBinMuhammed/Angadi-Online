import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import VendorOrdersClient from './VendorOrdersClient'

export const metadata: Metadata = { title: 'Order Management' }

export default async function VendorOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: shopOwners } = await supabase
    .from('shop_owners').select('shop_id').eq('user_id', user!.id)
  
  const shopIds = shopOwners?.map(o => o.shop_id) || []

  const { data: orders } = shopIds.length > 0
    ? await supabase
        .from('orders')
        .select('id, status, created_at, total_estimated_price, total_final_price, users(name, phone)')
        .in('shop_id', shopIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <>
      <div className="vp-header">
        <div>
          <h1 className="vp-title">Order Management</h1>
          <p className="vp-subtitle">Process and track customer orders</p>
        </div>
      </div>
      <VendorOrdersClient orders={(orders ?? []) as any[]} />
    </>
  )
}

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CreditManagementClient from './CreditManagementClient'

export const metadata: Metadata = { title: 'Credit Management' }

export default async function CreditManagementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: shopOwners } = await supabase
    .from('shop_owners').select('shop_id').eq('user_id', user!.id)
  
  const shopIds = shopOwners?.map(o => o.shop_id) || []
  const primaryShopId = shopIds[0]

  const { data: credits } = shopIds.length > 0
    ? await supabase
        .from('shop_user_credits')
        .select('*, users(name, phone)')
        .in('shop_id', shopIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <>
      <div className="vp-header">
        <div>
          <h1 className="vp-title">Credit Management</h1>
          <p className="vp-subtitle">Manage customer store credits and balances</p>
        </div>
      </div>
      <CreditManagementClient credits={(credits ?? []) as any[]} shopId={primaryShopId ?? ''} />
    </>
  )
}

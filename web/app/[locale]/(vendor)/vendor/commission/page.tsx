import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VendorCommissionClient from './VendorCommissionClient'

export const metadata: Metadata = { title: 'Vendor - Commission Dashboard' }

export default async function VendorCommissionPage({
  searchParams
}: {
  searchParams: Promise<{ shopId?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get shops owned by this user
  const { data: ownedShops } = await supabase
    .from('shop_owners')
    .select('shop_id, shops(id, name, type)')
    .eq('user_id', user.id)

  const shopsList = ownedShops?.map(o => (o as any).shops).filter(Boolean) || []

  // Select shop (default to first)
  const selectedShopId = params.shopId || (shopsList[0]?.id || '')

  let sub = null
  let reports: any[] = []
  let payments: any[] = []
  let orders: any[] = []

  if (selectedShopId) {
    const [
      subRes,
      reportsRes,
      paymentsRes,
      ordersRes
    ] = await Promise.all([
      supabase.from('shop_subscription').select('*').eq('shop_id', selectedShopId).maybeSingle(),
      supabase.from('monthly_commission_reports').select('*').eq('shop_id', selectedShopId).order('year', { ascending: false }).order('month', { ascending: false }),
      supabase.from('commission_payments').select('amount, paid_at').eq('shop_id', selectedShopId),
      supabase.from('orders').select('total_final_price, created_at').eq('shop_id', selectedShopId).eq('status', 'delivered')
    ])
    sub = subRes.data
    reports = reportsRes.data || []
    payments = paymentsRes.data || []
    orders = ordersRes.data || []
  }

  return (
    <VendorCommissionClient
      shops={shopsList}
      selectedShopId={selectedShopId}
      subscription={sub}
      reports={reports}
      orders={orders}
      payments={payments}
    />
  )
}

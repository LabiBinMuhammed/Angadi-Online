import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ShopsCommissionClient from './ShopsCommissionClient'

export const metadata: Metadata = { title: 'Admin - Shop Billing Data' }

type SearchParams = Promise<{ month?: string; year?: string }>

export default async function AdminShopsCommissionPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const now = new Date()
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1
  const year = params.year ? parseInt(params.year) : now.getFullYear()

  const supabase = await createClient()

  // 1. Fetch all shops with subscription & location details, and fetch all locations
  const [{ data: shops }, { data: locations }] = await Promise.all([
    supabase
      .from('shops')
      .select('id, name, location_id, created_at, shop_subscription(trial_start_date, trial_end_date, is_trial_active, commission_rate, commission_enabled)')
      .order('name'),
    supabase
      .from('locations')
      .select('id, name')
      .order('name')
  ])

  // 2. Fetch billing period start/end bounds
  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 1).toISOString()

  // 3. Fetch delivered orders for the month to calculate selling value
  const { data: orders } = await supabase
    .from('orders')
    .select('shop_id, total_final_price')
    .eq('status', 'delivered')
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  // 4. Fetch commission transactions for the month
  const { data: txs } = await supabase
    .from('commission_transactions')
    .select('shop_id, commission_amount')
    .gte('generated_at', startDate)
    .lt('generated_at', endDate)

  // 5. Fetch existing monthly billing reports for status
  const { data: reports } = await supabase
    .from('monthly_commission_reports')
    .select('shop_id, payment_status, total_sales, total_commission')
    .eq('month', month)
    .eq('year', year)

  // 6. Combine all data
  const combinedShopsBilling = (shops || []).map((shop) => {
    const sub = Array.isArray(shop.shop_subscription)
      ? shop.shop_subscription[0]
      : shop.shop_subscription

    // Filter delivered orders in the period
    const shopOrders = (orders || []).filter((o) => o.shop_id === shop.id)
    const calculatedSales = shopOrders.reduce((sum, o) => sum + Number(o.total_final_price || 0), 0)

    // Filter transactions in the period
    const shopTxs = (txs || []).filter((t) => t.shop_id === shop.id)
    const calculatedCommission = shopTxs.reduce((sum, t) => sum + Number(t.commission_amount || 0), 0)

    // Check if report exists
    const report = (reports || []).find((r) => r.shop_id === shop.id)

    // Priority: Database saved values first, fallback to on-the-fly aggregates
    const totalSales = report ? Number(report.total_sales) : calculatedSales
    const totalCommission = report ? Number(report.total_commission) : calculatedCommission
    const paymentStatus = report ? (report.payment_status as 'pending' | 'partially_paid' | 'paid') : 'pending'

    return {
      id: shop.id,
      name: shop.name,
      locationId: shop.location_id,
      isTrialActive: sub ? sub.is_trial_active : false,
      totalSales,
      totalCommission,
      paymentStatus,
    }
  })

  return (
    <ShopsCommissionClient
      initialShopsData={combinedShopsBilling}
      locations={locations || []}
      month={month}
      year={year}
    />
  )
}

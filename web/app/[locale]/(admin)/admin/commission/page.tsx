import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { 
  getPlatformOverviewStats, 
  getRevenueOverviewStats, 
  getMonthlyChartData, 
  getPendingPayments 
} from '@/lib/supabase/commission'
import CommissionDashboardClient from './CommissionDashboardClient'

export const metadata: Metadata = { title: 'Admin - Commission Management' }

export default async function AdminCommissionDashboard() {
  const supabase = await createClient()
  
  // Fetch overview stats
  const [
    platformOverview, 
    revenueOverview, 
    chartData, 
    pendingPayments
  ] = await Promise.all([
    getPlatformOverviewStats(),
    getRevenueOverviewStats(),
    getMonthlyChartData(),
    getPendingPayments()
  ])

  // Fetch all shops with subscription details for settings / references / trial management
  const { data: shops } = await supabase
    .from('shops')
    .select('id, name, created_at, shop_subscription(trial_start_date, trial_end_date, is_trial_active, commission_rate, commission_enabled)')
    .order('name')

  return (
    <CommissionDashboardClient 
      platformOverview={platformOverview}
      revenueOverview={revenueOverview}
      chartData={chartData}
      pendingPayments={pendingPayments}
      shops={shops || []}
    />
  )
}

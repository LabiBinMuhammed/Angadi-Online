'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { 
  updateCommissionSettings, 
  extendTrial, 
  endFreeTrial,
  changeCommissionRate, 
  toggleCommissionEnabled, 
  recordCommissionPayment, 
  waiveCommission,
  generateMonthlyReports,
  updateShopsRestrictionLevels,
  updateCategoryCommissionRate
} from '@/lib/supabase/commission'

export async function saveSettingsAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  
  // Verify user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  
  const default_commission_rate = formData.get('default_commission_rate') as string
  const free_trial_duration = formData.get('free_trial_duration') as string
  const calculation_trigger = formData.get('calculation_trigger') as string
  const auto_generate_reports = formData.get('auto_generate_reports') === 'true'
  const report_generation_day = formData.get('report_generation_day') as string
  const grace_period_warning = formData.get('grace_period_warning') as string
  const grace_period_restriction = formData.get('grace_period_restriction') as string
  const grace_period_block = formData.get('grace_period_block') as string
  
  await updateCommissionSettings({
    default_commission_rate,
    free_trial_duration,
    calculation_trigger,
    auto_generate_reports,
    report_generation_day,
    grace_period_warning,
    grace_period_restriction,
    grace_period_block
  })
  
  revalidatePath('/admin/commission/settings')
  revalidatePath('/admin/commission')
}

export async function extendTrialAction(shopId: string, days: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  
  // Verify user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  
  await extendTrial(shopId, days, user.id)
  
  revalidatePath(`/admin/shops/${shopId}`)
  revalidatePath('/admin/commission')
  return { success: true }
}

export async function changeRateAction(shopId: string, rate: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  
  // Verify user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  
  await changeCommissionRate(shopId, rate, user.id)
  
  revalidatePath(`/admin/shops/${shopId}`)
  revalidatePath('/admin/commission')
  return { success: true }
}

export async function toggleEnabledAction(shopId: string, enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  
  // Verify user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  
  await toggleCommissionEnabled(shopId, enabled, user.id)
  
  revalidatePath(`/admin/shops/${shopId}`)
  revalidatePath('/admin/commission')
  return { success: true }
}

export async function recordPaymentAction(shopId: string, reportId: string, amount: number, paymentMethod: string, reference: string | null = null, notes: string | null = null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  
  // Verify user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  
  await recordCommissionPayment(shopId, reportId, amount, paymentMethod, reference, notes, user.id)
  
  revalidatePath('/admin/commission')
  revalidatePath(`/admin/shops/${shopId}`)
  return { success: true }
}

export async function waiveAction(type: 'order' | 'report' | 'custom', targetId: string, shopId: string, amount: number, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  
  // Verify user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  
  await waiveCommission(type, targetId, shopId, amount, reason, user.id)
  
  revalidatePath('/admin/commission')
  revalidatePath(`/admin/shops/${shopId}`)
  return { success: true }
}

export async function triggerReportsGenerationAction(month: number, year: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  
  // Verify user is admin
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  
  const reports = await generateMonthlyReports(month, year)
  
  revalidatePath('/admin/commission')
  return { success: true, count: reports.length }
}

export async function refreshRestrictionsAction() {
  await updateShopsRestrictionLevels()
  revalidatePath('/admin/commission')
  revalidatePath('/admin/shops')
  return { success: true }
}

export async function endTrialAction(shopId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  
  await endFreeTrial(shopId, user.id)
  
  revalidatePath('/admin/commission')
  revalidatePath(`/admin/shops/${shopId}`)
  return { success: true }
}

export async function toggleMonthlyReportPaidAction(shopId: string, month: number, year: number, targetStatus: 'paid' | 'pending') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')
  
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  
  // 1. Fetch current subscription rate
  const { data: sub } = await supabase
    .from('shop_subscription')
    .select('commission_rate')
    .eq('shop_id', shopId)
    .maybeSingle()
  const rate = sub?.commission_rate ?? 4.0

  // 2. Fetch stats for the month if we need to create/update
  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 1).toISOString()

  // Fetch delivered orders
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_final_price')
    .eq('shop_id', shopId)
    .eq('status', 'delivered')
    .gte('created_at', startDate)
    .lt('created_at', endDate)

  const totalOrders = orders?.length ?? 0
  const totalSales = orders?.reduce((sum, o) => sum + Number(o.total_final_price || 0), 0) ?? 0

  // Fetch commission transactions
  const { data: txs } = await supabase
    .from('commission_transactions')
    .select('commission_amount')
    .eq('shop_id', shopId)
    .gte('generated_at', startDate)
    .lt('generated_at', endDate)

  const totalCommission = txs?.reduce((sum, t) => sum + Number(t.commission_amount || 0), 0) ?? 0

  // Check if report already exists
  const { data: existingReport } = await supabase
    .from('monthly_commission_reports')
    .select('id')
    .eq('shop_id', shopId)
    .eq('month', month)
    .eq('year', year)
    .maybeSingle()

  const amountPaid = targetStatus === 'paid' ? totalCommission : 0.0
  const balanceDue = targetStatus === 'paid' ? 0.0 : totalCommission

  if (existingReport) {
    // Update existing report
    const { error: updateErr } = await supabase
      .from('monthly_commission_reports')
      .update({
        total_orders: totalOrders,
        total_sales: totalSales,
        total_commission: totalCommission,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        payment_status: targetStatus,
      })
      .eq('id', existingReport.id)
    if (updateErr) throw updateErr
  } else {
    // Insert new report
    const { error: insertErr } = await supabase
      .from('monthly_commission_reports')
      .insert({
        shop_id: shopId,
        month,
        year,
        total_orders: totalOrders,
        total_sales: totalSales,
        commission_rate: rate,
        total_commission: totalCommission,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        payment_status: targetStatus,
      })
    if (insertErr) throw insertErr
  }

  // Update transaction status for the period
  const transStatus = targetStatus === 'paid' ? 'paid' : 'pending'
  const { error: txErr } = await supabase
    .from('commission_transactions')
    .update({ commission_status: transStatus })
    .eq('shop_id', shopId)
    .gte('generated_at', startDate)
    .lt('generated_at', endDate)

  if (txErr) throw txErr

  // Log to audit logs
  await supabase.from('commission_audit_logs').insert({
    action: `Monthly Commission Status Toggled`,
    shop_id: shopId,
    admin_user_id: user.id,
    previous_value: targetStatus === 'paid' ? 'pending' : 'paid',
    new_value: targetStatus,
    notes: `Toggled payment status for month ${month}/${year} to ${targetStatus}`
  })

  // Update restrictions if status changed
  await updateShopsRestrictionLevels()

  revalidatePath('/admin/commission/shops')
  revalidatePath('/admin/commission')
  return { success: true }
}

export async function updateCategoryCommissionAction(categoryId: string, rate: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not logged in')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')

  await updateCategoryCommissionRate(categoryId, rate, user.id)

  revalidatePath('/admin/commission')
  revalidatePath('/admin/commission/settings')
  revalidatePath('/admin/categories')
  return { success: true }
}

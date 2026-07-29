import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import VendorOrdersClient from './VendorOrdersClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../messages/en.json')
  }
  const t = (key: string) => {
    const parts = key.split('.')
    let curr = messages as any
    for (const part of parts) {
      if (!curr) return key
      curr = curr[part]
    }
    return typeof curr === 'string' ? curr : key
  }
  return { title: `${t('vendor_dashboard.vendor_manage_orders_title') || 'Manage Orders'} — ${t('vendor_dashboard.vendor_panel_title') || 'Vendor Panel'}` }
}

export default async function VendorOrdersPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ filter?: string; date?: string; slot?: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages: any = {}
  try {
    messages = require(`../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../messages/en.json')
  }
  const t = (key: string) => {
    const parts = key.split('.')
    let curr = messages
    for (const part of parts) {
      if (!curr) return key
      curr = curr[part]
    }
    if (typeof curr === 'string') return curr
    try {
      const enMessages = require('../../../../../messages/en.json')
      let fallback = enMessages
      for (const part of parts) {
        if (!fallback) return key
        fallback = fallback[part]
      }
      if (typeof fallback === 'string') return fallback
    } catch (e) {}
    return key
  }

  const { data: shopOwners } = await supabase
    .from('shop_owners').select('shop_id').eq('user_id', user!.id)
  
  const shopIds = shopOwners?.map(o => o.shop_id) || []
  const searchParamsResolved = await searchParams
  const filter = searchParamsResolved.filter || 'today'
  const dateParam = searchParamsResolved.date
  const slotParam = searchParamsResolved.slot

  let ordersQuery = supabase
    .from('orders')
    .select('id, status, created_at, total_estimated_price, total_final_price, delivery_date, delivery_slot, order_number, users(name, phone)')
    .in('shop_id', shopIds)

  if (dateParam) {
    ordersQuery = ordersQuery.eq('delivery_date', dateParam)
  }
  if (slotParam) {
    ordersQuery = ordersQuery.eq('delivery_slot', slotParam.toLowerCase())
  }

  // If no specific date filter is requested, use the standard date range filters
  if (!dateParam) {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const todayStr = `${year}-${month}-${day}`

    if (filter === 'today') {
      ordersQuery = ordersQuery.gte('delivery_date', todayStr)
    } else if (filter === 'week') {
      const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
      const y = sevenDaysAgo.getFullYear()
      const m = String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')
      const d = String(sevenDaysAgo.getDate()).padStart(2, '0')
      ordersQuery = ordersQuery.gte('delivery_date', `${y}-${m}-${d}`)
    } else if (filter === 'month') {
      const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
      const y = thirtyDaysAgo.getFullYear()
      const m = String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0')
      const d = String(thirtyDaysAgo.getDate()).padStart(2, '0')
      ordersQuery = ordersQuery.gte('delivery_date', `${y}-${m}-${d}`)
    }
  }

  ordersQuery = ordersQuery.order('created_at', { ascending: false })

  const { data: orders } = shopIds.length > 0
    ? await ordersQuery
    : { data: [] }

  const capitalizedSlot = slotParam ? slotParam.charAt(0).toUpperCase() + slotParam.slice(1) : ''
  const formattedFilterDate = dateParam ? new Date(dateParam).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''

      const slotName = slotParam === 'morning' ? (t('vendor_dashboard.morning_run') || 'Morning Run') : slotParam === 'evening' ? (t('vendor_dashboard.evening_run') || 'Evening Run') : ''
      
      return (
    <>
      <div className="vp-header">
        <div>
          <h1 className="vp-title">{t('vendor_dashboard.vendor_manage_orders_title') || 'Order Management'}</h1>
          <p className="vp-subtitle">
            {dateParam || slotParam 
              ? `${t('vendor_dashboard.showing_orders_for') || 'Showing orders for'} ${slotName} ${t('common.on') || 'on'} ${formattedFilterDate}`
              : t('vendor_dashboard.manage_shop_settings_subtitle') || 'Process and track customer orders'}
          </p>
        </div>
      </div>
      {!dateParam && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', paddingBottom: '4px' }}>
          {['today', 'week', 'month', 'all'].map((f) => {
            const isActive = filter === f
            const labels: Record<string, string> = {
              today: t('orders.filter_today') || 'Today',
              week: t('orders.filter_week') || 'Last Week',
              month: t('orders.filter_month') || 'Last Month',
              all: t('orders.filter_all') || 'All'
            }
            return (
              <Link
                key={f}
                href={`/vendor/orders?filter=${f}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  background: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.05)',
                  color: isActive ? '#fff' : '#94a3b8',
                  border: `1px solid ${isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
                  transition: 'all 0.2s'
                }}
              >
                {labels[f]}
              </Link>
            )
          })}
        </div>
      )}
      {dateParam && (
        <div style={{ marginBottom: '20px' }}>
          <Link href="/vendor/orders" className="vp-btn vp-btn-outline vp-btn-sm" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            ← {t('vendor_dashboard.filter_all') || 'Show All Orders'}
          </Link>
        </div>
      )}
      <VendorOrdersClient orders={(orders ?? []) as any[]} />
    </>
  )
}

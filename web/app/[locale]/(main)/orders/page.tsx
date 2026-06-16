import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Order } from '@/types'
import { ArrowLeft, Package, Clock, Truck, CheckCircle2, XCircle, Store, ShieldCheck, Bell } from 'lucide-react'

export const metadata: Metadata = { title: 'My Orders' }

const STATUS_MAP: Record<string, { bg: string; color: string; label: string; Icon: any }> = {
  pending:    { bg: 'var(--status-pending-bg)', color: '#f59e0b', label: 'Pending',    Icon: Clock },
  packing:    { bg: 'var(--status-packing-bg)', color: '#0ea5e9', label: 'Packing',    Icon: Package },
  delivering: { bg: 'var(--status-packing-bg)', color: '#0ea5e9', label: 'On the way', Icon: Truck },
  delivered:  { bg: 'var(--status-delivered-bg)', color: '#22c55e', label: 'Delivered',  Icon: CheckCircle2 },
  cancelled:  { bg: 'var(--status-cancelled-bg)', color: '#ef4444', label: 'Cancelled',  Icon: XCircle },
}

export default async function OrdersPage({ params, searchParams }: { params: Promise<{ locale: string }>, searchParams: Promise<{ filter?: string; slot?: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../messages/en.json')
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

  const queryParams = await searchParams
  const filter = queryParams.filter || 'today'
  const slotFilter = queryParams.slot || 'all'

  let ordersQuery = supabase
    .from('orders')
    .select('id, status, created_at, total_final_price, shop_id, shops(name), delivery_date, delivery_slot, order_number')
    .eq('user_id', user!.id)
    .not('payment_type', 'is', null)

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

  if (slotFilter === 'morning' || slotFilter === 'evening') {
    ordersQuery = ordersQuery.eq('delivery_slot', slotFilter)
  }

  ordersQuery = ordersQuery.order('created_at', { ascending: false })

  const [ordersRes, userRes] = await Promise.all([
    ordersQuery,
    supabase
      .from('users')
      .select('role')
      .eq('id', user!.id)
      .single()
  ])

  const orders = ordersRes.data
  const role = userRes.data?.role

  const orderList = ((orders ?? []) as unknown) as (Order & { shops: { name: string } | null; delivery_date: string | null; delivery_slot: string | null; order_number: string | null })[]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: var(--bg-base); }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-base); transition: all 0.2s; }
        .title { font-size: 28px; font-weight: 800; color: var(--text-base); margin: 0; letter-spacing: -0.5px; }
        
        .order-card { background: var(--bg-surface); border-radius: 24px; padding: 20px; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 16px; text-decoration: none; transition: transform 0.2s; }
        .order-card:active { transform: scale(0.98); }
        .order-header { display: flex; justify-content: space-between; align-items: center; }
        .shop-name { font-size: 18px; font-weight: 800; color: var(--text-base); margin: 0; }
        .order-date { font-size: 13px; color: var(--text-light); font-weight: 500; }
        
        .order-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--border); }
        .order-price { font-size: 20px; font-weight: 800; color: var(--wa-green); }
        .status-badge { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 700; }
        
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; text-align: center; }
        .empty-icon { font-size: 64px; margin-bottom: 24px; }
        .empty-title { font-size: 24px; font-weight: 800; color: var(--text-base); margin: 0 0 8px; }
        .empty-sub { font-size: 15px; color: var(--text-muted); margin: 0 0 32px; font-weight: 500; }
        .browse-btn { background: var(--wa-green); color: #fff; border: none; border-radius: 24px; padding: 16px 32px; font-size: 16px; font-weight: 700; text-decoration: none; box-shadow: 0 8px 20px rgba(76,217,100,0.3); }
      `}} />

      <div className="page-container">
        <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/profile" className="back-btn">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="title">{t('orders.title')}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {(role === 'shop_owner' || role === 'admin') && (
              <Link href="/vendor/dashboard" title={t('orders.vendor_panel')} className="back-btn">
                <Store size={20} />
              </Link>
            )}
            {role === 'admin' && (
              <Link href="/admin/dashboard" title={t('orders.admin_panel')} className="back-btn">
                <ShieldCheck size={20} />
              </Link>
            )}
            <Link href="/notifications" title={t('orders.notifications')} className="back-btn">
              <Bell size={20} />
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['today', 'week', 'month', 'all'].map((f) => {
            const isActive = filter === f
            const labels: Record<string, string> = {
              today: t('orders.filter_today'),
              week: t('orders.filter_week'),
              month: t('orders.filter_month'),
              all: t('orders.filter_all')
            }
            return (
              <Link
                key={f}
                href={`/orders?filter=${f}&slot=${slotFilter}`}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  background: isActive ? 'var(--wa-green)' : 'var(--bg-surface)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${isActive ? 'var(--wa-green)' : 'var(--border)'}`,
                  transition: 'all 0.2s'
                }}
              >
                {labels[f]}
              </Link>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
          {['all', 'morning', 'evening'].map((s) => {
            const isActive = slotFilter === s
            const labels: Record<string, string> = {
              all: t('orders.all_slots'),
              morning: `☀️ ${t('orders.morning_slot')}`,
              evening: `🌙 ${t('orders.evening_slot')}`
            }
            return (
              <Link
                key={s}
                href={`/orders?filter=${filter}&slot=${s}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  background: isActive ? 'var(--wa-green)' : 'var(--bg-surface)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${isActive ? 'var(--wa-green)' : 'var(--border)'}`,
                  transition: 'all 0.2s'
                }}
              >
                {labels[s]}
              </Link>
            )
          })}
        </div>

        {orderList.length > 0 ? (
          <div>
            {orderList.map((order) => {
              const st = STATUS_MAP[order.status] ?? { bg: '#f5f5f5', color: '#666', label: order.status, Icon: Package }
              const StatusIcon = st.Icon
              const formattedDeliveryDate = order.delivery_date
                ? new Date(order.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : null

              return (
                <Link key={order.id} href={`/orders/${order.id}`} className="order-card" id={`order-row-${order.id}`}>
                  <div className="order-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 className="shop-name">{order.shops?.name ?? 'Shop'}</h3>
                        {order.order_number && (
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '2px 6px', borderRadius: '6px' }}>
                            #{order.order_number}
                          </span>
                        )}
                      </div>
                      <span className="order-date">
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {order.delivery_date && order.delivery_slot && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: 700, 
                            color: order.delivery_slot === 'morning' ? '#16a34a' : '#ea580c',
                            background: order.delivery_slot === 'morning' ? '#f0fdf4' : '#fff7ed',
                            padding: '3px 8px',
                            borderRadius: '8px',
                            border: `1px solid ${order.delivery_slot === 'morning' ? '#bbf7d0' : '#fed7aa'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {order.delivery_slot === 'morning' ? `☀️ ${t('orders.morning_slot')}` : `🌙 ${t('orders.evening_slot')}`} • {formattedDeliveryDate}
                          </span>
                        </div>
                      )}
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: st.color }}>
                      <StatusIcon size={24} strokeWidth={2.5} />
                    </div>
                  </div>
                  <div className="order-footer">
                    <span className="order-price">
                      {order.total_final_price != null ? `₹ ${order.total_final_price.toFixed(0)}` : '--'}
                    </span>
                    <span className="status-badge" style={{ background: st.bg, color: st.color }}>
                      {t('orders.status_' + order.status)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', margin: '0 auto 24px' }}><Package size={64} /></div>
            <h2 className="empty-title">{t('orders.no_orders')}</h2>
            <p className="empty-sub">{t('orders.no_orders_sub')}</p>
            <Link href="/home" className="browse-btn" id="orders-browse-btn">
              {t('orders.browse_shops')}
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

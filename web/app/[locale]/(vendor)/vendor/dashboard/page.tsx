import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { 
  Package, ShoppingBag, Clock, Plus, Store, CreditCard,
  TrendingUp, BarChart3, Users, AlertTriangle
} from 'lucide-react'
import VendorDeliveryRuns from './VendorDeliveryRuns'
import { getServerTranslations } from '@/lib/i18n/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  const t = getServerTranslations(activeLocale)
  return { title: `${t('vendor_dashboard.vendor_panel_title') || 'Vendor Panel'}` }
}

export default async function VendorDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  const t = getServerTranslations(activeLocale)
  // Get all shops owned by this user
  const { data: shopOwners } = await supabase
    .from('shop_owners')
    .select('shop_id, shops(id, name, type)')
    .eq('user_id', user!.id)

  const shopIds = shopOwners?.map(o => o.shop_id) || []
  const hasMultiple = shopIds.length > 1
  const firstShopName = (shopOwners?.[0] as any)?.shops?.name
  const shopName = hasMultiple ? (t('vendor_dashboard.your_shops_title') || 'Your Shops') : (firstShopName ?? 'Your Shop')
  const firstShopId = shopIds[0]

  // Get dates
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`
    
  const [itemsRes, ordersRes, pendingRes, subsRes, revenueRes] = await Promise.all([
      shopIds.length > 0 ? supabase.from('items').select('id', { count: 'exact', head: true }).in('shop_id', shopIds) : Promise.resolve({ count: 0 }),
      shopIds.length > 0 ? supabase.from('orders').select('id', { count: 'exact', head: true }).in('shop_id', shopIds) : Promise.resolve({ count: 0 }),
      shopIds.length > 0 ? supabase.from('orders').select('id', { count: 'exact', head: true }).in('shop_id', shopIds).eq('status', 'pending') : Promise.resolve({ count: 0 }),
      shopIds.length > 0 ? supabase.from('shop_subscription').select('restriction_level').in('shop_id', shopIds) : Promise.resolve({ data: [] }),
      shopIds.length > 0 ? supabase.from('orders').select('total_final_price').in('shop_id', shopIds).eq('status', 'delivered') : Promise.resolve({ data: [] })
    ])

    const maxRestLevel = subsRes?.data?.reduce((max: number, s: any) => Math.max(max, s.restriction_level || 0), 0) || 0
    const totalRevenue = (revenueRes?.data || []).reduce((acc: number, order: any) => acc + (order.total_final_price ?? 0), 0)

    const stats = [
      { icon: <Package size={28} color="#60a5fa" />, value: itemsRes.count ?? 0,   label: t('vendor_dashboard.total_items') || 'Total Items' },
      { icon: <ShoppingBag size={28} color="#c084fc" />, value: ordersRes.count ?? 0,  label: t('vendor_dashboard.total_orders') || 'Total Orders' },
      { icon: <Clock size={28} color="#fbbf24" />, value: pendingRes.count ?? 0,  label: t('vendor_dashboard.pending_orders') || 'Pending Orders' },
      { icon: <TrendingUp size={28} color="#34d399" />, value: totalRevenue.toLocaleString(), label: t('vendor_dashboard.total_revenue') || 'Total Revenue' },
    ]

    const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const tomYear = tomorrow.getFullYear()
  const tomMonth = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const tomDay = String(tomorrow.getDate()).padStart(2, '0')
  const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`

  let initialRuns: any[] = []

  if (firstShopId) {
    try {
      // Fetch orders for today and tomorrow
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, delivery_date, delivery_slot, total_final_price, total_estimated_price, delivery_batch_id')
        .eq('shop_id', firstShopId)
        .in('delivery_date', [todayStr, tomorrowStr])
        .not('payment_type', 'is', null)
        .neq('status', 'cancelled')

      // Fetch existing batches
      const { data: batchesData } = await supabase
        .from('delivery_batches')
        .select('id, delivery_date, delivery_slot, status')
        .eq('shop_id', firstShopId)
        .in('delivery_date', [todayStr, tomorrowStr])

      const slots: ('morning' | 'evening')[] = ['morning', 'evening']
      const dates = [todayStr, tomorrowStr]

      dates.forEach(date => {
        slots.forEach(slot => {
          const batch = batchesData?.find(b => b.delivery_date === date && b.delivery_slot === slot) || null
          
          // Filter orders for this slot/date
          const matchingOrders = ordersData?.filter(o => o.delivery_date === date && o.delivery_slot === slot) || []
          const totalValue = matchingOrders.reduce((acc, o) => acc + (o.total_final_price ?? o.total_estimated_price ?? 0), 0)

          initialRuns.push({
            date,
            label: date === todayStr ? (t('vendor_dashboard.today_label') || 'Today') : (t('vendor_dashboard.tomorrow_label') || 'Tomorrow'),
            slot,
            batch: batch ? { id: batch.id, status: batch.status } : null,
            orderCount: matchingOrders.length,
            totalValue
          })
        })
      })
    } catch (err) {
      console.error('Error loading delivery runs:', err)
    }
  }

  return (
    <>
      <div className="vp-header">
        <div>
          <h1 className="vp-title">{t('vendor_dashboard.vendor_panel_title') || 'Dashboard'}</h1>
          <p className="vp-subtitle">{(t('vendor_dashboard.welcome_back_to') || 'Welcome back to ')}<strong>{shopName}</strong></p>
        </div>
        {firstShopId && !hasMultiple && (
          <Link href={`/home/shop/${firstShopId}`} className="vp-btn vp-btn-outline" id="view-my-shop">
            <Store size={18} /> {t('vendor_dashboard.view_my_shop_button') || 'View My Shop'}
          </Link>
        )}
      </div>

      {maxRestLevel >= 1 && (
        <div 
          className="vp-card" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.15))', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            padding: '1rem 1.5rem', 
            borderRadius: '12px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#fca5a5'
          }}
        >
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.88rem' }}>
            {maxRestLevel === 1 && (
              <span><strong>{t('vendor_commission.warning_title_l1') || 'Outstanding Dues Pending'}:</strong> {t('vendor_dashboard.outstanding_dues_desc_1') || 'You have outstanding commission balances. Please settle them in the'} <Link href="/vendor/commission" style={{ textDecoration: 'underline', color: '#fff', fontWeight: 700 }}>{t('vendor_commission.title') || 'Commission Dashboard'}</Link> {t('vendor_dashboard.outstanding_dues_desc_2') || 'to avoid service restrictions.'}</span>
            )}
            {maxRestLevel === 2 && (
              <span><strong>{t('vendor_commission.warning_title_l2') || 'Shop Visibility Restricted'}:</strong> {t('vendor_dashboard.visibility_restricted_desc_1') || 'Your shop visibility has been reduced on the marketplace due to outstanding dues. Please settle them in the'} <Link href="/vendor/commission" style={{ textDecoration: 'underline', color: '#fff', fontWeight: 700 }}>{t('vendor_commission.title') || 'Commission Dashboard'}</Link>.</span>
            )}
            {maxRestLevel === 3 && (
              <span><strong>{t('vendor_commission.warning_title_l3') || 'New Ordering Suspended'}:</strong> {t('vendor_dashboard.new_ordering_suspended_desc_1') || 'Your shop is temporarily blocked from receiving new orders due to outstanding billing dues. Settle them immediately in the'} <Link href="/vendor/commission" style={{ textDecoration: 'underline', color: '#fff', fontWeight: 700 }}>{t('vendor_commission.title') || 'Commission Dashboard'}</Link> {t('vendor_dashboard.new_ordering_suspended_desc_2') || 'to restore ordering.'}</span>
            )}
          </div>
        </div>
      )}

      <div className="vp-stat-grid">
        {stats.map(s => (
          <div key={s.label} className="vp-card vp-stat-card">
            <div className="vp-stat-icon">{s.icon}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
              <span className="vp-stat-value">{s.value}</span>
              <span className="vp-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {firstShopId && initialRuns.length > 0 && (
        <VendorDeliveryRuns 
          shopId={firstShopId} 
          todayStr={todayStr} 
          tomorrowStr={tomorrowStr} 
          initialRuns={initialRuns} 
        />
      )}

      <h2 className="vp-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', marginTop: '2rem' }}>{t('vendor_dashboard.quick_actions_title') || 'Quick Actions'}</h2>
      <div className="vp-quick-grid">
        <Link href="/vendor/items/new" id="dashboard-add-new-item" className="vp-card vp-quick-action">
          <div className="vp-quick-icon">
            <Plus size={40} color="#60a5fa" />
          </div>
          <span className="vp-quick-label">{t('vendor_dashboard.add_new_product_action') || 'Add New Product'}</span>
        </Link>
        <Link href="/vendor/orders" id="dashboard-view-orders" className="vp-card vp-quick-action">
          <div className="vp-quick-icon">
            <ShoppingBag size={40} color="#c084fc" />
          </div>
          <span className="vp-quick-label">{t('vendor_dashboard.manage_orders_action') || 'Manage Orders'}</span>
        </Link>
        <Link href="/vendor/credit" id="dashboard-manage-credit" className="vp-card vp-quick-action">
          <div className="vp-quick-icon">
            <CreditCard size={40} color="#fbbf24" />
          </div>
          <span className="vp-quick-label">{t('vendor_dashboard.customer_credit_action') || 'Customer Credit'}</span>
        </Link>
        <Link href="/vendor/shop" id="dashboard-shop-settings" className="vp-card vp-quick-action">
          <div className="vp-quick-icon">
            <Store size={40} color="#34d399" />
          </div>
          <span className="vp-quick-label">{t('vendor_dashboard.shop_settings_action') || 'Shop Settings'}</span>
        </Link>
      </div>
    </>
  )
}

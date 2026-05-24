import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { 
  Package, ShoppingBag, Clock, Plus, Store, CreditCard,
  TrendingUp, BarChart3, Users
} from 'lucide-react'

export const metadata: Metadata = { title: 'Vendor Dashboard' }

export default async function VendorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get all shops owned by this user
  const { data: shopOwners } = await supabase
    .from('shop_owners')
    .select('shop_id, shops(id, name, type)')
    .eq('user_id', user!.id)

  const shopIds = shopOwners?.map(o => o.shop_id) || []
  const hasMultiple = shopIds.length > 1
  const firstShopName = (shopOwners?.[0] as any)?.shops?.name
  const shopName = hasMultiple ? 'Your Shops' : (firstShopName ?? 'Your Shop')
  const firstShopId = shopIds[0]

  const [itemsRes, ordersRes, pendingRes] = await Promise.all([
    shopIds.length > 0 ? supabase.from('items').select('id', { count: 'exact', head: true }).in('shop_id', shopIds) : Promise.resolve({ count: 0 }),
    shopIds.length > 0 ? supabase.from('orders').select('id', { count: 'exact', head: true }).in('shop_id', shopIds) : Promise.resolve({ count: 0 }),
    shopIds.length > 0 ? supabase.from('orders').select('id', { count: 'exact', head: true }).in('shop_id', shopIds).eq('status', 'pending') : Promise.resolve({ count: 0 }),
  ])

  const stats = [
    { icon: <Package size={28} color="#60a5fa" />, value: itemsRes.count ?? 0,   label: 'Total Items' },
    { icon: <ShoppingBag size={28} color="#c084fc" />, value: ordersRes.count ?? 0,  label: 'Total Orders' },
    { icon: <Clock size={28} color="#fbbf24" />, value: pendingRes.count ?? 0,  label: 'Pending Orders' },
    { icon: <TrendingUp size={28} color="#34d399" />, value: '0', label: 'Total Revenue' },
  ]

  return (
    <>
      <div className="vp-header">
        <div>
          <h1 className="vp-title">Dashboard</h1>
          <p className="vp-subtitle">Welcome back to <strong>{shopName}</strong></p>
        </div>
        {firstShopId && !hasMultiple && (
          <Link href={`/home/shop/${firstShopId}`} className="vp-btn vp-btn-outline" id="view-my-shop">
            <Store size={18} /> View My Shop
          </Link>
        )}
      </div>

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

      <h2 className="vp-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Quick Actions</h2>
      <div className="vp-quick-grid">
        <Link href="/vendor/items/new" id="dashboard-add-new-item" className="vp-card vp-quick-action">
          <div className="vp-quick-icon">
            <Plus size={40} color="#60a5fa" />
          </div>
          <span className="vp-quick-label">Add New Product</span>
        </Link>
        <Link href="/vendor/orders" id="dashboard-view-orders" className="vp-card vp-quick-action">
          <div className="vp-quick-icon">
            <ShoppingBag size={40} color="#c084fc" />
          </div>
          <span className="vp-quick-label">Manage Orders</span>
        </Link>
        <Link href="/vendor/credit" id="dashboard-manage-credit" className="vp-card vp-quick-action">
          <div className="vp-quick-icon">
            <CreditCard size={40} color="#fbbf24" />
          </div>
          <span className="vp-quick-label">Customer Credit</span>
        </Link>
        <Link href="/vendor/shop" id="dashboard-shop-settings" className="vp-card vp-quick-action">
          <div className="vp-quick-icon">
            <Store size={40} color="#34d399" />
          </div>
          <span className="vp-quick-label">Shop Settings</span>
        </Link>
      </div>
    </>
  )
}

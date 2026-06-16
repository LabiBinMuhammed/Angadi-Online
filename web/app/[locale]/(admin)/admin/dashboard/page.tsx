import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Store, ShoppingBag, Clock, Tag, CreditCard, ClipboardList, Settings, ChevronRight, Coins } from 'lucide-react'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // Get dates
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`

  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const tomYear = tomorrow.getFullYear()
  const tomMonth = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const tomDay = String(tomorrow.getDate()).padStart(2, '0')
  const tomorrowStr = `${tomYear}-${tomMonth}-${tomDay}`

  let todayMorningCount = 0
  let todayEveningCount = 0
  let tomMorningCount = 0
  let tomEveningCount = 0

  try {
    const { data: deliveryOrders } = await supabase
      .from('orders')
      .select('delivery_date, delivery_slot')
      .in('delivery_date', [todayStr, tomorrowStr])
      .not('payment_type', 'is', null)
      .neq('status', 'cancelled')

    todayMorningCount = deliveryOrders?.filter(o => o.delivery_date === todayStr && o.delivery_slot === 'morning').length || 0
    todayEveningCount = deliveryOrders?.filter(o => o.delivery_date === todayStr && o.delivery_slot === 'evening').length || 0
    tomMorningCount = deliveryOrders?.filter(o => o.delivery_date === tomorrowStr && o.delivery_slot === 'morning').length || 0
    tomEveningCount = deliveryOrders?.filter(o => o.delivery_date === tomorrowStr && o.delivery_slot === 'evening').length || 0
  } catch (err) {
    console.error('Error loading delivery slot metrics:', err)
  }

  const [usersRes, shopsRes, ordersRes, pendingRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('shops').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const stats = [
    { icon: <Users size={24} />, value: usersRes.count ?? 0,   label: 'Total Users',    href: '/admin/users', color: '#3B82F6' },
    { icon: <Store size={24} />, value: shopsRes.count ?? 0,   label: 'Total Shops',    href: '/admin/shops', color: '#22C55E' },
    { icon: <ShoppingBag size={24} />, value: ordersRes.count ?? 0,  label: 'Total Orders',   href: '/admin/orders', color: '#8B5CF6' },
    { icon: <Clock size={24} />, value: pendingRes.count ?? 0, label: 'Pending', href: '/admin/orders', color: '#F59E0B' },
  ]

  const tools = [
    { href: '/admin/shops',          icon: <Store size={18} />,       label: 'Shops Directory', color: '#22C55E' },
    { href: '/admin/users',          icon: <Users size={18} />,       label: 'User Accounts',   color: '#3B82F6' },
    { href: '/admin/orders',         icon: <ShoppingBag size={18} />, label: 'All Orders',      color: '#8B5CF6' },
    { href: '/admin/categories',     icon: <Tag size={18} />,         label: 'Categories',      color: '#EC4899' },
    { href: '/admin/commission',     icon: <Coins size={18} />,       label: 'Commission Dashboard', color: '#8B5CF6' },
    { href: '/admin/commission/shops', icon: <Store size={18} />,     label: 'Shop Billing & Dues', color: '#3B82F6' },
    { href: '/admin/logs',           icon: <ClipboardList size={18} />, label: 'System Logs',   color: '#64748B' },
    { href: '/admin/settings',       icon: <Settings size={18} />,    label: 'Global Settings', color: '#94A3B8' },
    { href: '/admin/credit',         icon: <CreditCard size={18} />,  label: 'Credit Monitor',  color: '#14B8A6' },
  ]

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>
      <h1 className="panel-page-title" style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>System Overview</h1>
      <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2rem' }}>Platform metrics and management</p>

      {/* Stats Grid */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {stats.map(s => (
          <Link 
            key={s.label} 
            href={s.href} 
            className="stat-card" 
            style={{ 
              textDecoration: 'none', 
              color: 'inherit',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '20px',
              border: '1px solid var(--wa-separator)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '140px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: `${s.color}1f`,
              border: `1px solid ${s.color}26`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: s.color
            }}>
              {s.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{s.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Delivery Slot Analytics</h2>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '24px',
        border: '1px solid var(--wa-separator)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '2.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '24px'
      }}>
        {/* Today */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderRight: '1px solid var(--wa-separator)', paddingRight: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>☀️ Today's Slots <span style={{ fontSize: '12px', fontWeight: 500 }}>({new Date(todayStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})</span></h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Morning Run</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a', background: '#f0fdf4', padding: '2px 10px', borderRadius: '8px' }}>{todayMorningCount} orders</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Evening Run</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#ea580c', background: '#fff7ed', padding: '2px 10px', borderRadius: '8px' }}>{todayEveningCount} orders</span>
            </div>
          </div>
        </div>

        {/* Tomorrow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>🌙 Tomorrow's Slots <span style={{ fontSize: '12px', fontWeight: 500 }}>({new Date(tomorrowStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})</span></h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Morning Run</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a', background: '#f0fdf4', padding: '2px 10px', borderRadius: '8px' }}>{tomMorningCount} orders</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Evening Run</span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#ea580c', background: '#fff7ed', padding: '2px 10px', borderRadius: '8px' }}>{tomEveningCount} orders</span>
            </div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Management Tools</h2>
      
      {/* Management Tools List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {tools.map(t => (
          <Link 
            key={t.href} 
            href={t.href} 
            className="tool-card" 
            style={{
              textDecoration: 'none',
              color: 'inherit',
              background: '#ffffff',
              borderRadius: '16px',
              padding: '16px 20px',
              border: '1px solid var(--wa-separator)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
          >
            <div style={{
              padding: '10px',
              background: `${t.color}1f`,
              borderRadius: '12px',
              color: t.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '16px'
            }}>
              {t.icon}
            </div>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', flex: 1 }}>{t.label}</span>
            <ChevronRight size={20} style={{ color: '#64748b' }} />
          </Link>
        ))}
      </div>
    </div>
  )
}

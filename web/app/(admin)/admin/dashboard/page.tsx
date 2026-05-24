import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [usersRes, shopsRes, ordersRes, pendingRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('shops').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const stats = [
    { icon: '👤', value: usersRes.count ?? 0,   label: 'Total Users',    href: '/admin/users' },
    { icon: '🏪', value: shopsRes.count ?? 0,   label: 'Total Shops',    href: '/admin/shops' },
    { icon: '📦', value: ordersRes.count ?? 0,  label: 'Total Orders',   href: '/admin/orders' },
    { icon: '🕐', value: pendingRes.count ?? 0, label: 'Pending Orders', href: '/admin/orders' },
  ]

  const quickLinks = [
    { href: '/admin/shops',          icon: '🏪', label: 'Approve Shops' },
    { href: '/admin/categories',     icon: '🏷️', label: 'Add Category' },
    { href: '/admin/credit',         icon: '💳', label: 'Credit Monitor' },
    { href: '/admin/logs',           icon: '🗒️', label: 'View Logs' },
    { href: '/admin/disputes',       icon: '🚨', label: 'Disputes' },
    { href: '/admin/settings',       icon: '⚙️', label: 'Settings' },
  ]

  return (
    <>
      <h1 className="panel-page-title">System Overview</h1>

      <div className="stat-grid">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="stat-card-icon">{s.icon}</span>
            <span className="stat-card-value">{s.value}</span>
            <span className="stat-card-label">{s.label}</span>
          </Link>
        ))}
      </div>

      <h2 className="font-semibold" style={{ marginBottom: '.75rem' }}>Quick Actions</h2>
      <div className="grid-3">
        {quickLinks.map(a => (
          <Link key={a.href} href={a.href} id={`admin-ql-${a.label}`} className="card card-body"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>{a.icon}</span>
            <p className="font-medium text-sm">{a.label}</p>
          </Link>
        ))}
      </div>
    </>
  )
}

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Mail, Globe, User, Calendar, ShieldCheck, AlertCircle, Store, Package } from 'lucide-react'

export const metadata: Metadata = { title: 'User Detail (Admin)' }

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const [{ data: user }, { data: orders }, { data: shops }] = await Promise.all([
    supabase.from('users').select('*, user_profiles(email, profile_image_url, gender, preferred_language)').eq('id', userId).single(),
    supabase.from('orders').select('id, status, created_at, total_final_price, shops(name)').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('shop_owners').select('shops(id, name)').eq('user_id', userId),
  ])

  if (!user) notFound()

  const u = user as any

  return (
    <>
      <Link href="/admin/users" className="btn btn-ghost btn-sm" id="back-users" style={{ marginBottom: '1rem' }}>← All Users</Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--wa-green-dark), var(--wa-green))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#fff', fontWeight: 700 }}>
          {u.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div>
          <h1 className="panel-page-title" style={{ marginBottom: '.15rem' }}>{u.name}</h1>
          <p className="text-muted text-sm">{u.phone}</p>
          <span className={`badge ${u.role === 'admin' ? 'badge-warning' : u.role === 'shop_owner' ? 'badge-info' : 'badge-neutral'}`} style={{ marginTop: '.25rem' }}>{u.role}</span>
        </div>
      </div>

      {/* Info card */}
      <div className="wa-list" style={{ marginBottom: '1.5rem', maxWidth: 540 }}>
        {[
          { icon: <Mail size={18} />, label: 'Email',    val: u.user_profiles?.email },
          { icon: <Globe size={18} />, label: 'Language', val: u.user_profiles?.preferred_language },
          { icon: <User size={18} />, label: 'Gender',   val: u.user_profiles?.gender },
          { icon: <Calendar size={18} />, label: 'Joined',   val: new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
          { icon: u.is_active ? <ShieldCheck size={18} color="var(--wa-green-dark)" /> : <AlertCircle size={18} color="var(--danger)" />, label: 'Status', val: u.is_active ? 'Active' : 'Inactive' },
        ].map(row => (
          <div key={row.label} className="wa-list-item" style={{ cursor: 'default' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', color: 'var(--wa-green-dark)' }}>{row.icon}</span>
            <div className="wa-item-body">
              <p className="wa-item-sub">{row.label}</p>
              <p className="wa-item-title">{row.val ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Shops owned */}
      {(shops ?? []).length > 0 && (
        <>
          <h2 className="font-semibold" style={{ marginBottom: '.75rem' }}>Shops Owned</h2>
          <div className="wa-list" style={{ marginBottom: '1.5rem' }}>
            {(shops as any[]).map(so => (
              <Link key={so.shops.id} href={`/home/shop/${so.shops.id}`} id={`udetail-shop-${so.shops.id}`} className="wa-list-item">
                <div className="wa-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wa-green-dark)' }}><Store size={18} /></div>
                <div className="wa-item-body"><p className="wa-item-title">{so.shops.name}</p></div>
                <span>→</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Recent orders */}
      <h2 className="font-semibold" style={{ marginBottom: '.75rem' }}>Recent Orders</h2>
      {(orders ?? []).length === 0 ? (
        <p className="text-muted text-sm">No orders yet.</p>
      ) : (
        <div className="wa-list">
          {(orders as any[]).map(o => (
            <Link key={o.id} href={`/admin/orders/${o.id}`} id={`udetail-order-${o.id}`} className="wa-list-item">
              <div className="wa-avatar" style={{ background: 'var(--neutral-100)', color: 'var(--text-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={16} /></div>
              <div className="wa-item-body">
                <p className="wa-item-title">{o.shops?.name ?? 'Shop'}</p>
                <p className="wa-item-sub">#{o.id.slice(0, 8)} · {o.status}</p>
              </div>
              <div className="wa-item-right">
                <span className="font-semibold text-sm">₹{o.total_final_price ?? '—'}</span>
                <span className="wa-item-time">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

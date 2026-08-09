'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Mail,
  Globe,
  User,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Store,
  Package,
  Shield,
  Check,
  Loader2,
  UserCheck
} from 'lucide-react'
import { updateUserRoleAction } from '@/app/actions/admin'

type Props = {
  user: any
  orders: any[]
  shops: any[]
}

const ROLES = [
  {
    id: 'customer',
    label: 'Customer',
    icon: User,
    color: '#64748b',
    bg: '#f1f5f9',
    border: '#cbd5e1',
    description: 'Standard customer account for browsing shops and placing orders.'
  },
  {
    id: 'shop_owner',
    label: 'Shop Keeper',
    icon: Store,
    color: '#0284c7',
    bg: '#f0f9ff',
    border: '#bae6fd',
    description: 'Shop owner account with access to Vendor Panel, inventory, and order fulfillment.'
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    description: 'Administrator with full system access, user management, and shop approvals.'
  }
]

export default function UserDetailClient({ user: initialUser, orders, shops }: Props) {
  const [user, setUser] = useState(initialUser)
  const [role, setRole] = useState<string>(initialUser.role ?? 'customer')
  const [savingRole, setSavingRole] = useState(false)
  const [roleMsg, setRoleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleRoleChange(newRole: string) {
    if (newRole === role || savingRole) return

    setSavingRole(true)
    setRoleMsg(null)

    const res = await updateUserRoleAction(user.id, newRole)
    setSavingRole(false)

    if (res.success) {
      setRole(newRole)
      setUser((prev: any) => ({ ...prev, role: newRole }))
      setRoleMsg({
        type: 'success',
        text: `Role successfully updated to ${ROLES.find(r => r.id === newRole)?.label ?? newRole}!`
      })
      setTimeout(() => setRoleMsg(null), 4000)
    } else {
      setRoleMsg({
        type: 'error',
        text: res.error || 'Failed to update user role.'
      })
    }
  }

  const currentRoleInfo = ROLES.find(r => r.id === role) || ROLES[0]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Back button */}
      <Link href="/admin/users" className="btn btn-ghost btn-sm" id="back-users" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
        ← Back to All Users
      </Link>

      {/* Header Profile Info */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#fff', border: '1px solid var(--wa-separator)', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${currentRoleInfo.color}, var(--wa-green-dark))`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: '#fff',
            fontWeight: 700,
            boxShadow: '0 6px 16px rgba(0,0,0,0.1)'
          }}>
            {user.name?.[0]?.toUpperCase() ?? '?'}
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
              <h1 className="panel-page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{user.name}</h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '.3rem',
                  padding: '.25rem .75rem',
                  borderRadius: '20px',
                  fontSize: '.8rem',
                  fontWeight: 700,
                  background: currentRoleInfo.bg,
                  color: currentRoleInfo.color,
                  border: `1px solid ${currentRoleInfo.border}`
                }}
              >
                <currentRoleInfo.icon size={14} />
                {currentRoleInfo.label}
              </span>
            </div>
            <p className="text-muted text-sm" style={{ marginTop: '.25rem', margin: 0 }}>{user.phone || 'No phone number'}</p>
          </div>
        </div>
      </div>

      {/* ROLE CHANGE SECTION */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#fff', border: '1.5px solid var(--wa-separator)', borderRadius: 'var(--radius-lg)', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
          <Shield size={20} style={{ color: 'var(--wa-green-dark)' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Change User Role</h2>
        </div>

        <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          Select a role below to change permissions for <strong>{user.name}</strong>. Changes take effect immediately.
        </p>

        {roleMsg && (
          <div
            style={{
              padding: '.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '.875rem',
              fontWeight: 600,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '.5rem',
              background: roleMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: roleMsg.type === 'success' ? '#15803d' : '#b91c1c',
              border: `1px solid ${roleMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}
          >
            {roleMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {roleMsg.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {ROLES.map(r => {
            const isSelected = role === r.id
            const Icon = r.icon

            return (
              <button
                key={r.id}
                id={`role-opt-${r.id}`}
                type="button"
                onClick={() => handleRoleChange(r.id)}
                disabled={savingRole}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '1.15rem',
                  borderRadius: 'var(--radius-lg)',
                  border: isSelected ? `2px solid ${r.color}` : '1.5px solid var(--border)',
                  background: isSelected ? r.bg : '#fff',
                  cursor: isSelected || savingRole ? 'default' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  outline: 'none',
                  boxShadow: isSelected ? `0 4px 14px ${r.color}22` : 'none'
                }}
              >
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: r.color,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {savingRole ? <Loader2 size={12} className="spinner" /> : <Check size={14} strokeWidth={3} />}
                  </span>
                )}

                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '12px',
                  background: `${r.color}15`,
                  color: r.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '.75rem'
                }}>
                  <Icon size={20} />
                </div>

                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '.25rem' }}>
                  {r.label}
                </span>

                <span style={{ fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {r.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Info card */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '.75rem' }}>User Information</h2>
      <div className="wa-list" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: <Mail size={18} />, label: 'Email', val: user.user_profiles?.email },
          { icon: <Globe size={18} />, label: 'Language', val: user.user_profiles?.preferred_language },
          { icon: <User size={18} />, label: 'Gender', val: user.user_profiles?.gender },
          { icon: <Calendar size={18} />, label: 'Joined', val: user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
          { icon: user.is_active ? <ShieldCheck size={18} color="var(--wa-green-dark)" /> : <AlertCircle size={18} color="var(--danger)" />, label: 'Status', val: user.is_active ? 'Active' : 'Inactive' },
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
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '.75rem' }}>Shops Owned ({shops.length})</h2>
          <div className="wa-list" style={{ marginBottom: '1.5rem' }}>
            {(shops as any[]).map(so => (
              <Link key={so.shops?.id || Math.random()} href={`/home/shop/${so.shops?.id}`} id={`udetail-shop-${so.shops?.id}`} className="wa-list-item">
                <div className="wa-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wa-green-dark)' }}><Store size={18} /></div>
                <div className="wa-item-body"><p className="wa-item-title">{so.shops?.name ?? 'Shop'}</p></div>
                <span>→</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Recent orders */}
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '.75rem' }}>Recent Orders ({orders?.length ?? 0})</h2>
      {(orders ?? []).length === 0 ? (
        <p className="text-muted text-sm">No orders recorded for this user.</p>
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
    </div>
  )
}

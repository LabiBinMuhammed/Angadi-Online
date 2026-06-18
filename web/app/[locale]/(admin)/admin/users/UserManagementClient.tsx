'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, User, Phone, Shield, Loader2, Trash2 } from 'lucide-react'
import type { User as UserType } from '@/types'

const ROLE_BADGE: Record<string, string> = {
  customer: 'badge-neutral', shop_owner: 'badge-info', admin: 'badge-warning',
}

const ROLES = ['customer', 'shop_owner', 'admin']

type NewUser = { name: string; phone: string; role: string }

export default function UserManagementClient({ users: initial }: { users: UserType[] }) {
  const [users, setUsers] = useState(initial)
  const [search, setSearch]     = useState('')
  const [role, setRole]         = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formErr, setFormErr]   = useState('')
  const [newUser, setNewUser]   = useState<NewUser>({ name: '', phone: '', role: 'customer' })

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
    const matchRole   = role === 'all' || u.role === role
    return matchSearch && matchRole
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newUser.name.trim() || !newUser.phone.trim()) {
      setFormErr('Name and phone are required.')
      return
    }
    setCreating(true)
    setFormErr('')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .insert({ name: newUser.name.trim(), phone: newUser.phone.trim(), role: newUser.role, is_active: true })
      .select('*')
      .single()
    setCreating(false)
    if (error) { setFormErr(error.message); return }
    if (data) setUsers(prev => [data as UserType, ...prev])
    setShowCreate(false)
    setNewUser({ name: '', phone: '', role: 'customer' })
  }

  async function toggleUser(u: UserType) {
    const supabase = createClient()
    const next = !u.is_active
    await supabase.from('users').update({ is_active: next }).eq('id', u.id)
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: next } : x))
  }

  async function handleDelete(u: UserType) {
    if (!window.confirm(`Delete user "${u.name ?? 'this user'}"? This cannot be undone.`)) {
      return
    }
    const supabase = createClient()
    const { error } = await supabase.from('users').delete().eq('id', u.id)
    if (error) {
      alert(`Error deleting user: ${error.message}`)
      return
    }
    setUsers(prev => prev.filter(x => x.id !== u.id))
  }

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <span className="search-bar-icon">🔍</span>
          <input placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="chip-row" style={{ marginBottom: 0 }}>
          {['all', 'customer', 'shop_owner', 'admin'].map(r => (
            <button key={r} className={`chip${role === r ? ' active' : ''}`} id={`urole-${r}`}
              onClick={() => setRole(r)}>{r.replace('_', ' ')}</button>
          ))}
        </div>
        <button
          className="btn btn-primary"
          id="btn-add-user"
          onClick={() => { setShowCreate(true); setFormErr('') }}
          style={{ background: 'var(--wa-green-dark)', display: 'flex', alignItems: 'center', gap: '.4rem' }}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Table */}
      <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Last Login</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(u => {
              const initials = u.name ? u.name[0].toUpperCase() : '?'
              const roleColor = u.role === 'admin' ? '#f59e0b' : u.role === 'shop_owner' ? '#3b82f6' : '#64748b'
              return (
                <tr key={u.id} id={`user-row-${u.id}`}>
                  <td className="font-medium">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: `${roleColor}1c`,
                        color: roleColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        border: `1.5px solid ${roleColor}28`
                      }}>
                        {initials}
                      </div>
                      <span>{u.name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="text-sm">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>{u.phone}</span>
                      {u.phone_verified ? (
                        <span style={{ fontSize: '.7rem', color: '#166534', fontWeight: 600 }}>✓ Verified</span>
                      ) : (
                        <span style={{ fontSize: '.7rem', color: '#991b1b', fontWeight: 600 }}>✗ Unverified</span>
                      )}
                    </div>
                  </td>
                  <td><span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-neutral'}`}>{u.role}</span></td>
                  <td>
                    <button
                      onClick={() => toggleUser(u)}
                      className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}
                      style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                      title="Click to toggle status"
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="text-sm text-muted">{new Date(u.created_at!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="text-sm text-muted">{u.last_login_at ? new Date(u.last_login_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button
                        id={`delete-user-${u.id}`}
                        className="btn btn-sm"
                        style={{ background: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: 'none' }}
                        onClick={() => handleDelete(u)}
                      >
                        <Trash2 size={14} style={{ marginRight: '2px' }} /> Delete
                      </button>
                      <Link href={`/admin/users/${u.id}`} id={`view-user-${u.id}`} className="btn btn-sm btn-outline">
                        Details →
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Cards */}
      <div className="mobile-only-grid" style={{ display: 'none', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map(u => {
          const roleColor = u.role === 'admin' ? '#f59e0b' : u.role === 'shop_owner' ? '#3b82f6' : '#64748b'
          return (
            <div key={u.id} className="card card-body" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#fff', border: '1px solid var(--wa-separator)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden', flex: 1 }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: `${roleColor}1c`,
                  color: roleColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  border: `1.5px solid ${roleColor}28`,
                  flexShrink: 0
                }}>
                  {u.name ? u.name[0].toUpperCase() : '?'}
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name ?? '—'}</h4>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.phone}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0, marginLeft: '0.5rem' }}>
                <button 
                  onClick={() => toggleUser(u)}
                  className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}
                  style={{ border: 'none', cursor: 'pointer', outline: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  title="Click to toggle status"
                >
                  {u.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  className="btn btn-sm"
                  style={{ padding: '0.25rem', background: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: 'none', minWidth: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => handleDelete(u)}
                  title="Delete User"
                >
                  <Trash2 size={16} />
                </button>
                <Link 
                  href={`/admin/users/${u.id}`} 
                  className="btn btn-sm btn-outline"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  Details →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card fade-up" style={{ width: '100%', maxWidth: 460, background: '#fff' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="font-bold">Add New User</h3>
              <button onClick={() => setShowCreate(false)} className="btn-ghost" style={{ padding: '.25rem' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="e.g. Arjun Kumar"
                    value={newUser.name}
                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="+91 98765 43210"
                    value={newUser.phone}
                    onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Role */}
              <div className="form-group">
                <label className="form-label">Role</label>
                <div style={{ position: 'relative' }}>
                  <Shield size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <select
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              {formErr && <p className="form-error">{formErr}</p>}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '.5rem' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={creating} className="btn btn-primary" style={{ flex: 1, background: 'var(--wa-green-dark)' }}>
                  {creating ? <Loader2 size={18} className="spinner" /> : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

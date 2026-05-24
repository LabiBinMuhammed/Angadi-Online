'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, User, Phone, Shield, Loader2 } from 'lucide-react'
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
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} id={`user-row-${u.id}`}>
                <td className="font-medium">{u.name ?? '—'}</td>
                <td className="text-sm">{u.phone}</td>
                <td><span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-neutral'}`}>{u.role}</span></td>
                <td><span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td className="text-sm text-muted">{new Date(u.created_at!).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button
                      id={`toggle-user-${u.id}`}
                      className="btn btn-sm btn-outline"
                      onClick={() => toggleUser(u)}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <Link href={`/admin/users/${u.id}`} id={`view-user-${u.id}`} className="btn btn-sm btn-outline">
                      View →
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

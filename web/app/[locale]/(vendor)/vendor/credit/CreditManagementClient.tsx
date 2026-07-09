'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, CreditCard, ShieldBan, ShieldCheck, History, Plus, X, UserPlus, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { grantCreditAction } from '@/app/actions/credit'

type CreditRow = {
  id: string
  user_id: string
  is_credit_enabled: boolean
  credit_limit?: number
  used_amount?: number
  is_blocked: boolean
  users: { name: string; phone: string } | null
}

export default function CreditManagementClient({ credits: initial, shopId }: { credits: CreditRow[]; shopId: string }) {
  const { t, locale } = useTranslation()
  const [credits, setCredits] = useState(initial)
  const [search, setSearch] = useState('')

  // Inline Editing limit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLimitVal, setEditLimitVal] = useState('')

  // New Credit Registration Panel state
  const [showGrantPanel, setShowGrantPanel] = useState(false)
  const [userQuery, setUserQuery] = useState('')
  const [matchingUsers, setMatchingUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [newLimit, setNewLimit] = useState('5000')
  const [grantError, setGrantError] = useState('')
  const [grantLoading, setGrantLoading] = useState(false)

  const filtered = credits.filter(c =>
    !search || c.users?.name?.toLowerCase().includes(search.toLowerCase()) || c.users?.phone?.includes(search)
  )

  async function toggleEnabled(credit: CreditRow) {
    const supabase = createClient()
    const next = !credit.is_credit_enabled
    await supabase.from('shop_user_credit').update({ is_credit_enabled: next }).eq('id', credit.id)
    setCredits(prev => prev.map(c => c.id === credit.id ? { ...c, is_credit_enabled: next } : c))
  }

  async function toggleBlock(credit: CreditRow) {
    const supabase = createClient()
    const next = !credit.is_blocked
    await supabase.from('shop_user_credit').update({ is_blocked: next }).eq('id', credit.id)
    setCredits(prev => prev.map(c => c.id === credit.id ? { ...c, is_blocked: next } : c))
  }

  async function updateLimit(credit: CreditRow, limit: string) {
    const val = parseFloat(limit)
    if (isNaN(val)) return
    const supabase = createClient()
    await supabase.from('shop_user_credit').update({ credit_limit: val }).eq('id', credit.id)
    setCredits(prev => prev.map(c => c.id === credit.id ? { ...c, credit_limit: val } : c))
  }

  // Search system customers
  async function searchCustomers(q: string) {
    setUserQuery(q)
    if (q.trim().length < 2) {
      setMatchingUsers([])
      return
    }

    const supabase = createClient()
    const existingUserIds = credits.map(c => c.user_id)

    // Look up customers not already in the credits table
    const { data, error } = await supabase
      .from('users')
      .select('id, name, phone')
      .eq('role', 'customer')
      .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(8)

    if (!error && data) {
      setMatchingUsers(data.filter(u => !existingUserIds.includes(u.id)))
    }
  }

  async function handleGrantCredit() {
    if (!selectedUser) return
    setGrantLoading(true)
    setGrantError('')
    try {
      const limitVal = parseFloat(newLimit)
      if (isNaN(limitVal) || limitVal < 0) {
        throw new Error('Please enter a valid credit limit')
      }

      await grantCreditAction(shopId, selectedUser.id, limitVal)

      // Add to local state list
      const newRow: CreditRow = {
        id: Math.random().toString(), // client-side placeholder ID
        user_id: selectedUser.id,
        is_credit_enabled: true,
        credit_limit: limitVal,
        used_amount: 0,
        is_blocked: false,
        users: { name: selectedUser.name, phone: selectedUser.phone }
      }
      setCredits(prev => [newRow, ...prev])

      // Reset state
      setSelectedUser(null)
      setUserQuery('')
      setMatchingUsers([])
      setShowGrantPanel(false)
    } catch (err: any) {
      setGrantError(err.message)
    } finally {
      setGrantLoading(false)
    }
  }

  return (
    <div className="vp-card">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', [locale === 'ar' ? 'right' : 'left']: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            className="vp-input" 
            style={{ [locale === 'ar' ? 'paddingRight' : 'paddingLeft']: '2.75rem', borderRadius: '99px' }}
            placeholder={t('vendor_credit.search_customer_placeholder')} 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        
        <button 
          className="vp-btn vp-btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '99px' }}
          onClick={() => setShowGrantPanel(!showGrantPanel)}
        >
          {showGrantPanel ? <X size={18} /> : <UserPlus size={18} />}
          {showGrantPanel ? t('common.cancel') : 'Grant Credit'}
        </button>
      </div>

      {/* Grant Credit Form Panel */}
      {showGrantPanel && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Grant Credit Account to Customer</h3>
          
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
            {!selectedUser ? (
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Search Customer (Name or Phone)</label>
                <input
                  className="vp-input"
                  placeholder="Type name or phone number..."
                  value={userQuery}
                  onChange={e => searchCustomers(e.target.value)}
                />
                
                {matchingUsers.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', zIndex: 10, marginTop: '0.25rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {matchingUsers.map(u => (
                      <div 
                        key={u.id} 
                        style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #1e293b' }}
                        onClick={() => setSelectedUser(u)}
                        className="hover-bg-slate"
                      >
                        <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>{u.name}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{u.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#0f172a', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>{selectedUser.name}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{selectedUser.phone}</p>
                </div>
                <button className="vp-btn vp-btn-sm vp-btn-outline" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setSelectedUser(null)}>
                  Change
                </button>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>Credit Limit (₹)</label>
              <input
                type="number"
                className="vp-input"
                value={newLimit}
                onChange={e => setNewLimit(e.target.value)}
              />
            </div>

            {grantError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.9rem' }}>
                <AlertCircle size={16} /> {grantError}
              </div>
            )}

            <button 
              className="vp-btn vp-btn-primary" 
              onClick={handleGrantCredit} 
              disabled={grantLoading || !selectedUser}
            >
              {grantLoading ? 'Granting...' : 'Grant Credit Account'}
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
          <CreditCard size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('vendor_credit.no_credit_records')}</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{t('vendor_credit.no_credit_records_desc')}</p>
        </div>
      ) : (
        <div className="vp-table-wrapper">
          <table className="vp-table">
            <thead>
              <tr>
                <th>{t('vendor_credit.customer_label')}</th>
                <th>{t('vendor_credit.credit_status_label')}</th>
                <th>{t('vendor_credit.used_limit_label')}</th>
                <th>{t('vendor_credit.blocked_status_label')}</th>
                <th style={{ textAlign: locale === 'ar' ? 'left' : 'right' }}>{t('vendor_credit.actions_label')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} id={`credit-row-${c.id}`}>
                  <td>
                    <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{c.users?.name ?? '—'}</p>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>{c.users?.phone}</p>
                  </td>
                  <td>
                    <span className={`vp-badge ${c.is_credit_enabled ? 'vp-badge-success' : 'vp-badge-neutral'}`}>
                      {c.is_credit_enabled ? t('vendor_credit.status_enabled') : t('vendor_credit.status_disabled')}
                    </span>
                  </td>
                  <td>
                    {editingId === c.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <input
                          type="number"
                          className="vp-input"
                          style={{ width: '80px', padding: '0.2rem 0.4rem', fontSize: '0.9rem' }}
                          value={editLimitVal}
                          onChange={e => setEditLimitVal(e.target.value)}
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              updateLimit(c, editLimitVal)
                              setEditingId(null)
                            } else if (e.key === 'Escape') {
                              setEditingId(null)
                            }
                          }}
                        />
                        <button className="vp-btn vp-btn-sm vp-btn-primary" style={{ padding: '0.25rem' }} onClick={() => {
                          updateLimit(c, editLimitVal)
                          setEditingId(null)
                        }}>
                          ✓
                        </button>
                        <button className="vp-btn vp-btn-sm vp-btn-outline" style={{ padding: '0.25rem' }} onClick={() => setEditingId(null)}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => {
                        setEditingId(c.id)
                        setEditLimitVal(String(c.credit_limit ?? ''))
                      }} title="Click to edit limit">
                        <span style={{ fontWeight: 700, color: c.used_amount && c.credit_limit && c.used_amount > c.credit_limit * 0.8 ? '#f87171' : '#e2e8f0' }}>₹{c.used_amount ?? 0}</span>
                        <span style={{ color: '#64748b' }}>/</span>
                        <span style={{ color: '#94a3b8', textDecoration: 'underline dashed #475569' }}>₹{c.credit_limit ?? '—'}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`vp-badge ${c.is_blocked ? 'vp-badge-danger' : 'vp-badge-success'}`}>
                      {c.is_blocked ? t('vendor_credit.status_blocked') : t('vendor_credit.status_active')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: locale === 'ar' ? 'flex-start' : 'flex-end', flexWrap: 'wrap' }}>
                      <button id={`toggle-credit-${c.id}`} className={`vp-btn vp-btn-sm ${c.is_credit_enabled ? 'vp-btn-outline' : 'vp-btn-primary'}`}
                        onClick={() => toggleEnabled(c)} style={{ padding: '0.5rem 0.75rem' }}>
                        {c.is_credit_enabled ? t('vendor_credit.disable_button') : t('vendor_credit.enable_button')}
                      </button>
                      <button id={`toggle-block-${c.id}`} className={`vp-btn vp-btn-sm ${c.is_blocked ? 'vp-btn-outline' : 'vp-btn-danger'}`}
                        onClick={() => toggleBlock(c)} style={{ padding: '0.5rem 0.75rem' }} title={c.is_blocked ? t('vendor_credit.unblock_tooltip') : t('vendor_credit.block_tooltip')}>
                        {c.is_blocked ? <ShieldCheck size={16} /> : <ShieldBan size={16} />}
                      </button>
                      <Link href={`/vendor/credit/${c.user_id}`} id={`view-credit-${c.id}`} className="vp-btn vp-btn-sm vp-btn-outline" style={{ padding: '0.5rem 0.75rem' }} title={t('vendor_credit.view_history_tooltip')}>
                        <History size={16} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

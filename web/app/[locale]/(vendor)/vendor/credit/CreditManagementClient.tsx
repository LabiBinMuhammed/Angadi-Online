'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, CreditCard, ShieldBan, ShieldCheck, History } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

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
      </div>

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: c.used_amount && c.credit_limit && c.used_amount > c.credit_limit * 0.8 ? '#f87171' : '#e2e8f0' }}>₹{c.used_amount ?? 0}</span>
                      <span style={{ color: '#64748b' }}>/</span>
                      <span style={{ color: '#94a3b8' }}>₹{c.credit_limit ?? '—'}</span>
                    </div>
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

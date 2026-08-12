import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, CreditCard, Activity, ShieldAlert, Package, ShoppingBag, ArrowRight } from 'lucide-react'
import RepaymentClient from './RepaymentClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../../messages/en.json')
  }
  const t = (key: string) => {
    const parts = key.split('.')
    let curr = messages as any
    for (const part of parts) {
      if (!curr) return key
      curr = curr[part]
    }
    return typeof curr === 'string' ? curr : key
  }
  return { title: t('vendor_credit.user_credit_detail_title') || 'User Credit Detail' }
}

export default async function UserCreditPage({ params }: { params: Promise<{ locale: string; userId: string }> }) {
  const { locale, userId } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages: any = {}
  try {
    messages = require(`../../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../../messages/en.json')
  }

  const t = (key: string) => {
    const parts = key.split('.')
    let curr = messages
    for (const part of parts) {
      if (!curr) return key
      curr = curr[part]
    }
    if (typeof curr === 'string') return curr
    try {
      const enMessages = require('../../../../../../messages/en.json')
      let fallback = enMessages
      for (const part of parts) {
        if (!fallback) return key
        fallback = fallback[part]
      }
      if (typeof fallback === 'string') return fallback
    } catch (e) {}
    return key
  }

  const isRtl = activeLocale === 'ar'
  const BackIcon = isRtl ? ArrowRight : ArrowLeft
  const NextIcon = isRtl ? ArrowLeft : ArrowRight

  const supabase = await createClient()
  const { data: authUser } = await supabase.auth.getUser()
  const { data: shopOwners } = await supabase
    .from('shop_owners').select('shop_id').eq('user_id', authUser.user!.id)
  const shopId = shopOwners?.[0]?.shop_id ?? ''


  const [{ data: credit }, { data: userRow }, { data: orders }, { data: repayments }] = await Promise.all([
    supabase.from('shop_user_credit').select('*').eq('shop_id', shopId).eq('user_id', userId).maybeSingle(),
    supabase.from('users').select('name, phone').eq('id', userId).single(),
    supabase.from('orders').select('id, status, created_at, total_final_price').eq('shop_id', shopId).eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('customer_repayment_logs').select('*').eq('shop_id', shopId).eq('user_id', userId).order('recorded_at', { ascending: false })
  ])

  if (!userRow) notFound()

  const u = userRow as { name: string; phone: string }
  const c = credit as any
  const repaymentsList = repayments || []

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="vp-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <Link href="/vendor/credit" className="vp-btn vp-btn-outline vp-btn-sm" id="back-credit" style={{ marginBottom: '1rem', display: 'inline-flex', padding: '0.4rem 0.8rem', gap: '0.5rem', alignItems: 'center' }}>
            <BackIcon size={16} /> {t('vendor_credit.back_to_credit_management')}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
              <User size={28} />
            </div>
            <div>
              <h1 className="vp-title" style={{ marginBottom: '0.2rem' }}>{u.name}</h1>
              <p className="vp-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Phone size={14} /> {u.phone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Credit summary */}
      <div className="vp-grid" style={{ marginBottom: '2rem' }}>
        <div className="vp-stat-card">
          <div className="vp-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <CreditCard size={24} />
          </div>
          <div className="vp-stat-content">
            <span className="vp-stat-label">{t('vendor_credit.credit_used_label')}</span>
            <span className="vp-stat-value">₹{c?.used_amount ?? 0}</span>
          </div>
        </div>
        <div className="vp-stat-card">
          <div className="vp-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Activity size={24} />
          </div>
          <div className="vp-stat-content">
            <span className="vp-stat-label">{t('vendor_credit.credit_limit_label')}</span>
            <span className="vp-stat-value">₹{c?.credit_limit ?? '∞'}</span>
          </div>
        </div>
        <div className="vp-stat-card">
          <div className="vp-stat-icon" style={{ background: c?.is_blocked ? 'rgba(239, 68, 68, 0.1)' : c?.is_credit_enabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)', color: c?.is_blocked ? '#ef4444' : c?.is_credit_enabled ? '#10b981' : '#94a3b8' }}>
            {c?.is_blocked ? <ShieldAlert size={24} /> : c?.is_credit_enabled ? <CreditCard size={24} /> : <CreditCard size={24} opacity={0.5} />}
          </div>
          <div className="vp-stat-content">
            <span className="vp-stat-label">{t('vendor_credit.account_status_label')}</span>
            <span className="vp-stat-value" style={{ fontSize: '1.25rem', color: c?.is_blocked ? '#f87171' : c?.is_credit_enabled ? '#34d399' : '#94a3b8' }}>
              {c?.is_blocked ? t('vendor_credit.status_blocked') : c?.is_credit_enabled ? t('vendor_credit.status_active') : t('vendor_credit.status_disabled')}
            </span>
          </div>
        </div>
      </div>

      {/* Order history */}
      <div className="vp-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <ShoppingBag size={20} color="#3b82f6" />
          <h2 className="vp-title" style={{ fontSize: '1.25rem', margin: 0 }}>{t('vendor_credit.order_history_title')}</h2>
        </div>

        {(orders ?? []).length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('vendor_credit.no_orders')}</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{t('vendor_credit.no_orders_desc')}</p>
          </div>
        ) : (
          <div className="vp-table-wrapper">
            <table className="vp-table">
              <thead>
                <tr>
                  <th>{t('vendor_credit.order_label')}</th>
                  <th>{t('vendor_credit.date_label')}</th>
                  <th>{t('vendor_credit.amount_label')}</th>
                  <th>{t('vendor_credit.status_label')}</th>
                  <th style={{ textAlign: isRtl ? 'left' : 'right' }}>{t('vendor_credit.action_label')}</th>
                </tr>
              </thead>
              <tbody>
                {(orders ?? []).map((o: any) => (
                  <tr key={o.id} id={`ucredit-order-${o.id}`}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                          <Package size={16} />
                        </div>
                        <span style={{ fontWeight: 600, color: '#fff', fontFamily: 'monospace', fontSize: '0.9rem' }}>#{o.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                      {new Date(o.created_at).toLocaleDateString(activeLocale === 'en' ? 'en-IN' : activeLocale, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>
                      ₹{o.total_final_price ?? '—'}
                    </td>
                    <td>
                      <span className="vp-badge vp-badge-neutral">{o.status}</span>
                    </td>
                    <td style={{ textAlign: isRtl ? 'left' : 'right' }}>
                      <Link href={`/vendor/orders/${o.id}`} className="vp-btn vp-btn-outline vp-btn-sm" style={{ padding: '0.4rem 0.75rem', display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                        {t('vendor_credit.view_button')} <NextIcon size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Repayments section */}
      <RepaymentClient shopId={shopId} userId={userId} initialRepayments={repaymentsList} />
    </div>
  )
}

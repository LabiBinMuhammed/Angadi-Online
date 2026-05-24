import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, CreditCard, Activity, ShieldAlert, Package, ShoppingBag, ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'User Credit Detail' }

export default async function UserCreditPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: authUser } = await supabase.auth.getUser()
  const { data: shopOwner } = await supabase
    .from('shop_owners').select('shop_id').eq('user_id', authUser.user!.id).maybeSingle()
  const shopId = (shopOwner as any)?.shop_id

  const [{ data: credit }, { data: userRow }, { data: orders }] = await Promise.all([
    supabase.from('shop_user_credits').select('*').eq('shop_id', shopId).eq('user_id', userId).maybeSingle(),
    supabase.from('users').select('name, phone').eq('id', userId).single(),
    supabase.from('orders').select('id, status, created_at, total_final_price').eq('shop_id', shopId).eq('user_id', userId).order('created_at', { ascending: false }),
  ])

  if (!userRow) notFound()

  const u = userRow as { name: string; phone: string }
  const c = credit as any

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="vp-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <Link href="/vendor/credit" className="vp-btn vp-btn-outline vp-btn-sm" id="back-credit" style={{ marginBottom: '1rem', display: 'inline-flex', padding: '0.4rem 0.8rem' }}>
            <ArrowLeft size={16} /> Back to Credit Management
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
            <span className="vp-stat-label">Credit Used</span>
            <span className="vp-stat-value">₹{c?.used_amount ?? 0}</span>
          </div>
        </div>
        <div className="vp-stat-card">
          <div className="vp-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Activity size={24} />
          </div>
          <div className="vp-stat-content">
            <span className="vp-stat-label">Credit Limit</span>
            <span className="vp-stat-value">₹{c?.credit_limit ?? '∞'}</span>
          </div>
        </div>
        <div className="vp-stat-card">
          <div className="vp-stat-icon" style={{ background: c?.is_blocked ? 'rgba(239, 68, 68, 0.1)' : c?.is_credit_enabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)', color: c?.is_blocked ? '#ef4444' : c?.is_credit_enabled ? '#10b981' : '#94a3b8' }}>
            {c?.is_blocked ? <ShieldAlert size={24} /> : c?.is_credit_enabled ? <CreditCard size={24} /> : <CreditCard size={24} opacity={0.5} />}
          </div>
          <div className="vp-stat-content">
            <span className="vp-stat-label">Account Status</span>
            <span className="vp-stat-value" style={{ fontSize: '1.25rem', color: c?.is_blocked ? '#f87171' : c?.is_credit_enabled ? '#34d399' : '#94a3b8' }}>
              {c?.is_blocked ? 'Blocked' : c?.is_credit_enabled ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Order history */}
      <div className="vp-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <ShoppingBag size={20} color="#3b82f6" />
          <h2 className="vp-title" style={{ fontSize: '1.25rem', margin: 0 }}>Order History</h2>
        </div>

        {(orders ?? []).length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No orders yet</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>This customer hasn't placed any orders.</p>
          </div>
        ) : (
          <div className="vp-table-wrapper">
            <table className="vp-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
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
                      {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ fontWeight: 700, color: '#10b981' }}>
                      ₹{o.total_final_price ?? '—'}
                    </td>
                    <td>
                      <span className="vp-badge vp-badge-neutral">{o.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/vendor/orders/${o.id}`} className="vp-btn vp-btn-outline vp-btn-sm" style={{ padding: '0.4rem 0.75rem' }}>
                        View <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

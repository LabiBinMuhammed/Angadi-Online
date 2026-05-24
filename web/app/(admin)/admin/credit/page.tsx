import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Credit Monitor (Admin)' }

export default async function AdminCreditPage() {
  const supabase = await createClient()
  const { data: credits } = await supabase
    .from('shop_user_credits')
    .select('*, users(name, phone), shops(name)')
    .order('used_amount', { ascending: false })
    .limit(100)

  const totalUsed = (credits ?? []).reduce((sum: number, c: any) => sum + (c.used_amount ?? 0), 0)
  const blocked = (credits ?? []).filter((c: any) => c.is_blocked).length
  const enabled = (credits ?? []).filter((c: any) => c.is_credit_enabled).length

  return (
    <>
      <h1 className="panel-page-title">Credit Monitoring</h1>

      <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card"><span className="stat-card-icon">💳</span><span className="stat-card-value">₹{totalUsed.toFixed(0)}</span><span className="stat-card-label">Total Credit Used</span></div>
        <div className="stat-card"><span className="stat-card-icon">✅</span><span className="stat-card-value">{enabled}</span><span className="stat-card-label">Enabled</span></div>
        <div className="stat-card"><span className="stat-card-icon">🔴</span><span className="stat-card-value">{blocked}</span><span className="stat-card-label">Blocked</span></div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead><tr><th>Customer</th><th>Shop</th><th>Used</th><th>Limit</th><th>Status</th></tr></thead>
          <tbody>
            {(credits ?? []).map((c: any) => (
              <tr key={c.id} id={`admin-credit-${c.id}`}>
                <td>
                  <p className="font-medium">{c.users?.name ?? '—'}</p>
                  <p className="text-sm text-muted">{c.users?.phone}</p>
                </td>
                <td className="text-sm">{c.shops?.name ?? '—'}</td>
                <td className="font-semibold" style={{ color: (c.used_amount ?? 0) > 0 ? 'var(--danger)' : 'inherit' }}>₹{c.used_amount ?? 0}</td>
                <td className="text-sm">{c.credit_limit != null ? `₹${c.credit_limit}` : 'No limit'}</td>
                <td>
                  {c.is_blocked
                    ? <span className="badge badge-danger">Blocked</span>
                    : c.is_credit_enabled
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-neutral">Disabled</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

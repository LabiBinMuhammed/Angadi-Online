'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { formatOrderStatus } from '@/lib/utils/formatters'


type OrderRow = {
  id: string; status: string; created_at: string
  total_final_price?: number; total_estimated_price?: number
  delivery_date?: string
  delivery_slot?: string
  order_number?: number
  users: { name: string; phone: string } | null
  shops: { name: string } | null
}
const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning',
  accepted: 'badge-info',
  ready: 'badge-info',
  out_for_delivery: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
}

export default function AdminOrdersClient({ orders }: { orders: OrderRow[] }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const [status, setStatus] = useState('all')

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.users?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.shops?.name?.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search)
    return matchSearch && (status === 'all' || o.status === status)
  })

  return (
    <>
      <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <span className="search-bar-icon">🔍</span>
          <input placeholder="Search customer, shop or ID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="chip-row">
        {['all', 'pending', 'accepted', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map(s => (
          <button key={s} className={`chip${status === s ? ' active' : ''}`} id={`astatus-${s}`}
            onClick={() => setStatus(s)}>{s === 'out_for_delivery' ? 'Out for Delivery' : s === 'accepted' ? 'Accepted' : s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>
      <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>{filtered.length} orders</p>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Shop</th>
              <th>Date</th>
              <th>Delivery Slot</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const initials = o.users?.name ? o.users.name[0].toUpperCase() : '?'
              return (
                <tr key={o.id} id={`admin-order-${o.id}`}>
                  <td className="text-sm text-muted">
                    {o.order_number ? `#${o.order_number}` : `#${o.id.slice(0, 8)}`}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#e0f2fe',
                        color: '#0369a1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        border: '1.5px solid #bae6fd'
                      }}>
                        {initials}
                      </div>
                      <div>
                        <p className="font-medium" style={{ margin: 0 }}>{o.users?.name ?? '—'}</p>
                        <p className="text-sm text-muted" style={{ margin: 0 }}>{o.users?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{o.shops?.name ?? '—'}</td>
                  <td className="text-sm">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td className="text-sm">
                    {o.delivery_date && o.delivery_slot ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 700, 
                          color: o.delivery_slot === 'morning' ? '#16a34a' : '#ea580c',
                          background: o.delivery_slot === 'morning' ? '#f0fdf4' : '#fff7ed',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          border: `1px solid ${o.delivery_slot === 'morning' ? '#bbf7d0' : '#fed7aa'}`,
                          display: 'inline-block',
                          width: 'fit-content'
                        }}>
                          {o.delivery_slot === 'morning' ? '☀️ Morning' : '🌙 Evening'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(o.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>—</span>
                    )}
                  </td>
                  <td className="font-semibold">₹{o.total_final_price ?? o.total_estimated_price ?? '—'}</td>
                  <td><span className={`badge ${STATUS_BADGE[o.status] ?? 'badge-neutral'}`}>{formatOrderStatus(o.status, t)}</span></td>

                  <td>
                    <Link href={`/admin/orders/${o.id}`} id={`admin-order-detail-${o.id}`} className="btn btn-sm btn-outline">
                      View →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

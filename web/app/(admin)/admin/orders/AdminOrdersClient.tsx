'use client'

import { useState } from 'react'
import Link from 'next/link'

type OrderRow = {
  id: string; status: string; created_at: string
  total_final_price?: number; total_estimated_price?: number
  users: { name: string; phone: string } | null
  shops: { name: string } | null
}
const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-warning', packing: 'badge-info', delivering: 'badge-info',
  delivered: 'badge-success', cancelled: 'badge-danger',
}

export default function AdminOrdersClient({ orders }: { orders: OrderRow[] }) {
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
        {['all', 'pending', 'packing', 'delivering', 'delivered', 'cancelled'].map(s => (
          <button key={s} className={`chip${status === s ? ' active' : ''}`} id={`astatus-${s}`}
            onClick={() => setStatus(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</button>
        ))}
      </div>
      <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>{filtered.length} orders</p>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead><tr><th>Order ID</th><th>Customer</th><th>Shop</th><th>Date</th><th>Amount</th><th>Status</th><th>Detail</th></tr></thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} id={`admin-order-${o.id}`}>
                <td className="text-sm text-muted">#{o.id.slice(0, 8)}</td>
                <td>
                  <p className="font-medium">{o.users?.name ?? '—'}</p>
                  <p className="text-sm text-muted">{o.users?.phone}</p>
                </td>
                <td className="text-sm">{o.shops?.name ?? '—'}</td>
                <td className="text-sm">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                <td className="font-semibold">₹{o.total_final_price ?? o.total_estimated_price ?? '—'}</td>
                <td><span className={`badge ${STATUS_BADGE[o.status] ?? 'badge-neutral'}`}>{o.status}</span></td>
                <td>
                  <Link href={`/admin/orders/${o.id}`} id={`admin-order-detail-${o.id}`} className="btn btn-sm btn-outline">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

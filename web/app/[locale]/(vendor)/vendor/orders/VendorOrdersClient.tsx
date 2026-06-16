'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingBag, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

type OrderRow = {
  id: string
  status: string
  created_at: string
  total_estimated_price?: number
  total_final_price?: number
  delivery_date?: string
  delivery_slot?: string
  order_number?: number
  users: { name: string; phone: string } | null
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'vp-badge-warning',
  accepted: 'vp-badge-info',
  ready: 'vp-badge-info',
  out_for_delivery: 'vp-badge-info',
  delivered: 'vp-badge-success',
  cancelled: 'vp-badge-danger',
}
const STATUSES = ['all', 'pending', 'accepted', 'ready', 'out_for_delivery', 'delivered', 'cancelled']

export default function VendorOrdersClient({ orders }: { orders: OrderRow[] }) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.status === filter
    const matchSearch = !search || o.users?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.id.includes(search)
    return matchStatus && matchSearch
  })

  return (
    <div className="vp-card">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            className="vp-input" 
            style={{ paddingLeft: '2.75rem', borderRadius: '99px' }}
            placeholder={t('vendor_dashboard.search_products_placeholder') || 'Search by customer or order ID…'} 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '99px', overflowX: 'auto' }}>
          {STATUSES.map(s => (
            <button 
              key={s} 
              className="vp-btn" 
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                borderRadius: '99px',
                background: filter === s ? '#8b5cf6' : 'transparent',
                color: filter === s ? '#fff' : '#94a3b8',
                boxShadow: filter === s ? '0 2px 8px rgba(139,92,246,0.3)' : 'none',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setFilter(s)} 
              id={`filter-${s}`}
            >
              {s === 'all' ? (t('vendor_dashboard.filter_all') || 'All') : t(`orders.status_${s === 'accepted' ? 'pending' : s === 'ready' ? 'packing' : s === 'out_for_delivery' ? 'delivering' : s}`) || s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
          <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('vendor_dashboard.vendor_no_orders') || 'No orders found'}</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{t('recent_purchases.start_shopping') || 'Try adjusting your search or filter'}</p>
        </div>
      ) : (
        <div className="vp-table-wrapper">
          <table className="vp-table">
            <thead>
              <tr>
                <th>{t('purchase_history.order_id') || 'Order ID'}</th>
                <th>{t('reviews.customer_fallback') || 'Customer'}</th>
                <th>{t('purchase_history.date') || 'Date'}</th>
                <th>{t('checkout.delivery_slot') || 'Delivery Slot'}</th>
                <th>{t('purchase_history.total') || 'Amount'}</th>
                <th>{t('purchase_history.status') || 'Status'}</th>
                <th style={{ textAlign: 'right' }}>{t('vendor_commission.actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id} id={`vorder-${order.id}`}>
                  <td style={{ color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {order.order_number ? `#${order.order_number}` : `#${order.id.slice(0, 8)}`}
                  </td>
                  <td>
                    <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{order.users?.name ?? '—'}</p>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.2rem' }}>{order.users?.phone}</p>
                  </td>
                  <td style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>
                    {order.delivery_date && order.delivery_slot ? (
                      <div>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          color: order.delivery_slot === 'morning' ? '#10b981' : '#f97316',
                          backgroundColor: order.delivery_slot === 'morning' ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          border: `1px solid ${order.delivery_slot === 'morning' ? 'rgba(16,185,129,0.2)' : 'rgba(249,115,22,0.2)'}`
                        }}>
                          {order.delivery_slot === 'morning' ? `☀️ ${t('checkout.morning') || 'Morning'}` : `🌙 ${t('checkout.evening') || 'Evening'}`}
                        </span>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                          {new Date(order.delivery_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: '#10b981' }}>
                    {order.total_final_price != null ? `₹${order.total_final_price}` : order.total_estimated_price != null ? `~₹${order.total_estimated_price}` : '—'}
                  </td>
                  <td>
                    <span className={`vp-badge ${STATUS_BADGE[order.status] ?? 'vp-badge-neutral'}`}>
                      {t(`orders.status_${order.status === 'accepted' ? 'pending' : order.status === 'ready' ? 'packing' : order.status === 'out_for_delivery' ? 'delivering' : order.status}`) || order.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/vendor/orders/${order.id}`} id={`vorder-detail-${order.id}`} className="vp-btn vp-btn-outline vp-btn-sm" style={{ padding: '0.5rem 1rem' }}>
                      {t('purchase_history.view_order') || 'Process'} <ArrowRight size={14} />
                    </Link>
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

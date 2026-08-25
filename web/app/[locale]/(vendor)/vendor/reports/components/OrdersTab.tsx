'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Filter, ExternalLink, Package, Clock, Truck, Box, CheckCircle, XCircle, CreditCard, Wallet } from 'lucide-react'
import { ReportOrder } from '../actions'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface OrdersTabProps {
  orders: ReportOrder[]
  locale: string
  initialStatusFilter?: string
}

export default function OrdersTab({ orders, locale, initialStatusFilter = 'all' }: OrdersTabProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)
  const [paymentFilter, setPaymentFilter] = useState('all')

  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`

  const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
    pending: { label: 'Pending', badgeClass: 'vp-badge-warning', icon: <Clock size={13} /> },
    delivering: { label: 'Out for Delivery', badgeClass: 'vp-badge-info', icon: <Truck size={13} /> },
    packing: { label: 'Completed Txn', badgeClass: 'vp-badge-info', icon: <Box size={13} /> },
    delivered: { label: 'Delivered', badgeClass: 'vp-badge-success', icon: <CheckCircle size={13} /> },
    cancelled: { label: 'Cancelled', badgeClass: 'vp-badge-danger', icon: <XCircle size={13} /> }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Status Filter
      if (statusFilter !== 'all' && o.status !== statusFilter) {
        return false
      }
      // Payment Filter
      if (paymentFilter !== 'all' && o.paymentType !== paymentFilter) {
        return false
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase()
        const idMatch = String(o.orderNumber).toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
        const nameMatch = o.customerName.toLowerCase().includes(q)
        const phoneMatch = o.customerPhone.includes(q)
        if (!idMatch && !nameMatch && !phoneMatch) return false
      }
      return true
    })
  }, [orders, statusFilter, paymentFilter, search])

  const totalFilteredAmount = filteredOrders.reduce((sum, o) => o.status !== 'cancelled' ? sum + o.total : sum, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Controls: Search & Filter Row */}
      <div
        className="vp-card"
        style={{
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="vp-input"
            style={{ paddingLeft: '2.75rem' }}
            placeholder={t('vendor_reports.search_orders')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Selects */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            className="vp-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">{t('vendor_reports.all_statuses')} ({orders.length})</option>
            <option value="pending">Pending</option>
            <option value="delivering">Out for Delivery</option>
            <option value="packing">Transaction Completed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Filter */}
          <select
            className="vp-select"
            style={{ width: 'auto', minWidth: '150px' }}
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
          >
            <option value="all">{t('vendor_reports.all_payments')}</option>
            <option value="cod">{t('vendor_reports.cod')}</option>
            <option value="credit">{t('vendor_reports.credit')}</option>
          </select>
        </div>
      </div>

      {/* Orders Count & Total Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: 'var(--text-base)' }}>{filteredOrders.length}</strong> orders
        </span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Non-Cancelled Total: <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>{formatINR(totalFilteredAmount)}</strong>
        </span>
      </div>

      {/* Table Container */}
      <div className="vp-table-wrapper" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {filteredOrders.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
            <Package size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.5 }} />
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>No orders found</h4>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Try adjusting your search criteria or date filter.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="vp-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Order ID</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Date & Slot</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Items</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Payment</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => {
                  const cfg = STATUS_CONFIG[o.status] || { label: o.status, badgeClass: 'vp-badge-neutral', icon: null }
                  return (
                    <tr
                      key={o.id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                      className="hover-row"
                    >
                      {/* Order ID */}
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 700, fontFamily: 'monospace' }}>
                        #{o.orderNumber}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{o.customerName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{o.customerPhone}</div>
                      </td>

                      {/* Date & Slot */}
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem' }}>
                        <div>{o.date}</div>
                        {o.deliverySlot && (
                          <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600, textTransform: 'capitalize' }}>
                            {o.deliverySlot} Delivery
                          </div>
                        )}
                      </td>

                      {/* Items */}
                      <td style={{ padding: '1rem 1.25rem', maxWidth: '240px' }}>
                        <div style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {o.itemsSummary}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {o.itemsCount} {o.itemsCount === 1 ? 'item' : 'items'}
                        </div>
                      </td>

                      {/* Payment */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '8px',
                            background: o.paymentType === 'credit' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: o.paymentType === 'credit' ? '#fbbf24' : '#34d399',
                            border: `1px solid ${o.paymentType === 'credit' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`
                          }}
                        >
                          {o.paymentType === 'credit' ? <CreditCard size={12} /> : <Wallet size={12} />}
                          {o.paymentType === 'credit' ? 'Credit' : 'COD'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          className={`vp-badge ${cfg.badgeClass}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.65rem' }}
                        >
                          {cfg.icon}
                          <span>{cfg.label}</span>
                        </span>
                      </td>

                      {/* Total */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
                        {o.status === 'cancelled' ? (
                          <span style={{ color: '#f87171', textDecoration: 'line-through' }}>{formatINR(o.total)}</span>
                        ) : (
                          <span style={{ color: '#10b981' }}>{formatINR(o.total)}</span>
                        )}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                        <Link
                          href={`/${locale}/vendor/orders/${o.id}`}
                          className="vp-btn vp-btn-outline vp-btn-sm"
                          style={{ padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                          title="Open Order Fulfillment"
                        >
                          <span>Open</span>
                          <ExternalLink size={13} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hover-row:hover {
          background: var(--bg-muted);
        }
      `}} />
    </div>
  )
}

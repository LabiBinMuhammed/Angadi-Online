'use client'

import React, { useState, useMemo } from 'react'
import { Users, Search, CreditCard, ShoppingBag, ArrowUpDown, UserCheck } from 'lucide-react'
import { ReportCustomer } from '../actions'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface CustomersTabProps {
  customers: ReportCustomer[]
  locale: string
  initialFilter?: string
}

export default function CustomersTab({ customers, locale, initialFilter = 'all' }: CustomersTabProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState(initialFilter)
  const [sortBy, setSortBy] = useState<'purchased' | 'orders' | 'outstanding'>('purchased')

  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`

  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => {
        if (filterType === 'outstanding' && c.creditOutstanding <= 0) {
          return false
        }
        if (filterType === 'credit' && !c.isCreditEnabled) {
          return false
        }
        if (search.trim()) {
          const q = search.toLowerCase()
          if (!c.name.toLowerCase().includes(q) && !c.phone.includes(q)) {
            return false
          }
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'orders') return b.totalOrders - a.totalOrders
        if (sortBy === 'outstanding') return b.creditOutstanding - a.creditOutstanding
        return b.totalPurchased - a.totalPurchased
      })
  }, [customers, filterType, search, sortBy])

  const totalCustomerPurchases = filteredCustomers.reduce((sum, c) => sum + c.totalPurchased, 0)
  const totalOutstanding = filteredCustomers.reduce((sum, c) => sum + c.creditOutstanding, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search and Filters Bar */}
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
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="vp-input"
            style={{ paddingLeft: '2.75rem' }}
            placeholder={t('vendor_reports.search_customers')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Segment Filter */}
          <select
            className="vp-select"
            style={{ width: 'auto', minWidth: '160px' }}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="all">{t('vendor_reports.tab_customers')} ({customers.length})</option>
            <option value="outstanding">{t('vendor_reports.kpi_outstanding')}</option>
            <option value="credit">{t('vendor_reports.credit')}</option>
          </select>

          {/* Sort Filter */}
          <select
            className="vp-select"
            style={{ width: 'auto', minWidth: '160px' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
          >
            <option value="purchased">{t('vendor_reports.sort_spent')}</option>
            <option value="orders">{t('vendor_reports.sort_orders')}</option>
            <option value="outstanding">{t('vendor_reports.sort_outstanding')}</option>
          </select>
        </div>
      </div>

      {/* Summary Counts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Showing <strong style={{ color: 'var(--text-base)' }}>{filteredCustomers.length}</strong> customers
        </span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Total Purchases: <strong style={{ color: '#10b981' }}>{formatINR(totalCustomerPurchases)}</strong> | Total Outstanding: <strong style={{ color: '#f87171' }}>{formatINR(totalOutstanding)}</strong>
        </span>
      </div>

      {/* Customers Table */}
      <div className="vp-table-wrapper" style={{ borderRadius: '16px', overflow: 'hidden' }}>
        {filteredCustomers.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
            <Users size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem', opacity: 0.5 }} />
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>No customers found</h4>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No customer records match the selected filters or date range.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="vp-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Type</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>Orders</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Total Purchased</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Credit Outstanding</th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr
                    key={c.userId}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                    className="hover-row"
                  >
                    {/* Customer */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.phone}</div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {c.isCreditEnabled ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.2rem 0.55rem',
                            borderRadius: '6px',
                            background: 'rgba(251, 191, 36, 0.12)',
                            color: '#fbbf24',
                            border: '1px solid rgba(251, 191, 36, 0.25)',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                        >
                          <CreditCard size={12} /> Credit Customer
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Regular Customer</span>
                      )}
                    </td>

                    {/* Orders */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'center', fontWeight: 700 }}>
                      {c.totalOrders}
                    </td>

                    {/* Total Purchased */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>
                      {formatINR(c.totalPurchased)}
                    </td>

                    {/* Credit Outstanding */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 800, color: c.creditOutstanding > 0 ? '#f87171' : 'var(--text-muted)' }}>
                      {c.creditOutstanding > 0 ? formatINR(c.creditOutstanding) : '₹0'}
                    </td>

                    {/* Last Order */}
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {c.lastOrderDate || '—'}
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

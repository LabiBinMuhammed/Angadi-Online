'use client'

import React, { useState, useMemo } from 'react'
import { Wallet, CreditCard, AlertCircle, CheckCircle, Search, User, ShieldAlert, ShieldCheck } from 'lucide-react'
import { PaymentBreakdown } from '../actions'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface PaymentsTabProps {
  paidAmount: number
  creditSales: number
  outstandingCredit: number
  paymentBreakdown: PaymentBreakdown
  creditLedger: {
    userId: string
    name: string
    phone: string
    creditLimit: number | null
    usedAmount: number
    availableCredit: number
    isBlocked: boolean
    isCreditEnabled: boolean
    lastUsedAt: string | null
  }[]
  locale: string
}

export default function PaymentsTab({
  paidAmount,
  creditSales,
  outstandingCredit,
  paymentBreakdown,
  creditLedger,
  locale
}: PaymentsTabProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'outstanding' | 'blocked'>('all')

  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`

  const filteredLedger = useMemo(() => {
    return creditLedger.filter(c => {
      if (statusFilter === 'outstanding' && c.usedAmount <= 0) return false
      if (statusFilter === 'blocked' && !c.isBlocked) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (!c.name.toLowerCase().includes(q) && !c.phone.includes(q)) return false
      }
      return true
    })
  }, [creditLedger, statusFilter, search])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 3 Payment Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {/* Paid */}
        <div className="vp-card" style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>
            <Wallet size={18} />
            <span>{t('vendor_reports.kpi_paid')}</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-base)', margin: '0.75rem 0 0.25rem' }}>
            {formatINR(paidAmount)}
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Delivered COD orders + credit repayments in period
          </p>
        </div>

        {/* Credit Sales */}
        <div className="vp-card" style={{ padding: '1.5rem', background: 'rgba(251, 191, 36, 0.06)', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
            <CreditCard size={18} />
            <span>{t('vendor_reports.kpi_credit_sales')}</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-base)', margin: '0.75rem 0 0.25rem' }}>
            {formatINR(creditSales)}
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {paymentBreakdown.credit.count} orders placed using store credit
          </p>
        </div>

        {/* Live Outstanding */}
        <div className="vp-card" style={{ padding: '1.5rem', background: 'rgba(248, 113, 113, 0.06)', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 700, fontSize: '0.85rem' }}>
            <AlertCircle size={18} />
            <span>{t('vendor_reports.kpi_outstanding')}</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171', margin: '0.75rem 0 0.25rem' }}>
            {formatINR(outstandingCredit)}
          </div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total unpaid customer balance across shop
          </p>
        </div>
      </div>

      {/* Credit Customers Ledger Table */}
      <div className="vp-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="vp-title" style={{ fontSize: '1.2rem', margin: 0 }}>{t('vendor_reports.credit_overview')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.2rem 0 0' }}>
              Customers with approved store credit accounts for your shop.
            </p>
          </div>

          {/* Filters & Search */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="vp-input"
                style={{ paddingLeft: '2.4rem', padding: '0.45rem 0.65rem 0.45rem 2.2rem', fontSize: '0.85rem' }}
                placeholder={t('vendor_reports.search_customers')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              className="vp-select"
              style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
            >
              <option value="all">{t('vendor_reports.all_accounts')} ({creditLedger.length})</option>
              <option value="outstanding">{t('vendor_reports.kpi_outstanding')}</option>
              <option value="blocked">{t('vendor_reports.blocked')}</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="vp-table-wrapper" style={{ borderRadius: '14px', overflow: 'hidden' }}>
          {filteredLedger.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <CreditCard size={36} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '0.5rem' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>No credit accounts found</h4>
              <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No credit customer records match your filter.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="vp-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Customer</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Credit Limit</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Outstanding</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>Available Credit</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Last Used</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedger.map(c => (
                    <tr
                      key={c.userId}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}
                      className="hover-row"
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.phone}</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600 }}>
                        {c.creditLimit != null ? formatINR(c.creditLimit) : 'No Limit'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: c.usedAmount > 0 ? '#f87171' : '#34d399' }}>
                        {formatINR(c.usedAmount)}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {c.creditLimit != null ? formatINR(c.availableCredit) : '—'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {c.lastUsedAt || 'Never'}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        {c.isBlocked ? (
                          <span className="vp-badge vp-badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                            <ShieldAlert size={12} /> Blocked
                          </span>
                        ) : c.isCreditEnabled ? (
                          <span className="vp-badge vp-badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                            <ShieldCheck size={12} /> Active
                          </span>
                        ) : (
                          <span className="vp-badge vp-badge-neutral" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Disabled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, Shield, Coins, AlertCircle, Clock, Download, ArrowRight, Printer, Calendar } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

type Props = {
  shops: Array<{ id: string; name: string }>
  selectedShopId: string
  subscription: any
  reports: any[]
  orders: any[]
  payments: any[]
}

export default function VendorCommissionClient({
  shops,
  selectedShopId,
  subscription,
  reports,
  orders,
  payments
}: Props) {
  const router = useRouter()
  const { t, locale } = useTranslation()
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')

  const handleShopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/${locale}/vendor/commission?shopId=${e.target.value}`)
  }

  if (shops.length === 0) {
    return (
      <div className="vp-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p className="text-muted">{t('vendor_commission.no_shops')}</p>
      </div>
    )
  }

  // Calculate days remaining in trial
  let daysRemaining = 0
  if (subscription && subscription.is_trial_active) {
    const end = new Date(subscription.trial_end_date).getTime()
    const now = new Date().getTime()
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
  }

  const monthNames = [
    t('months.jan'), t('months.feb'), t('months.mar'), t('months.apr'),
    t('months.may'), t('months.jun'), t('months.jul'), t('months.aug'),
    t('months.sep'), t('months.oct'), t('months.nov'), t('months.dec')
  ]

  // Client side date filtering
  const filteredOrders = orders.filter(o => {
    const d = new Date(o.created_at)
    const matchMonth = selectedMonth === 'all' ? true : (d.getMonth() + 1) === parseInt(selectedMonth)
    const matchYear = selectedYear === 'all' ? true : d.getFullYear() === parseInt(selectedYear)
    return matchMonth && matchYear
  })

  const filteredPayments = payments.filter(p => {
    const d = new Date(p.paid_at)
    const matchMonth = selectedMonth === 'all' ? true : (d.getMonth() + 1) === parseInt(selectedMonth)
    const matchYear = selectedYear === 'all' ? true : d.getFullYear() === parseInt(selectedYear)
    return matchMonth && matchYear
  })

  const filteredReports = reports.filter(r => {
    const matchMonth = selectedMonth === 'all' ? true : r.month === parseInt(selectedMonth)
    const matchYear = selectedYear === 'all' ? true : r.year === parseInt(selectedYear)
    return matchMonth && matchYear
  })

  // Dynamic calculations
  const totalSales = filteredOrders.reduce((sum, o) => sum + Number(o.total_final_price || 0), 0)
  const totalPaid = filteredPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const outstandingBalance = filteredReports.reduce((sum, r) => sum + Number(r.balance_due || 0), 0)

  return (
    <>
      {/* Title & Shop Selector */}
      <div className="vp-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="vp-title">{t('vendor_commission.title')}</h1>
          <p className="vp-subtitle">{t('vendor_commission.subtitle')}</p>
        </div>
        {shops.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Store size={18} color="var(--text-muted)" />
            <select
              value={selectedShopId}
              onChange={handleShopChange}
              className="vp-input"
              style={{ width: '200px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.45rem' }}
            >
              {shops.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#1e293b', color: '#fff' }}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Date Filter Bar */}
      <div 
        className="vp-card" 
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '1rem', 
          alignItems: 'center', 
          marginBottom: '2rem', 
          padding: '1rem',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <Calendar size={18} />
          <span>{t('vendor_commission.date_filter')}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="vp-input"
            style={{ width: '150px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.45rem' }}
          >
            <option value="all" style={{ background: '#1e293b', color: '#fff' }}>{t('vendor_commission.all_months')}</option>
            {monthNames.map((name, i) => (
              <option key={i} value={i + 1} style={{ background: '#1e293b', color: '#fff' }}>{name}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="vp-input"
            style={{ width: '120px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.45rem' }}
          >
            <option value="all" style={{ background: '#1e293b', color: '#fff' }}>{t('vendor_commission.all_years')}</option>
            {Array.from({ length: 6 }, (_, i) => 2025 + i).map(y => (
              <option key={y} value={y} style={{ background: '#1e293b', color: '#fff' }}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Free Trial Banner */}
      {subscription && subscription.is_trial_active && (
        <div 
          className="vp-card" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(4,120,87,0.15))', 
            border: '1px solid rgba(16,185,129,0.3)', 
            padding: '1.5rem', 
            borderRadius: '16px',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem'
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 }}>
            <Clock size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{t('vendor_commission.active_free_trial')}</h3>
            <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.9rem', color: '#a7f3d0' }}>
              {t('vendor_commission.trial_desc')}
            </p>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '0.5rem', fontSize: '0.8rem', color: '#d1fae5' }}>
              <span><strong>{t('vendor_commission.started_on')}</strong> {new Date(subscription.trial_start_date).toLocaleDateString()}</span>
              <span><strong>{t('vendor_commission.ends_on')}</strong> {new Date(subscription.trial_end_date).toLocaleDateString()}</span>
              <span><strong>{t('vendor_commission.days_remaining')}</strong> {daysRemaining} {t('vendor_commission.days')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Category Commission Tier Breakdown Notice */}
      <div className="vp-card" style={{
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        padding: '1.25rem 1.5rem',
        borderRadius: '16px',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', flexShrink: 0 }}>
          <Coins size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>Category-Based Commission Rates</h3>
          <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.88rem', color: '#93c5fd', lineHeight: 1.4 }}>
            Platform commission is calculated per item based on product category margins:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem', fontSize: '0.82rem', color: '#e0f2fe' }}>
            <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(34, 197, 94, 0.12)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <strong style={{ color: '#4ade80' }}>2.5% Low Margin:</strong> Vegetables, Fruits, Grocery, Dairy & Beverages
            </div>
            <div style={{ padding: '0.4rem 0.75rem', background: 'rgba(59, 130, 246, 0.12)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <strong style={{ color: '#60a5fa' }}>4.0% Standard Margin:</strong> Bakery, Meat & Fish, Household Essentials, Stationery
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Warning Banner */}
      {subscription && subscription.restriction_level >= 1 && (
        <div 
          className="vp-card" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(185,28,28,0.15))', 
            border: '1px solid rgba(239,68,68,0.3)', 
            padding: '1.25rem 1.5rem', 
            borderRadius: '16px',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fca5a5' }}>
              {subscription.restriction_level === 1 && t('vendor_commission.warning_title_l1')}
              {subscription.restriction_level === 2 && t('vendor_commission.warning_title_l2')}
              {subscription.restriction_level === 3 && t('vendor_commission.warning_title_l3')}
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#fca5a5' }}>
              {subscription.restriction_level === 1 && t('vendor_commission.warning_desc_l1')}
              {subscription.restriction_level === 2 && t('vendor_commission.warning_desc_l2')}
              {subscription.restriction_level === 3 && t('vendor_commission.warning_desc_l3')}
            </p>
          </div>
        </div>
      )}

      {/* Overview Stats Cards */}
      <div className="vp-stat-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="vp-card vp-stat-card">
          <div className="vp-stat-icon" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}><Store size={22} /></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="vp-stat-value">₹{totalSales.toLocaleString('en-IN')}</span>
            <span className="vp-stat-label">{t('vendor_commission.total_sales_delivered')}</span>
          </div>
        </div>

        <div className="vp-card vp-stat-card">
          <div className="vp-stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}><Coins size={22} /></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="vp-stat-value">{subscription ? subscription.commission_rate : '5'}%</span>
            <span className="vp-stat-label">{t('vendor_commission.commission_rate')}</span>
          </div>
        </div>

        <div className="vp-card vp-stat-card">
          <div className="vp-stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><Shield size={22} /></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="vp-stat-value">₹{totalPaid.toLocaleString('en-IN')}</span>
            <span className="vp-stat-label">{t('vendor_commission.total_paid')}</span>
          </div>
        </div>

        <div className="vp-card vp-stat-card" style={{ borderLeft: outstandingBalance > 0 ? '4px solid #ef4444' : '1px solid rgba(255,255,255,0.06)' }}>
          <div className="vp-stat-icon" style={{ background: outstandingBalance > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', color: outstandingBalance > 0 ? '#ef4444' : 'var(--text-muted)' }}><AlertCircle size={22} /></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="vp-stat-value" style={{ color: outstandingBalance > 0 ? '#ef4444' : '#fff' }}>₹{outstandingBalance.toLocaleString('en-IN')}</span>
            <span className="vp-stat-label">{t('vendor_commission.outstanding_balance')}</span>
          </div>
        </div>
      </div>

      {/* Monthly Reports Section */}
      <h2 className="vp-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('vendor_commission.monthly_billings')}</h2>
      <div className="vp-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="vp-table" style={{ width: '100%', borderCollapse: 'collapse', color: '#fff', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>{t('vendor_commission.month_period')}</th>
              <th style={{ padding: '1rem' }}>{t('vendor_commission.total_sales')}</th>
              <th style={{ padding: '1rem' }}>{t('vendor_commission.commission')}</th>
              <th style={{ padding: '1rem' }}>{t('vendor_commission.paid')}</th>
              <th style={{ padding: '1rem' }}>{t('vendor_commission.status')}</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>{t('vendor_commission.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('vendor_commission.no_reports')}
                </td>
              </tr>
            ) : (
              filteredReports.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{monthNames[r.month - 1]} {r.year}</td>
                  <td style={{ padding: '1rem' }}>₹{Number(r.total_sales).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '1rem' }}>₹{Number(r.total_commission).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '1rem' }}>₹{Number(r.amount_paid).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '1rem' }}>
                    <span 
                      className="vp-badge" 
                      style={{ 
                        background: r.payment_status === 'paid' ? 'rgba(16,185,129,0.1)' : r.payment_status === 'partially_paid' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                        color: r.payment_status === 'paid' ? '#10b981' : r.payment_status === 'partially_paid' ? '#fbbf24' : '#ef4444',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {r.payment_status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <Link 
                      href={`/${locale}/vendor/commission/reports/${r.id}`}
                      className="vp-btn vp-btn-outline vp-btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      <Printer size={12} /> {t('vendor_commission.view_report')}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Commission Terms & Policy Guidelines */}
      <div className="vp-card" style={{ marginTop: '2.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="vp-title" style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={18} style={{ color: 'var(--wa-purple-dark)' }} /> {t('vendor_commission.terms_title')}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
          {t('vendor_commission.terms_subtitle')}
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '0.825rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', display: 'block', marginBottom: '0.375rem' }}>{t('vendor_commission.trial_payouts')}</span>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', lineHeight: 1.4 }}>
              <li><strong>{t('vendor_commission.trial_term_title')}</strong> {t('vendor_commission.trial_term_desc')}</li>
              <li><strong>{t('vendor_commission.rate_term_title')}</strong> {t('vendor_commission.rate_term_desc')}</li>
              <li><strong>{t('vendor_commission.cycle_term_title')}</strong> {t('vendor_commission.cycle_term_desc')}</li>
            </ul>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', display: 'block', marginBottom: '0.375rem' }}>{t('vendor_commission.delivered_trigger')}</span>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', lineHeight: 1.4 }}>
              <li><strong>{t('vendor_commission.calc_term_title')}</strong> {t('vendor_commission.calc_term_desc')}</li>
              <li><strong>{t('vendor_commission.cancel_term_title')}</strong> {t('vendor_commission.cancel_term_desc')}</li>
            </ul>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', display: 'block', marginBottom: '0.375rem' }}>{t('vendor_commission.late_payment')}</span>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', lineHeight: 1.4 }}>
              <li><strong>{t('vendor_commission.l1_term_title')}</strong> {t('vendor_commission.l1_term_desc')}</li>
              <li><strong>{t('vendor_commission.l2_term_title')}</strong> {t('vendor_commission.l2_term_desc')}</li>
              <li><strong>{t('vendor_commission.l3_term_title')}</strong> {t('vendor_commission.l3_term_desc')}</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

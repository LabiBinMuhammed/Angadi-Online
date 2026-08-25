'use client'

import React from 'react'
import {
  TrendingUp, ShoppingBag, Package, Calculator,
  Wallet, CreditCard, AlertCircle, XCircle, ArrowUpRight, ArrowDownRight,
  Clock, Truck, Box, CheckCircle, ChevronRight, Scale, Sun, Moon
} from 'lucide-react'
import { VendorReportData } from '../actions'
import { useTranslation } from '@/lib/i18n/I18nContext'
import SalesTrendChart from './SalesTrendChart'

interface OverviewTabProps {
  data: VendorReportData
  onNavigateTab: (tab: 'orders' | 'products' | 'payments' | 'customers', filter?: string) => void
}

export default function OverviewTab({ data, onNavigateTab }: OverviewTabProps) {
  const { t } = useTranslation()
  const { kpis, salesTrend, statusBreakdown, paymentBreakdown, topProducts, categoryPerformance, dynamicPriceSummary, deliveryPerformance } = data

  const formatINR = (val: number) => `₹${Number(val || 0).toLocaleString('en-IN')}`

  const KPIS = [
    {
      id: 'kpi-total-sales',
      label: t('vendor_reports.kpi_total_sales'),
      value: formatINR(kpis.totalSales),
      subtext: kpis.salesChangePercent !== null
        ? `${kpis.salesChangePercent >= 0 ? '+' : ''}${kpis.salesChangePercent}% vs prev period`
        : 'Non-cancelled orders',
      trend: kpis.salesChangePercent,
      icon: <TrendingUp size={24} style={{ color: '#34d399' }} />,
      bg: 'rgba(52, 211, 153, 0.12)'
    },
    {
      id: 'kpi-orders',
      label: t('vendor_reports.kpi_orders'),
      value: kpis.totalOrders.toLocaleString(),
      subtext: kpis.ordersChangePercent !== null
        ? `${kpis.ordersChangePercent >= 0 ? '+' : ''}${kpis.ordersChangePercent}% vs prev period`
        : 'Total created orders',
      trend: kpis.ordersChangePercent,
      icon: <ShoppingBag size={24} style={{ color: '#60a5fa' }} />,
      bg: 'rgba(96, 165, 250, 0.12)'
    },
    {
      id: 'kpi-items-sold',
      label: t('vendor_reports.kpi_items_sold'),
      value: kpis.itemsSold.toLocaleString(),
      subtext: 'Units / kg packed',
      trend: null,
      icon: <Package size={24} style={{ color: '#c084fc' }} />,
      bg: 'rgba(192, 132, 252, 0.12)'
    },
    {
      id: 'kpi-avg-order',
      label: t('vendor_reports.kpi_avg_order'),
      value: formatINR(kpis.avgOrderValue),
      subtext: 'Sales / non-cancelled orders',
      trend: null,
      icon: <Calculator size={24} style={{ color: '#38bdf8' }} />,
      bg: 'rgba(56, 189, 248, 0.12)'
    },
    {
      id: 'kpi-paid',
      label: t('vendor_reports.kpi_paid'),
      value: formatINR(kpis.paidAmount),
      subtext: 'COD delivered + repayments',
      trend: null,
      icon: <Wallet size={24} style={{ color: '#10b981' }} />,
      bg: 'rgba(16, 185, 129, 0.12)'
    },
    {
      id: 'kpi-credit-sales',
      label: t('vendor_reports.kpi_credit_sales'),
      value: formatINR(kpis.creditSales),
      subtext: 'Orders placed on credit',
      trend: null,
      icon: <CreditCard size={24} style={{ color: '#fbbf24' }} />,
      bg: 'rgba(251, 191, 36, 0.12)'
    },
    {
      id: 'kpi-outstanding',
      label: t('vendor_reports.kpi_outstanding'),
      value: formatINR(kpis.outstandingCredit),
      subtext: 'Live unpaid credit balance',
      trend: null,
      icon: <AlertCircle size={24} style={{ color: '#f87171' }} />,
      bg: 'rgba(248, 113, 113, 0.12)'
    },
    {
      id: 'kpi-cancellation',
      label: t('vendor_reports.kpi_cancellation'),
      value: `${kpis.cancellationRate}%`,
      subtext: `${kpis.cancelledOrdersCount} cancelled orders`,
      trend: null,
      icon: <XCircle size={24} style={{ color: '#f43f5e' }} />,
      bg: 'rgba(244, 63, 94, 0.12)'
    }
  ]

  const STATUS_ICONS: Record<string, React.ReactNode> = {
    pending: <Clock size={16} color="#fbbf24" />,
    delivering: <Truck size={16} color="#60a5fa" />,
    packing: <Box size={16} color="#c084fc" />,
    delivered: <CheckCircle size={16} color="#34d399" />,
    cancelled: <XCircle size={16} color="#f87171" />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 8 Primary KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {KPIS.map(kpi => (
          <div
            key={kpi.id}
            className="vp-card"
            style={{
              padding: '1.25rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.75rem',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="vp-stat-label" style={{ fontSize: '0.8rem' }}>{kpi.label}</span>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: kpi.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {kpi.icon}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-base)', lineHeight: 1.1 }}>
                {kpi.value}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {kpi.trend !== null && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontWeight: 700,
                      color: kpi.trend >= 0 ? '#34d399' : '#f87171'
                    }}
                  >
                    {kpi.trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </span>
                )}
                <span>{kpi.subtext}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sales Trend Chart */}
      <SalesTrendChart data={salesTrend} />

      {/* 2-Column Grid: Orders Status & Payment Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Order Status Breakdown */}
        <div className="vp-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 className="vp-title" style={{ fontSize: '1.15rem', margin: 0 }}>{t('vendor_reports.orders_by_status')}</h3>
            <button
              onClick={() => onNavigateTab('orders')}
              className="vp-btn vp-btn-outline vp-btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              {t('vendor_reports.view_all')}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {statusBreakdown.map(s => {
              const count = s.count
              const percent = kpis.totalOrders > 0 ? (count / kpis.totalOrders) * 100 : 0
              return (
                <div
                  key={s.status}
                  onClick={() => onNavigateTab('orders', s.status)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'var(--bg-muted)',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  className="hover-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {STATUS_ICONS[s.status] || <Box size={16} />}
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize' }}>{s.status}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{count} orders</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({formatINR(s.amount)})</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percent}%`,
                        background: s.status === 'delivered' ? '#34d399' : s.status === 'cancelled' ? '#f87171' : '#60a5fa',
                        borderRadius: 2
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment Breakdown (COD vs Credit) */}
        <div className="vp-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 className="vp-title" style={{ fontSize: '1.15rem', margin: 0 }}>{t('vendor_reports.payment_breakdown')}</h3>
              <button
                onClick={() => onNavigateTab('payments')}
                className="vp-btn vp-btn-outline vp-btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                {t('vendor_reports.tab_payments')}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              {/* COD */}
              <div style={{ padding: '1.25rem', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontWeight: 700, fontSize: '0.85rem' }}>
                  <Wallet size={16} />
                  <span>{t('vendor_reports.cod')}</span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-base)', margin: '0.5rem 0 0.2rem' }}>
                  {formatINR(paymentBreakdown.cod.amount)}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {paymentBreakdown.cod.count} orders
                </p>
              </div>

              {/* Credit */}
              <div style={{ padding: '1.25rem', background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}>
                  <CreditCard size={16} />
                  <span>{t('vendor_reports.credit')}</span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-base)', margin: '0.5rem 0 0.2rem' }}>
                  {formatINR(paymentBreakdown.credit.amount)}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {paymentBreakdown.credit.count} orders
                </p>
              </div>
            </div>
          </div>

          {/* Credit Overview callout */}
          <div style={{ padding: '1rem', background: 'var(--bg-muted)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('vendor_reports.credit_overview')}</p>
              <p style={{ margin: '0.15rem 0 0', fontSize: '1.2rem', fontWeight: 800, color: '#f87171' }}>{formatINR(kpis.outstandingCredit)}</p>
            </div>
            <button
              onClick={() => onNavigateTab('customers', 'outstanding')}
              className="vp-btn vp-btn-primary vp-btn-sm"
              style={{ fontSize: '0.8rem' }}
            >
              {t('vendor_reports.view_credit_customers')}
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Dynamic Price Adjustments & Delivery Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Dynamic Price Adjustments */}
        <div className="vp-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Scale size={20} style={{ color: '#fbbf24' }} />
            <h3 className="vp-title" style={{ fontSize: '1.15rem', margin: 0 }}>{t('vendor_reports.price_adjustments')}</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            For variable-weight products (meat, fish, vegetables) weighed & packed by your shop.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
            <div style={{ padding: '0.85rem', background: 'var(--bg-muted)', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('vendor_reports.adjusted_orders')}</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 800, fontSize: '1.15rem' }}>{dynamicPriceSummary.adjustedOrdersCount}</p>
            </div>
            <div style={{ padding: '0.85rem', background: 'var(--bg-muted)', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('vendor_reports.estimated')}</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 800, fontSize: '1.15rem' }}>{formatINR(dynamicPriceSummary.totalEstimated)}</p>
            </div>
            <div style={{ padding: '0.85rem', background: 'var(--bg-muted)', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('vendor_reports.final_packed')}</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 800, fontSize: '1.15rem', color: '#10b981' }}>{formatINR(dynamicPriceSummary.totalFinal)}</p>
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-base)' }}>{t('vendor_reports.net_difference')}:</span>
            <span style={{ fontWeight: 800, color: dynamicPriceSummary.difference >= 0 ? '#34d399' : '#f87171' }}>
              {dynamicPriceSummary.difference >= 0 ? '+' : ''}{formatINR(dynamicPriceSummary.difference)} ({dynamicPriceSummary.differencePercent}%)
            </span>
          </div>
        </div>

        {/* Delivery Performance */}
        <div className="vp-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Truck size={20} style={{ color: '#60a5fa' }} />
            <h3 className="vp-title" style={{ fontSize: '1.15rem', margin: 0 }}>{t('vendor_reports.delivery_performance')}</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Scheduled slot breakdown and completed fulfillment rate.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
            <div style={{ padding: '0.85rem', background: 'var(--bg-muted)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: '#fbbf24', fontSize: '0.75rem' }}>
                <Sun size={14} /> {t('vendor_reports.morning_slot')}
              </div>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 800, fontSize: '1.15rem' }}>{deliveryPerformance.morningCount}</p>
            </div>
            <div style={{ padding: '0.85rem', background: 'var(--bg-muted)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: '#c084fc', fontSize: '0.75rem' }}>
                <Moon size={14} /> {t('vendor_reports.evening_slot')}
              </div>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 800, fontSize: '1.15rem' }}>{deliveryPerformance.eveningCount}</p>
            </div>
            <div style={{ padding: '0.85rem', background: 'var(--bg-muted)', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('vendor_reports.delivered')}</span>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 800, fontSize: '1.15rem', color: '#34d399' }}>{deliveryPerformance.deliveredCount}</p>
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-muted)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('vendor_reports.pending_dispatch')}:</span>
            <span style={{ fontWeight: 700, color: '#60a5fa' }}>{deliveryPerformance.pendingDeliveriesCount} orders</span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Top Products & Category Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Top 5 Products */}
        <div className="vp-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="vp-title" style={{ fontSize: '1.15rem', margin: 0 }}>{t('vendor_reports.top_products')}</h3>
            <button
              onClick={() => onNavigateTab('products')}
              className="vp-btn vp-btn-outline vp-btn-sm"
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              {t('vendor_reports.tab_products')}
            </button>
          </div>

          {topProducts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>{t('vendor_reports.no_data_title')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {topProducts.slice(0, 5).map((p, idx) => (
                <div key={p.itemId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: idx < 4 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'var(--bg-muted)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={18} color="var(--text-muted)" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.categoryName} • {p.quantitySold} sold</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#10b981' }}>{formatINR(p.totalSales)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Performance */}
        <div className="vp-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="vp-title" style={{ fontSize: '1.15rem', margin: 0 }}>{t('vendor_reports.category_performance')}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>By Revenue Share</span>
          </div>

          {categoryPerformance.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>{t('vendor_reports.no_data_title')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {categoryPerformance.slice(0, 5).map(c => (
                <div key={c.categoryId} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontWeight: 700 }}>{formatINR(c.totalSales)} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({c.percentage}%)</span></span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.percentage}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

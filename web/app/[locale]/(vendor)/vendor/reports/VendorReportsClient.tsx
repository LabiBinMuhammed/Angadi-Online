'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, Package, CreditCard, Users,
  Download, RefreshCw, Store, AlertCircle, Printer, FileSpreadsheet
} from 'lucide-react'
import { VendorReportData, getVendorReportDataAction } from './actions'
import { useTranslation } from '@/lib/i18n/I18nContext'
import ReportDateFilter, { DatePreset } from './components/ReportDateFilter'
import OverviewTab from './components/OverviewTab'
import OrdersTab from './components/OrdersTab'
import ProductsTab from './components/ProductsTab'
import PaymentsTab from './components/PaymentsTab'
import CustomersTab from './components/CustomersTab'

interface ShopOption {
  id: string
  name: string
}

interface VendorReportsClientProps {
  initialData: VendorReportData
  shops: ShopOption[]
  locale: string
}

type TabKey = 'overview' | 'orders' | 'products' | 'payments' | 'customers'

export default function VendorReportsClient({
  initialData,
  shops,
  locale
}: VendorReportsClientProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const [data, setData] = useState<VendorReportData>(initialData)
  const [selectedShopId, setSelectedShopId] = useState<string>(initialData.shopId)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [ordersInitialFilter, setOrdersInitialFilter] = useState<string>('all')
  const [customersInitialFilter, setCustomersInitialFilter] = useState<string>('all')

  const [datePreset, setDatePreset] = useState<DatePreset>(
    (initialData.dateRange.preset as DatePreset) || 'this_month'
  )
  const [startDate, setStartDate] = useState<string>(initialData.dateRange.startDate)
  const [endDate, setEndDate] = useState<string>(initialData.dateRange.endDate)

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  // Fetch / Refresh Data with active shop and date range
  const loadData = (shopId: string, start: string, end: string, preset: DatePreset) => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await getVendorReportDataAction(shopId, start, end, preset)
        setData(res)
        setStartDate(start)
        setEndDate(end)
        setDatePreset(preset)
      } catch (err: any) {
        console.error('Failed to load vendor report:', err)
        setError(err.message || 'Failed to load report data')
      }
    })
  }

  const handleApplyDateRange = (start: string, end: string, preset: DatePreset) => {
    loadData(selectedShopId, start, end, preset)
  }

  const handleRefresh = () => {
    loadData(selectedShopId, startDate, endDate, datePreset)
  }

  const handleShopChange = (newShopId: string) => {
    setSelectedShopId(newShopId)
    loadData(newShopId, startDate, endDate, datePreset)
  }

  // Cross-tab navigation handler (e.g. from Overview status click to Orders tab)
  const handleNavigateTab = (tab: TabKey, filter?: string) => {
    if (tab === 'orders') {
      setOrdersInitialFilter(filter || 'all')
    }
    if (tab === 'customers') {
      setCustomersInitialFilter(filter || 'all')
    }
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Export Data to CSV based on current active tab
  const handleExportCSV = () => {
    setExportMenuOpen(false)
    let csvContent = 'data:text/csv;charset=utf-8,'
    let filename = `Report_${data.shopName.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.csv`

    if (activeTab === 'orders' || activeTab === 'overview') {
      csvContent += 'Order ID,Customer,Phone,Date,Items Count,Items,Payment,Status,Total (INR)\n'
      data.orders.forEach(o => {
        const cleanSummary = `"${o.itemsSummary.replace(/"/g, '""')}"`
        const cleanCustomer = `"${o.customerName.replace(/"/g, '""')}"`
        csvContent += `${o.orderNumber},${cleanCustomer},${o.customerPhone},${o.date},${o.itemsCount},${cleanSummary},${o.paymentType},${o.status},${o.total}\n`
      })
    } else if (activeTab === 'products') {
      csvContent += 'Product Name,Category,Quantity Sold,Orders Count,Total Sales (INR),Average Price (INR)\n'
      data.topProducts.forEach(p => {
        const cleanName = `"${p.name.replace(/"/g, '""')}"`
        csvContent += `${cleanName},${p.categoryName},${p.quantitySold},${p.ordersCount},${p.totalSales},${p.avgPrice}\n`
      })
    } else if (activeTab === 'payments') {
      csvContent += 'Customer,Phone,Credit Limit,Used Amount,Available Credit,Status,Last Used\n'
      data.creditLedger.forEach(c => {
        csvContent += `"${c.name}",${c.phone},${c.creditLimit || 'No Limit'},${c.usedAmount},${c.availableCredit},${c.isBlocked ? 'Blocked' : 'Active'},${c.lastUsedAt || 'Never'}\n`
      })
    } else if (activeTab === 'customers') {
      csvContent += 'Customer Name,Phone,Total Orders,Total Purchased (INR),Credit Outstanding (INR),Last Order\n'
      data.customers.forEach(c => {
        csvContent += `"${c.name}",${c.phone},${c.totalOrders},${c.totalPurchased},${c.creditOutstanding},${c.lastOrderDate || 'Never'}\n`
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    setExportMenuOpen(false)
    window.print()
  }

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: t('vendor_reports.tab_overview'), icon: <LayoutDashboard size={16} /> },
    { key: 'orders', label: t('vendor_reports.tab_orders'), icon: <ShoppingBag size={16} /> },
    { key: 'products', label: t('vendor_reports.tab_products'), icon: <Package size={16} /> },
    { key: 'payments', label: t('vendor_reports.tab_payments'), icon: <CreditCard size={16} /> },
    { key: 'customers', label: t('vendor_reports.tab_customers'), icon: <Users size={16} /> }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header Row */}
      <div
        className="vp-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1.5rem',
          flexWrap: 'wrap',
          marginBottom: '0.5rem'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h1 className="vp-title" style={{ margin: 0 }}>{t('vendor_reports.page_title')}</h1>
            {/* Multi-Shop Selector */}
            {shops.length > 1 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-muted)', padding: '0.25rem 0.65rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <Store size={14} style={{ color: '#60a5fa' }} />
                <select
                  value={selectedShopId}
                  onChange={e => handleShopChange(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-base)', fontSize: '0.85rem', fontWeight: 700, outline: 'none', cursor: 'pointer' }}
                >
                  {shops.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <p className="vp-subtitle" style={{ marginTop: '0.35rem' }}>
            {t('vendor_reports.page_subtitle')}
          </p>
        </div>

        {/* Action Controls: Date Filter + Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <ReportDateFilter
            startDate={startDate}
            endDate={endDate}
            preset={datePreset}
            loading={isPending}
            onApplyRange={handleApplyDateRange}
            onRefresh={handleRefresh}
          />

          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="vp-btn vp-btn-outline"
              style={{ padding: '0.65rem 1rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '12px' }}
              id="report-export-btn"
            >
              <Download size={16} />
              <span>{t('vendor_reports.export')}</span>
            </button>

            {exportMenuOpen && (
              <div
                style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                minWidth: '180px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                padding: '0.4rem',
                zIndex: 100
              }}
            >
              <button
                type="button"
                onClick={handleExportCSV}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  background: 'transparent',
                  color: 'var(--text-base)',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                className="hover-tab"
              >
                <FileSpreadsheet size={15} style={{ color: '#10b981' }} />
                <span>{t('vendor_reports.export_csv')}</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  background: 'transparent',
                  color: 'var(--text-base)',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                className="hover-tab"
              >
                <Printer size={15} style={{ color: '#60a5fa' }} />
                <span>{t('vendor_reports.export_pdf')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Primary Tab Navigation */}
    <div
      style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        paddingBottom: '0.25rem'
      }}
    >
      {TABS.map(tab => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
              color: isActive ? '#60a5fa' : 'var(--text-muted)',
              border: 'none',
              borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
              borderRadius: '10px 10px 0 0',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            id={`report-tab-${tab.key}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>

    {/* Error Message with Try Again */}
    {error && (
      <div
        className="vp-card"
        style={{
          padding: '1.25rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#fca5a5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontWeight: 700 }}>{t('vendor_reports.error_title')}</p>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>{error}</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="vp-btn vp-btn-outline vp-btn-sm"
          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
        >
          {t('vendor_reports.try_again')}
        </button>
      </div>
    )}

      {/* Loading Overlay or Tab Contents */}
      <div style={{ position: 'relative', opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>
        {activeTab === 'overview' && (
          <OverviewTab data={data} onNavigateTab={handleNavigateTab} />
        )}

        {activeTab === 'orders' && (
          <OrdersTab
            orders={data.orders}
            locale={locale}
            initialStatusFilter={ordersInitialFilter}
          />
        )}

        {activeTab === 'products' && (
          <ProductsTab
            products={data.topProducts}
            categories={data.categoryPerformance}
            locale={locale}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab
            paidAmount={data.kpis.paidAmount}
            creditSales={data.kpis.creditSales}
            outstandingCredit={data.kpis.outstandingCredit}
            paymentBreakdown={data.paymentBreakdown}
            creditLedger={data.creditLedger}
            locale={locale}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersTab
            customers={data.customers}
            locale={locale}
            initialFilter={customersInitialFilter}
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .hover-tab:hover {
          background: var(--bg-muted) !important;
        }
        @media print {
          .vp-sidebar, .vendor-header, .vp-sidebar-overlay, #report-date-filter-trigger, #report-export-btn, #report-refresh-btn {
            display: none !important;
          }
          .vp-main {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          body {
            background: #fff !important;
            color: #000 !important;
          }
        }
      `}} />
    </div>
  )
}

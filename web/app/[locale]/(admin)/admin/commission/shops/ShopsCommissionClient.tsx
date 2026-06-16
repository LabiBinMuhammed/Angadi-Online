'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Calendar, Store, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { toggleMonthlyReportPaidAction } from '@/app/actions/commission'

type ShopBillingData = {
  id: string
  name: string
  locationId?: string | null
  isTrialActive: boolean
  totalSales: number
  totalCommission: number
  paymentStatus: 'pending' | 'partially_paid' | 'paid'
}

type Props = {
  initialShopsData: ShopBillingData[]
  locations: Array<{ id: string; name: string }>
  month: number
  year: number
}

export default function ShopsCommissionClient({ initialShopsData, locations, month, year }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all')
  const [isPending, startTransition] = useTransition()
  const [loadingShopId, setLoadingShopId] = useState<string | null>(null)

  // List of months for selection
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ]

  // Years range from 2025 to 2030
  const years = Array.from({ length: 6 }, (_, i) => 2025 + i)

  const handleDateChange = (newMonth: number, newYear: number) => {
    router.push(`/admin/commission/shops?month=${newMonth}&year=${newYear}`)
  }

  const handleTogglePaymentStatus = async (shopId: string, currentStatus: string) => {
    const targetStatus = currentStatus === 'paid' ? 'pending' : 'paid'
    setLoadingShopId(shopId)
    
    startTransition(async () => {
      try {
        await toggleMonthlyReportPaidAction(shopId, month, year, targetStatus)
        router.refresh()
      } catch (err: any) {
        alert('Action failed: ' + err.message)
      } finally {
        setLoadingShopId(null)
      }
    })
  }

  // Filter shops based on search and location
  const filteredData = initialShopsData.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchLocation = selectedLocationId === 'all' ? true : s.locationId === selectedLocationId
    return matchSearch && matchLocation
  })

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/commission" className="btn btn-ghost" style={{ padding: '.5rem', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="panel-page-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Shop Billing & Commissions</h1>
          <p className="text-sm text-muted" style={{ margin: 0 }}>View and manage monthly sales, commission dues, and payment statuses by shop</p>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Line 1: Date selections & Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Month / Year selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
            
            <select
              value={month}
              onChange={(e) => handleDateChange(parseInt(e.target.value), year)}
              className="form-input"
              style={{ padding: '0.375rem 2rem 0.375rem 0.75rem', fontSize: '0.875rem' }}
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => handleDateChange(month, parseInt(e.target.value))}
              className="form-input"
              style={{ padding: '0.375rem 2rem 0.375rem 0.75rem', fontSize: '0.875rem' }}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', width: '300px' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search shop name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.25rem', width: '100%', fontSize: '0.875rem' }}
            />
          </div>

        </div>

        {/* Separator */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--wa-separator)', margin: 0 }} />

        {/* Line 2: Location selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            📍 Location:
          </span>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="form-input"
            style={{ padding: '0.375rem 2rem 0.375rem 0.75rem', fontSize: '0.875rem', width: '220px' }}
          >
            <option value="all">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Card Grid / List matching Flutter app */}
      {filteredData.length === 0 ? (
        <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', boxShadow: 'var(--shadow-sm)', textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
          <AlertCircle size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ fontWeight: 600, margin: 0 }}>No billing records found matching your query.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredData.map((shop) => {
            const isLoading = loadingShopId === shop.id
            const isPaid = shop.paymentStatus === 'paid'

            return (
              <div
                key={shop.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  border: '1px solid var(--wa-separator)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                {/* Header: Shop Name & Trial Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
                    <Store size={18} style={{ color: 'var(--wa-purple-dark)' }} />
                    {shop.name}
                  </div>
                  {shop.isTrialActive ? (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      background: '#e0e7ff',
                      color: '#4f46e5',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Trial
                    </span>
                  ) : (
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      background: '#f1f5f9',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Active
                    </span>
                  )}
                </div>

                {/* Metrics Row: Sales, Commission, Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Sales</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#334155', marginTop: '2px' }}>
                      ₹{shop.totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Commission</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: shop.totalCommission > 0 ? '#b91c1c' : '#334155', marginTop: '2px' }}>
                      ₹{shop.totalCommission.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Status</div>
                    <div style={{ marginTop: '2px' }}>
                      {isPaid ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          background: '#d1fae5',
                          color: '#065f46',
                          textTransform: 'uppercase'
                        }}>
                          Paid
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          background: '#fef3c7',
                          color: '#92400e',
                          textTransform: 'uppercase'
                        }}>
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--wa-separator)', margin: '0.5rem 0 0.25rem' }} />

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleTogglePaymentStatus(shop.id, shop.paymentStatus)}
                    disabled={isLoading}
                    className="btn"
                    style={{
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isPaid ? '#d97706' : '#10b981',
                      background: isPaid ? 'transparent' : '#10b981',
                      color: isPaid ? '#d97706' : '#ffffff',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      minWidth: '125px',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isLoading ? (
                      <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : isPaid ? (
                      <>
                        <AlertCircle size={12} />
                        Mark Pending
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={12} />
                        Mark Paid
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Store, CreditCard, Coins, CheckCircle, Clock, AlertCircle, 
  Settings, RefreshCw, Plus, Calendar, Download, Trash, Check, X, Info
} from 'lucide-react'
import { 
  recordPaymentAction, 
  waiveAction, 
  triggerReportsGenerationAction, 
  refreshRestrictionsAction,
  extendTrialAction,
  endTrialAction
} from '@/app/actions/commission'

type Payment = {
  id: string
  shop_id: string
  shopName: string
  month: number
  year: number
  commissionDue: number
  daysOverdue: number
  status: string
}

type ShopSubscription = {
  trial_start_date: string
  trial_end_date: string
  is_trial_active: boolean
  commission_rate: number
  commission_enabled: boolean
}

type ShopWithSubscription = {
  id: string
  name: string
  created_at: string
  shop_subscription: ShopSubscription | ShopSubscription[] | null
}

type Props = {
  platformOverview: any
  revenueOverview: any
  chartData: any[]
  pendingPayments: Payment[]
  shops: ShopWithSubscription[]
}

export default function CommissionDashboardClient({
  platformOverview,
  revenueOverview,
  chartData,
  pendingPayments,
  shops: rawShops
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Normalize shops so that shop_subscription is always a single object or null
  const shops = rawShops.map(s => {
    const sub = Array.isArray(s.shop_subscription) 
      ? s.shop_subscription[0] 
      : s.shop_subscription
    return {
      id: s.id,
      name: s.name,
      created_at: s.created_at,
      shop_subscription: sub || null
    }
  })
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'collections' | 'trials'>('collections')
  
  // Trial Management state
  const [trialSearch, setTrialSearch] = useState('')
  const [trialFilter, setTrialFilter] = useState<'all' | 'active' | 'expired'>('active')
  const [selectedTrialShop, setSelectedTrialShop] = useState<ShopWithSubscription | null>(null)
  const [showExtendModal, setShowExtendModal] = useState(false)
  const [extendDaysInput, setExtendDaysInput] = useState('7')
  
  // Modals state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showWaiveModal, setShowWaiveModal] = useState(false)
  const [showGenModal, setShowGenModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Payment | null>(null)
  
  // Payment Form state
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentRef, setPaymentRef] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')
  
  // Waive Form state
  const [waiveAmount, setWaiveAmount] = useState('')
  const [waiveReason, setWaiveReason] = useState('')
  const [waiveType, setWaiveType] = useState<'report' | 'custom'>('report')
  
  // Generation Form state
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1)
  const [genYear, setGenYear] = useState(new Date().getFullYear())
  const [genCount, setGenCount] = useState<number | null>(null)

  // Filter payments
  const filteredPayments = pendingPayments.filter(p => {
    const matchesSearch = p.shopName.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'overdue' 
        ? p.daysOverdue > 15
        : p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Filter trial shops
  const filteredTrialShops = shops.filter(s => {
    if (!s.shop_subscription) return false
    const matchesSearch = s.name.toLowerCase().includes(trialSearch.toLowerCase())
    const isActiveTrial = s.shop_subscription.is_trial_active
    
    if (trialFilter === 'active') return matchesSearch && isActiveTrial
    if (trialFilter === 'expired') return matchesSearch && !isActiveTrial
    return matchesSearch
  })

  // Export CSV function
  const handleExportCSV = () => {
    const headers = ['Shop Name', 'Billing Period', 'Commission Due', 'Days Overdue', 'Status']
    const rows = pendingPayments.map(p => [
      p.shopName,
      `${p.month}/${p.year}`,
      `₹${p.commissionDue}`,
      p.daysOverdue,
      p.status
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Commission_Pending_Payments_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print function (PDF export)
  const handlePrint = () => {
    window.print()
  }

  // Payment Recording Submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReport || !paymentAmount) return
    setLoading(true)
    try {
      await recordPaymentAction(
        selectedReport.shop_id,
        selectedReport.id,
        parseFloat(paymentAmount),
        paymentMethod,
        paymentRef || null,
        paymentNotes || null
      )
      setShowPaymentModal(false)
      setSelectedReport(null)
      setPaymentAmount('')
      setPaymentRef('')
      setPaymentNotes('')
      router.refresh()
    } catch (err: any) {
      alert('Payment failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Waive Submit
  const handleWaiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReport) return
    if (waiveType === 'custom' && !waiveAmount) return
    if (!waiveReason) {
      alert('A reason is required to waive commission.')
      return
    }
    setLoading(true)
    try {
      await waiveAction(
        waiveType,
        selectedReport.id,
        selectedReport.shop_id,
        waiveType === 'custom' ? parseFloat(waiveAmount) : 0,
        waiveReason
      )
      setShowWaiveModal(false)
      setSelectedReport(null)
      setWaiveAmount('')
      setWaiveReason('')
      router.refresh()
    } catch (err: any) {
      alert('Waiver failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Trigger Billing Generation Submit
  const handleGenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setGenCount(null)
    try {
      const res = await triggerReportsGenerationAction(genMonth, genYear)
      setGenCount(res.count)
      router.refresh()
    } catch (err: any) {
      alert('Generation failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Refresh Overdue restrictions manually
  const handleRefreshRestrictions = async () => {
    setRefreshing(true)
    try {
      await refreshRestrictionsAction()
      router.refresh()
      alert('Overdue restriction levels re-calculated successfully.')
    } catch (err: any) {
      alert('Error updating restrictions: ' + err.message)
    } finally {
      setRefreshing(false)
    }
  }

  // Trial Extend Submit
  const handleExtendTrialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrialShop) return
    const days = parseInt(extendDaysInput)
    if (isNaN(days) || days <= 0) {
      alert('Please enter a valid number of days.')
      return
    }
    setLoading(true)
    try {
      await extendTrialAction(selectedTrialShop.id, days)
      setShowExtendModal(false)
      setSelectedTrialShop(null)
      setExtendDaysInput('7')
      router.refresh()
      alert(`Trial extended by ${days} days successfully.`)
    } catch (err: any) {
      alert('Failed to extend trial: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // End Trial handler
  const handleEndTrial = async (shopId: string) => {
    if (!confirm('Are you sure you want to end this shop\'s free trial and activate commissions?')) return
    setLoading(true)
    try {
      await endTrialAction(shopId)
      router.refresh()
      alert('Free trial ended and commission activated successfully.')
    } catch (err: any) {
      alert('Failed to end trial: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateRemainingDays = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime()
    const now = new Date().getTime()
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
  }

  // Chart Rendering Prep
  const maxSales = Math.max(...chartData.map(d => d.Sales), 10000)
  const maxComm = Math.max(...chartData.map(d => Math.max(d.Generated, d.Collected)), 1000)

  return (
    <div style={{ paddingBottom: '3rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }} className="no-print">
        <div>
          <h1 className="panel-page-title" style={{ margin: 0 }}>Commission Management</h1>
          <p className="text-sm text-muted" style={{ margin: 0 }}>Monitor billing cycles, collect outstanding platform commission, and manage shop restrictions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handleRefreshRestrictions}
            disabled={refreshing}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={16} className={refreshing ? 'spinner' : ''} /> 
            Sync Restrictions
          </button>
          <button 
            onClick={() => setShowGenModal(true)}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--wa-green-dark)', color: 'var(--wa-green-dark)' }}
          >
            <Calendar size={16} /> 
            Generate Reports
          </button>
          <Link href="/admin/commission/shops" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', color: '#fff', border: 'none' }}>
            <Store size={16} />
            Shop Billing
          </Link>
          <Link href="/admin/commission/settings" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--wa-green-dark)' }}>
            <Settings size={16} /> 
            Settings
          </Link>
        </div>
      </div>

      {/* Print Header */}
      <div className="print-only" style={{ marginBottom: '2rem', display: 'none' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Village Market - Platform Commission Report</h1>
        <p suppressHydrationWarning>Generated at: {new Date().toLocaleString()}</p>
      </div>

      {/* 4 Stats Cards - Platform Overview */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Platform Overview</h2>
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Shops</span>
            <Store size={20} style={{ color: '#3b82f6' }} />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0 0', color: '#0f172a' }}>{platformOverview.totalShops}</p>
        </div>

        <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Shops in Free Trial</span>
            <Clock size={20} style={{ color: '#f59e0b' }} />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0 0', color: '#0f172a' }}>{platformOverview.shopsInTrial}</p>
        </div>

        <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Paying Commission</span>
            <Coins size={20} style={{ color: '#10b981' }} />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0 0', color: '#0f172a' }}>{platformOverview.shopsPayingCommission}</p>
        </div>

        <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Outstanding Balance</span>
            <AlertCircle size={20} style={{ color: '#ef4444' }} />
          </div>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0 0', color: '#0f172a' }}>{platformOverview.shopsWithOutstanding}</p>
        </div>
      </div>

      {/* 4 Stats Cards - Revenue Overview */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Revenue Overview</h2>
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Sales (Delivered)</span>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0 0', color: '#0f172a' }}>₹{revenueOverview.totalSales.toLocaleString('en-IN')}</p>
        </div>

        <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Commission Generated</span>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0 0', color: 'var(--wa-green-dark)' }}>₹{revenueOverview.totalCommissionGenerated.toLocaleString('en-IN')}</p>
        </div>

        <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', boxShadow: 'var(--shadow-sm)' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Commission Collected</span>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0 0', color: '#10b981' }}>₹{revenueOverview.totalCommissionCollected.toLocaleString('en-IN')}</p>
        </div>

        <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', boxShadow: 'var(--shadow-sm)', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Outstanding Commission</span>
          <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0 0', color: '#ef4444' }}>₹{revenueOverview.outstandingCommission.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* SVG Charts - Double Charts Stacked/Row */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }} className="no-print">Monthly Growth Analytics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }} className="no-print">
        
        {/* Sales Volume Chart */}
        <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem', color: '#0f172a' }}>Monthly Sales Volume (₹)</h3>
          <svg viewBox="0 0 400 200" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            {/* Grid lines */}
            <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="60" x2="380" y2="60" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="100" x2="380" y2="100" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="140" x2="380" y2="140" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="170" x2="380" y2="170" stroke="#cbd5e1" strokeWidth="1" />
            
            {/* Axis Y Labels */}
            <text x="35" y="24" fontSize="8" textAnchor="end" fill="#64748b">₹{(maxSales).toFixed(0)}</text>
            <text x="35" y="104" fontSize="8" textAnchor="end" fill="#64748b">₹{(maxSales / 2).toFixed(0)}</text>
            <text x="35" y="174" fontSize="8" textAnchor="end" fill="#64748b">₹0</text>
            
            {/* Bars */}
            {chartData.map((d, idx) => {
              const xPos = 60 + idx * 52
              const barHeight = (d.Sales / maxSales) * 150
              const yPos = 170 - barHeight
              return (
                <g key={d.name}>
                  <rect 
                    x={xPos} 
                    y={yPos} 
                    width="24" 
                    height={barHeight} 
                    fill="url(#blueGrad)" 
                    rx="3"
                    style={{ transition: 'all 0.3s' }}
                  />
                  <text x={xPos + 12} y={yPos - 4} fontSize="8" textAnchor="middle" fontWeight="700" fill="#0f172a">
                    {d.Sales >= 1000 ? `${(d.Sales / 1000).toFixed(0)}k` : d.Sales}
                  </text>
                  <text x={xPos + 12} y="184" fontSize="8" textAnchor="middle" fill="#64748b">{d.name.split(' ')[0]}</text>
                </g>
              )
            })}
            
            {/* Gradients */}
            <defs>
              <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Commission Analytics Chart */}
        <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem', color: '#0f172a' }}>Commissions Generated vs Collected</h3>
          <svg viewBox="0 0 400 200" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
            <line x1="40" y1="20" x2="380" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="60" x2="380" y2="60" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="100" x2="380" y2="100" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="140" x2="380" y2="140" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="40" y1="170" x2="380" y2="170" stroke="#cbd5e1" strokeWidth="1" />
            
            <text x="35" y="24" fontSize="8" textAnchor="end" fill="#64748b">₹{maxComm.toFixed(0)}</text>
            <text x="35" y="104" fontSize="8" textAnchor="end" fill="#64748b">₹{(maxComm / 2).toFixed(0)}</text>
            <text x="35" y="174" fontSize="8" textAnchor="end" fill="#64748b">₹0</text>
            
            {chartData.map((d, idx) => {
              const groupX = 50 + idx * 54
              const genHeight = (d.Generated / maxComm) * 150
              const colHeight = (d.Collected / maxComm) * 150
              
              const genY = 170 - genHeight
              const colY = 170 - colHeight
              
              return (
                <g key={d.name}>
                  {/* Generated (Purple) */}
                  <rect 
                    x={groupX} 
                    y={genY} 
                    width="14" 
                    height={genHeight} 
                    fill="url(#purpleGrad)" 
                    rx="2" 
                  />
                  {/* Collected (Green) */}
                  <rect 
                    x={groupX + 16} 
                    y={colY} 
                    width="14" 
                    height={colHeight} 
                    fill="url(#greenGrad)" 
                    rx="2" 
                  />
                  <text x={groupX + 15} y="184" fontSize="8" textAnchor="middle" fill="#64748b">{d.name.split(' ')[0]}</text>
                </g>
              )
            })}
            
            <defs>
              <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6d28d9" />
              </linearGradient>
              <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
            </defs>
          </svg>
          {/* Legend */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', justifyContent: 'center', fontSize: '0.75rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 8, height: 8, background: '#8b5cf6', borderRadius: '50%' }} /> Generated</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }} /> Collected</span>
          </div>
        </div>
      </div>

      {/* Collection & Trial Management Tabs */}
      <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', padding: '1.5rem' }}>
        
        {/* Table Controls with Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--wa-separator)', paddingBottom: '1rem', marginBottom: '1.25rem' }} className="no-print">
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <button 
              onClick={() => setActiveTab('collections')}
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: activeTab === 'collections' ? 'var(--wa-green-dark)' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'collections' ? '2px solid var(--wa-green-dark)' : 'none',
                paddingBottom: '0.5rem',
                cursor: 'pointer'
              }}
              id="tab-collections"
            >
              Pending Collections
            </button>
            <button 
              onClick={() => setActiveTab('trials')}
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: activeTab === 'trials' ? 'var(--wa-green-dark)' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'trials' ? '2px solid var(--wa-green-dark)' : 'none',
                paddingBottom: '0.5rem',
                cursor: 'pointer'
              }}
              id="tab-trials-management"
            >
              Trial Management
            </button>
          </div>

          {activeTab === 'collections' ? (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Search */}
              <input 
                placeholder="Search shop..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="form-input" 
                style={{ width: '180px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
              />
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="form-input"
                style={{ width: '150px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="overdue">Overdue (&gt;15 days)</option>
              </select>
              {/* Exports */}
              <button onClick={handleExportCSV} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Download size={14} /> Export CSV</button>
              <button onClick={handlePrint} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Info size={14} /> Print Report</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Search */}
              <input 
                placeholder="Search shop..." 
                value={trialSearch} 
                onChange={e => setTrialSearch(e.target.value)} 
                className="form-input" 
                style={{ width: '180px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
              />
              {/* Trial Filter */}
              <select
                value={trialFilter}
                onChange={e => setTrialFilter(e.target.value as any)}
                className="form-input"
                style={{ width: '150px', padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
              >
                <option value="active">Active Trials</option>
                <option value="expired">Expired Trials</option>
                <option value="all">All Trials</option>
              </select>
            </div>
          )}
        </div>

        {/* Collections Tab Content */}
        {activeTab === 'collections' && (
          <>
            {/* Desktop View Table */}
            <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shop</th>
                    <th>Month</th>
                    <th>Commission Due</th>
                    <th>Days Overdue</th>
                    <th>Status</th>
                    <th className="no-print">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No pending commission payments found.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map(p => (
                      <tr key={p.id} id={`pending-payment-${p.id}`}>
                        <td className="font-semibold">{p.shopName}</td>
                        <td>{p.month}/{p.year}</td>
                        <td className="font-bold" style={{ color: 'var(--wa-green-dark)' }}>₹{p.commissionDue.toFixed(2)}</td>
                        <td>
                          <span style={{ 
                            color: p.daysOverdue > 30 ? '#ef4444' : p.daysOverdue > 15 ? '#f59e0b' : 'inherit',
                            fontWeight: p.daysOverdue > 15 ? 700 : 500
                          }}>
                            {p.daysOverdue} days
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${p.daysOverdue > 30 ? 'badge-danger' : p.daysOverdue > 15 ? 'badge-warning' : 'badge-neutral'}`}>
                            {p.status === 'partially_paid' ? 'Partial' : 'Pending'}
                          </span>
                        </td>
                        <td className="no-print">
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                              onClick={() => {
                                setSelectedReport(p)
                                setPaymentAmount(p.commissionDue.toString())
                                setShowPaymentModal(true)
                              }}
                              className="btn btn-sm"
                              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none' }}
                              id={`pay-btn-${p.id}`}
                            >
                              Collect
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedReport(p)
                                setWaiveAmount(p.commissionDue.toString())
                                setShowWaiveModal(true)
                              }}
                              className="btn btn-sm"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none' }}
                              id={`waive-btn-${p.id}`}
                            >
                              Waive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="mobile-only-grid" style={{ display: 'none', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredPayments.map(p => (
                <div key={p.id} className="card card-body" style={{ background: '#fff', border: '1px solid var(--wa-separator)', borderRadius: '12px', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: 700 }}>{p.shopName}</h4>
                      <p className="text-xs text-muted" style={{ margin: 0 }}>Month: {p.month}/{p.year}</p>
                    </div>
                    <span className={`badge ${p.daysOverdue > 30 ? 'badge-danger' : 'badge-warning'}`}>{p.daysOverdue} days</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--wa-green-dark)' }}>₹{p.commissionDue.toFixed(2)}</span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        onClick={() => {
                          setSelectedReport(p)
                          setPaymentAmount(p.commissionDue.toString())
                          setShowPaymentModal(true)
                        }}
                        className="btn btn-sm" 
                        style={{ padding: '0.25rem 0.5rem', background: '#10b981', color: '#fff', border: 'none' }}
                      >
                        Collect
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedReport(p)
                          setWaiveAmount(p.commissionDue.toString())
                          setShowWaiveModal(true)
                        }}
                        className="btn btn-sm" 
                        style={{ padding: '0.25rem 0.5rem', background: '#ef4444', color: '#fff', border: 'none' }}
                      >
                        Waive
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Trials Tab Content */}
        {activeTab === 'trials' && (
          <>
            {/* Desktop View Table */}
            <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shop</th>
                    <th>Trial Started</th>
                    <th>Trial Ends</th>
                    <th>Remaining Days</th>
                    <th>Rate</th>
                    <th>Status</th>
                    <th className="no-print">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrialShops.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No shops found matching the trial filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTrialShops.map(s => {
                      const sub = s.shop_subscription!
                      const remaining = calculateRemainingDays(sub.trial_end_date)
                      return (
                        <tr key={s.id} id={`trial-shop-${s.id}`}>
                          <td className="font-semibold">
                            <Link href={`/admin/shops/${s.id}`} className="hover:underline" style={{ color: 'var(--wa-green-dark)', fontWeight: 600 }}>
                              {s.name}
                            </Link>
                          </td>
                          <td>{new Date(sub.trial_start_date).toLocaleDateString()}</td>
                          <td>{new Date(sub.trial_end_date).toLocaleDateString()}</td>
                          <td>
                            {sub.is_trial_active ? (
                              <span style={{ 
                                color: remaining <= 5 ? '#ef4444' : remaining <= 10 ? '#f59e0b' : 'inherit',
                                fontWeight: remaining <= 10 ? 700 : 500
                              }}>
                                {remaining} days
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>0 days</span>
                            )}
                          </td>
                          <td className="font-semibold">{sub.commission_rate}%</td>
                          <td>
                            <span className={`badge ${sub.is_trial_active ? 'badge-success' : 'badge-neutral'}`}>
                              {sub.is_trial_active ? 'In Trial' : 'Expired'}
                            </span>
                          </td>
                          <td className="no-print">
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button 
                                onClick={() => {
                                  setSelectedTrialShop(s)
                                  setShowExtendModal(true)
                                }}
                                className="btn btn-sm"
                                style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none' }}
                                id={`extend-btn-${s.id}`}
                              >
                                Extend
                              </button>
                              {sub.is_trial_active && (
                                <button 
                                  onClick={() => handleEndTrial(s.id)}
                                  className="btn btn-sm"
                                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none' }}
                                  id={`end-btn-${s.id}`}
                                >
                                  End Trial
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Cards */}
            <div className="mobile-only-grid" style={{ display: 'none', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredTrialShops.map(s => {
                const sub = s.shop_subscription!
                const remaining = calculateRemainingDays(sub.trial_end_date)
                return (
                  <div key={s.id} className="card card-body" style={{ background: '#fff', border: '1px solid var(--wa-separator)', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 700 }}>
                          <Link href={`/admin/shops/${s.id}`} style={{ color: 'var(--wa-green-dark)' }}>
                            {s.name}
                          </Link>
                        </h4>
                        <p className="text-xs text-muted" style={{ margin: 0 }}>Started: {new Date(sub.trial_start_date).toLocaleDateString()}</p>
                      </div>
                      <span className={`badge ${sub.is_trial_active ? 'badge-success' : 'badge-neutral'}`}>
                        {sub.is_trial_active ? 'In Trial' : 'Expired'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', margin: '0.5rem 0' }}>
                      <span><strong>Ends:</strong> {new Date(sub.trial_end_date).toLocaleDateString()}</span>
                      <span><strong>Remaining:</strong> {sub.is_trial_active ? `${remaining} days` : '0 days'}</span>
                      <span><strong>Rate:</strong> {sub.commission_rate}%</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button 
                        onClick={() => {
                          setSelectedTrialShop(s)
                          setShowExtendModal(true)
                        }}
                        className="btn btn-sm btn-outline" 
                        style={{ flex: 1, padding: '0.25rem 0.5rem' }}
                      >
                        Extend
                      </button>
                      {sub.is_trial_active && (
                        <button 
                          onClick={() => handleEndTrial(s.id)}
                          className="btn btn-sm" 
                          style={{ flex: 1, padding: '0.25rem 0.5rem', background: '#ef4444', color: '#fff', border: 'none' }}
                        >
                          End Trial
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Commission Terms & Policy Guidelines */}
        <div className="card card-body" style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--wa-separator)', boxShadow: 'var(--shadow-sm)', marginTop: '2rem', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={18} style={{ color: 'var(--wa-purple-dark)' }} /> Commission System Terms & Conditions
        </h3>
        <p className="text-sm text-muted" style={{ margin: '0 0 1.25rem' }}>
          Platform rules, billing triggers, and shop restriction grace periods.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Trial & Rates</span>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li><strong>30-Day Free Trial:</strong> All new shops start with 30 days of 0% commission.</li>
              <li><strong>5% Commission:</strong> Default rate applied on delivered orders after the trial expires.</li>
              <li><strong>Custom Shop Rates:</strong> Rates can be overridden by admins on individual shop detail cards.</li>
            </ul>
          </div>

          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Billing Triggers</span>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li><strong>Delivered Status:</strong> Commission is generated only when orders are marked "Delivered".</li>
              <li><strong>Auto-Reversion:</strong> Reverting or cancelling orders deletes the commission transaction.</li>
              <li><strong>Monthly Cycle:</strong> Billing statements compile automatically at the end of monthly periods.</li>
            </ul>
          </div>

          <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>Grace & Restrictions</span>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li><strong>Level 1 Warning (15 Days Overdue):</strong> Displays warning banners to vendor.</li>
              <li><strong>Level 2 Demotion (20 Days Overdue):</strong> Pushes shop to the bottom of all directories.</li>
              <li><strong>Level 3 Suspend (30 Days Overdue):</strong> Blocks add-to-cart & new order checkouts.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

      {/* Collect Payment Modal */}
      {showPaymentModal && selectedReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card fade-up" style={{ width: '100%', maxWidth: 450, background: '#fff', borderRadius: '16px' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="font-bold" style={{ margin: 0 }}>Record Payment - {selectedReport.shopName}</h3>
              <button onClick={() => { setShowPaymentModal(false); setSelectedReport(null); }} className="btn-ghost" style={{ padding: '.25rem' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Payment Amount (₹) *</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedReport.commissionDue}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
                <span className="text-xs text-muted" style={{ marginTop: '0.25rem', display: 'block' }}>
                  Outstanding Balance: ₹{selectedReport.commissionDue.toFixed(2)}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method *</label>
                <select 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="cash">💵 Cash</option>
                  <option value="upi">📱 UPI</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Reference (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. UPI ID or TXN Ref"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea 
                  placeholder="Memo / internal comments"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', minHeight: '60px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { setShowPaymentModal(false); setSelectedReport(null); }} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, background: 'var(--wa-green-dark)' }}>
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waive Modal */}
      {showWaiveModal && selectedReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card fade-up" style={{ width: '100%', maxWidth: 450, background: '#fff', borderRadius: '16px' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="font-bold" style={{ margin: 0 }}>Waive Commission - {selectedReport.shopName}</h3>
              <button onClick={() => { setShowWaiveModal(false); setSelectedReport(null); }} className="btn-ghost" style={{ padding: '.25rem' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleWaiveSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Waive Type</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <input type="radio" checked={waiveType === 'report'} onChange={() => setWaiveType('report')} />
                    Waive Entire Report Dues
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <input type="radio" checked={waiveType === 'custom'} onChange={() => setWaiveType('custom')} />
                    Waive Custom Amount
                  </label>
                </div>
              </div>

              {waiveType === 'custom' && (
                <div className="form-group">
                  <label className="form-label">Waive Amount (₹) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedReport.commissionDue}
                    value={waiveAmount}
                    onChange={e => setWaiveAmount(e.target.value)}
                    className="form-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Reason for Waiver *</label>
                <textarea 
                  placeholder="Explain why this commission is being waived (required)"
                  value={waiveReason}
                  onChange={e => setWaiveReason(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', minHeight: '80px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { setShowWaiveModal(false); setSelectedReport(null); }} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, background: '#ef4444' }}>
                  {loading ? 'Processing...' : 'Apply Waiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Reports Modal */}
      {showGenModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card fade-up" style={{ width: '100%', maxWidth: 450, background: '#fff', borderRadius: '16px' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="font-bold" style={{ margin: 0 }}>Trigger Billing Reports</h3>
              <button onClick={() => { setShowGenModal(false); setGenCount(null); }} className="btn-ghost" style={{ padding: '.25rem' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleGenSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p className="text-sm text-muted">
                Calculate shop sales and compile monthly commission summaries. Note that this runs on delivered orders for the specified month/year.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <select 
                    value={genMonth}
                    onChange={e => setGenMonth(parseInt(e.target.value))}
                    className="form-input"
                    style={{ width: '100%' }}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>{new Date(2020, m - 1, 1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input 
                    type="number"
                    value={genYear}
                    onChange={e => setGenYear(parseInt(e.target.value))}
                    className="form-input"
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              {genCount !== null && (
                <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', color: '#10b981', textAlign: 'center', fontSize: '0.9rem' }}>
                  Successfully generated {genCount} reports!
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { setShowGenModal(false); setGenCount(null); }} className="btn btn-outline" style={{ flex: 1 }}>Close</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, background: 'var(--wa-green-dark)' }}>
                  {loading ? 'Processing...' : 'Run Generation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Trial Modal */}
      {showExtendModal && selectedTrialShop && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card fade-up" style={{ width: '100%', maxWidth: 450, background: '#fff', borderRadius: '16px' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="font-bold" style={{ margin: 0, color: '#0f172a' }}>Extend Trial - {selectedTrialShop.name}</h3>
              <button onClick={() => { setShowExtendModal(false); setSelectedTrialShop(null); }} className="btn-ghost" style={{ padding: '.25rem' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleExtendTrialSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p className="text-sm text-muted">
                Extend the free trial duration for this shop. This will reset the trial status to active if it is currently expired.
              </p>
              
              <div className="form-group">
                <label className="form-label">Extension Duration (Days) *</label>
                <select 
                  value={extendDaysInput} 
                  onChange={e => setExtendDaysInput(e.target.value)} 
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="7">7 Days</option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { setShowExtendModal(false); setSelectedTrialShop(null); }} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, background: 'var(--wa-green-dark)' }}>
                  {loading ? 'Processing...' : 'Extend Trial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

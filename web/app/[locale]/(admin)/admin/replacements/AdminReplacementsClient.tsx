'use client'

import { useState } from 'react'
import { Search, Filter, Calendar, BarChart3, HelpCircle, ArrowUpDown, ChevronDown, Check, RefreshCcw, DollarSign, Clock, ShieldAlert } from 'lucide-react'

interface Props {
  initialRequests: any[]
  shops: any[]
}

export default function AdminReplacementsClient({ initialRequests, shops }: Props) {
  const [requests, setRequests] = useState<any[]>(initialRequests)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [shopFilter, setShopFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Filter requests list
  const filteredRequests = requests.filter(req => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const custName = req.orders?.users?.name?.toLowerCase() || ''
      const orderNum = req.orders?.order_number?.toLowerCase() || ''
      const shopName = req.shops?.name?.toLowerCase() || ''
      if (!custName.includes(q) && !orderNum.includes(q) && !shopName.includes(q)) {
        return false
      }
    }

    // Shop filter
    if (shopFilter !== 'all' && req.shop_id !== shopFilter) {
      return false
    }

    // Status filter
    if (statusFilter !== 'all' && req.status.toLowerCase() !== statusFilter) {
      return false
    }

    // Date filters
    const reqDate = new Date(req.created_at).getTime()
    if (startDate) {
      const start = new Date(startDate).getTime()
      if (reqDate < start) return false
    }
    if (endDate) {
      const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 // end of day
      if (reqDate > end) return false
    }

    return true
  })

  // Calculate Metrics
  const totalCount = filteredRequests.length
  
  const approvedCount = filteredRequests.filter(r => r.status.toLowerCase() === 'approved' || r.status.toLowerCase() === 'completed').length
  const rejectedCount = filteredRequests.filter(r => r.status.toLowerCase() === 'rejected').length
  const pendingCount = filteredRequests.filter(r => r.status.toLowerCase() === 'pending').length
  
  const approvedRate = totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(0) : '0'
  const rejectedRate = totalCount > 0 ? ((rejectedCount / totalCount) * 100).toFixed(0) : '0'
  const pendingRate = totalCount > 0 ? ((pendingCount / totalCount) * 100).toFixed(0) : '0'

  // Resolution Time (in minutes/hours for resolved cases)
  const resolvedRequests = filteredRequests.filter(r => r.status.toLowerCase() !== 'pending')
  let avgResolutionHours = '0'
  if (resolvedRequests.length > 0) {
    const totalMs = resolvedRequests.reduce((sum, r) => {
      const created = new Date(r.created_at).getTime()
      const updated = new Date(r.updated_at).getTime()
      return sum + (updated - created)
    }, 0)
    avgResolutionHours = (totalMs / resolvedRequests.length / 1000 / 60 / 60).toFixed(1)
  }

  // Cost calculation
  // cost = sum of approved/completed item costs
  const totalCost = filteredRequests
    .filter(r => r.status.toLowerCase() === 'approved' || r.status.toLowerCase() === 'completed')
    .reduce((sum, r) => {
      const requestCost = r.replacement_items?.reduce((itemSum: number, ri: any) => {
        const itemPrice = ri.order_items?.estimated_price || 0
        return itemSum + (itemPrice * ri.quantity)
      }, 0) || 0
      return sum + requestCost
    }, 0)

  // Common reasons breakdown
  const reasonsMap: Record<string, number> = {}
  filteredRequests.forEach(r => {
    reasonsMap[r.reason] = (reasonsMap[r.reason] || 0) + 1
  })
  const sortedReasons = Object.entries(reasonsMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        @media (max-width: 1024px) {
          .admin-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .admin-grid { grid-template-columns: 1fr; }
        }
        
        .admin-card { background: #ffffff; border-radius: 20px; padding: 20px; border: 1px solid var(--wa-separator); box-shadow: var(--shadow-sm); display: flex; align-items: center; gap: 16px; }
        .card-icon-box { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .card-num { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin: 0; line-height: 1.1; }
        .card-lbl { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-top: 4px; }

        .filter-row { background: #ffffff; border-radius: 20px; padding: 20px; border: 1px solid var(--wa-separator); box-shadow: var(--shadow-sm); margin-bottom: 24px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; align-items: end; }
        
        .admin-input-group { display: flex; flex-direction: column; gap: 6px; }
        .admin-lbl { font-size: 12px; font-weight: 700; color: #64748b; }
        .admin-input, .admin-select { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--wa-separator); background: #f8fafc; color: #0f172a; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .admin-input:focus, .admin-select:focus { border-color: #3b82f6; }

        .analytics-split { display: grid; grid-template-columns: 3fr 1fr; gap: 24px; margin-bottom: 24px; }
        @media (max-width: 1024px) {
          .analytics-split { grid-template-columns: 1fr; }
        }

        .data-table-card { background: #ffffff; border-radius: 20px; border: 1px solid var(--wa-separator); box-shadow: var(--shadow-sm); overflow: hidden; }
        .table-title { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; padding: 20px; border-bottom: 1px solid var(--wa-separator); }
        .table-responsive { overflow-x: auto; width: 100%; }
        
        .req-table { width: 100%; border-collapse: collapse; text-align: left; }
        .req-table th { background: #f8fafc; padding: 12px 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 1px solid var(--wa-separator); }
        .req-table td { padding: 16px 20px; font-size: 14px; border-bottom: 1px solid var(--wa-separator); color: #334155; vertical-align: top; }
        .req-table tr:last-child td { border-bottom: none; }

        .admin-badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-block; }
        .ab-pending { background: #fef3c7; color: #d97706; }
        .ab-approved { background: #dbeafe; color: #2563eb; }
        .ab-completed { background: #d1fae5; color: #059669; }
        .ab-rejected { background: #fee2e2; color: #dc2626; }

        .breakdown-card { background: #ffffff; border-radius: 20px; padding: 20px; border: 1px solid var(--wa-separator); box-shadow: var(--shadow-sm); }
        .reason-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
        .reason-row:last-child { margin-bottom: 0; }
        .reason-header { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #0f172a; }
        .reason-bar-bg { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .reason-bar { height: 100%; background: #3b82f6; border-radius: 4px; }
      ` }} />

      {/* Analytics Summary */}
      <div className="admin-grid">
        <div className="admin-card">
          <div className="card-icon-box" style={{ background: '#eff6ff', color: '#3b82f6' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className="card-num">{totalCount}</h3>
            <div className="card-lbl">Total Requests</div>
          </div>
        </div>

        <div className="admin-card">
          <div className="card-icon-box" style={{ background: '#ecfdf5', color: '#10b981' }}>
            <Check size={24} />
          </div>
          <div>
            <h3 className="card-num">{approvedRate}%</h3>
            <div className="card-lbl">Approved Rate</div>
          </div>
        </div>

        <div className="admin-card">
          <div className="card-icon-box" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="card-num">{rejectedRate}%</h3>
            <div className="card-lbl">Rejected Rate</div>
          </div>
        </div>

        <div className="admin-card">
          <div className="card-icon-box" style={{ background: '#fdf4ff', color: '#d946ef' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <h3 className="card-num">₹{totalCost.toFixed(0)}</h3>
            <div className="card-lbl">Replacement Cost</div>
          </div>
        </div>

        <div className="admin-card">
          <div className="card-icon-box" style={{ background: '#fff7ed', color: '#f97316' }}>
            <Clock size={24} />
          </div>
          <div>
            <h3 className="card-num">{avgResolutionHours}h</h3>
            <div className="card-lbl">Avg Resolution</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-row">
        <div className="admin-input-group">
          <label className="admin-lbl">Search Customers/Shops</label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 12, color: '#94a3b8' }} />
            <input 
              type="text" 
              className="admin-input" 
              style={{ paddingLeft: '32px' }}
              placeholder="Name, shop, order #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="admin-input-group">
          <label className="admin-lbl">Filter by Shop</label>
          <select 
            className="admin-select"
            value={shopFilter}
            onChange={(e) => setShopFilter(e.target.value)}
          >
            <option value="all">All Shops</option>
            {shops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="admin-input-group">
          <label className="admin-lbl">Filter by Status</label>
          <select 
            className="admin-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="admin-input-group">
          <label className="admin-lbl">Start Date</label>
          <input 
            type="date" 
            className="admin-input" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="admin-input-group">
          <label className="admin-lbl">End Date</label>
          <input 
            type="date" 
            className="admin-input" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table + Reason Breakdown */}
      <div className="analytics-split">
        <div className="data-table-card">
          <h2 className="table-title">Recent Replacement Requests</h2>
          <div className="table-responsive">
            <table className="req-table">
              <thead>
                <tr>
                  <th>Request ID / Date</th>
                  <th>Customer / Shop</th>
                  <th>Reason / Items</th>
                  <th>Decision / Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map(req => {
                    const cost = req.replacement_items?.reduce((sum: number, ri: any) => {
                      const price = ri.order_items?.estimated_price || 0
                      return sum + (price * ri.quantity)
                    }, 0) || 0

                    const badgeClasses: Record<string, string> = {
                      pending: 'ab-pending',
                      approved: 'ab-approved',
                      completed: 'ab-completed',
                      rejected: 'ab-rejected'
                    }

                    return (
                      <tr key={req.id}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                            {req.id.slice(0, 8).toUpperCase()}
                          </span>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                            {new Date(req.created_at).toLocaleDateString('en-GB')}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {req.orders?.users?.name || 'Customer'}
                          </span>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Shop: <strong style={{ color: '#334155' }}>{req.shops?.name}</strong>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#3b82f6' }}>
                            {req.reason}
                          </span>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                            {req.replacement_items?.map((ri: any) => (
                              <div key={ri.id}>
                                • {ri.order_items?.items?.name} × {ri.quantity}
                              </div>
                            ))}
                          </div>
                          {(() => {
                            const raw = req.customer_images || req.proof_images || []
                            const imgs = Array.isArray(raw) ? raw : typeof raw === 'string' && raw.startsWith('http') ? [raw] : []
                            if (imgs.length === 0) return null
                            return (
                              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                                {imgs.map((img: string, idx: number) => (
                                  <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                                    <img src={img} alt="proof" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                                  </a>
                                ))}
                              </div>
                            )
                          })()}
                        </td>
                        <td>
                          <span className={`admin-badge ${badgeClasses[req.status.toLowerCase()] || ''}`}>
                            {req.status}
                          </span>
                          <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600, marginTop: '6px' }}>
                            Cost: ₹{cost.toFixed(0)}
                          </div>
                          {req.notes && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                              Note: {req.notes}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      No replacement records match the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="breakdown-card">
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 20px' }}>
            Top Claim Reasons
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sortedReasons.map(([reason, count]) => {
              const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0
              return (
                <div key={reason} className="reason-row">
                  <div className="reason-header">
                    <span>{reason}</span>
                    <span>{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="reason-bar-bg">
                    <div 
                      className="reason-bar" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            
            {sortedReasons.length === 0 && (
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', margin: '20px 0' }}>
                No analytics logs.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, Settings, HelpCircle, Save, CheckCircle, XCircle, AlertCircle, RefreshCw, Eye, MessageSquare } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { updateReplacementStatusAction, updateShopReplacementSettingsAction } from '@/app/actions/replacements'

interface Props {
  initialRequests: any[]
  shops: any[]
  locale: string
}

function parseEvidenceImages(req: any): string[] {
  if (!req) return []
  const raw = req.customer_images || req.proof_images || req.customerImages || req.images
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw.map((item: any) => String(item).trim()).filter(url => url.length > 0)
  }

  if (typeof raw === 'string') {
    const str = raw.trim()
    if (!str) return []
    if (str.startsWith('[')) {
      try {
        const arr = JSON.parse(str)
        if (Array.isArray(arr)) {
          return arr.map((item: any) => String(item).trim()).filter(url => url.length > 0)
        }
      } catch (e) {}
    }
    if (str.startsWith('{') && str.endsWith('}')) {
      return str.slice(1, -1).split(',').map(s => s.replace(/^"|"$/g, '').trim()).filter(Boolean)
    }
    if (str.startsWith('http')) {
      return [str]
    }
  }

  return []
}

export default function VendorReplacementsClient({ initialRequests, shops, locale }: Props) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'requests' | 'settings'>('requests')
  const [requests, setRequests] = useState<any[]>(initialRequests)
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Selected request for action modal
  const [selectedReq, setSelectedReq] = useState<any | null>(null)
  const [resolutionStatus, setResolutionStatus] = useState<'approved' | 'rejected' | 'completed'>('approved')
  const [generalNotes, setGeneralNotes] = useState('')
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({})
  
  // Settings tab state (per shop)
  const [shopSettings, setShopSettings] = useState<Record<string, { enabled: boolean; window: number; policy: string }>>(() => {
    const initial: Record<string, any> = {}
    shops.forEach(s => {
      initial[s.id] = {
        enabled: s.replacement_enabled !== false,
        window: s.return_window_hours ?? 24,
        policy: s.replacement_policy || ''
      }
    })
    return initial
  })

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [savingSettings, setSavingSettings] = useState<Record<string, boolean>>({})
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null)

  // Filter requests
  const filteredRequests = requests.filter(req => {
    // Status filter
    if (statusFilter !== 'all' && req.status.toLowerCase() !== statusFilter) return false

    // Search query (customer name, phone, order number)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const custName = req.orders?.users?.name?.toLowerCase() || ''
      const custPhone = req.orders?.users?.phone || ''
      const orderNum = req.orders?.order_number?.toLowerCase() || ''
      const reqId = req.id.toLowerCase()
      
      if (!custName.includes(q) && !custPhone.includes(q) && !orderNum.includes(q) && !reqId.includes(q)) {
        return false
      }
    }

    return true
  })

  // Open action modal
  function handleOpenActionModal(req: any) {
    setSelectedReq(req)
    setResolutionStatus(req.status.toLowerCase() === 'pending' ? 'approved' : req.status.toLowerCase())
    setGeneralNotes(req.notes || '')
    
    const initialItemNotes: Record<string, string> = {}
    req.replacement_items?.forEach((itm: any) => {
      initialItemNotes[itm.id] = itm.notes || ''
    })
    setItemNotes(initialItemNotes)
    setErrorMsg('')
  }

  // Submit action modal
  async function handleSubmitAction(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedReq) return

    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const mappedStatus = resolutionStatus === 'approved' ? 'Approved'
                         : resolutionStatus === 'completed' ? 'Completed'
                         : 'Rejected'

      const response = await fetch('/api/vendor/replacements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedReq.id,
          shopId: selectedReq.shop_id,
          status: mappedStatus,
          notes: generalNotes,
          sellerNotesMap: itemNotes
        })
      })

      const res = await response.json()

      if (!response.ok || res.error) {
        setErrorMsg(res.error || 'Operation failed.')
      } else {
        // Update local requests list
        setRequests(prev => prev.map(r => r.id === selectedReq.id ? {
          ...r,
          status: mappedStatus,
          notes: generalNotes,
          updated_at: new Date().toISOString(),
          replacement_items: r.replacement_items?.map((ri: any) => ({
            ...ri,
            notes: itemNotes[ri.id] || ri.notes
          }))
        } : r))
        
        setSuccessMsg('Request updated successfully.')
        setSelectedReq(null)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  // Save shop settings
  async function handleSaveSettings(shopId: string) {
    const config = shopSettings[shopId]
    if (!config) return

    setSavingSettings(prev => ({ ...prev, [shopId]: true }))
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await updateShopReplacementSettingsAction(
        shopId,
        config.enabled,
        config.window,
        config.policy
      )

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Replacement settings saved successfully.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings.')
    } finally {
      setSavingSettings(prev => ({ ...prev, [shopId]: false }))
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .vp-tabs { display: flex; gap: 16px; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 24px; }
        .vp-tab-btn { padding: 12px 16px; font-size: 15px; font-weight: 700; background: none; border: none; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .vp-tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
        
        .search-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .search-wrapper { position: relative; flex: 1; min-width: 260px; }
        .search-icon { position: absolute; left: 14px; top: 13px; color: #64748b; }
        .search-input { width: 100%; padding: 12px 16px 12px 42px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); color: #fff; font-size: 14px; outline: none; }
        .search-input:focus { border-color: #3b82f6; }
        
        .filter-select { padding: 12px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.02); color: #94a3b8; font-size: 14px; outline: none; cursor: pointer; }
        
        .req-list { display: flex; flex-direction: column; gap: 16px; }
        .req-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 20px; transition: all 0.2s; }
        .req-card:hover { border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); }
        
        .req-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 14px; margin-bottom: 14px; }
        .cust-name { font-size: 16px; font-weight: 700; color: #fff; margin: 0; }
        .cust-phone { font-size: 13px; color: #94a3b8; margin: 2px 0 0; }
        
        .badge { padding: 4px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge-pending { background: rgba(245,158,11,0.1); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
        .badge-approved { background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); }
        .badge-completed { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .badge-rejected { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
        
        .req-body { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
        @media (max-width: 768px) {
          .req-body { grid-template-columns: 1fr; gap: 16px; }
        }
        
        .section-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; }
        
        .proof-gallery { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
        .proof-thumb { width: 64px; height: 64px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); object-fit: cover; cursor: pointer; transition: all 0.2s; }
        .proof-thumb:hover { border-color: #3b82f6; transform: scale(1.05); }
        
        .items-box { background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); border-radius: 12px; padding: 12px; }
        .item-line { display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-bottom: 1px dashed rgba(255,255,255,0.04); }
        .item-line:last-child { border-bottom: none; }
        
        .setting-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 24px; margin-bottom: 16px; }
        
        .toast-msg { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
        .toast-success { background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
        .toast-error { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
        
        /* Modal Styles */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
        .modal-content { background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; padding: 24px; position: relative; }
        
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; text-align: center; border: 2px dashed rgba(255,255,255,0.04); border-radius: 20px; }
      ` }} />

      {successMsg && (
        <div className="toast-msg toast-success">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="toast-msg toast-error">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="vp-tabs">
        <button 
          className={`vp-tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <MessageSquare size={16} />
          <span>{t('replacements.replacement_requests') || 'Replacement Requests'}</span>
        </button>
        <button 
          className={`vp-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} />
          <span>{t('replacements.policy_settings') || 'Policy & Settings'}</span>
        </button>
      </div>

      {activeTab === 'requests' ? (
        <>
          {/* Filters */}
          <div className="search-row">
            <div className="search-wrapper">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                className="search-input" 
                placeholder={t('replacements.search_replacement_placeholder') || 'Search by customer name, order number, or ID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('replacements.all_request_statuses') || 'All Request Statuses'}</option>
              <option value="pending">{t('replacements.pending_requests') || 'Pending Requests'}</option>
              <option value="approved">{t('replacements.approved_requests') || 'Approved Requests'}</option>
              <option value="completed">{t('replacements.completed_requests') || 'Completed Requests'}</option>
              <option value="rejected">{t('replacements.rejected_requests') || 'Rejected Requests'}</option>
            </select>
          </div>

          {/* List */}
          <div className="req-list">
            {filteredRequests.length > 0 ? (
              filteredRequests.map(req => {
                const statusClasses: Record<string, string> = {
                  pending: 'badge-pending',
                  approved: 'badge-approved',
                  completed: 'badge-completed',
                  rejected: 'badge-rejected'
                }
                const statusLower = req.status.toLowerCase()

                return (
                  <div key={req.id} className="req-card">
                    <div className="req-header">
                      <div>
                        <h3 className="cust-name">{req.orders?.users?.name || 'Customer'}</h3>
                        <p className="cust-phone">
                          {t('replacements.order_number_label') || 'Order Number:'} <strong style={{ color: '#fff' }}>{req.orders?.order_number || req.order_id.slice(0, 8).toUpperCase()}</strong>
                          {req.orders?.users?.phone && ` · Phone: ${req.orders.users.phone}`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`badge ${statusClasses[statusLower] || ''}`}>
                          {statusLower === 'pending' ? t('replacements.status_pending') :
                           statusLower === 'approved' ? t('replacements.status_approved') :
                           statusLower === 'completed' ? t('replacements.status_completed') :
                           statusLower === 'rejected' ? t('replacements.status_rejected') : req.status}
                        </span>
                        {(statusLower === 'pending' || statusLower === 'approved') && (
                          <button 
                            className="vp-btn vp-btn-primary vp-btn-sm"
                            style={{ padding: '4px 12px', fontSize: '12px' }}
                            onClick={() => handleOpenActionModal(req)}
                          >
                            {t('replacements.resolve_action') || 'Resolve'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="req-body">
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <div className="section-label">{t('replacements.reason_explanation') || 'Reason & Explanation'}</div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                            {req.reason}
                          </p>
                          {req.description && (
                            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                              {req.description}
                            </p>
                          )}
                        </div>

                        {(() => {
                          const images = parseEvidenceImages(req)
                          if (images.length === 0) return null
                          return (
                            <div style={{ marginTop: '12px' }}>
                              <div className="section-label">{t('replacements.photo_proof') || 'Photo Proof / Evidence'}</div>
                              <div className="proof-gallery">
                                {images.map((img: string, i: number) => (
                                  <img 
                                    key={i} 
                                    src={img} 
                                    alt="proof" 
                                    className="proof-thumb"
                                    onClick={() => setActiveImagePreview(img)}
                                  />
                                ))}
                              </div>
                            </div>
                          )
                        })()}

                        {req.notes && (
                          <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '12px', borderRadius: '12px' }}>
                            <div className="section-label" style={{ color: '#10b981' }}>{t('replacements.resolution_notes') || 'Resolution Notes'}</div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                              {req.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="section-label">{t('replacements.requested_items') || 'Requested Items'}</div>
                        <div className="items-box">
                          {req.replacement_items?.map((itm: any) => (
                            <div key={itm.id} className="item-line">
                              <div>
                                <span style={{ fontWeight: 600, color: '#fff' }}>
                                  {itm.order_items?.items?.name || 'Item'}
                                </span>
                                {itm.order_items?.item_variants?.label && (
                                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                                    ({itm.order_items.item_variants.label})
                                  </span>
                                )}
                                {itm.notes && (
                                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#10b981' }}>
                                    Note: {itm.notes}
                                  </p>
                                )}
                              </div>
                              <span style={{ fontWeight: 700, color: '#3b82f6' }}>
                                Qty: {itm.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="empty-state">
                <HelpCircle size={48} color="#475569" />
                <h3 style={{ margin: '16px 0 8px', fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                  {t('replacements.no_requests') || 'No Replacement Requests Found'}
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                  {t('replacements.no_matching_requests_desc') || 'No requests matching the selected filters were found.'}
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Settings Tab */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {shops.map(shop => {
            const config = shopSettings[shop.id] || { enabled: true, window: 24, policy: '' }
            const saving = savingSettings[shop.id] || false

            return (
              <div key={shop.id} className="setting-card">
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>
                  {shop.name}
                </h2>

                <div className="vp-form-group" style={{ marginBottom: '16px' }}>
                  <label className="vp-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={config.enabled}
                      onChange={(e) => setShopSettings(prev => ({
                        ...prev,
                        [shop.id]: { ...prev[shop.id], enabled: e.target.checked }
                      }))}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                      {t('replacements.enable_replacements_label') || 'Enable Replacement Requests for this Shop'}
                    </span>
                  </label>
                </div>

                <div className="vp-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                  <label className="vp-label" style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>
                    {t('replacements.return_window_label') || 'Return Window (Hours)'}
                  </label>
                  <input 
                     type="number" 
                     className="search-input" 
                     style={{ maxWidth: '120px', padding: '10px 14px' }}
                     value={config.window}
                     onChange={(e) => setShopSettings(prev => ({
                       ...prev,
                       [shop.id]: { ...prev[shop.id], window: parseInt(e.target.value) || 24 }
                     }))}
                     min={1}
                  />
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                    {t('replacements.return_window_desc') || 'Number of hours post-delivery during which a customer can file replacement claims.'}
                  </p>
                </div>

                <div className="vp-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  <label className="vp-label" style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>
                    {t('replacements.replacement_policy_terms') || 'Replacement Policy Terms'}
                  </label>
                  <textarea 
                    className="search-input" 
                    style={{ minHeight: '100px', lineHeight: 1.5 }}
                    placeholder="Enter custom replacement/return guidelines for customers. (e.g. Return unused items in original packaging...)"
                    value={config.policy}
                    onChange={(e) => setShopSettings(prev => ({
                      ...prev,
                      [shop.id]: { ...prev[shop.id], policy: e.target.value }
                    }))}
                  />
                </div>

                <button 
                  className="vp-btn vp-btn-primary"
                  onClick={() => handleSaveSettings(shop.id)}
                  disabled={saving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {saving ? (
                    <RefreshCw className="spinner" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{t('replacements.save_shop_rules') || 'Save Shop Rules'}</span>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Action Dialog / Modal */}
      {selectedReq && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: '0 0 16px' }}>
              {t('replacements.resolve_replacement_request') || 'Resolve Replacement Request'}
            </h3>
            
            <form onSubmit={handleSubmitAction}>
              <div className="vp-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <label className="vp-label" style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>
                  {t('replacements.action_decision') || 'Action Decision'}
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '14px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="dec" 
                      value="approved" 
                      checked={resolutionStatus === 'approved'}
                      onChange={() => setResolutionStatus('approved')}
                    />
                    {t('replacements.approve') || 'Approve'}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '14px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="dec" 
                      value="completed" 
                      checked={resolutionStatus === 'completed'}
                      onChange={() => setResolutionStatus('completed')}
                    />
                    {t('replacements.complete_resolved') || 'Complete (Resolved)'}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '14px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="dec" 
                      value="rejected" 
                      checked={resolutionStatus === 'rejected'}
                      onChange={() => setResolutionStatus('rejected')}
                    />
                    {t('replacements.reject') || 'Reject'}
                  </label>
                </div>
              </div>

              {/* Item-specific notes */}
              <div style={{ marginBottom: '16px' }}>
                <div className="section-label" style={{ marginBottom: '8px' }}>{t('replacements.item_resolutions') || 'Item Resolutions'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedReq.replacement_items?.map((ri: any) => (
                    <div key={ri.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px' }}>
                      <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                        {ri.order_items?.items?.name} (Qty: {ri.quantity})
                      </p>
                      <input 
                        type="text" 
                        className="search-input" 
                        style={{ padding: '8px 12px', fontSize: '13px' }}
                        placeholder="Specific action note for this item (e.g. Approved replacement dispatch...)"
                        value={itemNotes[ri.id] || ''}
                        onChange={(e) => setItemNotes(prev => ({
                          ...prev,
                          [ri.id]: e.target.value
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="vp-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                <label className="vp-label" style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8' }}>
                  {t('replacements.general_resolution_explanation') || 'General Resolution Explanation'}
                </label>
                <textarea 
                  className="search-input" 
                  style={{ minHeight: '80px', lineHeight: 1.5 }}
                  placeholder="Enter overall notes about this request..."
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="vp-btn vp-btn-outline" 
                  onClick={() => setSelectedReq(null)}
                  disabled={submitting}
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button 
                  type="submit" 
                  className="vp-btn vp-btn-primary" 
                  disabled={submitting}
                  style={{ minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {submitting && <RefreshCw className="spinner" size={14} />}
                  Submit Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Overlay */}
      {activeImagePreview && (
        <div className="modal-overlay" onClick={() => setActiveImagePreview(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img src={activeImagePreview} alt="proof-zoom" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px' }} />
            <button 
              onClick={() => setActiveImagePreview(null)}
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}

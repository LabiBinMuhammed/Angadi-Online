'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  RotateCcw, AlertCircle, CheckCircle, Clock, ChevronRight,
  User, Phone, ShoppingBag, Eye, X, Check, XCircle
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { updateReplacementStatusAction } from '@/app/actions/replacements'

interface Props {
  initialRequests: any[]
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

export default function VendorUnfinishedReplacements({ initialRequests, locale }: Props) {
  const { t } = useTranslation()
  const [requests, setRequests] = useState<any[]>(initialRequests)
  const [selectedReq, setSelectedReq] = useState<any | null>(null)
  const [decision, setDecision] = useState<'approve_next_shift' | 'approve_now' | 'reject'>('approve_next_shift')
  const [generalNotes, setGeneralNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [activeImagePreview, setActiveImagePreview] = useState<string | null>(null)

  const handleOpenActionModal = (req: any) => {
    setSelectedReq(req)
    setDecision('approve_next_shift')
    setGeneralNotes('')
    setRejectionReason('')
    const notesMap: Record<string, string> = {}
    if (req.replacement_items) {
      req.replacement_items.forEach((itm: any) => {
        if (itm.notes) notesMap[itm.id] = itm.notes
      })
    }
    setItemNotes(notesMap)
  }

  const handleCloseModal = () => {
    setSelectedReq(null)
    setGeneralNotes('')
    setRejectionReason('')
    setItemNotes({})
  }

  const handleSaveResolution = async () => {
    if (!selectedReq) return
    setErrorMsg('')

    if (decision === 'reject' && !rejectionReason.trim() && !generalNotes.trim()) {
      setErrorMsg('Please specify a rejection reason or explanation for the customer.')
      return
    }

    setSubmitting(true)

    try {
      let dbStatus: 'Approved' | 'Rejected' = 'Approved'
      let finalNotes = ''

      if (decision === 'reject') {
        dbStatus = 'Rejected'
        finalNotes = rejectionReason.trim() || generalNotes.trim()
      } else if (decision === 'approve_next_shift') {
        dbStatus = 'Approved'
        const customNote = generalNotes.trim()
        finalNotes = customNote 
          ? `${customNote} [Delivery: Next Shift]` 
          : 'Approved for replacement. Delivery scheduled in the next shift.'
      } else if (decision === 'approve_now') {
        dbStatus = 'Approved'
        const customNote = generalNotes.trim()
        finalNotes = customNote 
          ? `${customNote} [Delivery: Out Now]` 
          : 'Approved for immediate replacement. Items dispatched for delivery.'
      }

      const response = await fetch('/api/vendor/replacements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedReq.id,
          shopId: selectedReq.shop_id,
          status: dbStatus,
          notes: finalNotes,
          sellerNotesMap: itemNotes
        })
      })

      const res = await response.json()

      if (!response.ok || res.error) {
        throw new Error(res.error || 'Failed to update replacement request')
      }

      setSuccessMsg(
        decision === 'reject' 
          ? 'Replacement request rejected.' 
          : 'Replacement approved! Waiting for customer confirmation upon delivery.'
      )
      setRequests(prev => prev.filter(r => r.id !== selectedReq.id))
      handleCloseModal()
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update replacement request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ marginTop: '2rem', marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h2 className="vp-title" style={{ fontSize: '1.4rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RotateCcw size={22} color="#f59e0b" />
            {t('vendor_dashboard.unfinished_replacements_title') || 'Unfinished Replacement Requests'}
          </h2>
          {requests.length > 0 && (
            <span style={{ 
              background: 'rgba(245, 158, 11, 0.15)', 
              color: '#f59e0b', 
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '20px', 
              padding: '2px 10px', 
              fontSize: '0.75rem', 
              fontWeight: 700 
            }}>
              {requests.length} {t('vendor_dashboard.action_required') || 'Action Required'}
            </span>
          )}
        </div>
        <Link 
          href="/vendor/replacements" 
          className="vp-btn vp-btn-outline vp-btn-sm" 
          style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
        >
          {t('vendor_dashboard.view_all_replacements') || 'View All Replacements'} <ChevronRight size={16} />
        </Link>
      </div>

      {successMsg && (
        <div style={{ 
          background: 'rgba(34, 197, 94, 0.15)', 
          border: '1px solid rgba(34, 197, 94, 0.3)', 
          color: '#4ade80', 
          padding: '0.75rem 1rem', 
          borderRadius: '12px', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.88rem'
        }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.15)', 
          border: '1px solid rgba(239, 68, 68, 0.3)', 
          color: '#f87171', 
          padding: '0.75rem 1rem', 
          borderRadius: '12px', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="vp-card" style={{ 
          padding: '1.75rem', 
          textAlign: 'center', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '0.5rem',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(255, 255, 255, 0.08)'
        }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '50%', 
            background: 'rgba(34, 197, 94, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#22c55e',
            marginBottom: '0.25rem'
          }}>
            <CheckCircle size={24} />
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>
            {t('vendor_dashboard.no_unfinished_replacements') || 'No unfinished replacement requests'}
          </p>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
            All replacement and damaged item complaints are up to date.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {requests.map(req => {
            const statusLower = (req.status || '').toLowerCase()
            const isPending = statusLower === 'pending'
            const isApproved = statusLower === 'approved'
            const images = parseEvidenceImages(req)

            return (
              <div 
                key={req.id} 
                className="vp-card" 
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  gap: '1rem',
                  borderLeft: isPending ? '4px solid #f59e0b' : '4px solid #3b82f6'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
                          {req.orders?.users?.name || 'Customer'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Order: <strong style={{ color: '#e2e8f0' }}>#{req.orders?.order_number || req.order_id?.slice(0, 8)}</strong></span>
                        {req.orders?.users?.phone && <span>· {req.orders.users.phone}</span>}
                      </div>
                    </div>

                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      background: isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: isPending ? '#fbbf24' : '#60a5fa',
                      border: `1px solid ${isPending ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                    }}>
                      {isPending ? (t('replacements.status_pending') || 'Pending Review') : 
                       isApproved ? (t('replacements.status_approved') || 'Approved - In Progress') : req.status}
                    </span>
                  </div>

                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.03)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)', 
                    borderRadius: '10px', 
                    padding: '0.75rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>
                      {req.reason || 'Replacement Request'}
                    </div>
                    {req.description && (
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                        &quot;{req.description}&quot;
                      </p>
                    )}
                  </div>

                  {/* Items List */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.4rem' }}>
                      {t('replacements.requested_items') || 'Requested Items'}:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {req.replacement_items?.map((itm: any) => (
                        <div 
                          key={itm.id} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            fontSize: '0.82rem',
                            padding: '4px 8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '6px'
                          }}
                        >
                          <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
                            {itm.order_items?.items?.name || 'Item'}
                            {itm.order_items?.item_variants?.label && (
                              <span style={{ color: '#94a3b8', marginLeft: '4px' }}>
                                ({itm.order_items.item_variants.label})
                              </span>
                            )}
                          </span>
                          <span style={{ fontWeight: 700, color: '#60a5fa', fontSize: '0.8rem' }}>
                            Qty: {itm.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Photo Thumbnails */}
                  {images.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.35rem' }}>
                        {t('replacements.photo_proof') || 'Photo Proof'}:
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                        {images.map((img, idx) => (
                          <img 
                            key={idx}
                            src={img}
                            alt="Proof"
                            onClick={() => setActiveImagePreview(img)}
                            style={{ 
                              width: '48px', 
                              height: '48px', 
                              borderRadius: '8px', 
                              objectFit: 'cover', 
                              cursor: 'pointer',
                              border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <button 
                    onClick={() => handleOpenActionModal(req)}
                    className="vp-btn vp-btn-primary vp-btn-sm" 
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    {t('replacements.resolve_action') || 'Resolve Complaint'}
                  </button>
                  <Link 
                    href="/vendor/replacements" 
                    className="vp-btn vp-btn-outline vp-btn-sm" 
                    style={{ padding: '0.5rem 0.75rem' }}
                  >
                    <Eye size={16} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedReq && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{ 
            width: '100%', 
            maxWidth: '520px', 
            maxHeight: '90vh', 
            overflowY: 'auto', 
            padding: '1.5rem',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                {t('replacements.resolve_replacement_request') || 'Resolve Replacement Request'}
              </h3>
              <button 
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.6rem' }}>
                Select Decision:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setDecision('approve_next_shift')}
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${decision === 'approve_next_shift' ? '#3b82f6' : 'rgba(255,255,255,0.08)'}`,
                    background: decision === 'approve_next_shift' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: decision === 'approve_next_shift' ? '#93c5fd' : '#cbd5e1',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '8px', 
                      background: decision === 'approve_next_shift' ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                    }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>Approve & Deliver in Next Shift</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Replacement items will be batched for the next delivery shift</div>
                    </div>
                  </div>
                  {decision === 'approve_next_shift' && <Check size={18} color="#60a5fa" />}
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('approve_now')}
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${decision === 'approve_now' ? '#22c55e' : 'rgba(255,255,255,0.08)'}`,
                    background: decision === 'approve_now' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: decision === 'approve_now' ? '#86efac' : '#cbd5e1',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '8px', 
                      background: decision === 'approve_now' ? '#22c55e' : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                    }}>
                      <CheckCircle size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>Approve & Deliver Now</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Dispatches replacement items immediately for direct delivery</div>
                    </div>
                  </div>
                  {decision === 'approve_now' && <Check size={18} color="#4ade80" />}
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('reject')}
                  style={{
                    padding: '0.8rem 1rem',
                    borderRadius: '12px',
                    border: `1.5px solid ${decision === 'reject' ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
                    background: decision === 'reject' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: decision === 'reject' ? '#fca5a5' : '#cbd5e1',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '8px', 
                      background: decision === 'reject' ? '#ef4444' : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                    }}>
                      <XCircle size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff' }}>Reject Request with Reason</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Decline the replacement claim with customer explanation</div>
                    </div>
                  </div>
                  {decision === 'reject' && <Check size={18} color="#f87171" />}
                </button>
              </div>
            </div>

            {decision === 'reject' ? (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.4rem' }}>
                  Rejection Reason / Explanation (Required):
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {[
                    'Damage not visible in photos',
                    'Product already consumed',
                    'Outside return policy window',
                    'Item reported does not match order'
                  ].map(template => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => setRejectionReason(template)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: rejectionReason === template ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.04)',
                        color: '#fca5a5',
                        cursor: 'pointer'
                      }}
                    >
                      {template}
                    </button>
                  ))}
                </div>
                <textarea 
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this request is being rejected..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>
                  Seller Delivery Notes (Optional):
                </label>
                <textarea 
                  rows={2}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Add any specific instructions for the delivery or customer..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    color: '#fff',
                    fontSize: '0.85rem',
                    resize: 'vertical'
                  }}
                />
                <p style={{ margin: '6px 0 0', fontSize: '0.76rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  ℹ️ Once approved, the customer will confirm receipt of the replacement items upon delivery.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                onClick={handleCloseModal}
                className="vp-btn vp-btn-outline vp-btn-sm"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveResolution}
                className={`vp-btn ${decision === 'reject' ? 'vp-btn-danger' : 'vp-btn-primary'} vp-btn-sm`}
                style={{
                  background: decision === 'reject' ? '#ef4444' : undefined,
                  borderColor: decision === 'reject' ? '#ef4444' : undefined
                }}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : decision === 'reject' ? 'Reject Request' : 'Confirm & Send Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {activeImagePreview && (
        <div 
          onClick={() => setActiveImagePreview(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem',
            cursor: 'zoom-out'
          }}
        >
          <img 
            src={activeImagePreview} 
            alt="Proof enlarged" 
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  )
}

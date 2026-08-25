'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, User, Phone, CheckCircle, Clock, Truck, Box, XCircle, ChevronRight, Edit2, Check, X, CreditCard, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

type OrderItem = {
  id: string
  final_price: number
  estimated_price?: number
  status: string
  variant_type?: string
  requested_value?: number
  actual_value?: number
  items: { name: string } | null
  item_variants: { label: string; value?: number; unit_id?: string; image_url?: string | null } | null
}
type Order = {
  id: string
  status: string
  total_estimated_price?: number
  total_final_price?: number
  payment_type?: string
  delivery_date?: string
  delivery_slot?: string
  users: { name: string; phone: string } | null
  order_items: OrderItem[]
  order_number?: string | number
}

const STATUS_FLOW = ['pending', 'delivering', 'packing', 'delivered']
const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={16} />,
  delivering: <Truck size={16} />,
  packing: <Box size={16} />,
  delivered: <CheckCircle size={16} />,
}

function checkProcessingAllowed(deliveryDateStr: string | null, deliverySlot: string | null): { allowed: boolean; reason?: string } {
  if (!deliveryDateStr) return { allowed: true };
  
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const localTodayStr = `${year}-${month}-${day}`;
  
  const cleanedDeliveryDate = deliveryDateStr.split('T')[0];
  
  if (cleanedDeliveryDate !== localTodayStr) {
    return { 
      allowed: false, 
      reason: `This order is scheduled for delivery on ${new Date(cleanedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}. Updates are only allowed on the scheduled date.` 
    };
  }
  
  if (deliverySlot?.toLowerCase() === 'evening') {
    const currentHour = today.getHours();
    if (currentHour < 12) {
      return { 
        allowed: false, 
        reason: "Evening slot orders cannot be processed before 12:00 PM." 
      };
    }
  }
  
  return { allowed: true };
}

export default function OrderProcessingClient({ order: initial }: { order: Order }) {
  const { t, locale } = useTranslation()
  const [order, setOrder] = useState(initial)
  const [updating, setUpdating] = useState(false)
  const { allowed: isAllowed, reason: disallowedReason } = checkProcessingAllowed(order.delivery_date || null, order.delivery_slot || null)
  const [actualValues, setActualValues] = useState<Record<string, string>>({})
  const router = useRouter()

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('vendor_order_processing.status_pending')
      case 'delivering': return t('vendor_order_processing.status_delivering')
      case 'packing': return t('vendor_order_processing.status_completed_transaction')
      case 'delivered': return t('vendor_order_processing.status_delivered')
      case 'cancelled': return t('vendor_order_processing.status_cancelled')
      default: return status
    }
  }

  const [orderError, setOrderError] = useState<string | null>(null)

  async function updateOrderStatus(nextStatus: string) {
    setUpdating(true)
    setOrderError(null)
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_order_status', orderId: order.id, nextStatus })
      })
      const data = await res.json()
      if (data.error) {
        setOrderError(data.error)
        return
      }
      if (data.success && data.order) {
        setOrder(data.order)
      } else {
        const supabase = createClient()
        await supabase.from('orders').update({ status: nextStatus }).eq('id', order.id)
        setOrder(o => ({ ...o, status: nextStatus }))
      }

    } catch (err: any) {
      console.error('Failed to update order status:', err)
      setOrderError(err.message || 'Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  async function updatePaymentType(type: 'cod' | 'credit') {
    setUpdating(true)
    try {
      const res = await fetch('/api/vendor/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_payment_type', orderId: order.id, paymentType: type })
      })
      const data = await res.json()
      if (data.success && data.order) {
        setOrder(data.order)
      } else {
        const supabase = createClient()
        await supabase.from('orders').update({ payment_type: type }).eq('id', order.id)
        setOrder(o => ({ ...o, payment_type: type }))
      }
    } catch (err: any) {
      console.error('Failed to update payment type:', err)
      const supabase = createClient()
      await supabase.from('orders').update({ payment_type: type }).eq('id', order.id)
      setOrder(o => ({ ...o, payment_type: type }))
    } finally {
      setUpdating(false)
    }
  }

  async function updateItemStatus(item: OrderItem, newStatus: string) {
    setUpdating(true)
    try {
      const actualVal = actualValues[item.id] ? parseFloat(actualValues[item.id]) : undefined
      const res = await fetch('/api/vendor/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_item_status',
          orderId: order.id,
          itemId: item.id,
          newStatus,
          actualValue: actualVal
        })
      })
      const data = await res.json()
      if (data.success && data.order) {
        setOrder(data.order)
      } else {
        const supabase = createClient()
        let newFinalPrice = item.estimated_price ?? item.final_price
        let newActualValue = item.actual_value
        if (newStatus === 'rejected') {
          newFinalPrice = 0
        } else if (newStatus === 'adjusted') {
          const val = parseFloat(actualValues[item.id])
          if (!isNaN(val) && item.requested_value && item.estimated_price) {
            newActualValue = val
            newFinalPrice = Number(((val / item.requested_value) * item.estimated_price).toFixed(2))
          }
        } else if (newStatus === 'approved') {
          newFinalPrice = item.estimated_price ?? item.final_price
        }
        const updateData: any = { status: newStatus, final_price: newFinalPrice }
        if (newActualValue !== undefined) updateData.actual_value = newActualValue
        await supabase.from('order_items').update(updateData).eq('id', item.id)
        const updatedItems = order.order_items.map(oi => oi.id === item.id ? { ...oi, ...updateData } : oi)
        const newTotal = updatedItems.reduce((sum, oi) => sum + Number(oi.final_price), 0)
        await supabase.from('orders').update({ total_final_price: newTotal }).eq('id', order.id)
        setOrder(o => ({ ...o, order_items: updatedItems, total_final_price: newTotal }))
      }
    } catch (err: any) {
      console.error('Failed to update item status:', err)
    } finally {
      setUpdating(false)
    }
  }

  const currentIdx = STATUS_FLOW.indexOf(order.status)
  const nextStatus = STATUS_FLOW[currentIdx + 1]
  
  const isItemDynamic = (oi: OrderItem) => {
    const vType = oi.variant_type?.toLowerCase()
    return vType === 'dynamic' || vType === 'portion'
  }

  const unadjustedDynamicItems = order.order_items.filter(oi => {
    if (!isItemDynamic(oi) || oi.status === 'rejected') return false
    return oi.status !== 'adjusted' || oi.actual_value == null || Number(oi.actual_value) <= 0
  })
  const allDynamicItemsAdjusted = unadjustedDynamicItems.length === 0
  const allItemsProcessed = order.order_items.every(oi => oi.status !== 'pending')
  const canAdvanceStatus = !updating && isAllowed && (order.status !== 'pending' || allItemsProcessed) && allDynamicItemsAdjusted

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .vp-main {
          padding: 1.5rem 2rem !important;
        }
        .vp-card {
          padding: 1.25rem !important;
        }
        @media (max-width: 767px) {
          .vp-main { padding: 1rem !important; }
          .vp-card { padding: 1rem !important; }
        }
        @media (max-width: 600px) {
          .customer-card-wrap {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start !important;
          }
          .status-header-mobile {
            display: flex !important;
          }
          .status-step-label {
            display: none !important;
          }
          .order-item-row {
            flex-direction: column;
            align-items: stretch !important;
            gap: 0.75rem !important;
          }
          .order-item-details {
            width: 100%;
          }
          .order-item-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-align: left !important;
            border-top: 1px solid rgba(255,255,255,0.05);
            padding-top: 0.75rem;
            margin-top: 0.25rem;
            width: 100%;
          }
          .order-item-actions > div {
            margin-top: 0 !important;
          }
        }
      `}} />

      {!isAllowed && disallowedReason && (
        <div style={{ 
          padding: '1rem', 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          borderRadius: '16px', 
          color: '#fca5a5', 
          marginBottom: '1.5rem',
          textAlign: 'center',
          fontSize: '0.95rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{disallowedReason}</span>
        </div>
      )}
      {/* Customer */}
      <div className="vp-card customer-card-wrap" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <User size={24} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>{order.users?.name ?? t('vendor_order_processing.unknown_customer')}</p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.2rem' }}>
              <Phone size={14} /> {order.users?.phone ?? t('vendor_order_processing.no_phone')}
            </p>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.5rem', fontFamily: 'monospace' }}>
              {t('vendor_order_processing.order_number_prefix')} {order.order_number ? `#${order.order_number}` : `#${order.id.slice(0, 8)}`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <span className={`vp-badge vp-badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'info'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem' }}>
            {STATUS_ICONS[order.status] ?? <XCircle size={16} />}
            {getStatusLabel(order.status)}
          </span>
          {order.status === 'delivered' && (
            <a
              href={`/${locale}/orders/${order.id}/delivered`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#4ade80',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '0.3rem 0.75rem',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <span>View Delivered Celebration Page 📦🎉</span>
            </a>
          )}
        </div>
      </div>

      {/* Delivery Schedule */}
      {order.delivery_date && (
        <div className="vp-card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
          <h3 className="vp-title" style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} style={{ color: '#3b82f6' }} /> {t('vendor_order_processing.delivery_schedule')}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>
              {order.delivery_slot?.toLowerCase() === 'morning' ? '☀️' : '🌙'}
            </span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                {order.delivery_slot?.toLowerCase() === 'morning' 
                  ? t('vendor_order_processing.morning_slot') 
                  : t('vendor_order_processing.evening_slot')}
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                {t('vendor_order_processing.requested_for')} {new Date(order.delivery_date).toLocaleDateString(locale === 'ml' ? 'ml-IN' : locale === 'hi' ? 'hi-IN' : locale === 'ar' ? 'ar-EG' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status progress */}
      <div className="vp-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="status-header-mobile" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('purchase_history.status') || 'Status'}</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{getStatusLabel(order.status)}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {STATUS_FLOW.map((s, i) => {
            const isActive = i <= currentIdx
            const isCurrent = i === currentIdx
            return (
              <div key={s} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                <div style={{
                  height: 6, borderRadius: 3,
                  background: isActive ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                  marginBottom: '0.75rem',
                  boxShadow: isCurrent ? '0 0 10px rgba(59,130,246,0.5)' : 'none',
                  transition: 'all 0.3s ease'
                }} />
                <p className="status-step-label" style={{ 
                  fontSize: '0.75rem', 
                  color: isActive ? '#fff' : '#64748b', 
                  fontWeight: isActive ? 700 : 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: 0
                }}>
                  {getStatusLabel(s)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Items */}
      <h2 className="vp-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('vendor_order_processing.order_items')}</h2>
      <div className="vp-card" style={{ padding: 0, marginBottom: '1.5rem', overflow: 'hidden' }}>
        {order.order_items.map((oi, i) => {
          const isDynamic = isItemDynamic(oi)
          
          return (
            <div key={oi.id} className="order-item-row" style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem',
              borderBottom: i < order.order_items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
            }}>
              <div className="order-item-details" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {oi.item_variants?.image_url
                    ? <img src={oi.item_variants.image_url} alt={oi.items?.name ?? 'Item'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Package size={24} color="#94a3b8" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 600, color: '#fff', fontSize: '1.05rem', margin: 0 }}>{oi.items?.name ?? t('vendor_order_processing.item')}</p>
                    {isDynamic && (
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontWeight: 700 }}>
                        ⚖️ DYNAMIC (WEIGHT)
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                    {t('vendor_order_processing.requested')} <span style={{ color: '#e2e8f0' }}>{oi.requested_value ?? oi.item_variants?.value ?? 1} {oi.item_variants?.label ?? ''}</span>
                  </p>
                  {oi.actual_value && (
                    <p style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.2rem' }}>
                      {t('vendor_order_processing.actual_packed')} {oi.actual_value} {oi.item_variants?.label ?? ''}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="order-item-actions" style={{ textAlign: 'right', minWidth: 140 }}>
                {oi.status === 'rejected' ? (
                  <span style={{ fontWeight: 700, color: '#ef4444', textDecoration: 'line-through' }}>₹{oi.estimated_price}</span>
                ) : (
                  <>
                    {oi.estimated_price !== oi.final_price && oi.status !== 'pending' && (
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', textDecoration: 'line-through', marginRight: '0.5rem' }}>₹{oi.estimated_price}</span>
                    )}
                    <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>₹{oi.final_price}</span>
                  </>
                )}
                <div style={{ marginTop: '0.5rem' }}>
                  {isDynamic ? (
                    oi.status === 'rejected' ? (
                      <span className="vp-badge vp-badge-danger">REJECTED</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        {(order.status === 'pending' || order.status === 'delivering') && (
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <input 
                              type="number" 
                              step="any"
                              className="vp-input" 
                              style={{ width: 85, padding: '0.3rem 0.5rem', fontSize: '0.85rem', borderColor: oi.status === 'adjusted' ? '#10b981' : '#f59e0b' }} 
                              placeholder={t('vendor_order_processing.actual_qty_placeholder') || 'Actual Wt'}
                              value={actualValues[oi.id] ?? (oi.actual_value ? String(oi.actual_value) : '')}
                              onChange={e => setActualValues({ ...actualValues, [oi.id]: e.target.value })}
                              disabled={!isAllowed || updating}
                            />
                            <button 
                              onClick={() => updateItemStatus(oi, 'adjusted')} 
                              disabled={updating || (!actualValues[oi.id] && !oi.actual_value) || !isAllowed}
                              className="vp-btn vp-btn-primary vp-btn-sm" 
                              style={{ padding: '0.35rem 0.65rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              title={t('vendor_order_processing.adjust_price_tooltip') || 'Set price based on weight'}
                            >
                              <Edit2 size={13} />
                              <span style={{ fontSize: '0.75rem' }}>{oi.status === 'adjusted' ? 'Update' : 'Set Wt'}</span>
                            </button>
                            {order.status === 'pending' && (
                              <button 
                                onClick={() => updateItemStatus(oi, 'rejected')} 
                                disabled={updating || !isAllowed} 
                                className="vp-btn vp-btn-danger vp-btn-sm" 
                                style={{ padding: '0.35rem 0.5rem' }}
                                title={t('vendor_order_processing.reject') || 'Reject'}
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {oi.status !== 'adjusted' && (
                            <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>* Weight Required</span>
                          )}
                          <span className={`vp-badge vp-badge-${oi.status === 'adjusted' ? 'success' : 'warning'}`}>
                            {oi.status === 'adjusted' ? 'ADJUSTED' : 'PENDING WEIGHT'}
                          </span>
                        </div>
                      </div>
                    )
                  ) : (
                    /* Non-dynamic products */
                    order.status === 'pending' ? (
                      oi.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => updateItemStatus(oi, 'approved')} disabled={updating || !isAllowed} className="vp-btn vp-btn-success vp-btn-sm" style={{ padding: '0.3rem 0.6rem' }}><Check size={14} /> {t('vendor_order_processing.approve')}</button>
                          <button onClick={() => updateItemStatus(oi, 'rejected')} disabled={updating || !isAllowed} className="vp-btn vp-btn-danger vp-btn-sm" style={{ padding: '0.3rem 0.6rem' }}><X size={14} /> {t('vendor_order_processing.reject')}</button>
                        </div>
                      ) : (
                        <span className={`vp-badge vp-badge-${oi.status === 'rejected' ? 'danger' : 'success'}`}>
                          {getStatusLabel(oi.status).toUpperCase()}
                        </span>
                      )
                    ) : (
                      <span className={`vp-badge vp-badge-${oi.status === 'rejected' ? 'danger' : 'success'}`}>
                        {getStatusLabel(oi.status).toUpperCase()}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Totals */}
      <div className="vp-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ color: '#94a3b8' }}>{t('vendor_order_processing.estimated_subtotal')}</span>
          <span style={{ fontWeight: 500, color: '#fff' }}>₹{order.total_estimated_price ?? '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{t('vendor_order_processing.final_total')}</span>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#10b981' }}>₹{order.total_final_price ?? order.total_estimated_price ?? '—'}</span>
        </div>
      </div>

      {/* Payment Option Toggle */}
      {(order.status === 'delivering' || order.status === 'delivered') && (
        <div className="vp-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
          <h3 className="vp-title" style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} style={{ color: '#3b82f6' }} /> {t('vendor_order_processing.payment_settlement')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
            {t('vendor_order_processing.payment_settlement_desc')}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => updatePaymentType('cod')}
              disabled={updating || !isAllowed}
              className={`vp-btn ${order.payment_type === 'cod' || !order.payment_type ? 'vp-btn-success' : 'vp-btn-outline'}`}
              style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {(order.payment_type === 'cod' || !order.payment_type) && <Check size={16} />}
              💵 {t('vendor_order_processing.paid_cod')}
            </button>
            <button
              onClick={() => updatePaymentType('credit')}
              disabled={updating || !isAllowed}
              className={`vp-btn ${order.payment_type === 'credit' ? 'vp-btn-primary' : 'vp-btn-outline'}`}
              style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {order.payment_type === 'credit' && <Check size={16} />}
              💳 {t('vendor_order_processing.credit_pay_later')}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {orderError && (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#fca5a5', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{orderError}</span>
          </div>
        )}

        {order.status === 'pending' && !allItemsProcessed && (
           <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#fca5a5', textAlign: 'center', fontSize: '0.9rem' }}>
             {t('vendor_order_processing.approve_all_items_warning')}
           </div>
        )}

        {!allDynamicItemsAdjusted && (
          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', color: '#fcd34d', textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>⚖️ Price & weight editing is compulsory for dynamic products ({unadjustedDynamicItems.length} pending). Please enter actual packed weight before advancing order status.</span>
          </div>
        )}

        {order.status === 'packing' ? (
           <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', color: '#93c5fd', textAlign: 'center', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
             <Clock size={18} /> {t('vendor_order_processing.waiting_user_confirmation') || 'Transaction Completed. Waiting for Customer Confirmation.'}
           </div>
        ) : (
          nextStatus && order.status !== 'cancelled' && (
            <button
              id="advance-status-btn"
              className="vp-btn vp-btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', opacity: canAdvanceStatus ? 1 : 0.6 }}
              onClick={() => updateOrderStatus(nextStatus)}
              disabled={!canAdvanceStatus}
            >
              {updating ? (
                t('vendor_order_processing.updating')
              ) : order.status === 'pending' ? (
                t('vendor_order_processing.mark_as_delivering') || 'Set Out for Delivery'
              ) : order.status === 'delivering' ? (
                t('vendor_order_processing.mark_as_completed_transaction') || 'Complete Transaction'
              ) : (
                t('vendor_order_processing.mark_as').replace('{status}', getStatusLabel(nextStatus))
              )}
              {!updating && <ChevronRight size={20} />}
            </button>
          )
        )}

        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <button id="cancel-order-btn" className="vp-btn vp-btn-danger" style={{ width: '100%', padding: '1rem' }}
            onClick={() => {
              if (confirm('Are you sure you want to cancel this order?')) {
                updateOrderStatus('cancelled');
              }
            }} 
            disabled={updating || !isAllowed}
          >
            <XCircle size={18} /> {t('vendor_order_processing.cancel_order')}
          </button>
        )}
      </div>
    </div>
  )
}

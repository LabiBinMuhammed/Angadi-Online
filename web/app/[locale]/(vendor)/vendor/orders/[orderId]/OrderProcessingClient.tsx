'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, User, Phone, CheckCircle, Clock, Truck, Box, XCircle, ChevronRight, Edit2, Check, X, CreditCard } from 'lucide-react'
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

const STATUS_FLOW = ['pending', 'accepted', 'ready', 'out_for_delivery', 'delivered']
const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={16} />,
  accepted: <Box size={16} />,
  ready: <Package size={16} />,
  out_for_delivery: <Truck size={16} />,
  delivered: <CheckCircle size={16} />,
}

export default function OrderProcessingClient({ order: initial }: { order: Order }) {
  const { t, locale } = useTranslation()
  const [order, setOrder] = useState(initial)
  const [updating, setUpdating] = useState(false)
  const [actualValues, setActualValues] = useState<Record<string, string>>({})
  const router = useRouter()

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('vendor_order_processing.status_pending')
      case 'accepted': return t('vendor_order_processing.status_accepted')
      case 'ready': return t('vendor_order_processing.status_ready')
      case 'out_for_delivery': return t('vendor_order_processing.status_out_for_delivery')
      case 'delivered': return t('vendor_order_processing.status_delivered')
      case 'cancelled': return t('vendor_order_processing.status_cancelled')
      default: return status
    }
  }

  async function updateOrderStatus(nextStatus: string) {
    setUpdating(true)
    const supabase = createClient()
    await supabase.from('orders').update({ status: nextStatus }).eq('id', order.id)
    setOrder(o => ({ ...o, status: nextStatus }))
    setUpdating(false)
  }

  async function updatePaymentType(type: 'cod' | 'credit') {
    setUpdating(true)
    const supabase = createClient()
    await supabase.from('orders').update({ payment_type: type }).eq('id', order.id)
    setOrder(o => ({ ...o, payment_type: type }))
    setUpdating(false)
  }

  async function updateItemStatus(item: OrderItem, newStatus: string) {
    setUpdating(true)
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
    
    const updatedItems = order.order_items.map(oi => 
      oi.id === item.id ? { ...oi, ...updateData } : oi
    )
    
    const newTotal = updatedItems.reduce((sum, oi) => sum + Number(oi.final_price), 0)
    await supabase.from('orders').update({ total_final_price: newTotal }).eq('id', order.id)
    
    setOrder(o => ({ ...o, order_items: updatedItems, total_final_price: newTotal }))
    setUpdating(false)
  }

  const currentIdx = STATUS_FLOW.indexOf(order.status)
  const nextStatus = STATUS_FLOW[currentIdx + 1]
  
  const allItemsProcessed = order.order_items.every(oi => oi.status !== 'pending')

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Customer */}
      <div className="vp-card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
        <span className={`vp-badge vp-badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'info'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem' }}>
          {STATUS_ICONS[order.status] ?? <XCircle size={16} />}
          {getStatusLabel(order.status)}
        </span>
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
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: isActive ? '#fff' : '#64748b', 
                  fontWeight: isActive ? 700 : 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
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
          const variantTypeLower = oi.variant_type?.toLowerCase()
          const isDynamic = variantTypeLower === 'dynamic' || variantTypeLower === 'portion'
          
          return (
            <div key={oi.id} style={{ 
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', padding: '1.25rem 1.5rem',
              borderBottom: i < order.order_items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
            }}>
              <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {oi.item_variants?.image_url
                  ? <img src={oi.item_variants.image_url} alt={oi.items?.name ?? 'Item'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Package size={24} color="#94a3b8" />}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontWeight: 600, color: '#fff', fontSize: '1.05rem' }}>{oi.items?.name ?? t('vendor_order_processing.item')}</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                  {t('vendor_order_processing.requested')} <span style={{ color: '#e2e8f0' }}>{oi.requested_value ?? oi.item_variants?.value ?? 1} {oi.item_variants?.label ?? ''}</span>
                </p>
                {oi.actual_value && (
                  <p style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '0.2rem' }}>
                    {t('vendor_order_processing.actual_packed')} {oi.actual_value}
                  </p>
                )}
              </div>
              
              <div style={{ textAlign: 'right', minWidth: 120 }}>
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
                  {order.status === 'pending' ? (
                    oi.status === 'pending' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        {isDynamic && (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input 
                              type="number" 
                              className="vp-input" 
                              style={{ width: 80, padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} 
                              placeholder={t('vendor_order_processing.actual_qty_placeholder')}
                              value={actualValues[oi.id] ?? ''}
                              onChange={e => setActualValues({ ...actualValues, [oi.id]: e.target.value })}
                            />
                            <button 
                              onClick={() => updateItemStatus(oi, 'adjusted')} 
                              disabled={updating || !actualValues[oi.id]}
                              className="vp-btn vp-btn-primary vp-btn-sm" 
                              style={{ padding: '0.3rem 0.6rem' }}
                              title={t('vendor_order_processing.adjust_price_tooltip')}
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => updateItemStatus(oi, 'approved')} disabled={updating} className="vp-btn vp-btn-success vp-btn-sm" style={{ padding: '0.3rem 0.6rem' }}><Check size={14} /> {t('vendor_order_processing.approve')}</button>
                          <button onClick={() => updateItemStatus(oi, 'rejected')} disabled={updating} className="vp-btn vp-btn-danger vp-btn-sm" style={{ padding: '0.3rem 0.6rem' }}><X size={14} /> {t('vendor_order_processing.reject')}</button>
                        </div>
                      </div>
                    ) : (
                      <span className={`vp-badge vp-badge-${oi.status === 'rejected' ? 'danger' : oi.status === 'adjusted' ? 'warning' : 'success'}`}>
                        {getStatusLabel(oi.status).toUpperCase()}
                      </span>
                    )
                  ) : (
                    <span className={`vp-badge vp-badge-${oi.status === 'rejected' ? 'danger' : 'success'}`}>
                      {getStatusLabel(oi.status).toUpperCase()}
                    </span>
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
              disabled={updating}
              className={`vp-btn ${order.payment_type === 'cod' || !order.payment_type ? 'vp-btn-success' : 'vp-btn-outline'}`}
              style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {(order.payment_type === 'cod' || !order.payment_type) && <Check size={16} />}
              💵 {t('vendor_order_processing.paid_cod')}
            </button>
            <button
              onClick={() => updatePaymentType('credit')}
              disabled={updating}
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
        {order.status === 'pending' && !allItemsProcessed && (
           <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: '#fca5a5', textAlign: 'center', fontSize: '0.9rem' }}>
             {t('vendor_order_processing.approve_all_items_warning')}
           </div>
        )}

        {order.status === 'out_for_delivery' ? (
           <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', color: '#93c5fd', textAlign: 'center', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
             <Clock size={18} /> {t('vendor_order_processing.waiting_user_confirmation')}
           </div>
        ) : (
          nextStatus && order.status !== 'cancelled' && (
            <button
              id="advance-status-btn"
              className="vp-btn vp-btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
              onClick={() => updateOrderStatus(nextStatus)}
              disabled={updating || (order.status === 'pending' && !allItemsProcessed)}
            >
              {updating ? t('vendor_order_processing.updating') : order.status === 'pending' ? t('vendor_order_processing.accept_order_start_packing') : t('vendor_order_processing.mark_as').replace('{status}', getStatusLabel(nextStatus))}
              {!updating && <ChevronRight size={20} />}
            </button>
          )
        )}

        {order.status === 'pending' && (
          <button id="cancel-order-btn" className="vp-btn vp-btn-danger" style={{ width: '100%', padding: '1rem' }}
            onClick={() => updateOrderStatus('cancelled')} disabled={updating}>
            <XCircle size={18} /> {t('vendor_order_processing.cancel_order')}
          </button>
        )}
      </div>
    </div>
  )
}

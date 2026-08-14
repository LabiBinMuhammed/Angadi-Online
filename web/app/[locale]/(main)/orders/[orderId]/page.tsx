import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { Order, OrderItem, OrderAddress } from '@/types'
import { ArrowLeft, Clock, Package, Truck, CheckCircle2, XCircle, MapPin, CreditCard, ShoppingBag, Receipt, MessageSquare } from 'lucide-react'
import MarkAsDeliveredButton from '@/components/MarkAsDeliveredButton'
import CancelOrderButton from '@/components/CancelOrderButton'
import BackButton from '@/components/BackButton'
import LoyaltyRewardTracker from '@/components/LoyaltyRewardTracker'

type Props = { params: Promise<{ locale: string; orderId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params
  return { title: `Order ${orderId.slice(0, 8).toUpperCase()}` }
}

const STATUS_MAP: Record<string, { bg: string; color: string; label: string; Icon: any }> = {
  pending:    { bg: 'var(--status-pending-bg)', color: '#f59e0b', label: 'Order Placed', Icon: Clock },
  packing:    { bg: 'var(--status-packing-bg)', color: '#0ea5e9', label: 'Preparing',    Icon: Package },
  out_for_delivery: { bg: 'var(--status-packing-bg)', color: '#0ea5e9', label: 'On the way', Icon: Truck },
  delivered:  { bg: 'var(--status-delivered-bg)', color: '#22c55e', label: 'Delivered',  Icon: CheckCircle2 },
  cancelled:  { bg: 'var(--status-cancelled-bg)', color: '#ef4444', label: 'Cancelled',  Icon: XCircle },
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export default async function OrderDetailPage({ params }: Props) {
  const { locale, orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const [{ data: order }, { data: orderItems }, { data: address }, { data: review }, { data: replacements }] = await Promise.all([
    supabaseAdmin
      .from('orders')
      .select('*, shops(name)')
      .eq('id', orderId)
      .maybeSingle(),
    supabaseAdmin
      .from('order_items')
      .select('*, items(name), item_variants(label, price)')
      .eq('order_id', orderId),
    supabaseAdmin.from('order_addresses').select('*').eq('order_id', orderId).maybeSingle(),
    supabaseAdmin.from('shop_reviews').select('id').eq('order_id', orderId).maybeSingle(),
    supabaseAdmin
      .from('replacement_requests')
      .select('*, replacement_items(*, order_items(*, items(name))))')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
  ])

  if (!order) notFound()

  const o     = order as Order & { shops: { name: string; return_window_hours: number; replacement_enabled: boolean } | null }
  const items = (orderItems ?? []) as (OrderItem & {
    items: { name: string }
    item_variants: { label: string; price: number }
  })[]
  const addr  = address as OrderAddress | null

  const st = STATUS_MAP[o.status] ?? { bg: 'var(--bg-muted)', color: 'var(--text-muted)', label: o.status, Icon: Package }
  const StatusIcon = st.Icon

  const deliveredAt = new Date(o.updated_at).getTime()
  const windowHours = o.shops?.return_window_hours ?? 24
  const windowMs = windowHours * 60 * 60 * 1000
  const isEligibleForReplacement = o.status === 'delivered' && (Date.now() - deliveredAt <= windowMs)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: var(--bg-base); }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-base); transition: all 0.2s; }
        .title { font-size: 24px; font-weight: 800; color: var(--text-base); margin: 0; letter-spacing: -0.5px; }
        .header-status { background: var(--bg-surface); padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }

        .card { background: var(--bg-surface); border-radius: 24px; padding: 24px; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        .card-title { font-size: 18px; font-weight: 800; color: var(--text-base); margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        
        .info-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-label { font-size: 13px; color: var(--text-light); font-weight: 600; margin: 0; }
        .info-val { font-size: 15px; font-weight: 700; color: var(--text-base); margin: 0; }

        .item-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 0; border-bottom: 1px dashed var(--border); }
        .item-row:last-child { border-bottom: none; }
        .item-name { font-size: 15px; font-weight: 700; color: var(--text-base); margin: 0 0 4px; }
        .item-meta { font-size: 13px; color: var(--text-muted); font-weight: 500; margin: 0; }
        .item-price { font-size: 15px; font-weight: 800; color: var(--text-base); margin: 0; text-align: right; }
        
        .total-row { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--border); margin-top: 8px; }
        .total-label { font-size: 18px; font-weight: 800; color: var(--text-base); }
        .total-val { font-size: 24px; font-weight: 900; color: var(--wa-green); }
        
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
        .badge-pending { background: #fef3c7; color: #d97706; }
        .badge-approved { background: #dbeafe; color: #2563eb; }
        .badge-completed { background: #d1fae5; color: #059669; }
        .badge-rejected { background: #fee2e2; color: #dc2626; }
        .badge-cancelled { background: var(--bg-muted); color: var(--text-muted); }
      `}} />

      <div className="page-container">
        <div className="header">
          <div className="header-left">
            <BackButton fallbackHref={`/${locale}/orders`}>
              <ArrowLeft size={20} />
            </BackButton>
            <h1 className="title">{o.order_number ? `#${o.order_number}` : `#${o.id.slice(0, 8).toUpperCase()}`}</h1>
          </div>
          <div className="header-status" style={{ color: st.color }}>
            {st.label}
          </div>
        </div>

        <div className="card" style={{ background: 'linear-gradient(135deg, #1e4d1e, #2b5a2b)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <StatusIcon size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>{o.shops?.name}</h2>
              <p style={{ fontSize: '14px', color: '#b5deb5', margin: 0, fontWeight: 500 }}>
                {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(o.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {o.status === 'delivered' && !review && (
          <div className="card" style={{ border: '1px solid var(--wa-green)', background: 'var(--wa-green-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MessageSquare size={24} color="var(--wa-green-dark)" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-base)' }}>How was your order?</h3>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Share your experience and rate the shop for this order.</p>
              </div>
            </div>
            <Link href={`/${locale}/orders/${o.id}/review`} className="submit-btn" style={{ textDecoration: 'none', margin: '8px 0 0', textAlign: 'center' }}>
              Write a Review
            </Link>
          </div>
        )}

        {isEligibleForReplacement && (
          <div className="card" style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Receipt size={24} color="var(--text-light)" style={{ flexShrink: 0 }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-base)' }}>Need Help?</h3>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  If you received incorrect, damaged, or poor quality items, you can request a replacement.
                </p>
              </div>
            </div>
            <Link 
              href={`/${locale}/orders/${o.id}/replacement`} 
              className="submit-btn" 
              style={{ 
                textDecoration: 'none', 
                margin: '8px 0 0', 
                textAlign: 'center', 
                background: 'var(--bg-surface)', 
                border: '1px solid var(--border)', 
                color: 'var(--text-base)', 
                boxShadow: 'none' 
              }}
            >
              Need Help?
            </Link>
          </div>
        )}

        {o.status === 'out_for_delivery' && (
          <div className="card" style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-base)' }}>Confirm Delivery</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Has your order arrived? Please click the button below to confirm receipt of the delivery.</p>
            <MarkAsDeliveredButton orderId={o.id} />
          </div>
        )}

        {o.status === 'pending' && (
          <div className="card" style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-base)' }}>Cancel Order</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>You can cancel this order as long as it has not been accepted by the shop.</p>
            <CancelOrderButton orderId={o.id} />
          </div>
        )}

        {/* 5-Star Rewards Club Loyalty Tracker & Scratch Card */}
        <LoyaltyRewardTracker
          orderAmount={Number(o.total_final_price ?? o.total_estimated_price ?? 0)}
          orderStatus={o.status}
          orderId={o.id}
        />

        {replacements && replacements.length > 0 && (
          <div className="card">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={20} color="#3b82f6" /> Replacement Requests
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {replacements.map((req: any) => {
                const statusClasses: Record<string, string> = {
                  Pending: 'badge-pending',
                  Approved: 'badge-approved',
                  Completed: 'badge-completed',
                  Rejected: 'badge-rejected',
                  Cancelled: 'badge-cancelled'
                }
                return (
                  <div key={req.id} style={{ borderBottom: '1px dashed var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-base)' }}>
                        Request #{req.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`status-badge ${statusClasses[req.status] || ''}`} style={{ margin: 0 }}>
                        {req.status}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Reason: <strong style={{ color: 'var(--text-base)' }}>{req.reason}</strong>
                    </p>
                    {req.description && (
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        Details: {req.description}
                      </p>
                    )}
                    {(() => {
                      const imgs = req.customer_images || req.proof_images || []
                      const images = Array.isArray(imgs) ? imgs : typeof imgs === 'string' && imgs.startsWith('http') ? [imgs] : []
                      if (images.length === 0) return null
                      return (
                        <div style={{ marginTop: '12px' }}>
                          <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evidence Photos</p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {images.map((img: string, idx: number) => (
                              <img key={idx} src={img} alt="evidence" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                            ))}
                          </div>
                        </div>
                      )
                    })()}
                    <div style={{ marginTop: '12px', background: 'var(--bg-base)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <p style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Items Requested</p>
                      {req.replacement_items?.map((ri: any) => (
                        <div key={ri.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', color: 'var(--text-base)', fontWeight: 600 }}>
                          <span>{ri.order_items?.items?.name}</span>
                          <span style={{ color: 'var(--wa-green)' }}>Qty: {ri.quantity}</span>
                        </div>
                      ))}
                    </div>
                    {req.notes && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.15)', fontSize: '13px', lineHeight: 1.4, color: 'var(--text-base)' }}>
                        <strong>Seller Note:</strong> {req.notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {o.delivery_date && (
          <div className="card">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={20} color="#0ea5e9" /> Delivery Schedule</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>
                {o.delivery_slot?.toLowerCase() === 'morning' ? '☀️' : '🌙'}
              </span>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: '15px' }}>
                  {o.delivery_slot ? o.delivery_slot.charAt(0).toUpperCase() + o.delivery_slot.slice(1) : ''} Slot ({o.delivery_slot?.toLowerCase() === 'morning' ? '7 AM - 12 PM' : '4 PM - 8 PM'})
                </p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-light)', fontWeight: 500 }}>
                  On {new Date(o.delivery_date).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="card-title"><CreditCard size={20} color="#4cd964" /> Payment Details</h2>
          <div className="info-row">
            <p className="info-label">Payment Method</p>
            <p className="info-val">
              {o.payment_type === 'credit' ? 'Pay Later' : o.payment_type === 'cod' ? 'Cash on Delivery' : 'Cash on Delivery'}
            </p>
          </div>
        </div>

        {addr && (
          <div className="card">
            <h2 className="card-title"><MapPin size={20} color="#3b82f6" /> Delivery Address</h2>
            <div className="info-row">
              <p className="info-label">Contact</p>
              <p className="info-val">{addr.contact_name} · {addr.contact_phone}</p>
            </div>
            <div className="info-row" style={{ marginTop: '12px' }}>
              <p className="info-label">Address</p>
              <p className="info-val" style={{ fontWeight: 500 }}>{addr.address_line_1}</p>
              {addr.address_line_2 && <p className="info-val" style={{ fontWeight: 500 }}>{addr.address_line_2}</p>}
              {addr.landmark && <p className="info-val" style={{ color: 'var(--text-muted)' }}>Near {addr.landmark}</p>}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="card-title"><Receipt size={20} color="#f59e0b" /> Order Summary</h2>
          
          <div style={{ marginBottom: '16px' }}>
            {items.map((oi) => (
              <div key={oi.id} className="item-row">
                <div style={{ flex: 1, paddingRight: '16px' }}>
                  <p className="item-name">{oi.items?.name}</p>
                  <p className="item-meta">{oi.item_variants?.label} × {oi.requested_value || 1}</p>
                  {oi.status !== 'approved' && oi.status !== 'pending' && (
                    <span className="status-badge" style={{ background: oi.status === 'rejected' ? 'var(--status-cancelled-bg)' : 'var(--status-pending-bg)', color: oi.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>
                      {oi.status}
                    </span>
                  )}
                </div>
                <div>
                  <p className="item-price">₹ {Number(oi.final_price).toFixed(0)}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="total-row">
            <span className="total-label">Total</span>
            <span className="total-val">
              ₹ {Number(o.total_final_price ?? o.total_estimated_price ?? 0).toFixed(0)}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

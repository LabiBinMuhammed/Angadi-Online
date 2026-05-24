import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Order, OrderItem, OrderAddress } from '@/types'
import { ArrowLeft, Clock, Package, Truck, CheckCircle2, XCircle, MapPin, CreditCard, ShoppingBag, Receipt } from 'lucide-react'

type Props = { params: Promise<{ orderId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params
  return { title: `Order ${orderId.slice(0, 8).toUpperCase()}` }
}

const STATUS_MAP: Record<string, { bg: string; color: string; label: string; Icon: any }> = {
  pending:    { bg: '#fff8e6', color: '#f59e0b', label: 'Order Placed', Icon: Clock },
  packing:    { bg: '#e0f2fe', color: '#0ea5e9', label: 'Preparing',    Icon: Package },
  delivering: { bg: '#e0f2fe', color: '#0ea5e9', label: 'On the way', Icon: Truck },
  delivered:  { bg: '#dcfce7', color: '#22c55e', label: 'Delivered',  Icon: CheckCircle2 },
  cancelled:  { bg: '#fee2e2', color: '#ef4444', label: 'Cancelled',  Icon: XCircle },
}

export default async function OrderDetailPage({ params }: Props) {
  const { orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: order }, { data: orderItems }, { data: address }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, shops(name)')
      .eq('id', orderId)
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('order_items')
      .select('*, items(name), item_variants(label, price)')
      .eq('order_id', orderId),
    supabase.from('order_addresses').select('*').eq('order_id', orderId).single(),
  ])

  if (!order) notFound()

  const o     = order as Order & { shops: { name: string } | null }
  const items = (orderItems ?? []) as (OrderItem & {
    items: { name: string }
    item_variants: { label: string; price: number }
  })[]
  const addr  = address as OrderAddress | null

  const st = STATUS_MAP[o.status] ?? { bg: '#f5f5f5', color: '#666', label: o.status, Icon: Package }
  const StatusIcon = st.Icon

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: #fafafa; }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; background: #fff; border: 1px solid #eaeaea; display: flex; align-items: center; justify-content: center; color: #1a1a1a; transition: all 0.2s; }
        .title { font-size: 24px; font-weight: 800; color: #1e4d1e; margin: 0; letter-spacing: -0.5px; }
        .header-status { background: #fff; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }

        .card { background: #fff; border-radius: 24px; padding: 24px; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
        .card-title { font-size: 18px; font-weight: 800; color: #1a1a1a; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        
        .info-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-label { font-size: 13px; color: #999; font-weight: 600; margin: 0; }
        .info-val { font-size: 15px; font-weight: 700; color: #1a1a1a; margin: 0; }

        .item-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 0; border-bottom: 1px dashed #eaeaea; }
        .item-row:last-child { border-bottom: none; }
        .item-name { font-size: 15px; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; }
        .item-meta { font-size: 13px; color: #777; font-weight: 500; margin: 0; }
        .item-price { font-size: 15px; font-weight: 800; color: #1a1a1a; margin: 0; text-align: right; }
        
        .total-row { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #eaeaea; margin-top: 8px; }
        .total-label { font-size: 18px; font-weight: 800; color: #1a1a1a; }
        .total-val { font-size: 24px; font-weight: 900; color: #4cd964; }
        
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
      `}} />

      <div className="page-container">
        <div className="header">
          <div className="header-left">
            <Link href="/orders" className="back-btn">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="title">#{o.id.slice(0, 8).toUpperCase()}</h1>
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
              {addr.landmark && <p className="info-val" style={{ color: '#666' }}>Near {addr.landmark}</p>}
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
                    <span className="status-badge" style={{ background: oi.status === 'rejected' ? '#fee2e2' : '#fef3c7', color: oi.status === 'rejected' ? '#ef4444' : '#d97706' }}>
                      {oi.status}
                    </span>
                  )}
                </div>
                <div>
                  <p className="item-price">$ {oi.final_price}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="total-row">
            <span className="total-label">Total</span>
            <span className="total-val">
              $ {o.total_final_price ?? o.total_estimated_price ?? '0'}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

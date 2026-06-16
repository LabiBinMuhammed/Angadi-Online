import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package } from 'lucide-react'

export const metadata: Metadata = { title: 'Order Detail (Admin)' }

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, users(name, phone), shops(name), order_items(*, items(name), item_variants:vw_item_variants_with_fallback(label, value, image_url))')
    .eq('id', orderId)
    .single()

  if (!order) notFound()
  const o = order as any

  const STATUS_COLORS: Record<string, string> = {
    pending: 'badge-warning',
    accepted: 'badge-info',
    ready: 'badge-info',
    out_for_delivery: 'badge-info',
    delivered: 'badge-success',
    cancelled: 'badge-danger',
  }

  const capitalizedSlot = o.delivery_slot ? o.delivery_slot.charAt(0).toUpperCase() + o.delivery_slot.slice(1) : ''

  return (
    <>
      <Link href="/admin/orders" className="btn btn-ghost btn-sm" id="back-admin-orders" style={{ marginBottom: '1rem' }}>← All Orders</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="panel-page-title" style={{ marginBottom: '.15rem' }}>
            {o.order_number ? `Order #${o.order_number}` : `Order #${orderId.slice(0, 8)}`}
          </h1>
          <p className="text-muted text-sm">{new Date(o.created_at).toLocaleString('en-IN')}</p>
        </div>
        <span className={`badge ${STATUS_COLORS[o.status] ?? 'badge-neutral'}`} style={{ fontSize: '.85rem', padding: '.35rem .8rem' }}>
          {o.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', maxWidth: 640, marginBottom: '1.5rem' }}>
        <div className="card card-body">
          <p className="text-sm text-muted">Customer</p>
          <p className="font-semibold">{o.users?.name ?? '—'}</p>
          <p className="text-sm">{o.users?.phone}</p>
        </div>
        <div className="card card-body">
          <p className="text-sm text-muted">Shop</p>
          <p className="font-semibold">{o.shops?.name ?? '—'}</p>
          <p className="text-sm">{o.payment_type?.toUpperCase() || 'PENDING'} payment</p>
        </div>
        {o.delivery_date && (
          <div className="card card-body">
            <p className="text-sm text-muted">Delivery Schedule</p>
            <p className="font-semibold">{capitalizedSlot} Slot</p>
            <p className="text-sm">On {new Date(o.delivery_date).toLocaleDateString('en-GB')}</p>
          </div>
        )}
      </div>

      <h2 className="font-semibold" style={{ marginBottom: '.75rem' }}>Items</h2>
      <div className="wa-list" style={{ marginBottom: '1.5rem' }}>
        {(o.order_items ?? []).map((oi: any) => (
          <div key={oi.id} className="wa-list-item" style={{ cursor: 'default' }}>
            <div className="wa-avatar" style={{ background: 'var(--neutral-100)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              {oi.item_variants?.image_url
                ? <img src={oi.item_variants.image_url} alt={oi.items?.name || 'Item'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Package size={20} />}
            </div>
            <div className="wa-item-body">
              <p className="wa-item-title">{oi.items?.name ?? 'Item'}</p>
              <p className="wa-item-sub">{oi.item_variants?.label} {oi.item_variants?.value} · {oi.status}</p>
            </div>
            <div className="wa-item-right">
              <span className="font-semibold">₹{oi.final_price}</span>
              {oi.estimated_price !== oi.final_price && (
                <span className="text-sm text-muted" style={{ textDecoration: 'line-through' }}>₹{oi.estimated_price}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card card-body" style={{ maxWidth: 400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="text-muted">Estimated</span><span>₹{o.total_estimated_price ?? '—'}</span></div>
        <hr className="divider" style={{ margin: '.75rem 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span className="font-bold">Final Total</span><span className="font-bold" style={{ color: 'var(--wa-green-dark)' }}>₹{o.total_final_price ?? '—'}</span></div>
      </div>
    </>
  )
}

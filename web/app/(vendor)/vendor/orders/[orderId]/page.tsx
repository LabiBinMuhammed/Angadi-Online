import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OrderProcessingClient from './OrderProcessingClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Process Order' }

export default async function OrderProcessingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, users(name, phone), order_items(*, items(name), item_variants:vw_item_variants_with_fallback(label, value, unit_id, image_url))')
    .eq('id', orderId)
    .single()

  if (!order) notFound()

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="vp-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <Link href="/vendor/orders" className="vp-btn vp-btn-outline vp-btn-sm" style={{ marginBottom: '1rem', display: 'inline-flex', padding: '0.4rem 0.8rem' }}>
            <ArrowLeft size={16} /> Back to Orders
          </Link>
          <h1 className="vp-title">Process Order</h1>
          <p className="vp-subtitle">Order #{orderId.slice(0, 8)}</p>
        </div>
      </div>
      <OrderProcessingClient order={order as any} />
    </div>
  )
}

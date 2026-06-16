import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OrderProcessingClient from './OrderProcessingClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../../messages/en.json')
  }
  const t = (key: string) => {
    const parts = key.split('.')
    let curr = messages as any
    for (const part of parts) {
      if (!curr) return key
      curr = curr[part]
    }
    return typeof curr === 'string' ? curr : key
  }
  return { title: `${t('vendor_dashboard.vendor_manage_orders_title') || 'Process Order'} — ${t('vendor_dashboard.vendor_panel_title') || 'Vendor Panel'}` }
}

export default async function OrderProcessingPage({ params }: { params: Promise<{ orderId: string; locale: string }> }) {
  const { orderId, locale } = await params
  const supabase = await createClient()

  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages: any = {}
  try {
    messages = require(`../../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../../messages/en.json')
  }
  const t = (key: string) => {
    const parts = key.split('.')
    let curr = messages
    for (const part of parts) {
      if (!curr) return key
      curr = curr[part]
    }
    if (typeof curr === 'string') return curr
    try {
      const enMessages = require('../../../../../../messages/en.json')
      let fallback = enMessages
      for (const part of parts) {
        if (!fallback) return key
        fallback = fallback[part]
      }
      if (typeof fallback === 'string') return fallback
    } catch (e) {}
    return key
  }

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
            <ArrowLeft size={16} /> {t('checkout.back') || 'Back'}
          </Link>
          <h1 className="vp-title">{t('vendor_dashboard.vendor_manage_orders_title') || 'Process Order'}</h1>
          <p className="vp-subtitle">{t('purchase_history.order_id') || 'Order'} {order.order_number ? `#${order.order_number}` : `#${orderId.slice(0, 8)}`}</p>
        </div>
      </div>
      <OrderProcessingClient order={order as any} />
    </div>
  )
}

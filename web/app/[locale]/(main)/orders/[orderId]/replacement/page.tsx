import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReplacementRequestClient from './ReplacementRequestClient'

type Props = { params: Promise<{ locale: string; orderId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params
  return { title: `Replacement Request - Order ${orderId.slice(0, 8).toUpperCase()}` }
}

export default async function ReplacementPage({ params }: Props) {
  const { locale, orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Fetch order details with shop settings
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .select('*, shops(name, replacement_enabled, return_window_hours, replacement_policy)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (orderErr || !order) {
    notFound()
  }

  // Verify status is delivered
  if (order.status !== 'delivered') {
    redirect(`/${locale}/orders/${orderId}`)
  }

  const o = order as any

  // Verify replacement is enabled for the shop
  if (o.shops?.replacement_enabled === false) {
    redirect(`/${locale}/orders/${orderId}?error=replacement_disabled`)
  }

  // Verify replacement window has not expired
  const deliveredAt = new Date(o.updated_at).getTime()
  const windowHours = o.shops?.return_window_hours ?? 24
  const windowMs = windowHours * 60 * 60 * 1000
  const isExpired = Date.now() - deliveredAt > windowMs

  if (isExpired) {
    redirect(`/${locale}/orders/${orderId}?error=window_expired`)
  }

  // Fetch order items with variant details
  const { data: orderItems, error: itemsErr } = await supabase
    .from('order_items')
    .select('*, items(name), item_variants(label)')
    .eq('order_id', orderId)

  if (itemsErr || !orderItems || orderItems.length === 0) {
    notFound()
  }

  return (
    <ReplacementRequestClient
      order={o}
      orderItems={orderItems as any[]}
      locale={locale}
    />
  )
}

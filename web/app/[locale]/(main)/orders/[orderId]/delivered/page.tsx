import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderDeliveredClient from './OrderDeliveredClient'

export const metadata: Metadata = {
  title: 'Order Delivered — Angadi Online'
}

export default async function OrderDeliveredPage({
  params
}: {
  params: Promise<{ orderId: string; locale: string }>
}) {
  const supabase = await createClient()
  const { orderId } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch order details safely using existing schema columns
  let orderData = null
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, total_final_price, total_estimated_price, payment_type, created_at, shops(name)')
      .eq('id', orderId)
      .maybeSingle()

    if (!error && order) {
      orderData = {
        id: order.id,
        status: order.status,
        total_amount: order.total_final_price ?? order.total_estimated_price ?? 0,
        payment_method: order.payment_type,
        created_at: order.created_at,
        shops: order.shops
      }
    }
  } catch (err) {
    console.error('Error loading order delivered details:', err)
  }

  return (
    <OrderDeliveredClient
      orderId={orderId}
      order={orderData as any}
    />
  )
}

import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrderSuccessClient from './OrderSuccessClient'

export const metadata: Metadata = {
  title: 'Order Confirmed — Angadi Online'
}

export default async function OrderSuccessPage({
  params
}: {
  params: Promise<{ orderId: string; locale: string }>
}) {
  const supabase = await createClient()
  const { orderId } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch order details
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total_amount, payment_method, created_at, shops(name)')
    .eq('id', orderId)
    .maybeSingle()

  return (
    <OrderSuccessClient
      orderId={orderId}
      order={order as any}
    />
  )
}

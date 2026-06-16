import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LeaveReviewClient from './LeaveReviewClient'

type Props = { params: Promise<{ locale: string; orderId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params
  return { title: `Review Order ${orderId.slice(0, 8).toUpperCase()}` }
}

export default async function LeaveReviewPage({ params }: Props) {
  const { locale, orderId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Fetch the order
  const { data: order } = await supabase
    .from('orders')
    .select('*, shops(name)')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) {
    notFound()
  }

  // Verify status is delivered
  if (order.status !== 'delivered') {
    redirect(`/${locale}/orders/${orderId}`)
  }

  // Check if already reviewed
  const { data: existingReview } = await supabase
    .from('shop_reviews')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existingReview) {
    redirect(`/${locale}/orders/${orderId}`)
  }

  const o = order as any

  return (
    <LeaveReviewClient
      orderId={orderId}
      shopId={o.shop_id}
      shopName={o.shops?.name || 'Shop'}
      userId={user.id}
    />
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PurchaseHistoryClient from './PurchaseHistoryClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../messages/en.json')
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

  return {
    title: t('purchase_history.title'),
    description: t('purchase_history.no_history'),
  }
}

export default async function PurchaseHistoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Fetch Orders List
  const { data: ordersData } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      total_final_price,
      created_at,
      payment_type,
      shops(name),
      order_items(
        id,
        requested_value,
        final_price,
        items(
          name,
          categories(name)
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const orders = (ordersData || []).map((o: any) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    total_final_price: Number(o.total_final_price || 0),
    created_at: o.created_at,
    payment_type: o.payment_type,
    shops: o.shops,
    order_items: (o.order_items || []).map((oi: any) => ({
      id: oi.id,
      requested_value: Number(oi.requested_value || 0),
      final_price: Number(oi.final_price || 0),
      items: oi.items ? {
        name: oi.items.name,
        categories: oi.items.categories ? { name: oi.items.categories.name } : null
      } : null
    }))
  }))

  // 2. Fetch Stats via RPC (with safe fallback)
  let stats = {
    total_orders: 0,
    total_spent: 0.0,
    favorite_shop_name: 'N/A',
    favorite_category_name: 'N/A'
  }

  try {
    const { data: statsData, error: statsError } = await supabase.rpc('get_purchase_history_stats', {
      p_user_id: user.id,
      p_date_filter: 'all'
    })

    if (!statsError && statsData && statsData.length > 0) {
      const s = statsData[0]
      stats = {
        total_orders: Number(s.total_orders || 0),
        total_spent: Number(s.total_spent || 0),
        favorite_shop_name: s.favorite_shop_name || 'N/A',
        favorite_category_name: s.favorite_category_name || 'N/A'
      }
    }
  } catch (err) {
    console.error('Failed to fetch purchase history stats RPC:', err)
  }

  return <PurchaseHistoryClient initialOrders={orders} initialStats={stats} />
}

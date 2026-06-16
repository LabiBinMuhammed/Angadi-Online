import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RecentPurchasesClient from './RecentPurchasesClient'

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
    title: t('recent_purchases.title'),
    description: t('recent_purchases.no_purchases'),
  }
}

export default async function RecentPurchasesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let purchases: any[] = []

  try {
    const { data, error } = await supabase.rpc('get_recent_purchases', {
      p_user_id: user.id,
      p_days: 3650, // Fetch 10 years to allow the 'All' date filter client-side
      p_limit: 100
    })

    if (!error && data) {
      purchases = data.map((item: any) => ({
        item_id: item.item_id,
        product_name: item.product_name,
        shop_id: item.shop_id,
        shop_name: item.shop_name,
        last_purchased_date: item.last_purchased_date,
        last_purchased_qty: Number(item.last_purchased_qty),
        last_purchased_price: Number(item.last_purchased_price),
        last_variant_id: item.last_variant_id,
        total_ordered_count: Number(item.total_ordered_count),
        image_url: item.image_url || null,
        is_active: item.is_active,
        has_variants: item.has_variants,
        item_status: item.item_status
      }))
    } else if (error) {
      console.error('Error fetching recent purchases:', error.message)
    }
  } catch (err) {
    console.error('Failed to invoke get_recent_purchases RPC:', err)
  }

  return <RecentPurchasesClient initialPurchases={purchases} />
}

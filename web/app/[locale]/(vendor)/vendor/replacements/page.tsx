import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VendorReplacementsClient from './VendorReplacementsClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../messages/en.json')
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
  return { title: `Replacement Manager — ${t('vendor_dashboard.vendor_panel_title') || 'Vendor Panel'}` }
}

export default async function VendorReplacementsPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Get vendor's shops
  const { data: shopOwners } = await supabase
    .from('shop_owners')
    .select('shop_id, shops(*)')
    .eq('user_id', user.id)
  
  const shopIds = shopOwners?.map(o => o.shop_id) || []
  const shops = shopOwners?.map(o => o.shops).filter(Boolean) || []

  // Fetch replacement requests for the vendor's shops
  // Include order details and user names
  const { data: requests, error } = shopIds.length > 0
    ? await supabase
        .from('replacement_requests')
        .select(`
          *,
          orders (
            order_number,
            users (
              name,
              phone
            )
          ),
          replacement_items (
            *,
            order_items (
              *,
              items (name),
              item_variants (label)
            )
          )
        `)
        .in('shop_id', shopIds)
        .order('created_at', { ascending: false })
    : { data: [], error: null }

  return (
    <VendorReplacementsClient
      initialRequests={requests as any[] || []}
      shops={shops as any[]}
      locale={locale}
    />
  )
}

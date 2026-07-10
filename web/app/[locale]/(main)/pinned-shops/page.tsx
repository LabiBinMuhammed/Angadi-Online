import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PinnedShopsClient from './PinnedShopsClient'

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
    title: t('pinned_shops.title'),
    description: t('pinned_shops.pin_prompt'),
  }
}

export default async function PinnedShopsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: pinned } = await supabase
    .from('customer_pinned_shops')
    .select('id, shop:shops(id, name, type)')
    .eq('user_id', user.id)

  const initialPinned = (pinned || []).map((item: any) => ({
    id: item.id,
    shop: {
      id: item.shop.id,
      name: item.shop.name,
      type: item.shop.type,
      logo_url: null,
    }
  }))

  return <PinnedShopsClient initialPinned={initialPinned} />
}

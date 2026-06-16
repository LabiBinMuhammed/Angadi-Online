import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CreditManagementClient from './CreditManagementClient'

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
  return { title: t('vendor_credit.credit_management_title') || 'Credit Management' }
}

export default async function CreditManagementPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages: any = {}
  try {
    messages = require(`../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../messages/en.json')
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
      const enMessages = require('../../../../../messages/en.json')
      let fallback = enMessages
      for (const part of parts) {
        if (!fallback) return key
        fallback = fallback[part]
      }
      if (typeof fallback === 'string') return fallback
    } catch (e) {}
    return key
  }

  const { data: shopOwners } = await supabase
    .from('shop_owners').select('shop_id').eq('user_id', user!.id)
  
  const shopIds = shopOwners?.map(o => o.shop_id) || []
  const primaryShopId = shopIds[0]

  const { data: credits } = shopIds.length > 0
    ? await supabase
        .from('shop_user_credit')
        .select('*, users(name, phone)')
        .in('shop_id', shopIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <>
      <div className="vp-header">
        <div>
          <h1 className="vp-title">{t('vendor_credit.credit_management_title')}</h1>
          <p className="vp-subtitle">{t('vendor_credit.credit_management_subtitle')}</p>
        </div>
      </div>
      <CreditManagementClient credits={(credits ?? []) as any[]} shopId={primaryShopId ?? ''} />
    </>
  )
}

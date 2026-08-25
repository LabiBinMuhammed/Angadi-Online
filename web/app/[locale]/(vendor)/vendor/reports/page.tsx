import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVendorReportDataAction } from './actions'
import { getDateRangeFromPreset } from './utils'
import VendorReportsClient from './VendorReportsClient'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages: any = {}
  try {
    messages = require(`../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../messages/en.json')
  }

  const title = messages?.vendor_reports?.page_title || 'Sales & Business Report'
  return {
    title: `${title} | Angadi Vendor`
  }
}

export default async function VendorReportsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ shopId?: string }>
}) {
  const { locale } = await params
  const { shopId: queryShopId } = await searchParams
  const supabase = await createClient()

  // 1. Authenticate User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/login?redirect=/${locale}/vendor/reports`)
  }

  // 2. Fetch User's Owned Shops
  const { data: shopOwners, error: shopError } = await supabase
    .from('shop_owners')
    .select('shop_id, shops(id, name, type)')
    .eq('user_id', user.id)

  const ownedShops = (shopOwners || [])
    .map(so => {
      const s = (so as any).shops
      return s ? { id: s.id as string, name: s.name as string } : null
    })
    .filter(Boolean) as { id: string; name: string }[]

  if (ownedShops.length === 0) {
    return (
      <div className="vp-card" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '3rem auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Shops Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          You need an active vendor shop to view sales and business performance reports.
        </p>
        <a href={`/${locale}/vendor/shop`} className="vp-btn vp-btn-primary">
          Create or Manage Shops
        </a>
      </div>
    )
  }

  // Determine active shop (from query param if valid or first owned shop)
  const activeShopId = (queryShopId && ownedShops.some(s => s.id === queryShopId))
    ? queryShopId
    : ownedShops[0].id

  // 3. Default Date Range: "This month"
  const { start, end } = getDateRangeFromPreset('this_month')

  // 4. Fetch Initial Report Data
  let initialReportData
  try {
    initialReportData = await getVendorReportDataAction(activeShopId, start, end, 'this_month')
  } catch (err: any) {
    console.error('Failed to load initial vendor report:', err)
    return (
      <div className="vp-card" style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '3rem auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171', marginBottom: '0.5rem' }}>Couldn't load report</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          {err.message || 'An error occurred while aggregating your business data.'}
        </p>
        <a href={`/${locale}/vendor/reports`} className="vp-btn vp-btn-primary">
          Retry
        </a>
      </div>
    )
  }

  return (
    <VendorReportsClient
      initialData={initialReportData}
      shops={ownedShops}
      locale={locale}
    />
  )
}

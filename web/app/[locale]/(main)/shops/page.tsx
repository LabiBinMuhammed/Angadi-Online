import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ShopsClient from './ShopsClient'
import type { Shop } from '@/types'

export const metadata: Metadata = { title: 'All Shops' }

export default async function ShopsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('shops')
    .select('id, name, type, location_id, created_at, updated_at, shop_subscription(restriction_level)')

  const activeShops = (data ?? []).filter((s: any) => !s.type?.endsWith('_inactive'))

  // Sort: push shops with restriction_level >= 2 to the bottom
  const sortedShops = [...activeShops].sort((a: any, b: any) => {
    const aLevel = (a.shop_subscription as any)?.restriction_level || 0
    const bLevel = (b.shop_subscription as any)?.restriction_level || 0
    
    if (aLevel >= 2 && bLevel < 2) return 1
    if (aLevel < 2 && bLevel >= 2) return -1
    return a.name.localeCompare(b.name)
  })

  return (
    <>
      <h1 className="text-2xl font-bold" style={{ marginBottom: '1.25rem' }}>All Shops</h1>
      <ShopsClient initialShops={sortedShops as Shop[]} />
    </>
  )
}

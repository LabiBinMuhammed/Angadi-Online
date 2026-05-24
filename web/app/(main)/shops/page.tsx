import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ShopsClient from './ShopsClient'
import type { Shop } from '@/types'

export const metadata: Metadata = { title: 'All Shops' }

export default async function ShopsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('shops')
    .select('id, name, type, location_id, created_at, updated_at')
    .order('name')

  return (
    <>
      <h1 className="text-2xl font-bold" style={{ marginBottom: '1.25rem' }}>All Shops</h1>
      <ShopsClient initialShops={(data ?? []) as Shop[]} />
    </>
  )
}

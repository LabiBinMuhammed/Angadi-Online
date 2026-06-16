import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShopProfileClient from './ShopProfileClient'

export const metadata: Metadata = { title: 'Shop Profile — Vendor Panel' }

export default async function ShopProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  /* Fetch all shops this vendor owns */
  const { data: ownerRows } = await supabase
    .from('shop_owners')
    .select('shop_id')
    .eq('user_id', user.id)

  let shops: any[] = []
  if (ownerRows && ownerRows.length > 0) {
    const shopIds = ownerRows.map((r: any) => r.shop_id)
    const { data } = await supabase
      .from('shops')
      .select('id, name, type, location_id, created_at, updated_at, locations(id, name)')
      .in('id', shopIds)
      .order('created_at', { ascending: false })
    shops = data || []
  }

  /* Fetch all locations for the dropdown */
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .order('name')

  return (
    <ShopProfileClient
      userId={user.id}
      shops={shops}
      locations={(locations ?? []) as { id: string; name: string }[]}
    />
  )
}

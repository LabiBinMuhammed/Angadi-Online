import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ShopManagementClient from './ShopManagementClient'

export const metadata: Metadata = { title: 'Shop Management' }

export default async function AdminShopsPage() {
  const supabase = await createClient()

  const [{ data: shops }, { data: users }, { data: locations }] = await Promise.all([
    supabase
      .from('shops')
      .select('id, name, type, created_at, shop_owners(users(name, phone)), locations(name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, name, phone, role')
      .neq('role', 'admin') // Typically admins don't own shops in this flow
      .order('name'),
    supabase
      .from('locations')
      .select('id, name')
      .order('name')
  ])

  return (
    <>
      <h1 className="panel-page-title">Shop Management</h1>
      <ShopManagementClient
        shops={(shops ?? []) as any[]}
        users={(users ?? []) as any[]}
        locations={(locations ?? []) as any[]}
      />
    </>
  )
}

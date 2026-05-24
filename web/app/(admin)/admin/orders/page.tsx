import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AdminOrdersClient from './AdminOrdersClient'

export const metadata: Metadata = { title: 'All Orders (Admin)' }

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('*, users(name, phone), shops(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <>
      <h1 className="panel-page-title">All Orders</h1>
      <AdminOrdersClient orders={(data ?? []) as any[]} />
    </>
  )
}

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AdminReplacementsClient from './AdminReplacementsClient'

export const metadata: Metadata = { title: 'Global Replacements & Analytics (Admin)' }

export default async function AdminReplacementsPage() {
  const supabase = await createClient()

  // Fetch all shops for filters
  const { data: shops } = await supabase
    .from('shops')
    .select('id, name')
    .order('name')

  // Fetch all replacement requests with customer details, order info, shop name, and replacement items details
  const { data: requests } = await supabase
    .from('replacement_requests')
    .select(`
      *,
      shops (
        name
      ),
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
    .order('created_at', { ascending: false })

  return (
    <>
      <h1 className="panel-page-title" style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.025em' }}>
        Replacements Analytics
      </h1>
      <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2rem' }}>
        Global marketplace replacement tracking and resolutions
      </p>
      <AdminReplacementsClient
        initialRequests={requests as any[] || []}
        shops={shops as any[] || []}
      />
    </>
  )
}

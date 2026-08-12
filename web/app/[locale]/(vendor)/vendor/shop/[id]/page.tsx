import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ShopDetailClient from './ShopDetailClient'

export const metadata: Metadata = { title: 'Manage Shop — Vendor Panel' }

export default async function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verify ownership
  const { data: ownerRow } = await supabase
    .from('shop_owners')
    .select('shop_id')
    .eq('user_id', user.id)
    .eq('shop_id', id)
    .maybeSingle()

  if (!ownerRow) {
    // Check if the user is an admin; admins can manage any shop
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role !== 'admin') {
      notFound()
    }
  }

  // Fetch shop details including shop_owners
  const { data: shop } = await supabase
    .from('shops')
    .select('id, name, type, location_id, created_at, updated_at, shop_owners(user_id, users(id, name, phone, email)), locations(id, name)')
    .eq('id', id)
    .single()

  if (!shop) {
    notFound()
  }

  // Fetch locations
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name')
    .order('name')

  // Fetch all users for co-owner selection
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, name, phone, email')
    .order('name')

  return (
    <ShopDetailClient
      shop={shop as any}
      locations={(locations ?? []) as { id: string; name: string }[]}
      allUsers={(allUsers ?? []) as { id: string; name: string; phone: string | null; email: string | null }[]}
    />
  )
}


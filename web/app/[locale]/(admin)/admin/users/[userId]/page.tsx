import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import UserDetailClient from './UserDetailClient'

export const metadata: Metadata = { title: 'User Detail (Admin)' }

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const [{ data: user }, { data: orders }, { data: shops }] = await Promise.all([
    supabase.from('users').select('*, user_profiles(email, profile_image_url, gender, preferred_language)').eq('id', userId).maybeSingle(),
    supabase.from('orders').select('id, status, created_at, total_final_price, shops(name)').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    supabase.from('shop_owners').select('shops(id, name)').eq('user_id', userId),
  ])

  if (!user) notFound()

  return (
    <UserDetailClient
      user={user}
      orders={orders ?? []}
      shops={shops ?? []}
    />
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FeedbacksClient from './FeedbacksClient'

export const metadata: Metadata = { title: 'Feedback Management' }

export default async function FeedbacksPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  // Check admin role
  const { data: userRow } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userRow?.role !== 'admin') {
    redirect(`/${locale}/profile`)
  }

  // Fetch all feedbacks including user name & phone
  const { data: feedbacks } = await supabase
    .from('feedbacks')
    .select('*, users(name, phone)')
    .order('created_at', { ascending: false })

  return <FeedbacksClient initialFeedbacks={feedbacks ?? []} />
}

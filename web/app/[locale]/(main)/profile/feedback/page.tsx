import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FeedbackClient from './FeedbackClient'

export const metadata: Metadata = { title: 'Platform Feedback' }

export default async function FeedbackPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/${locale}/login`)
  }

  // Fetch all feedbacks with users name
  const { data: feedbacks } = await supabase
    .from('feedbacks')
    .select('*, users(name)')
    .order('created_at', { ascending: false })

  return <FeedbackClient initialFeedbacks={feedbacks ?? []} userId={user.id} />
}

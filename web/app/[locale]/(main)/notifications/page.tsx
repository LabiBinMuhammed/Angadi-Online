import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import NotificationsClient from './NotificationsClient'
import BackButton from '@/components/BackButton'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Notifications' }

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="page-container">
        <NotificationsClient orders={[]} />
      </div>
    )
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, created_at, shops(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: var(--bg-base); }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-base); transition: all 0.2s; }
        .title { font-size: 28px; font-weight: 800; color: var(--text-base); margin: 0; letter-spacing: -0.5px; }
      `}} />
      <div className="page-container">
        <div className="header">
          <BackButton fallbackHref="/home">
            <ArrowLeft size={20} />
          </BackButton>
          <h1 className="title">Notifications</h1>
        </div>
        <NotificationsClient orders={(orders ?? []) as any[]} />
      </div>
    </>
  )
}

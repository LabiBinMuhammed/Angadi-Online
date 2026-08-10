import type { Metadata } from 'next'
import SettingsClient from './SettingsClient'
import { createClient } from '@/lib/supabase/server'
import BackButton from '@/components/BackButton'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let preferredLanguage = 'ml'

  if (user) {
    const { data: userRow } = await supabase
      .from('users')
      .select('preferred_language')
      .eq('id', user.id)
      .maybeSingle()
    if ((userRow as any)?.preferred_language) {
      preferredLanguage = (userRow as any).preferred_language
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <BackButton fallbackHref="/profile" style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-base)'
        }}>
          <ArrowLeft size={20} />
        </BackButton>
        <h1 className="text-2xl font-bold" style={{ margin: 0 }}>Settings</h1>
      </div>
      <SettingsClient preferredLanguage={preferredLanguage} />
    </>
  )
}

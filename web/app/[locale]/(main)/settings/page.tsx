import type { Metadata } from 'next'
import SettingsClient from './SettingsClient'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: userRow } = await supabase
    .from('users')
    .select('preferred_language')
    .eq('id', user!.id)
    .maybeSingle()

  return (
    <>
      <h1 className="text-2xl font-bold" style={{ marginBottom: '1.5rem' }}>Settings</h1>
      <SettingsClient preferredLanguage={(userRow as any)?.preferred_language ?? 'en'} />
    </>
  )
}

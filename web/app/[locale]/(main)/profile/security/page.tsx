import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import SecurityClient from './SecurityClient'

export const metadata: Metadata = { title: 'Security Settings' }

export default async function SecuritySettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userRow } = await supabase
    .from('users')
    .select('phone')
    .eq('id', user!.id)
    .single()

  return (
    <>
      <SecurityClient initialPhone={userRow?.phone ?? ''} />
    </>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VendorLayoutShell from './VendorLayoutShell'
import './vendor.css'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
  let role = (data as { role?: string })?.role || user.user_metadata?.role

  if (role !== 'shop_owner' && role !== 'admin') {
    const { data: isOwner } = await supabase
      .from('shop_owners')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (isOwner) {
      role = 'shop_owner'
    } else {
      redirect('/home')
    }
  }

  return (
    <VendorLayoutShell role={role}>
      {children}
    </VendorLayoutShell>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AddressDropdownClient from './AddressDropdownClient'
import { Bell, Store, ShieldCheck, ChevronDown } from 'lucide-react'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let role: string | undefined
  let addresses: any[] = []
  
  if (user) {
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    role = (data as any)?.role || user.user_metadata?.role

    const { data: addrs } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      
    if (addrs) addresses = addrs
  }

  return (
    <header className="wa-sidebar-top" style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '16px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100, width: '100%', boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 600, color: 'var(--text-base)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <span>Home</span>
        <ChevronDown size={16} color="var(--text-base)" style={{ marginLeft: '4px' }} />
      </div>


      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {(role === 'shop_owner' || role === 'admin') && (
          <Link href="/vendor/dashboard" title="Vendor Panel" style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0, color: 'var(--text-base)' }}>
            <Store size={20} />
          </Link>
        )}
        {role === 'admin' && (
          <Link href="/admin/dashboard" title="Admin Panel" style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0, color: 'var(--text-base)' }}>
            <ShieldCheck size={20} />
          </Link>
        )}
        <Link href="/notifications" style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0, color: 'var(--text-base)' }}>
          <Bell size={20} />
          <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', background: '#ff4757', borderRadius: '50%', border: '2px solid var(--bg-surface)' }} />
        </Link>
      </div>
    </header>
  )
}

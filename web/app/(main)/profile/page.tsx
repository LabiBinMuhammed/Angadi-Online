import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { User, UserProfile } from '@/types'
import { Settings, MapPin, Package, Bell, Store, ShieldAlert, ChevronRight, Mail, Calendar, Globe, User as UserIcon } from 'lucide-react'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: userRow }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', authUser!.id).maybeSingle(),
    supabase.from('users').select('name, phone, role').eq('id', authUser!.id).single(),
  ])

  const u = userRow as Pick<User, 'name' | 'phone' | 'role'> | null
  const p = profile as UserProfile | null
  const role = u?.role ?? 'customer'

  const links = [
    { href: '/profile/addresses', icon: MapPin, label: 'My Addresses', color: '#3b82f6', bg: '#eff6ff' },
    { href: '/orders', icon: Package, label: 'My Orders', color: '#8b5cf6', bg: '#f5f3ff' },
    { href: '/notifications', icon: Bell, label: 'Notifications', color: '#f59e0b', bg: '#fffbeb' },
    { href: '/settings', icon: Settings, label: 'Settings', color: '#64748b', bg: '#f8fafc' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: #fafafa; }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; }
        .title { font-size: 32px; font-weight: 800; color: #1e4d1e; margin: 0 0 32px 0; letter-spacing: -1px; }
        
        .profile-card { background: linear-gradient(135deg, #1e4d1e, #2b5a2b); border-radius: 32px; padding: 32px; display: flex; align-items: center; gap: 20px; box-shadow: 0 12px 30px rgba(30,77,30,0.2); margin-bottom: 32px; color: #fff; }
        .avatar-wrap { width: 80px; height: 80px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #1e4d1e; overflow: hidden; flex-shrink: 0; box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .profile-name { font-size: 24px; font-weight: 800; margin: 0 0 4px; letter-spacing: -0.5px; }
        .profile-phone { font-size: 15px; color: #b5deb5; margin: 0 0 12px; font-weight: 500; }
        .role-badge { display: inline-block; padding: 6px 12px; background: rgba(255,255,255,0.2); border-radius: 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; backdrop-filter: blur(4px); }

        .section-title { font-size: 18px; font-weight: 800; color: #1a1a1a; margin: 0 0 16px 8px; }
        
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
        .info-card { background: #fff; border-radius: 24px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 12px; }
        .info-icon { width: 40px; height: 40px; border-radius: 16px; background: #f5f7f5; display: flex; align-items: center; justify-content: center; color: #4cd964; }
        .info-label { font-size: 13px; color: #999; font-weight: 600; margin: 0; }
        .info-val { font-size: 15px; font-weight: 700; color: #1a1a1a; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .links-list { background: #fff; border-radius: 28px; padding: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 32px; }
        .link-item { display: flex; align-items: center; padding: 16px; text-decoration: none; border-radius: 20px; transition: background 0.2s; }
        .link-item:hover { background: #f9f9f9; }
        .link-icon { width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-right: 16px; }
        .link-label { flex: 1; font-size: 16px; font-weight: 700; color: #1a1a1a; margin: 0; }
        
        .vendor-card { background: linear-gradient(135deg, #f9f9f9, #f0f0f0); border: 1px solid #e5e5e5; }
        .admin-card { background: linear-gradient(135deg, #fff1f2, #ffe4e6); border: 1px solid #fecdd3; }
      `}} />

      <div className="page-container">
        <h1 className="title">My Profile</h1>

        <div className="profile-card">
          <div className="avatar-wrap">
            {p?.profile_image_url ? (
              <img src={p.profile_image_url} alt="avatar" className="avatar-img" />
            ) : (
              u?.name?.[0]?.toUpperCase() ?? '?'
            )}
          </div>
          <div>
            <h2 className="profile-name">{u?.name ?? 'Guest User'}</h2>
            <p className="profile-phone">{u?.phone || 'No phone number'}</p>
            <span className="role-badge">{role}</span>
          </div>
        </div>

        <h3 className="section-title">Personal Info</h3>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon"><Mail size={20} strokeWidth={2.5} /></div>
            <div>
              <p className="info-label">Email</p>
              <p className="info-val">{p?.email || '—'}</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon"><UserIcon size={20} strokeWidth={2.5} /></div>
            <div>
              <p className="info-label">Gender</p>
              <p className="info-val">{p?.gender || '—'}</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon"><Calendar size={20} strokeWidth={2.5} /></div>
            <div>
              <p className="info-label">Birthday</p>
              <p className="info-val">{p?.date_of_birth || '—'}</p>
            </div>
          </div>
          <div className="info-card">
            <div className="info-icon"><Globe size={20} strokeWidth={2.5} /></div>
            <div>
              <p className="info-label">Language</p>
              <p className="info-val">{p?.preferred_language || '—'}</p>
            </div>
          </div>
        </div>

        <h3 className="section-title">Preferences</h3>
        <div className="links-list">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href} className="link-item">
                <div className="link-icon" style={{ background: link.bg, color: link.color }}>
                  <Icon size={24} strokeWidth={2.5} />
                </div>
                <p className="link-label">{link.label}</p>
                <ChevronRight size={20} color="#ccc" />
              </Link>
            )
          })}
        </div>

        {(role === 'shop_owner' || role === 'admin') && (
          <>
            <h3 className="section-title">Management</h3>
            <div className="links-list" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
              <Link href="/vendor/dashboard" className="link-item vendor-card" style={{ marginBottom: '12px' }}>
                <div className="link-icon" style={{ background: '#fff', color: '#10b981', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <Store size={24} strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="link-label">Vendor Panel</p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666', fontWeight: 500 }}>Manage your shop & orders</p>
                </div>
                <ChevronRight size={20} color="#999" />
              </Link>

              {role === 'admin' && (
                <Link href="/admin/dashboard" className="link-item admin-card">
                  <div className="link-icon" style={{ background: '#fff', color: '#f43f5e', boxShadow: '0 4px 12px rgba(244,63,94,0.1)' }}>
                    <ShieldAlert size={24} strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="link-label">Admin Panel</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666', fontWeight: 500 }}>System administration</p>
                  </div>
                  <ChevronRight size={20} color="#f43f5e" />
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}

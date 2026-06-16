'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Search, ShoppingCart, Bell, Store, ShieldCheck, LogOut, Plus, MoreVertical } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

type Props = { user: User | null; role?: string }

export default function NavbarClient({ user, role }: Props) {
  const router = useRouter()
  const { locale, t } = useTranslation()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = `/${locale}/login`
  }

  // Use the exact class we created in globals.css for WhatsApp top bar icons
  const iconClass = "wa-top-icon-btn"

  return (
    <nav className="wa-sidebar-top-actions">
      {/* Search */}
      <Link href={`/${locale}/search`} id="nav-search" className={iconClass} aria-label={t('common.search')} title={t('common.search')}>
        <Search size={20} />
      </Link>
      
      {/* Cart */}
      <Link href={`/${locale}/cart`} id="nav-cart" className={iconClass} aria-label={t('nav.cart')} title={t('nav.cart')}>
        <ShoppingCart size={20} />
      </Link>
      
      {/* Notifications */}
      <Link href={`/${locale}/notifications`} id="nav-notifications" className={iconClass} aria-label={t('common.view_details')} title={t('common.view_details')}>
        <Bell size={20} />
      </Link>

      {user ? (
        <>
          {/* Shop owner & admin: Vendor panel */}
          {(role === 'shop_owner' || role === 'admin') && (
            <Link href={`/${locale}/vendor/dashboard`} id="nav-vendor"
              className={iconClass} title={t('nav.dashboard')}
            >
              <Store size={20} />
            </Link>
          )}

          {/* Admin only */}
          {role === 'admin' && (
            <Link href={`/${locale}/admin/dashboard`} id="nav-admin"
              className={iconClass} title={t('nav.dashboard')}
            >
              <ShieldCheck size={20} />
            </Link>
          )}

          {/* Sign out */}
          <button id="nav-logout"
            className={iconClass}
            onClick={handleLogout}
            title={t('common.sign_out')}
            aria-label={t('common.sign_out')}
          >
            <LogOut size={20} />
          </button>
        </>
      ) : (
        <Link href={`/${locale}/login`} id="nav-login"
          style={{
            display: 'flex', alignItems: 'center', gap: '.4rem',
            padding: '.35rem .9rem', marginLeft: '.5rem',
            background: '#128c7e', color: '#fff',
            borderRadius: 'var(--radius-full)', fontWeight: 700,
            fontSize: '.82rem', textDecoration: 'none',
          }}
        >
          {t('auth.login')}
        </Link>
      )}
    </nav>
  )
}


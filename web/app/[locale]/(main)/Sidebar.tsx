'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, ShoppingBag, User as UserIcon, 
  Bookmark, Heart, History, Settings, Sun, Moon, Sparkles 
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { useTheme } from '@/components/ThemeProvider'
import { OrdersIcon } from '@/components/icons/OrdersIcon'

export default function Sidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const { locale, t } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  if (pathname.includes('/checkout')) return null

  const isActive = (href: string) => {
    const localizedHref = `/${locale}${href}`
    return pathname === localizedHref || pathname.startsWith(localizedHref + '/')
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .desktop-sidebar { display: none; }
        .sidebar-text { display: none; }
        .sidebar-section-title { display: none; }

        .sidebar-item {
          display: flex; align-items: center; justify-content: center;
          padding: 12px; border-radius: 16px; margin-bottom: 6px;
          transition: all 0.2s ease; color: var(--text-muted); text-decoration: none;
          border: none; background: transparent; cursor: pointer; width: 100%;
          box-sizing: border-box;
        }
        .sidebar-item.active { background: var(--wa-green-light); color: var(--wa-green-dark); }
        .sidebar-item:hover { background: var(--bg-muted); color: var(--text-base); }

        @media (min-width: 768px) {
          .desktop-sidebar { 
            display: flex; flex-direction: column; 
            width: 80px; border-right: 1px solid var(--border); 
            background: var(--bg-surface); align-items: center; padding: 24px 12px;
            height: 100vh;
            position: sticky;
            top: 0;
            flex-shrink: 0;
            box-sizing: border-box;
            overflow-y: auto;
          }
        }

        @media (min-width: 1024px) {
          .desktop-sidebar { width: 250px; align-items: flex-start; padding: 24px 18px; }
          .sidebar-item { justify-content: flex-start; width: 100%; gap: 14px; padding: 12px 16px; }
          .sidebar-text { display: block; font-weight: 700; font-size: 14px; white-space: nowrap; }
          .sidebar-section-title { 
            display: block; 
            font-size: 11px; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: 0.8px; 
            color: var(--text-light); 
            margin: 16px 0 6px 12px; 
          }
        }
      `}} />

      <div className="desktop-sidebar" style={{ zIndex: 100 }}>
        {/* Header Logo */}
        <div style={{ marginBottom: '28px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #4cd964, #32b84a)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(76,217,100,0.3)', flexShrink: 0 }}>
            <Home size={22} />
          </div>
          <span className="sidebar-text" style={{ fontSize: '19px', fontWeight: 900, color: 'var(--text-base)', letterSpacing: '-0.5px', margin: 0 }}>
            Angadi Online
          </span>
        </div>

        {/* Main Navigation Group */}
        <span className="sidebar-section-title">{t('nav.menu') || 'Menu'}</span>
        
        <Link href={`/${locale}/home`} className={`sidebar-item ${isActive('/home') ? 'active' : ''}`} style={isActive('/home') ? { color: '#4cd964' } : undefined} title={t('nav.home')}>
          <Home size={22} strokeWidth={2.2} />
          <span className="sidebar-text">{t('nav.home')}</span>
        </Link>
        
        <Link href={`/${locale}/orders`} className={`sidebar-item ${isActive('/orders') ? 'active' : ''}`} style={isActive('/orders') ? { color: '#4cd964' } : undefined} title={t('nav.orders')}>
          <OrdersIcon size={22} strokeWidth={2.2} />
          <span className="sidebar-text">{t('nav.orders')}</span>
        </Link>
        
        <Link href={`/${locale}/cart`} className={`sidebar-item ${isActive('/cart') ? 'active' : ''}`} style={isActive('/cart') ? { color: '#4cd964' } : undefined} title={t('nav.cart')}>
          <ShoppingBag size={22} strokeWidth={2.2} />
          <span className="sidebar-text">{t('nav.cart')}</span>
        </Link>
        
        <Link href={`/${locale}/profile`} className={`sidebar-item ${isActive('/profile') ? 'active' : ''}`} style={isActive('/profile') ? { color: '#4cd964' } : undefined} title={t('nav.profile')}>
          <UserIcon size={22} strokeWidth={2.2} />
          <span className="sidebar-text">{t('nav.profile')}</span>
        </Link>

        {/* Quick Access Group */}
        <span className="sidebar-section-title" style={{ marginTop: '14px' }}>{t('nav.explore') || 'Explore'}</span>

        <Link href={`/${locale}/pinned-shops`} className={`sidebar-item ${isActive('/pinned-shops') ? 'active' : ''}`} style={isActive('/pinned-shops') ? { color: '#4cd964' } : undefined} title={t('nav.pinned_shops')}>
          <Bookmark size={22} strokeWidth={2.2} />
          <span className="sidebar-text">{t('nav.pinned_shops')}</span>
        </Link>

        <Link href={`/${locale}/favorites`} className={`sidebar-item ${isActive('/favorites') ? 'active' : ''}`} style={isActive('/favorites') ? { color: '#4cd964' } : undefined} title={t('nav.favorites')}>
          <Heart size={22} strokeWidth={2.2} />
          <span className="sidebar-text">{t('nav.favorites')}</span>
        </Link>

        <Link href={`/${locale}/recent-purchases`} className={`sidebar-item ${isActive('/recent-purchases') ? 'active' : ''}`} style={isActive('/recent-purchases') ? { color: '#4cd964' } : undefined} title={t('nav.recent_purchases')}>
          <History size={22} strokeWidth={2.2} />
          <span className="sidebar-text">{t('nav.recent_purchases')}</span>
        </Link>

        {/* Bottom Sticky Section */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)', width: '100%' }}>
          <Link href={`/${locale}/settings`} className={`sidebar-item ${isActive('/settings') ? 'active' : ''}`} style={isActive('/settings') ? { color: '#4cd964' } : undefined} title={t('nav.settings')}>
            <Settings size={22} strokeWidth={2.2} />
            <span className="sidebar-text">{t('nav.settings')}</span>
          </Link>

          <button onClick={toggleTheme} className="sidebar-item" title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            {theme === 'dark' ? <Sun size={22} strokeWidth={2.2} style={{ color: '#f59e0b' }} /> : <Moon size={22} strokeWidth={2.2} style={{ color: '#6366f1' }} />}
            <span className="sidebar-text">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>
    </>
  )
}

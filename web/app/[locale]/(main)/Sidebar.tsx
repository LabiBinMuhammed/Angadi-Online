'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, User as UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n/I18nContext'

const OrdersIcon = ({ size = 26, strokeWidth = 2.5, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
    <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
  </svg>
)

export default function Sidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const { locale, t } = useTranslation()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const isActive = (href: string) => {
    const localizedHref = `/${locale}${href}`
    return pathname === localizedHref || pathname.startsWith(localizedHref + '/')
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .desktop-sidebar { display: none; }
        .sidebar-text { display: none; }

        .sidebar-item {
          display: flex; align-items: center; justify-content: center;
          padding: 12px; border-radius: 16px; margin-bottom: 8px;
          transition: background 0.2s; color: var(--text-muted); text-decoration: none;
        }
        .sidebar-item.active { background: var(--wa-green-light); color: var(--wa-green-dark); }
        .sidebar-item:hover { background: var(--bg-muted); }

        @media (min-width: 768px) {
          .desktop-sidebar { 
            display: flex; flex-direction: column; 
            width: 80px; border-right: 1px solid var(--border); 
            background: var(--bg-surface); align-items: center; padding-top: 32px;
            height: 100vh;
            position: sticky;
            top: 0;
            flex-shrink: 0;
            box-sizing: border-box;
          }
        }

        @media (min-width: 1024px) {
          .desktop-sidebar { width: 240px; align-items: flex-start; padding: 32px 24px; }
          .sidebar-item { justify-content: flex-start; width: 100%; gap: 16px; padding: 14px 20px; }
          .sidebar-text { display: block; font-weight: 700; font-size: 15px; }
        }
      `}} />

      <div className="desktop-sidebar" style={{ zIndex: 100 }}>
        <div style={{ marginBottom: '40px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #4cd964, #32b84a)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Home size={24} />
          </div>
          <span className="sidebar-text" style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-base)', letterSpacing: '-0.5px', margin: 0 }}>Village Market</span>
        </div>

        <Link href={`/${locale}/home`} className={`sidebar-item ${isActive('/home') ? 'active' : ''}`} style={isActive('/home') ? { color: '#4cd964' } : undefined}>
          <Home size={26} strokeWidth={2.5} />
          <span className="sidebar-text">{t('nav.home')}</span>
        </Link>
        <Link href={`/${locale}/orders`} className={`sidebar-item ${isActive('/orders') ? 'active' : ''}`} style={isActive('/orders') ? { color: '#4cd964' } : undefined}>
          <OrdersIcon size={26} strokeWidth={2.5} />
          <span className="sidebar-text">{t('nav.orders')}</span>
        </Link>
        <Link href={`/${locale}/cart`} className={`sidebar-item ${isActive('/cart') ? 'active' : ''}`} style={isActive('/cart') ? { color: '#4cd964' } : undefined}>
          <ShoppingBag size={26} strokeWidth={2.5} />
          <span className="sidebar-text">{t('nav.cart')}</span>
        </Link>
        <Link href={`/${locale}/profile`} className={`sidebar-item ${isActive('/profile') ? 'active' : ''}`} style={isActive('/profile') ? { color: '#4cd964' } : undefined}>
          <UserIcon size={26} strokeWidth={2.5} />
          <span className="sidebar-text">{t('nav.profile')}</span>
        </Link>
      </div>
    </>
  )
}

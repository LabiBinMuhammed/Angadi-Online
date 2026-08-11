'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Tag, Scale, Link2, BookOpen,
  Store, Users, Package, CreditCard, Coins,
  ClipboardList, AlertTriangle, Settings, Bell,
  ArrowLeft, ShieldCheck, MapPin, Sun, Moon,
  Languages, MessageSquare, RefreshCcw
} from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useTranslation } from '@/lib/i18n/I18nContext'

const NAV = [
  { section: 'Overview', items: [
    { href: '/admin/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { section: 'Catalog', items: [
    { href: '/admin/categories',     icon: Tag,       label: 'Categories' },
    { href: '/admin/units',          icon: Scale,     label: 'Units' },
    { href: '/admin/category-units', icon: Link2,     label: 'Category-Unit Map' },
    { href: '/admin/demos',          icon: BookOpen,  label: 'Demo Templates' },
  ]},
  { section: 'Marketplace', items: [
    { href: '/admin/shops',          icon: Store,     label: 'Shops' },
    { href: '/admin/locations',      icon: MapPin,    label: 'Locations' },
    { href: '/admin/users',          icon: Users,     label: 'Users' },
    { href: '/admin/orders',         icon: Package,   label: 'Orders' },
    { href: '/admin/replacements',   icon: RefreshCcw, label: 'Replacements' },
  ]},
  { section: 'Finance', items: [
    { href: '/admin/credit',         icon: CreditCard, label: 'Credit Monitor' },
    { href: '/admin/commission',     icon: Coins,      label: 'Commission Management' },
  ]},
  { section: 'System', items: [
    { href: '/admin/translations',   icon: Languages,      label: 'Translations' },
    { href: '/admin/logs',           icon: ClipboardList,  label: 'Activity Logs' },
    { href: '/admin/disputes',       icon: AlertTriangle,  label: 'Disputes' },
    { href: '/admin/feedbacks',      icon: MessageSquare,  label: 'Feedbacks' },
    { href: '/admin/settings',       icon: Settings,       label: 'Settings' },
    { href: '/admin/notifications',  icon: Bell,           label: 'Notifications' },
  ]},
]

export default function AdminSidebar() {
  const path = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { locale } = useTranslation()

  return (
    <aside className="panel-sidebar">
      <div className="panel-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/logo_dark.png" className="logo-dark-mode" alt="Angadi Admin" style={{ height: '36px', maxWidth: '140px', objectFit: 'contain' }} />
        <img src="/logo_light.png" className="logo-light-mode" alt="Angadi Admin" style={{ height: '36px', maxWidth: '140px', objectFit: 'contain' }} />

        <span style={{ fontSize: '11px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>ADMIN</span>
      </div>

      <div className="panel-sidebar-menu" style={{ flex: 1, paddingTop: '.5rem' }}>
        {NAV.map(group => (
          <div key={group.section} className="panel-nav-group">
            <div className="panel-nav-section">{group.section}</div>
            {group.items.map(item => {
              const Icon = item.icon
              const localizedHref = `/${locale}${item.href}`
              const isActive = path === localizedHref || path.startsWith(localizedHref + '/')
              return (
                <Link
                  key={item.href}
                  href={localizedHref}
                  id={`anav-${item.label.toLowerCase().replace(/[\s-]+/g, '-')}`}
                  className={`panel-nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon size={17} className="nav-icon" style={{ flexShrink: 0 }} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div className="panel-sidebar-footer" style={{ padding: '.75rem 0', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <button
          onClick={toggleTheme}
          className="panel-nav-item"
          style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          id="anav-theme-toggle"
        >
          {theme === 'dark' ? <Sun size={17} className="nav-icon" style={{ flexShrink: 0 }} /> : <Moon size={17} className="nav-icon" style={{ flexShrink: 0 }} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <Link href={`/${locale}/home`} className="panel-nav-item" id="anav-back-shop">
          <ArrowLeft size={17} className="nav-icon" style={{ flexShrink: 0 }} />
          <span>Back to Shop</span>
        </Link>
      </div>
    </aside>
  )
}

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
  { sectionKey: 'admin_nav.sec_overview', defaultSection: 'Overview', items: [
    { href: '/admin/dashboard',      icon: LayoutDashboard, labelKey: 'admin_nav.dashboard', defaultLabel: 'Dashboard' },
  ]},
  { sectionKey: 'admin_nav.sec_catalog', defaultSection: 'Catalog', items: [
    { href: '/admin/categories',     icon: Tag,       labelKey: 'admin_nav.categories', defaultLabel: 'Categories' },
    { href: '/admin/units',          icon: Scale,     labelKey: 'admin_nav.units', defaultLabel: 'Units' },
    { href: '/admin/category-units', icon: Link2,     labelKey: 'admin_nav.category_units', defaultLabel: 'Category-Unit Map' },
    { href: '/admin/demos',          icon: BookOpen,  labelKey: 'admin_nav.demos', defaultLabel: 'Demo Templates' },
  ]},
  { sectionKey: 'admin_nav.sec_marketplace', defaultSection: 'Marketplace', items: [
    { href: '/admin/shops',          icon: Store,     labelKey: 'admin_nav.shops', defaultLabel: 'Shops' },
    { href: '/admin/locations',      icon: MapPin,    labelKey: 'admin_nav.locations', defaultLabel: 'Locations' },
    { href: '/admin/users',          icon: Users,     labelKey: 'admin_nav.users', defaultLabel: 'Users' },
    { href: '/admin/orders',         icon: Package,   labelKey: 'admin_nav.orders', defaultLabel: 'Orders' },
    { href: '/admin/replacements',   icon: RefreshCcw, labelKey: 'admin_nav.replacements', defaultLabel: 'Replacements' },
  ]},
  { sectionKey: 'admin_nav.sec_finance', defaultSection: 'Finance', items: [
    { href: '/admin/credit',         icon: CreditCard, labelKey: 'admin_nav.credit_monitor', defaultLabel: 'Credit Monitor' },
    { href: '/admin/commission',     icon: Coins,      labelKey: 'admin_nav.commission_mgmt', defaultLabel: 'Commission Management' },
  ]},
  { sectionKey: 'admin_nav.sec_system', defaultSection: 'System', items: [
    { href: '/admin/translations',   icon: Languages,      labelKey: 'admin_nav.translations', defaultLabel: 'Translations' },
    { href: '/admin/logs',           icon: ClipboardList,  labelKey: 'admin_nav.activity_logs', defaultLabel: 'Activity Logs' },
    { href: '/admin/disputes',       icon: AlertTriangle,  labelKey: 'admin_nav.disputes', defaultLabel: 'Disputes' },
    { href: '/admin/feedbacks',      icon: MessageSquare,  labelKey: 'admin_nav.feedbacks', defaultLabel: 'Feedbacks' },
    { href: '/admin/settings',       icon: Settings,       labelKey: 'admin_nav.settings', defaultLabel: 'Settings' },
    { href: '/admin/notifications',  icon: Bell,           labelKey: 'admin_nav.notifications', defaultLabel: 'Notifications' },
  ]},
]

export default function AdminSidebar() {
  const path = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { t, locale } = useTranslation()

  return (
    <aside className="panel-sidebar">
      <div className="panel-sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/logo_dark.png" className="logo-dark-mode" alt="Angadi Admin" style={{ height: '36px', maxWidth: '140px', objectFit: 'contain' }} />
        <img src="/logo_light.png" className="logo-light-mode" alt="Angadi Admin" style={{ height: '36px', maxWidth: '140px', objectFit: 'contain' }} />

        <span style={{ fontSize: '11px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>ADMIN</span>
      </div>

      <div className="panel-sidebar-menu" style={{ flex: 1, paddingTop: '.5rem' }}>
        {NAV.map(group => (
          <div key={group.sectionKey} className="panel-nav-group">
            <div className="panel-nav-section">{t(group.sectionKey) || group.defaultSection}</div>
            {group.items.map(item => {
              const Icon = item.icon
              const localizedHref = `/${locale}${item.href}`
              const isActive = path === localizedHref || path.startsWith(localizedHref + '/')
              const label = t(item.labelKey) || item.defaultLabel
              return (
                <Link
                  key={item.href}
                  href={localizedHref}
                  id={`anav-${item.defaultLabel.toLowerCase().replace(/[\s-]+/g, '-')}`}
                  className={`panel-nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon size={17} className="nav-icon" style={{ flexShrink: 0 }} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div className="panel-sidebar-footer" style={{ padding: '.75rem 0', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <button
          onClick={toggleTheme}
          className="panel-nav-item"
          style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          id="anav-theme-toggle"
        >
          {theme === 'dark' ? <Sun size={17} className="nav-icon" style={{ flexShrink: 0 }} /> : <Moon size={17} className="nav-icon" style={{ flexShrink: 0 }} />}
          <span>{theme === 'dark' ? (t('admin_nav.light_mode') || 'Light Mode') : (t('admin_nav.dark_mode') || 'Dark Mode')}</span>
        </button>

        <Link href={`/${locale}/home`} className="panel-nav-item" id="anav-back-shop">
          <ArrowLeft size={17} className="nav-icon" style={{ flexShrink: 0 }} />
          <span>{t('admin_nav.back_to_shop') || 'Back to Shop'}</span>
        </Link>
      </div>
    </aside>
  )
}

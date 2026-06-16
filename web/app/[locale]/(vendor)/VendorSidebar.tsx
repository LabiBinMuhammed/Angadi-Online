import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, PackagePlus, ShoppingBag,
  CreditCard, ArrowLeft, Store, Shield, Sun, Moon, X
} from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useTranslation } from '@/lib/i18n/I18nContext'

const NAV = [
  { sectionKey: 'vendor_nav.sec_overview', items: [
    { href: '/vendor/dashboard', icon: LayoutDashboard, labelKey: 'vendor_nav.dashboard', defaultLabel: 'Dashboard' },
  ]},
  { sectionKey: 'vendor_nav.sec_store', items: [
    { href: '/vendor/shop',      icon: Store,         labelKey: 'vendor_nav.my_shops', defaultLabel: 'My Shops' },
  ]},
  { sectionKey: 'vendor_nav.sec_inventory', items: [
    { href: '/vendor/items',     icon: Package,     labelKey: 'vendor_nav.all_products', defaultLabel: 'All Products' },
    { href: '/vendor/items/new', icon: PackagePlus, labelKey: 'vendor_nav.add_product', defaultLabel: 'Add Product' },
  ]},
  { sectionKey: 'vendor_nav.sec_sales', items: [
    { href: '/vendor/orders',    icon: ShoppingBag, labelKey: 'vendor_nav.orders', defaultLabel: 'Orders' },
  ]},
  { sectionKey: 'vendor_nav.sec_finance', items: [
    { href: '/vendor/credit',    icon: CreditCard,  labelKey: 'vendor_nav.customer_credit', defaultLabel: 'Customer Credit' },
    { href: '/vendor/commission', icon: Shield,      labelKey: 'vendor_nav.commission_dashboard', defaultLabel: 'Commission Dashboard' },
  ]},
]

interface VendorSidebarProps {
  isCollapsed: boolean
  onCloseMobile: () => void
}

export default function VendorSidebar({ isCollapsed, onCloseMobile }: VendorSidebarProps) {
  const path = usePathname()
  const { theme, toggleTheme } = useTheme()
  const { t, locale } = useTranslation()

  const onCloseMobileRef = useRef(onCloseMobile)

  // Keep the callback ref up to date
  useEffect(() => {
    onCloseMobileRef.current = onCloseMobile
  }, [onCloseMobile])

  // Auto-close drawer on mobile when navigating (route changes)
  useEffect(() => {
    onCloseMobileRef.current()
  }, [path])


  return (
    <aside className="vp-sidebar">
      <div className="vp-sidebar-brand-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '1rem' }}>
        <div className="vp-sidebar-brand">
          <Shield size={24} color="#60a5fa" style={{ flexShrink: 0 }} /> <span>{t('vendor_nav.portal_title')}</span>
        </div>
        <button 
          onClick={onCloseMobile}
          className="mobile-sidebar-close-btn"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          aria-label={t('vendor_nav.close_sidebar')}
          id="vendor-sidebar-close-mobile"
        >
          <X size={20} />
        </button>
      </div>

      <div className="vp-sidebar-nav">
        {NAV.map(group => (
          <div key={group.sectionKey} className="vp-nav-group">
            <div className="vp-nav-section">{t(group.sectionKey)}</div>
            {group.items.map(item => {
              const Icon = item.icon
              const localizedHref = `/${locale}${item.href}`
              const isActive = path === localizedHref || (path && item.href !== '/vendor/items' && path.startsWith(localizedHref + '/'))
              const label = t(item.labelKey)
              return (
                <Link
                  key={item.href}
                  href={localizedHref}
                  id={`vnav-${item.defaultLabel.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`vp-nav-item${isActive ? ' active' : ''}`}
                  title={isCollapsed ? label : undefined}
                >
                  <Icon size={18} className="vp-nav-icon" style={{ flexShrink: 0 }} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div className="vp-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={toggleTheme}
          className="vp-nav-item"
          style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          id="vnav-theme-toggle"
          title={isCollapsed ? (theme === 'dark' ? t('vendor_nav.light_mode') : t('vendor_nav.dark_mode')) : undefined}
        >
          {theme === 'dark' ? <Sun size={18} className="vp-nav-icon" style={{ flexShrink: 0 }} /> : <Moon size={18} className="vp-nav-icon" style={{ flexShrink: 0 }} />}
          <span>{theme === 'dark' ? t('vendor_nav.light_mode') : t('vendor_nav.dark_mode')}</span>
        </button>

        <Link href={`/${locale}/home`} className="vp-nav-item" id="vnav-back-shop" title={isCollapsed ? t('vendor_nav.back_to_marketplace') : undefined}>
          <ArrowLeft size={18} className="vp-nav-icon" style={{ flexShrink: 0 }} />
          <span>{t('vendor_nav.back_to_marketplace')}</span>
        </Link>
      </div>
    </aside>
  )
}

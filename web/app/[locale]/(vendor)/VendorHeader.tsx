'use client'

import Link from 'next/link'
import { Menu, Bell, ShieldCheck, ArrowLeft } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface VendorHeaderProps {
  role?: string
  toggleSidebar: () => void
}

export default function VendorHeader({ role, toggleSidebar }: VendorHeaderProps) {
  const { t, locale } = useTranslation()

  return (
    <header className="vendor-header">
      <div className="vendor-header-left">
        <button 
          onClick={toggleSidebar} 
          className="sidebar-toggle-btn"
          id="vendor-sidebar-toggle"
          aria-label={t('vendor_nav.toggle_sidebar') || 'Toggle Sidebar'}
        >
          <Menu size={22} />
        </button>
        <Link href={`/${locale}/vendor/dashboard`} className="vendor-header-brand">
          <span className="brand-text">{t('vendor_nav.portal_title') || 'Vendor Portal'}</span>
        </Link>
      </div>

      <div className="vendor-header-right">
        {role === 'admin' && (
          <Link 
            href={`/${locale}/admin/dashboard`} 
            title={t('vendor_nav.admin_panel') || 'Admin Panel'} 
            className="vendor-header-action-btn"
            id="vheader-admin-panel"
          >
            <ShieldCheck size={20} />
          </Link>
        )}
        <Link 
          href={`/${locale}/notifications`} 
          title={t('vendor_nav.notifications') || 'Notifications'} 
          className="vendor-header-action-btn"
          id="vheader-notifications"
        >
          <Bell size={20} />
          <span className="notification-badge" />
        </Link>
        <Link 
          href={`/${locale}/home`} 
          title={t('vendor_nav.back_to_marketplace') || 'Back to Marketplace'} 
          className="vendor-header-action-btn"
          id="vheader-back-marketplace"
        >
          <ArrowLeft size={20} />
        </Link>
      </div>
    </header>
  )
}


'use client'

import Link from 'next/link'
import { Menu, Bell, ShieldCheck, ArrowLeft } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface VendorHeaderProps {
  role?: string
  toggleSidebar: () => void
}

export default function VendorHeader({ role, toggleSidebar }: VendorHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="vendor-header">
      <div className="vendor-header-left">
        <button 
          onClick={toggleSidebar} 
          className="sidebar-toggle-btn"
          id="vendor-sidebar-toggle"
          aria-label={t('vendor_nav.toggle_sidebar')}
        >
          <Menu size={22} />
        </button>
        <Link href="/vendor/dashboard" className="vendor-header-brand">
          <span className="brand-text">{t('vendor_nav.portal_title')}</span>
        </Link>
      </div>

      <div className="vendor-header-right">
        {role === 'admin' && (
          <Link 
            href="/admin/dashboard" 
            title={t('vendor_nav.admin_panel')} 
            className="vendor-header-action-btn"
            id="vheader-admin-panel"
          >
            <ShieldCheck size={20} />
          </Link>
        )}
        <Link 
          href="/notifications" 
          title={t('vendor_nav.notifications')} 
          className="vendor-header-action-btn"
          id="vheader-notifications"
        >
          <Bell size={20} />
          <span className="notification-badge" />
        </Link>
        <Link 
          href="/home" 
          title={t('vendor_nav.back_to_marketplace')} 
          className="vendor-header-action-btn"
          id="vheader-back-marketplace"
        >
          <ArrowLeft size={20} />
        </Link>
      </div>
    </header>
  )
}


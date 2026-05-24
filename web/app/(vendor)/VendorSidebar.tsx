'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, PackagePlus, ShoppingBag,
  CreditCard, ArrowLeft, Store, Shield
} from 'lucide-react'

const NAV = [
  { section: 'Overview', items: [
    { href: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { section: 'Store Management', items: [
    { href: '/vendor/shop',      icon: Store,         label: 'My Shops' },
  ]},
  { section: 'Inventory', items: [
    { href: '/vendor/items',     icon: Package,     label: 'All Products' },
    { href: '/vendor/items/new', icon: PackagePlus, label: 'Add Product' },
  ]},
  { section: 'Sales', items: [
    { href: '/vendor/orders',    icon: ShoppingBag, label: 'Orders' },
  ]},
  { section: 'Finance', items: [
    { href: '/vendor/credit',    icon: CreditCard,  label: 'Customer Credit' },
  ]},
]

export default function VendorSidebar() {
  const path = usePathname()

  return (
    <aside className="vp-sidebar">
      <div className="vp-sidebar-brand">
        <Shield size={24} color="#60a5fa" /> Vendor Portal
      </div>

      <div className="vp-sidebar-nav">
        {NAV.map(group => (
          <div key={group.section} className="vp-nav-group">
            <div className="vp-nav-section">{group.section}</div>
            {group.items.map(item => {
              const Icon = item.icon
              const isActive = path === item.href || (path && item.href !== '/vendor/items' && path.startsWith(item.href + '/'))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  id={`vnav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`vp-nav-item${isActive ? ' active' : ''}`}
                >
                  <Icon size={18} className="vp-nav-icon" style={{ flexShrink: 0 }} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div className="vp-sidebar-footer">
        <Link href="/home" className="vp-nav-item" id="vnav-back-shop">
          <ArrowLeft size={18} className="vp-nav-icon" style={{ flexShrink: 0 }} />
          <span>Back to Marketplace</span>
        </Link>
      </div>
    </aside>
  )
}

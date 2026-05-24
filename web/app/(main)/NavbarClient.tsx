'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Search, ShoppingCart, Bell, Store, ShieldCheck, LogOut, Plus, MoreVertical } from 'lucide-react'

type Props = { user: User | null; role?: string }

export default function NavbarClient({ user, role }: Props) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Use the exact class we created in globals.css for WhatsApp top bar icons
  const iconClass = "wa-top-icon-btn"

  return (
    <nav className="wa-sidebar-top-actions">
      {/* Search */}
      <Link href="/search" id="nav-search" className={iconClass} aria-label="Search" title="Search">
        <Search size={20} />
      </Link>
      
      {/* Cart */}
      <Link href="/cart" id="nav-cart" className={iconClass} aria-label="Cart" title="Cart">
        <ShoppingCart size={20} />
      </Link>
      
      {/* Notifications */}
      <Link href="/notifications" id="nav-notifications" className={iconClass} aria-label="Notifications" title="Notifications">
        <Bell size={20} />
      </Link>

      {user ? (
        <>
          {/* Shop Owner only: Add Item shortcut */}
          {/* {role === 'shop_owner' && (
            <Link
              href="/vendor/items/new"
              id="nav-add-item"
              title="Add new item to your shop"
              style={{
                display: 'flex', alignItems: 'center', gap: '.35rem',
                padding: '.3rem .8rem', marginLeft: '.5rem', marginRight: '.5rem',
                borderRadius: 'var(--radius-full)',
                background: '#128c7e',
                color: '#fff', fontWeight: 700, fontSize: '.8rem',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              <Plus size={14} strokeWidth={3} /> Add Item
            </Link>
          )} */}

          {/* Shop owner & admin: Vendor panel */}
          {(role === 'shop_owner' || role === 'admin') && (
            <Link href="/vendor/dashboard" id="nav-vendor"
              className={iconClass} title="Vendor Panel"
            >
              <Store size={20} />
            </Link>
          )}

          {/* Admin only */}
          {role === 'admin' && (
            <Link href="/admin/dashboard" id="nav-admin"
              className={iconClass} title="Admin Panel"
            >
              <ShieldCheck size={20} />
            </Link>
          )}

          {/* Profile link (if they want to edit profile) */}
          {/* We use the left side avatar for the main profile visual, but keep a settings/profile link here or use MoreVertical */}
          
          {/* Sign out */}
          <button id="nav-logout"
            className={iconClass}
            onClick={handleLogout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={20} />
          </button>
        </>
      ) : (
        <Link href="/login" id="nav-login"
          style={{
            display: 'flex', alignItems: 'center', gap: '.4rem',
            padding: '.35rem .9rem', marginLeft: '.5rem',
            background: '#128c7e', color: '#fff',
            borderRadius: 'var(--radius-full)', fontWeight: 700,
            fontSize: '.82rem', textDecoration: 'none',
          }}
        >
          Sign in
        </Link>
      )}
    </nav>
  )
}


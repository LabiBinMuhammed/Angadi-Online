'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, User as UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

const OrdersIcon = ({ size = 24, strokeWidth = 2.5, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
    <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
  </svg>
)

const NAV_ITEMS = [
  { href: '/home',          label: 'Home',    Icon: Home },
  { href: '/orders',        label: 'Orders',  Icon: OrdersIcon },
  { href: '/cart',          label: 'Bag',     Icon: ShoppingBag },
  { href: '/profile',       label: 'Profile', Icon: UserIcon },
]

export default function MobileFooter() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // If we are on /home, it has its own panel-based duplicated footer to support the dual-panel scrolling.
  // Actually, wait, we can just render it globally and let /home hide it if we want,
  // but to prevent duplicate footers, we can hide this global one on /home via CSS or JS.
  // But the prompt says "set the new footer (on the home page) on every costomer pages".
  // So we render it here.

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 768px) {
          .global-mobile-footer { display: none !important; }
        }
      `}} />
      <div className="global-mobile-footer" style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0,
        width: '100%',
        background: '#fff', 
        borderTopLeftRadius: '32px',
        borderTopRightRadius: '32px',
        display: 'flex', 
        justifyContent: 'space-around', 
        padding: '24px 20px 32px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.04)',
        zIndex: 100
      }}>
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')

          if (active) {
            return (
              <Link key={href} href={href} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#2b5a2b', textDecoration: 'none' }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '-42px', 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #4cd964, #32b84a)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(76,217,100,0.4)',
                  color: '#fff'
                }}>
                  <Icon size={28} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, marginTop: '28px', color: '#2b5a2b' }}>{label}</span>
              </Link>
            )
          }

          return (
            <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#999', textDecoration: 'none', paddingTop: '4px' }}>
              <Icon size={24} strokeWidth={2.5} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>{label}</span>
            </Link>
          )
        })}
        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', width: '130px', height: '5px', background: '#000', borderRadius: '10px' }} />
      </div>
    </>
  )
}

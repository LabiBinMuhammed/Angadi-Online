'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, User as UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/i18n/I18nContext'

import { OrdersIcon } from '@/components/icons/OrdersIcon'

const NAV_ITEMS = [
  { href: '/home',          translationKey: 'nav.home',    Icon: Home },
  { href: '/orders',        translationKey: 'nav.orders',  Icon: OrdersIcon },
  { href: '/cart',          translationKey: 'nav.cart',    Icon: ShoppingBag },
  { href: '/profile',       translationKey: 'nav.profile', Icon: UserIcon },
]

export default function MobileFooter() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const { locale, t } = useTranslation()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

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
        background: 'var(--bg-surface)', 
        borderTopLeftRadius: '32px',
        borderTopRightRadius: '32px',
        display: 'flex', 
        justifyContent: 'space-around', 
        padding: '24px 20px 32px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.04)',
        zIndex: 100
      }}>
        {NAV_ITEMS.map(({ href, translationKey, Icon }) => {
          const localizedHref = `/${locale}${href}`
          const active = pathname === localizedHref || pathname.startsWith(localizedHref + '/')
          const label = t(translationKey)

          if (active) {
            return (
              <Link key={href} href={localizedHref} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--wa-green)', textDecoration: 'none' }}>
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
                <span style={{ fontSize: '12px', fontWeight: 700, marginTop: '28px', color: 'var(--wa-green)' }}>{label}</span>
              </Link>
            )
          }

          return (
            <Link key={href} href={localizedHref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-light)', textDecoration: 'none', paddingTop: '4px' }}>
              <Icon size={24} strokeWidth={2.5} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>{label}</span>
            </Link>
          )
        })}
        <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', width: '130px', height: '5px', background: 'var(--text-base)', opacity: 0.3, borderRadius: '10px' }} />
      </div>
    </>
  )
}

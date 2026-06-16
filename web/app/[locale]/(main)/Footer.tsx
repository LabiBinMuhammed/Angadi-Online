'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/I18nContext'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      padding: '48px 24px',
      marginTop: 'auto',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #4cd964, #32b84a)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
            M
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-base)', letterSpacing: '-0.5px' }}>Village Market</span>
        </div>
        
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)', maxWidth: '500px', lineHeight: '1.5' }}>
          {t('footer.description')}
        </p>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/home" style={{ color: '#4cd964', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>{t('nav.home')}</Link>
          <Link href="/orders" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>{t('nav.orders')}</Link>
          <Link href="/cart" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>{t('nav.cart')}</Link>
          <Link href="/profile" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>{t('nav.profile')}</Link>
        </div>

        <div style={{ width: '100%', height: '1px', background: 'var(--border)', margin: '10px 0' }} />

        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)' }}>
          &copy; {new Date().getFullYear()} Village Market. {t('footer.rights_reserved')}
        </p>
      </div>
    </footer>
  )
}


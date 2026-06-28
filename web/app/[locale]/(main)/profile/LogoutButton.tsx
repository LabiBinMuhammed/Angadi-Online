'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/I18nContext'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { t, locale } = useTranslation()
  const { signOut } = useAuth()

  async function handleLogout() {
    try {
      setLoading(true)
      await signOut()
      window.location.href = `/${locale}/login`
    } catch (err) {
      alert(t('auth.err_logout'))
      setLoading(false)
    }
  }

  return (
    <button
      id="profile-logout-btn"
      onClick={handleLogout}
      disabled={loading}
      style={{
        width: '100%',
        padding: '16px',
        borderRadius: '24px',
        background: '#fff',
        border: '1.5px solid #fecdd3',
        color: '#f43f5e',
        fontSize: '16px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(244,63,94,0.03)',
        outline: 'none',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = '#fff1f2';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(244,63,94,0.08)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = '#fff';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(244,63,94,0.03)';
      }}
    >
      <LogOut size={20} strokeWidth={2.5} />
      <span>{loading ? t('auth.logging_out') : t('common.sign_out')}</span>
    </button>
  )
}

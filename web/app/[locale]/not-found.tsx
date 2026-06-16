'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/I18nContext'

// Simple translation dictionary fallback for 404 text
const translations: Record<string, { notFound: string; desc: string; goHome: string }> = {
  en: {
    notFound: 'Page Not Found',
    desc: "The page you're looking for doesn't exist.",
    goHome: 'Go Home',
  },
  ml: {
    notFound: 'പേജ് കണ്ടെത്തിയില്ല',
    desc: 'നിങ്ങൾ തിരയുന്ന പേജ് നിലവിലില്ല.',
    goHome: 'ഹോമിലേക്ക് പോവുക',
  },
  hi: {
    notFound: 'पेज नहीं मिला',
    desc: 'आप जो पेज ढूंढ रहे हैं वह मौजूद नहीं है।',
    goHome: 'मुख्य पृष्ठ पर जाएं',
  },
  ar: {
    notFound: 'الصفحة غير موجودة',
    desc: 'الصفحة التي تبحث عنها غير موجودة.',
    goHome: 'العودة للرئيسية',
  },
}

export default function NotFound() {
  const { locale } = useTranslation()
  const tData = translations[locale] || translations.en

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        textAlign: 'center',
        padding: '2rem',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'var(--text-base)',
        backgroundColor: 'var(--bg-base)'
      }}
    >
      <span style={{ fontSize: '4rem' }}>🔍</span>
      <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>404 — {tData.notFound}</h1>
      <p style={{ color: 'var(--text-muted, #64748b)' }}>{tData.desc}</p>
      <Link
        href={`/${locale}/home`}
        style={{
          marginTop: '.5rem',
          padding: '.65rem 1.5rem',
          background: '#0ea5e9',
          color: '#fff',
          borderRadius: 10,
          fontWeight: 600,
          fontSize: '.95rem',
          textDecoration: 'none',
        }}
      >
        {tData.goHome}
      </Link>
    </div>
  )
}

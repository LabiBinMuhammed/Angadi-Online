import type { Metadata, Viewport } from 'next'
import '../globals.css'
import SessionListener from '../SessionListener'
import { ThemeProvider } from '@/components/ThemeProvider'
import { I18nProvider, Locale } from '@/lib/i18n/I18nContext'
import { AuthProvider } from '@/lib/auth/AuthContext'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const viewport: Viewport = {
  themeColor: '#2e5b28',
}

export const metadata: Metadata = {
  title: { default: 'Angadi Online', template: '%s | Angadi Online' },
  description: 'Your local multi-shop marketplace — fresh items from shops near you.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Angadi Online',
  },
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // Safely check and cast the active locale
  const activeLocale: Locale = ['en', 'ml', 'hi', 'ar'].includes(locale)
    ? (locale as Locale)
    : 'ml'

  let messages = {}
  try {
    messages = require(`../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../messages/ml.json')
  }


  const dir = activeLocale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={activeLocale} dir={dir} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anek+Malayalam:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2e5b28" />
      </head>

      <body>
        <I18nProvider initialLocale={activeLocale} messages={messages}>
          <ThemeProvider>
            <AuthProvider>
              <SessionListener />
              <ServiceWorkerRegister />
              {children}
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}

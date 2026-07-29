import type { Metadata } from 'next'
import '../globals.css'
import SessionListener from '../SessionListener'
import { ThemeProvider } from '@/components/ThemeProvider'
import { I18nProvider, Locale } from '@/lib/i18n/I18nContext'
import { AuthProvider } from '@/lib/auth/AuthContext'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata: Metadata = {
  title: { default: 'Angadi Online', template: '%s | Angadi Online' },
  description: 'Your local multi-shop marketplace — fresh items from shops near you.',
  manifest: '/manifest.json',
  themeColor: '#2e5b28',
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
    : 'en'

  let messages = {}
  try {
    messages = require(`../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../messages/en.json')
  }

  const dir = activeLocale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={activeLocale} dir={dir} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#2e5b28" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              const savedTheme = localStorage.getItem('theme');
              const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
              document.documentElement.setAttribute('data-theme', savedTheme || systemTheme);
            } catch (e) {}
          })();
        `}} />
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

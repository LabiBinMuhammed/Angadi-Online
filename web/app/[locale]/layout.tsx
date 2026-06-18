import type { Metadata } from 'next'
import '../globals.css'
import SessionListener from '../SessionListener'
import { ThemeProvider } from '@/components/ThemeProvider'
import { I18nProvider, Locale } from '@/lib/i18n/I18nContext'
import { AuthProvider } from '@/lib/auth/AuthContext'


export const metadata: Metadata = {
  title: { default: 'Village Market', template: '%s | Village Market' },
  description: 'Your local multi-shop marketplace — fresh items from shops near you.',
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
              {children}
            </AuthProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}

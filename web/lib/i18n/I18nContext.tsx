'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// Define supported locales
export type Locale = 'en' | 'ml' | 'hi' | 'ar'

// Loaded translations type
interface Translations {
  [key: string]: any
}

interface I18nContextProps {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  isRtl: boolean
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined)

// Helper to resolve dotted path (e.g. "nav.home") in translations object
function getNestedValue(obj: any, path: string): string | undefined {
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function I18nProvider({
  children,
  initialLocale = 'en',
  messages
}: {
  children: React.ReactNode
  initialLocale: Locale
  messages: Translations
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [activeMessages, setActiveMessages] = useState<Translations>(messages)

  const isRtl = locale === 'ar'

  // Update locale and cookie/HTML direction attributes
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`
    
    // Dynamically update direction and lang attributes on html element
    const htmlEl = document.documentElement
    htmlEl.lang = newLocale
    htmlEl.dir = newLocale === 'ar' ? 'rtl' : 'ltr'
    
    // Redirect or trigger router refresh depending on implementation
    window.location.pathname = window.location.pathname.replace(
      /^\/(en|ml|hi|ar)/,
      `/${newLocale}`
    )
  }

  // Load translations if locale changes client-side
  useEffect(() => {
    if (locale !== initialLocale) {
      import(`../../messages/${locale}.json`)
        .then((module) => {
          setActiveMessages(module.default)
        })
        .catch((err) => {
          console.error(`Failed to load translations for ${locale}:`, err)
        })
    }
  }, [locale, initialLocale])

  // Translation function with English fallback
  const t = (key: string): string => {
    // 1. Check in the current active locale's translations
    let val = getNestedValue(activeMessages, key)
    if (val) return val

    // 2. Fall back to English translations if not found in active locale
    if (locale !== 'en') {
      try {
        // We require the English translations as the universal fallback
        const enMessages = require('../../messages/en.json')
        val = getNestedValue(enMessages, key)
        if (val) return val
      } catch (e) {
        console.error('Failed to load fallback English messages:', e)
      }
    }

    // 3. Fall back to key itself if all fails
    return key
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRtl }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }
  return context
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTranslation, Locale } from '@/lib/i18n/I18nContext'
import { useAuth } from '@/lib/auth/AuthContext'
const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'ar', label: '🇸🇦 العربية' },
  { code: 'hi', label: '🇮🇳 हिंदी' },
  { code: 'ml', label: '🇮🇳 Malayalam' },
]

export default function SettingsClient({ preferredLanguage }: { preferredLanguage: string }) {
  const { setLocale, t, locale } = useTranslation()
  const [lang, setLang] = useState<string>(locale || preferredLanguage || 'en')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const { signOut } = useAuth()

  const activeLang = locale || lang

  async function saveLang(code: string) {
    if (code === activeLang) return
    setLang(code)

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({ preferred_language: code })
          .eq('id', user.id)
        if (error) {
          console.error("Failed to update preferred language in users:", error)
        }
      }
    } catch (err) {
      console.error("Error updating preferred language:", err)
    } finally {
      setSaving(false)
      setSaved(true)
      // Switch locale (updates cookie, dir, and re-routes path)
      setLocale(code as Locale)
    }
  }

  async function handleLogout() {
    setSaving(true)
    try {
      await signOut()
    } catch (err) {
      console.error("Signout error in settings:", err)
    } finally {
      window.location.href = `/${locale}/login`
    }
  }

  return (
    <div style={{ maxWidth: 540 }}>
      <div className="wa-list">
        {/* Language */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--wa-separator)' }}>
          <p className="font-semibold" style={{ marginBottom: '.75rem' }}>🌐 {t('settings.language')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {LANGUAGES.map(l => (
              <label
                key={l.code}
                id={`lang-${l.code}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  padding: '.5rem .75rem', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', background: activeLang === l.code ? 'var(--wa-bg)' : 'transparent',
                  transition: 'background .12s',
                }}
              >
                <input
                  type="radio"
                  name="language"
                  value={l.code}
                  checked={activeLang === l.code}
                  onChange={() => saveLang(l.code)}
                  style={{ accentColor: 'var(--wa-green-dark)' }}
                />
                <span>{l.label}</span>
                {activeLang === l.code && saving && <span className="spinner" style={{ width: 14, height: 14 }} />}
                {activeLang === l.code && saved && <span style={{ color: 'var(--wa-green)', fontSize: '.85rem' }}>✓ Saved</span>}
              </label>
            ))}
          </div>
        </div>


        {/* App info */}
        <div className="wa-list-item" style={{ cursor: 'default' }}>
          <span>📱</span>
          <div className="wa-item-body">
            <p className="wa-item-title">App version</p>
            <p className="wa-item-sub">Angadi Online 1.0.0</p>
          </div>
        </div>

        {/* Notifications preference */}
        <div className="wa-list-item" style={{ cursor: 'default' }}>
          <span>🔔</span>
          <div className="wa-item-body">
            <p className="wa-item-title">Order notifications</p>
            <p className="wa-item-sub">Enabled for all order updates</p>
          </div>
        </div>

        {/* Privacy */}
        <div className="wa-list-item" style={{ cursor: 'default' }}>
          <span>🔒</span>
          <div className="wa-item-body">
            <p className="wa-item-title">Privacy</p>
            <p className="wa-item-sub">Your data is stored securely</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <button
          id="settings-logout"
          className="btn btn-danger btn-full"
          onClick={handleLogout}
        >
          {t('common.sign_out')}
        </button>
      </div>
    </div>
  )
}

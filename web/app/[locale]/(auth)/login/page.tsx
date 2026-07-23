'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Phone, Lock, Eye, EyeOff, AlertCircle, Info, KeyRound, User, Globe, Users } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/I18nContext'

export function normalizePhone(phone: string, defaultCountryCode: string = '+91'): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('+')) return cleaned
  if (cleaned.startsWith('00')) return '+' + cleaned.substring(2)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }
  const codeWithoutPlus = defaultCountryCode.replace('+', '')
  if (cleaned.startsWith(codeWithoutPlus)) {
    return '+' + cleaned
  }
  return defaultCountryCode + cleaned
}

export default function LoginPage() {
  const { t } = useTranslation()
  const { user, session, signInWithPassword, completeRegistration } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'en'
  
  // Form states
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'phone' | 'email'>('phone') // login modes
  const [step, setStep] = useState<'login' | 'complete_registration'>('login')
  
  // Registration completion states
  const [fullName, setFullName] = useState('')
  const [language, setLanguage] = useState('en')
  const [role, setRole] = useState('customer')
  const [regPhone, setRegPhone] = useState('')
  const [regCountryCode, setRegCountryCode] = useState('+91')
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState('')
  
  // UI states
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const hasPasswordSession = (() => {
    if (!session?.access_token) return false
    try {
      const payload = JSON.parse(atob(session.access_token.split('.')[1]))
      return payload?.amr?.includes('password') || false
    } catch (_) {
      return false
    }
  })()

  const showPhoneField = !!user?.email && !user?.phone

  // Fetch locations from DB when entering Complete Registration
  useEffect(() => {
    if (step === 'complete_registration') {
      const supabase = createClient()
      supabase.from('locations').select('id, name').order('name').then(({ data }) => {
        if (data) {
          setLocations(data)
          if (data.length > 0) {
            setSelectedLocationId(data[0].id)
          }
        }
      })
    }
  }, [step])

  // Helper to check profile and redirect or show registration completion
  async function checkProfileAndRedirect(userId: string) {
    try {
      const supabase = createClient()
      const { data: userRow } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', userId)
        .maybeSingle()

      // If user is admin, bypass Complete Registration completely
      if (userRow?.role === 'admin') {
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', userId)
        router.push(`/${locale}/home`)
        return
      }

      // If name is 'User' or empty, it means registration is incomplete
      if (!userRow || !userRow.name || userRow.name === 'User') {
        setStep('complete_registration')
      } else {
        // Sync last login
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', userId)
        router.push(`/${locale}/home`)
      }
    } catch (err: any) {
      setError('Failed to load your profile. Please try again.')
    }
  }

  // Handle Login with Password (supporting Email and Phone)
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    
    setError('')

    if (mode === 'phone') {
      if (!phone.trim() || !password) {
        setError('Phone number and password are required.')
        return
      }
      setLoading(true)
      try {
        const { data, error: authErr } = await signInWithPassword(normalizePhone(phone, countryCode), password)
        if (authErr) {
          if (authErr.message.includes('Invalid login credentials')) {
            setError('Incorrect phone number or password. Please try again.')
          } else {
            setError(authErr.message)
          }
        } else if (data.user) {
          await checkProfileAndRedirect(data.user.id)
        } else {
          setError('Login failed. Please try again.')
        }
      } catch (err: any) {
        setError('A network error occurred. Please check your connection and try again.')
      } finally {
        setLoading(false)
      }
    } else {
      if (!email.trim() || !password) {
        setError('Email and password are required.')
        return
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.')
        return
      }
      setLoading(true)
      try {
        const { data, error: authErr } = await signInWithPassword(email, password)
        if (authErr) {
          if (authErr.message.includes('Invalid login credentials')) {
            setError('Incorrect email or password. Please try again.')
          } else {
            setError(authErr.message)
          }
        } else if (data.user) {
          await checkProfileAndRedirect(data.user.id)
        } else {
          setError('Login failed. Please try again.')
        }
      } catch (err: any) {
        setError('A network error occurred. Please check your connection and try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  // Handle Complete Registration
  async function handleCompleteRegistration(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    const name = fullName.trim()
    if (!name) {
      setError('Please enter your full name.')
      return
    }

    if (showPhoneField && !regPhone.trim()) {
      setError('Please enter your phone number.')
      return
    }

    setLoading(true)
    setError('')

    const phoneNum = showPhoneField ? normalizePhone(regPhone, regCountryCode) : undefined

    const { error: regErr } = await completeRegistration(
      name,
      language,
      role,
      phoneNum,
      selectedLocationId
    )
    setLoading(false)

    if (regErr) {
      setError(regErr.message)
    } else {
      if (selectedLocationId) {
        document.cookie = `selected_location_id=${selectedLocationId}; path=/; max-age=3153600000;`
      }
      router.push(`/${locale}/home`)
    }
  }

  return (
    <div className="auth-page-wrap">
      {step !== 'complete_registration' ? (
        <>
          <div className="auth-page-header">
            <h1 className="auth-page-title">{t('auth.welcome_back')}</h1>
            <p className="auth-page-sub">{t('auth.signin_to_account')}</p>
          </div>

          {/* Login Mode Toggle Buttons */}
          {step === 'login' && (
            <div style={{
              display: 'flex',
              background: 'var(--neutral-100)',
              borderRadius: '12px',
              padding: '4px',
              gap: '4px',
              marginBottom: '1.5rem'
            }} className="auth-mode-toggle-wrap">
              <button
                type="button"
                onClick={() => { setMode('phone'); setError(''); }}
                style={{
                  flex: 1,
                  background: mode === 'phone' ? 'var(--wa-green-dark)' : 'transparent',
                  color: mode === 'phone' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '.55rem',
                  fontSize: '.85rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {t('auth.phone_login')}
              </button>
              <button
                type="button"
                onClick={() => { setMode('email'); setError(''); }}
                style={{
                  flex: 1,
                  background: mode === 'email' ? 'var(--wa-green-dark)' : 'transparent',
                  color: mode === 'email' ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '.55rem',
                  fontSize: '.85rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {t('auth.email_login')}
              </button>
            </div>
          )}

          {step === 'login' && (
            <form onSubmit={handlePasswordLogin} className="auth-form">
              {mode === 'phone' ? (
                /* Phone Input */
                <div className="form-group">
                  <label className="form-label" htmlFor="login-phone">{t('auth.phone')}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="form-input"
                      style={{ width: '100px', flexShrink: 0, cursor: 'pointer' }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+968">🇴🇲 +968</option>
                      <option value="+974">🇶🇦 +974</option>
                      <option value="+973">🇧🇭 +973</option>
                      <option value="+965">🇰🇼 +965</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                    </select>
                    <div className="input-icon-wrap" style={{ flex: 1 }}>
                      <Phone size={16} className="input-icon" />
                    <input
                        id="login-phone"
                        className="form-input input-with-icon"
                        type="tel"
                        placeholder="9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        autoComplete="tel"
                        autoFocus
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Email Input */
                <div className="form-group">
                  <label className="form-label" htmlFor="login-email">{t('auth.email')}</label>
                  <div className="input-icon-wrap">
                    <Globe size={16} className="input-icon" />
                    <input
                      id="login-email"
                      className="form-input input-with-icon"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Password Input */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="login-password">{t('auth.password')}</label>
                  <Link href="/forgot-password" style={{ fontSize: '.8rem', color: 'var(--wa-green-dark)', fontWeight: 600, textDecoration: 'none', marginBottom: '.3rem' }}>
                    {t('auth.forgot_password')}
                  </Link>
                </div>
                <div className="input-icon-wrap">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="login-password"
                    className="form-input input-with-icon"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="input-eye"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="auth-alert auth-alert-error" role="alert"
                  style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}

              <button
                id="btn-login-pw"
                type="submit"
                className="btn btn-primary btn-full auth-submit-btn"
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : t('auth.sign_in')}
              </button>
            </form>
          )}

          <p className="auth-footer-text">
            {t('auth.dont_have_account_create').split('?')[0] + '? '}
            <Link href="/signup" className="auth-link">
              {t('auth.dont_have_account_create').split('?')[1]?.trim()}
            </Link>
          </p>
        </>
      ) : (
        <>
          <div className="auth-page-header">
            <h1 className="auth-page-title">{t('auth.complete_registration')}</h1>
            <p className="auth-page-sub">{t('auth.few_details_setup')}</p>
          </div>

          <form onSubmit={handleCompleteRegistration} className="auth-form">
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">{t('auth.name')}</label>
              <div className="input-icon-wrap">
                <User size={16} className="input-icon" />
                <input
                  id="reg-name"
                  className="form-input input-with-icon"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoFocus
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Language Selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-lang">{t('auth.preferred_language')}</label>
              <div className="input-icon-wrap">
                <Globe size={16} className="input-icon" />
                <select
                  id="reg-lang"
                  className="form-input input-with-icon"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  required
                >
                  <option value="en">English</option>
                  <option value="ar">العربية (Arabic)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="ml">Malayalam</option>
                </select>
              </div>
            </div>

            {/* Location Selection */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-location">{t('auth.village_location')}</label>
              <div className="input-icon-wrap">
                <Globe size={16} className="input-icon" />
                <select
                  id="reg-location"
                  className="form-input input-with-icon"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  required
                >
                  {locations.length === 0 ? (
                    <option value="" disabled>{t('auth.loading_locations')}</option>
                  ) : (
                    locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Phone Number (Show only if logged in with email and phone is missing) */}
            {showPhoneField && (
              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">{t('auth.phone')}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={regCountryCode}
                    onChange={(e) => setRegCountryCode(e.target.value)}
                    className="form-input"
                    style={{ width: '100px', flexShrink: 0, cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+971">🇦🇪 +971</option>
                    <option value="+966">🇸🇦 +966</option>
                    <option value="+968">🇴🇲 +968</option>
                    <option value="+974">🇶🇦 +974</option>
                    <option value="+973">🇧🇭 +973</option>
                    <option value="+965">🇰🇼 +965</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <div className="input-icon-wrap" style={{ flex: 1 }}>
                    <Phone size={16} className="input-icon" />
                    <input
                      id="reg-phone"
                      className="form-input input-with-icon"
                      type="tel"
                      placeholder="9876543210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            )}



            {error && (
              <div className="auth-alert auth-alert-error" role="alert"
                style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            <button
              id="btn-complete-reg"
              type="submit"
              className="btn btn-primary btn-full auth-submit-btn"
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : t('auth.complete_setup')}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

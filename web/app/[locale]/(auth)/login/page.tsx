'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Phone, Lock, Eye, EyeOff, AlertCircle, Info, KeyRound, User, Globe, Users, ArrowLeft } from 'lucide-react'
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
  const { t, setLocale } = useTranslation()

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
  
  const [showPw, setShowPw] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
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
          <div className="auth-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button type="button" className="auth-back-btn" onClick={() => router.back()} aria-label="Go back">
              <ArrowLeft size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid var(--border)' }}>
              <Globe size={15} style={{ color: 'var(--wa-green-dark)' }} />
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as any)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="ml">🇮🇳 മലയാളം</option>
                <option value="en">🇬🇧 English</option>
                <option value="ar">🇸🇦 العربية</option>
                <option value="hi">🇮🇳 हिंदी</option>
              </select>
            </div>
          </div>


          <div className="auth-page-header">
            <h1 className="auth-page-title">{t('auth.sign_in_your_account') || 'Sign In Your Account'}</h1>
            <p className="auth-page-sub">{t('auth.signin_subtitle') || 'Welcome back! Please enter your details to sign in and continue.'}</p>
          </div>

          {/* Login Mode Toggle Buttons */}
          {step === 'login' && (
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: '999px',
              padding: '4px',
              gap: '4px',
              marginBottom: '1.25rem'
            }} className="auth-mode-toggle-wrap">
              <button
                type="button"
                onClick={() => { setMode('phone'); setError(''); }}
                style={{
                  flex: 1,
                  background: mode === 'phone' ? '#2e5b28' : 'transparent',
                  color: mode === 'phone' ? '#fff' : '#64748b',
                  border: 'none',
                  padding: '.5rem',
                  fontSize: '.85rem',
                  fontWeight: 700,
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {t('auth.phone_login') || 'Phone'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('email'); setError(''); }}
                style={{
                  flex: 1,
                  background: mode === 'email' ? '#2e5b28' : 'transparent',
                  color: mode === 'email' ? '#fff' : '#64748b',
                  border: 'none',
                  padding: '.5rem',
                  fontSize: '.85rem',
                  fontWeight: 700,
                  borderRadius: '999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {t('auth.email_login') || 'Email'}
              </button>
            </div>
          )}

          {step === 'login' && (
            <form onSubmit={handlePasswordLogin} className="auth-form">
              {mode === 'phone' ? (
                /* Phone Input */
                <div className="form-group">
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="form-input"
                      style={{ width: '95px', flexShrink: 0, cursor: 'pointer', borderRadius: '14px' }}
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
                        placeholder={t('auth.placeholder_phone') || 'Phone Number'}
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
                  <div className="input-icon-wrap">
                    <Globe size={16} className="input-icon" />
                    <input
                      id="login-email"
                      className="form-input input-with-icon"
                      type="email"
                      placeholder={t('auth.placeholder_email') || 'Email Address'}
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
                <div className="input-icon-wrap">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="login-password"
                    className="form-input input-with-icon"
                    type={showPw ? 'text' : 'password'}
                    placeholder={t('auth.placeholder_password') || 'Password'}
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

              {/* Remember Me Checkbox & Forgot Password */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.2rem 0' }}>
                <label className="auth-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>{t('auth.remember_me') || 'Remember Me'}</span>
                </label>
                <Link href="/forgot-password" style={{ fontSize: '.82rem', color: '#2e5b28', fontWeight: 600, textDecoration: 'none' }}>
                  {t('auth.forgot_password') || 'Forgot Password?'}
                </Link>
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
                {loading ? <span className="spinner" /> : (t('auth.sign_in') || 'Sign In')}
              </button>
            </form>
          )}

          {/* Social Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Social Buttons */}
          <div className="social-btn-row">
            <button type="button" className="social-btn" title="Sign in with Google">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </button>
            <button type="button" className="social-btn" title="Sign in with Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
          </div>

          <p className="auth-footer-text">
            {t('auth.dont_have_account') || "Don't Have An Account?"}{' '}
            <Link href={`/${locale}/signup`} className="auth-link">
              {t('auth.sign_up') || 'Sign Up'}
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

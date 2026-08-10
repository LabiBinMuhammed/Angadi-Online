'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Phone, Lock, Eye, EyeOff, AlertCircle, Info, KeyRound, User, Globe, Users, MapPin, ArrowLeft } from 'lucide-react'
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

export default function SignupPage() {
  const { t, setLocale } = useTranslation()

  const { user, session, signUp } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'en'
  
  // Form states
  const [fullName, setFullName] = useState('')
  const [language, setLanguage] = useState('en')
  const [role, setRole] = useState('customer')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [locations, setLocations] = useState<any[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [mode, setMode] = useState<'phone' | 'email'>('phone')
  
  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // Load locations on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.from('locations').select('id, name').order('name').then(({ data }) => {
      if (data) {
        setLocations(data)
        if (data.length > 0) {
          setSelectedLocationId(data[0].id)
        }
      }
    })
  }, [])

  // Handle Signup
  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    setInfo('')

    const name = fullName.trim()
    if (!name) {
      setError('Please enter your full name.')
      return
    }

    if (mode === 'phone') {
      if (!phone.trim()) {
        setError('Please enter your phone number.')
        return
      }
    } else {
      if (!email.trim()) {
        setError('Please enter your email address.')
        return
      }
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError('Please enter a valid email address.')
        return
      }
    }

    if (!password) {
      setError('Please enter a password.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    const normalizedPhoneNum = mode === 'phone' ? normalizePhone(phone, countryCode) : undefined
    const emailVal = mode === 'email' ? email.trim() : undefined

    try {
      const { data, error: authErr } = await signUp({
        email: emailVal,
        phone: normalizedPhoneNum,
        password: password,
        name,
        role,
        language,
        locationId: selectedLocationId || undefined
      })

      if (authErr) {
        if (authErr.message.toLowerCase().includes('already registered') || authErr.message.toLowerCase().includes('already been registered')) {
          setError('This email or phone number is already registered. Please sign in instead.')
        } else {
          setError(authErr.message)
        }
      } else {
        if (data?.session) {
          router.push(`/${locale}/home`)
        } else {
          setInfo('Sign up successful! If you registered via email, please check your inbox for a confirmation link.')
        }
      }
    } catch (err: any) {
      setError('A network error occurred. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const [agreeTerms, setAgreeTerms] = useState(true)

  return (
    <div className="auth-page-wrap">
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
        <h1 className="auth-page-title">{t('auth.sign_up_your_account') || 'Sign Up Your Account'}</h1>
        <p className="auth-page-sub">{t('auth.signup_subtitle') || 'Join Angadi Online today to start shopping fresh groceries from local vendors.'}</p>
      </div>

      <form onSubmit={handleSignup} className="auth-form">
        {/* Full Name */}
        <div className="form-group">
          <div className="input-icon-wrap">
            <User size={16} className="input-icon" />
            <input
              id="signup-name"
              className="form-input input-with-icon"
              type="text"
              placeholder={t('auth.placeholder_full_name') || 'Full Name'}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
              autoComplete="name"
              disabled={loading}
            />
          </div>
        </div>


        {/* Preferred Language */}
        <div className="form-group">
          <div className="input-icon-wrap">
            <Globe size={16} className="input-icon" />
            <select
              id="signup-lang"
              className="form-input input-with-icon"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              required
              disabled={loading}
              style={{ cursor: 'pointer' }}
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
          <div className="input-icon-wrap">
            <MapPin size={16} className="input-icon" />
            <select
              id="signup-location"
              className="form-input input-with-icon"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              required
              disabled={loading || locations.length === 0}
              style={{ cursor: 'pointer' }}
            >
              {locations.length === 0 ? (
                <option value="">{t('auth.loading_locations') || 'Loading locations...'}</option>
              ) : (
                locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Signup Method Toggle */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: '999px',
          padding: '4px',
          gap: '4px',
          margin: '0.2rem 0'
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
            {t('auth.use_phone') || 'Phone'}
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
            {t('auth.use_email') || 'Email'}
          </button>
        </div>

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
                  id="signup-phone"
                  className="form-input input-with-icon"
                  type="tel"
                  placeholder={t('auth.placeholder_phone') || 'Phone Number'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
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
                id="signup-email"
                className="form-input input-with-icon"
                type="email"
                placeholder={t('auth.placeholder_email') || 'Email Address'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              id="signup-password"
              className="form-input input-with-icon"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.placeholder_password') || 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="new-password"
            />

            <button
              type="button"
              className="input-eye"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Terms and Conditions Checkbox */}
        <label className="auth-checkbox-wrap" style={{ margin: '0.2rem 0' }}>
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            required
          />
          <span>
            {t('auth.agree_terms') || 'I agree to the'}{' '}
            <a href="#" style={{ color: '#2e5b28', fontWeight: 700, textDecoration: 'underline' }} onClick={(e) => e.preventDefault()}>
              {t('auth.terms_conditions') || 'terms & conditions'}
            </a>
          </span>
        </label>

        {error && (
          <div className="auth-alert auth-alert-error" role="alert"
            style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        {info && (
          <div className="auth-alert auth-alert-info" role="alert"
            style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <Info size={16} style={{ flexShrink: 0 }} /> {info}
          </div>
        )}

        <button
          id="btn-signup-submit"
          type="submit"
          className="btn btn-primary btn-full auth-submit-btn"
          disabled={loading || !agreeTerms}
        >
          {loading ? <span className="spinner" /> : (t('auth.sign_up') || 'Sign Up')}
        </button>
      </form>

      {/* Social Divider */}
      <div className="auth-divider">
        <span>or</span>
      </div>

      {/* Social Buttons */}
      <div className="social-btn-row">
        <button type="button" className="social-btn" title="Sign up with Google">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
        </button>
        <button type="button" className="social-btn" title="Sign up with Facebook">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </button>
      </div>

      <p className="auth-footer-text">
        {t('auth.already_have_account_question') || 'Already Have An Account?'}{' '}
        <Link href={`/${locale}/login`} className="auth-link">
          {t('auth.sign_in') || 'Sign In'}
        </Link>
      </p>
    </div>
  )
}

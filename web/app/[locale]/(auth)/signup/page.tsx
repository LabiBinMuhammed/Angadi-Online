'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { Phone, Lock, Eye, EyeOff, AlertCircle, Info, KeyRound, User, Globe, Users } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'

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
  const { user, session, signUp } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'en'
  
  // Form states
  const [fullName, setFullName] = useState('')
  const [language, setLanguage] = useState('en')
  const [role, setRole] = useState('customer')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [email, setEmail] = useState('')
  const [mode, setMode] = useState<'phone' | 'email'>('phone')
  
  // UI states
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  function validatePassword(pw: string): boolean {
    if (pw.length < 8) return false
    if (!/[A-Z]/.test(pw)) return false
    if (!/[a-z]/.test(pw)) return false
    if (!/[0-9]/.test(pw)) return false
    return true
  }

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

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.')
      return
    }

    setLoading(true)
    const normalizedPhoneNum = mode === 'phone' ? normalizePhone(phone, countryCode) : undefined
    const emailVal = mode === 'email' ? email.trim() : undefined

    try {
      const { data, error: authErr } = await signUp({
        email: emailVal,
        phone: normalizedPhoneNum,
        password,
        name,
        role,
        language
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

  return (
    <div className="auth-page-wrap">
      <div className="auth-page-header">
        <h1 className="auth-page-title">Create account</h1>
        <p className="auth-page-sub">Join Angadi Online — enter details to get started</p>
      </div>

      <form onSubmit={handleSignup} className="auth-form">
        {/* Full Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-name">Full name</label>
          <div className="input-icon-wrap">
            <User size={16} className="input-icon" />
            <input
              id="signup-name"
              className="form-input input-with-icon"
              type="text"
              placeholder="Your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
              autoComplete="name"
              disabled={loading}
            />
          </div>
        </div>

        {/* Language Selection */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-lang">Preferred Language</label>
          <div className="input-icon-wrap">
            <Globe size={16} className="input-icon" />
            <select
              id="signup-lang"
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

        {/* Account Type / Role */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-role">Account Type</label>
          <div className="input-icon-wrap">
            <Users size={16} className="input-icon" />
            <select
              id="signup-role"
              className="form-input input-with-icon"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="customer">Customer</option>
              <option value="shop_owner">Shop Owner</option>
            </select>
          </div>
        </div>

        {/* Signup Method Toggle */}
        <div style={{ display: 'flex', gap: '.5rem', margin: '1.25rem 0 .75rem 0' }}>
          <button
            type="button"
            className={`btn btn-full ${mode === 'phone' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setMode('phone'); setError(''); }}
            style={{
              background: mode === 'phone' ? 'var(--wa-green-dark)' : 'transparent',
              color: mode === 'phone' ? '#fff' : 'var(--text-base)',
              border: '1px solid var(--wa-green-dark)',
              padding: '.5rem',
              fontSize: '.85rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)'
            }}
          >
            Use Phone Number
          </button>
          <button
            type="button"
            className={`btn btn-full ${mode === 'email' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setMode('email'); setError(''); }}
            style={{
              background: mode === 'email' ? 'var(--wa-green-dark)' : 'transparent',
              color: mode === 'email' ? '#fff' : 'var(--text-base)',
              border: '1px solid var(--wa-green-dark)',
              padding: '.5rem',
              fontSize: '.85rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)'
            }}
          >
            Use Email Address
          </button>
        </div>

        {mode === 'phone' ? (
          /* Phone Input */
          <div className="form-group">
            <label className="form-label" htmlFor="signup-phone">Phone number</label>
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
                  id="signup-phone"
                  className="form-input input-with-icon"
                  type="tel"
                  placeholder="9876543210"
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
            <label className="form-label" htmlFor="signup-email">Email Address</label>
            <div className="input-icon-wrap">
              <Globe size={16} className="input-icon" />
              <input
                id="signup-email"
                className="form-input input-with-icon"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-password">Password</label>
          <div className="input-icon-wrap">
            <Lock size={16} className="input-icon" />
            <input
              id="signup-password"
              className="form-input input-with-icon"
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 8 characters with Upper, Lower & Number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : 'Register'}
        </button>
      </form>

      <p className="auth-footer-text">
        Already have an account?{' '}
        <Link href="/login" className="auth-link">Sign in</Link>
      </p>
    </div>
  )
}

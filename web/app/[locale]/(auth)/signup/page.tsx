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
  const { user, session, signInWithOtp, verifyOtp, completeRegistration } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || 'en'
  
  // Form states
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'signup' | 'otp_verify' | 'complete_registration'>('signup')
  
  // Registration completion states
  const [fullName, setFullName] = useState('')
  const [language, setLanguage] = useState('en')
  const [role, setRole] = useState('customer')
  const [newPassword, setNewPassword] = useState('')
  
  // UI states
  const [showNewPw, setShowNewPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])



  // Helper to check profile and redirect or show registration completion
  async function checkProfileAndRedirect(userId: string) {
    const supabase = createClient()
    const { data: userRow } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .maybeSingle()

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
  }

  // Handle Send OTP (Signup start)
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!phone.trim()) {
      setError('Please enter your phone number.')
      return
    }

    setLoading(true)
    setError('')
    setInfo('')

    const { error: authErr } = await signInWithOtp(normalizePhone(phone, countryCode))
    setLoading(false)

    if (authErr) {
      setError(authErr.message)
    } else {
      setInfo('Verification code sent to your phone.')
      setStep('otp_verify')
      setCountdown(60)
    }
  }

  // Handle Verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP code.')
      return
    }

    setLoading(true)
    setError('')
    setInfo('')

    const { data, error: authErr } = await verifyOtp(normalizePhone(phone, countryCode), otp.trim())
    
    if (authErr) {
      setLoading(false)
      setError(authErr.message)
    } else if (data.user) {
      await checkProfileAndRedirect(data.user.id)
      setLoading(false)
    } else {
      setLoading(false)
      setError('Verification failed. Invalid OTP.')
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
    if (newPassword && newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    setError('')
    setInfo('')

    const { error: regErr } = await completeRegistration(
      name,
      language,
      role,
      newPassword || undefined
    )
    setLoading(false)

    if (regErr) {
      setError(regErr.message)
    } else {
      router.push(`/${locale}/home`)
    }
  }

  return (
    <div className="auth-page-wrap">
      {step !== 'complete_registration' ? (
        <>
          <div className="auth-page-header">
            <h1 className="auth-page-title">Create account</h1>
            <p className="auth-page-sub">Join Village Market — verify your phone number to start</p>
          </div>

          {step === 'signup' && (
            <form onSubmit={handleSendOtp} className="auth-form">
              {/* Phone Input */}
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
                      autoComplete="tel"
                      autoFocus
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="auth-alert auth-alert-error" role="alert"
                  style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}

              <button
                id="btn-signup-otp"
                type="submit"
                className="btn btn-primary btn-full auth-submit-btn"
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Send Verification OTP'}
              </button>
            </form>
          )}

          {step === 'otp_verify' && (
            <form onSubmit={handleVerifyOtp} className="auth-form">
              {/* OTP Input */}
              <div className="form-group">
                <label className="form-label" htmlFor="signup-otp">Verification Code</label>
                <div className="input-icon-wrap">
                  <KeyRound size={16} className="input-icon" />
                  <input
                    id="signup-otp"
                    className="form-input input-with-icon"
                    type="text"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    autoFocus
                  />
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

              {/* Resend option */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Didn&apos;t receive code?</span>
                {countdown > 0 ? (
                  <span style={{ color: 'var(--wa-teal)', fontWeight: 600 }}>Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                id="btn-verify-otp"
                type="submit"
                className="btn btn-primary btn-full auth-submit-btn"
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : 'Verify Code'}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-full"
                onClick={() => { setStep('signup'); setOtp(''); setError(''); }}
                style={{ padding: '.85rem', fontSize: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 700 }}
              >
                Back
              </button>
            </form>
          )}

          <p className="auth-footer-text">
            Already have an account?{' '}
            <Link href="/login" className="auth-link">Sign in</Link>
          </p>
        </>
      ) : (
        <>
          <div className="auth-page-header">
            <h1 className="auth-page-title">Complete registration</h1>
            <p className="auth-page-sub">Just a few details to set up your account</p>
          </div>

          <form onSubmit={handleCompleteRegistration} className="auth-form">
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full name</label>
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
              <label className="form-label" htmlFor="reg-lang">Preferred Language</label>
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

            {/* Account Type / Role */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-role">Account Type</label>
              <div className="input-icon-wrap">
                <Users size={16} className="input-icon" />
                <select
                  id="reg-role"
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

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password (Optional, for password login)</label>
              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  id="reg-password"
                  className="form-input input-with-icon"
                  type={showNewPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                />
                <button
                  type="button"
                  className="input-eye"
                  onClick={() => setShowNewPw(!showNewPw)}
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>
                Setting a password allows you to sign in with your password in the future.
              </p>
            </div>

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
              {loading ? <span className="spinner" /> : 'Complete Setup'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

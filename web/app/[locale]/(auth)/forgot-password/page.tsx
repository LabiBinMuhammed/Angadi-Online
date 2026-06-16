'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Phone, Lock, Eye, EyeOff, AlertCircle, Info, CheckCircle, KeyRound } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState(1) // 1: Send OTP, 2: Verify OTP, 3: Set Password, 4: Success
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
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

  const normalizePhone = (phone: string, defaultCountryCode: string = '+91'): string => {
    let cleaned = phone.replace(/[\s\-\(\)]/g, '')
    if (!cleaned) return ''
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

    const supabase = createClient()
    try {
      const { error: authErr } = await supabase.auth.signInWithOtp({
        phone: normalizePhone(phone, countryCode)
      })

      if (authErr) {
        setError(authErr.message)
      } else {
        setInfo('OTP code sent to your phone.')
        setStep(2)
        setCountdown(60)
      }
    } catch (err: any) {
      setError('Failed to send OTP. Please check your network connection.')
    } finally {
      setLoading(false)
    }
  }

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

    const supabase = createClient()
    try {
      const { data, error: authErr } = await supabase.auth.verifyOtp({
        phone: normalizePhone(phone, countryCode),
        token: otp.trim(),
        type: 'sms'
      })

      if (authErr) {
        setError(authErr.message)
      } else if (data.session) {
        setInfo('Phone verified. Please set your new password.')
        setStep(3)
      } else {
        setError('Verification failed. Invalid OTP.')
      }
    } catch (err: any) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    setInfo('')

    const supabase = createClient()
    try {
      const { error: authErr } = await supabase.auth.updateUser({
        password: password
      })

      if (authErr) {
        setError(authErr.message)
      } else {
        setStep(4)
      }
    } catch (err: any) {
      setError('Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-wrap">
      <div className="auth-page-header">
        <h1 className="auth-page-title">Reset password</h1>
        <p className="auth-page-sub">
          {step === 1 && 'Enter your phone number to receive a verification code'}
          {step === 2 && 'Enter the 6-digit verification code sent to your phone'}
          {step === 3 && 'Choose a secure new password for your account'}
          {step === 4 && 'Your password has been successfully updated'}
        </p>
      </div>

      {step === 1 && (
        <form onSubmit={handleSendOtp} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="reset-phone">Phone number</label>
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
                  id="reset-phone"
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
            id="btn-send-otp"
            type="submit"
            className="btn btn-primary btn-full auth-submit-btn"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Send Reset OTP'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="reset-otp">Verification Code</label>
            <div className="input-icon-wrap">
              <KeyRound size={16} className="input-icon" />
              <input
                id="reset-otp"
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
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="new-password">New Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="new-password"
                className="form-input input-with-icon"
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              <button
                type="button"
                className="input-eye"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="confirm-password"
                className="form-input input-with-icon"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-eye"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
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
            id="btn-save-pw"
            type="submit"
            className="btn btn-primary btn-full auth-submit-btn"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Save Password'}
          </button>
        </form>
      )}

      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--wa-green)' }}>
            <CheckCircle size={64} />
          </div>
          <div className="auth-alert auth-alert-success" role="alert" style={{ textAlign: 'center' }}>
            Your password has been successfully reset. You can now log in using your new password.
          </div>
          <Link href="/login" className="btn btn-primary btn-full auth-submit-btn" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none' }}>
            Go to Login
          </Link>
        </div>
      )}

      {step < 4 && (
        <p className="auth-footer-text">
          Remember your password?{' '}
          <Link href="/login" className="auth-link">Sign in</Link>
        </p>
      )}
    </div>
  )
}

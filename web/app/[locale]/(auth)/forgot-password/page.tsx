'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Phone, AlertCircle, Info, CheckCircle, Globe } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function ForgotPasswordPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'en'
  
  const [mode, setMode] = useState<'phone' | 'email'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    setInfo('')

    if (mode === 'phone') {
      // For phone accounts: Display standard placeholder alert
      setInfo('Phone password reset will be available in a future update.')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    try {
      const resetRedirectUrl = `${window.location.origin}/${locale}/reset-password`
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: resetRedirectUrl,
      })

      if (resetErr) {
        setError(resetErr.message)
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError('Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-wrap">
      <div className="auth-page-header">
        <h1 className="auth-page-title">Reset password</h1>
        <p className="auth-page-sub">
          {!success ? 'Enter your details to receive password reset instructions' : 'Check your inbox for a reset link'}
        </p>
      </div>

      {!success ? (
        <form onSubmit={handleResetRequest} className="auth-form">
          {/* Reset Mode Toggle */}
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className={`btn btn-full ${mode === 'email' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setMode('email'); setError(''); setInfo(''); }}
              style={{
                background: mode === 'email' ? 'var(--wa-green-dark)' : 'transparent',
                color: mode === 'email' ? '#fff' : 'var(--text-base)',
                border: '1px solid var(--wa-green-dark)',
                padding: '.6rem',
                fontSize: '.9rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)'
              }}
            >
              Email Accounts
            </button>
            <button
              type="button"
              className={`btn btn-full ${mode === 'phone' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => { setMode('phone'); setError(''); setInfo(''); }}
              style={{
                background: mode === 'phone' ? 'var(--wa-green-dark)' : 'transparent',
                color: mode === 'phone' ? '#fff' : 'var(--text-base)',
                border: '1px solid var(--wa-green-dark)',
                padding: '.6rem',
                fontSize: '.9rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-md)'
              }}
            >
              Phone Accounts
            </button>
          </div>

          {mode === 'phone' ? (
            /* Phone Input */
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
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Email Input */
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Email Address</label>
              <div className="input-icon-wrap">
                <Globe size={16} className="input-icon" />
                <input
                  id="reset-email"
                  className="form-input input-with-icon"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>
          )}

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
            id="btn-reset-submit"
            type="submit"
            className="btn btn-primary btn-full auth-submit-btn"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : mode === 'email' ? 'Send Reset Link' : 'Reset Password'}
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--wa-green)' }}>
            <CheckCircle size={64} />
          </div>
          <div className="auth-alert auth-alert-success" role="alert" style={{ textAlign: 'center' }}>
            A password reset link has been successfully sent to <strong>{email}</strong>. Please check your inbox and spam folders.
          </div>
          <Link href="/login" className="btn btn-primary btn-full auth-submit-btn" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none' }}>
            Go to Login
          </Link>
        </div>
      )}

      <p className="auth-footer-text">
        Remember your password?{' '}
        <Link href="/login" className="auth-link">Sign in</Link>
      </p>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Users, Lock, KeyRound, Eye, EyeOff, AlertCircle } from 'lucide-react'

type Step = 'form' | 'verify'

export default function SignupPage() {
  const [step, setStep]   = useState<Step>('form')
  const [form, setForm]   = useState({ name: '', email: '', password: '', confirm: '', role: 'customer' })
  const [showPw, setShowPw]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const name  = form.name.trim()
    const email = form.email.trim().toLowerCase()

    if (!name) { setError('Please enter your full name.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          name,
          full_name: name,
          role: form.role,
        },
        // emailRedirectTo: undefined  // uses Supabase project's Site URL
      },
    })

    setLoading(false)

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('User already')) {
        setError('This email is already registered. Try signing in instead.')
      } else {
        setError(authError.message)
      }
      return
    }

    // When email confirm is OFF, Supabase immediately sets a session cookie.
    // We navigate to /home — the proxy will redirect to /login if session is missing.
    // Using window.location for a full page reload so the server picks up the new cookie.
    window.location.href = '/home'
  }

  /* ── Verify email step ────────────────────────── */
  if (step === 'verify') {
    return (
      <div className="auth-page-wrap">
        <div className="verify-icon">📬</div>
        <h1 className="auth-page-title">Check your inbox</h1>
        <p className="verify-text">
          We sent a confirmation email to <strong>{form.email}</strong>. Click the link in the
          email to activate your account.
        </p>
        <div className="auth-alert auth-alert-info" style={{ marginTop: '1.25rem' }}>
          Didn&apos;t receive it? Check spam or{' '}
          <button
            className="auth-link-btn"
            onClick={() => setStep('form')}
          >
            try a different email
          </button>
          .
        </div>
        <p className="auth-footer-text" style={{ marginTop: '1.5rem' }}>
          Already confirmed?{' '}
          <Link href="/login" className="auth-link">Sign in</Link>
        </p>

      </div>
    )
  }

  /* ── Registration form ────────────────────────── */
  const pwStrength = getPasswordStrength(form.password)

  return (
    <div className="auth-page-wrap">
      <div className="auth-page-header">
        <h1 className="auth-page-title">Create account</h1>
        <p className="auth-page-sub">Join Village Market — it&apos;s free</p>
      </div>

      <form onSubmit={handleSignup} className="auth-form">
        {/* Full name */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-name">Full name</label>
          <div className="input-icon-wrap">
            <User size={16} className="input-icon" />
            <input
              id="signup-name"
              className="form-input input-with-icon"
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
              autoFocus
              autoComplete="name"
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-email">Email address</label>
          <div className="input-icon-wrap">
            <Mail size={16} className="input-icon" />
            <input
              id="signup-email"
              className="form-input input-with-icon"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Role Selection (For Testing) */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-role">Account Type</label>
          <div className="input-icon-wrap">
            <Users size={16} className="input-icon" />
            <select
              id="signup-role"
              className="form-input input-with-icon"
              value={form.role}
              onChange={(e) => update('role', e.target.value)}
              required
            >
              <option value="customer">Customer</option>
              <option value="shop_owner">Shop Owner</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-password">Password</label>
          <div className="input-icon-wrap">
            <Lock size={16} className="input-icon" />
            <input
              id="signup-password"
              className="form-input input-with-icon"
              type={showPw ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
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
          {/* Password strength meter */}
          {form.password.length > 0 && (
            <div className="pw-strength">
              <div className="pw-bar-row">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="pw-bar"
                    style={{
                      background: n <= pwStrength.score
                        ? pwStrength.color
                        : 'var(--neutral-200)',
                    }}
                  />
                ))}
              </div>
              <span className="pw-label" style={{ color: pwStrength.color }}>
                {pwStrength.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div className="form-group">
          <label className="form-label" htmlFor="signup-confirm">Confirm password</label>
          <div className="input-icon-wrap">
            <KeyRound size={16} className="input-icon" />
            <input
              id="signup-confirm"
              className="form-input input-with-icon"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat password"
              value={form.confirm}
              onChange={(e) => update('confirm', e.target.value)}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="input-eye"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {form.confirm.length > 0 && form.password !== form.confirm && (
            <p className="field-error">Passwords don&apos;t match</p>
          )}
        </div>

        {error && (
          <div className="auth-alert auth-alert-error" role="alert"
            style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <button
          id="btn-signup"
          type="submit"
          className="btn btn-primary btn-full auth-submit-btn"
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : 'Create Account'}
        </button>
      </form>

      <p className="auth-footer-text">
        Already have an account?{' '}
        <Link href="/login" className="auth-link">Sign in</Link>
      </p>

    </div>
  )
}

/* ── Helper: password strength ──────────────────── */
function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 4)  score++
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label: 'Weak',   color: '#ef4444' },
    { label: 'Weak',   color: '#ef4444' },
    { label: 'Fair',   color: '#f59e0b' },
    { label: 'Good',   color: '#22c55e' },
    { label: 'Strong', color: '#15803d' },
  ]
  return { score, ...map[score] }
}



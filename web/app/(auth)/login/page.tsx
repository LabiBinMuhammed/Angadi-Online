'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Info } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [info, setInfo]         = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    setLoading(false)

    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        setInfo('Please check your inbox and confirm your email address before signing in.')
      } else if (authError.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else {
        setError(authError.message)
      }
      return
    }

    if (data.user) {
      window.location.href = '/home'
    }
  }

  return (
    <div className="auth-page-wrap">
      <div className="auth-page-header">
        <h1 className="auth-page-title">Welcome back</h1>
        <p className="auth-page-sub">Sign in to your Village Market account</p>
      </div>

      <form onSubmit={handleLogin} className="auth-form">
        {/* Email */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email address</label>
          <div className="input-icon-wrap">
            <Mail size={16} className="input-icon" />
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
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
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
          id="btn-login"
          type="submit"
          className="btn btn-primary btn-full auth-submit-btn"
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : 'Sign In'}
        </button>
      </form>

      <p className="auth-footer-text">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="auth-link">Create one</Link>
      </p>
    </div>
  )
}

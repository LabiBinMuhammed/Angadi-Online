'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function validatePassword(pw: string): boolean {
    if (pw.length < 8) return false
    if (!/[A-Z]/.test(pw)) return false
    if (!/[a-z]/.test(pw)) return false
    if (!/[0-9]/.test(pw)) return false
    return true
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    try {
      const { error: resetErr } = await supabase.auth.updateUser({
        password: password
      })

      if (resetErr) {
        setError(resetErr.message)
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError('Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page-wrap">
      <div className="auth-page-header">
        <h1 className="auth-page-title">{t('auth.set_new_password')}</h1>
        <p className="auth-page-sub">
          {!success ? t('auth.choose_secure_pw') : t('auth.pw_updated_success')}
        </p>
      </div>

      {!success ? (
        <form onSubmit={handleResetPassword} className="auth-form">
          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="new-password">{t('auth.new_password')}</label>
            <div className="input-icon-wrap">
              <Lock size={16} className="input-icon" />
              <input
                id="new-password"
                className="form-input input-with-icon"
                type={showPw ? 'text' : 'password'}
                placeholder="Min. 8 characters with Upper, Lower & Number"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">{t('auth.confirm_password')}</label>
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
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
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
            {loading ? <span className="spinner" /> : t('auth.update_password')}
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--wa-green)' }}>
            <CheckCircle size={64} />
          </div>
          <div className="auth-alert auth-alert-success" role="alert" style={{ textAlign: 'center' }}>
            {t('auth.pw_updated_login_info')}
          </div>
          <Link href="/login" className="btn btn-primary btn-full auth-submit-btn" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none' }}>
            {t('auth.go_to_login')}
          </Link>
        </div>
      )}
    </div>
  )
}

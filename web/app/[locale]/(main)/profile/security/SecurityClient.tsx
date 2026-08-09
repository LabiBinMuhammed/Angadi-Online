'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { Phone, Lock, Eye, EyeOff, ShieldAlert, KeyRound, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

export default function SecurityClient({ initialPhone }: { initialPhone: string }) {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const { updatePassword, updatePhone, verifyPhoneChange, signOutAll } = useAuth()

  // Change Password states
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  // Change Phone states
  const [phone, setPhone] = useState(initialPhone)
  const [otp, setOtp] = useState('')
  const [phoneStep, setPhoneStep] = useState<1 | 2>(1) // 1: Input new phone, 2: Input OTP
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneSuccess, setPhoneSuccess] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Global Logout states
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Handle Change Password
  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (pwLoading) return
    if (password.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setPwError('Passwords do not match.')
      return
    }

    setPwLoading(true)
    setPwError('')
    setPwSuccess(false)

    const { error } = await updatePassword(password)
    setPwLoading(false)

    if (error) {
      setPwError(error.message)
    } else {
      setPwSuccess(true)
      setPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 5000)
    }
  }

  // Handle Send Phone OTP
  async function handlePhoneChangeRequest(e: React.FormEvent) {
    e.preventDefault()
    if (phoneLoading) return
    const targetPhone = phone.trim()
    if (!targetPhone) {
      setPhoneError('Please enter a valid phone number.')
      return
    }
    if (targetPhone === initialPhone) {
      setPhoneError('This is already your active phone number.')
      return
    }

    setPhoneLoading(true)
    setPhoneError('')
    setPhoneSuccess(false)

    const { error } = await updatePhone(targetPhone)
    setPhoneLoading(false)

    if (error) {
      setPhoneError(error.message)
    } else {
      setPhoneStep(2)
      setCountdown(60)
    }
  }

  // Handle Verify Phone OTP
  async function handlePhoneVerify(e: React.FormEvent) {
    e.preventDefault()
    if (phoneLoading) return
    if (otp.length !== 6) {
      setPhoneError('Please enter the 6-digit OTP code.')
      return
    }

    setPhoneLoading(true)
    setPhoneError('')

    const { error } = await verifyPhoneChange(phone.trim(), otp.trim())
    setPhoneLoading(false)

    if (error) {
      setPhoneError(error.message)
    } else {
      setPhoneSuccess(true)
      setPhoneStep(1)
      setOtp('')
      setTimeout(() => {
        setPhoneSuccess(false)
        router.refresh()
      }, 5000)
    }
  }

  // Handle Logout from All Devices
  async function handleLogoutAll() {
    if (!window.confirm(t('security.confirm_sign_out_all'))) {
      return
    }

    setLogoutLoading(true)
    setLogoutError('')

    const { error } = await signOutAll()
    setLogoutLoading(false)

    if (error) {
      setLogoutError(error.message)
    } else {
      window.location.href = `/${locale}/login`
    }
  }

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: '1rem 0 3rem' }}>
      {/* Back button */}
      <button
        onClick={() => router.back()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '.5rem',
          background: 'none',
          border: 'none',
          color: 'var(--wa-green-dark)',
          fontWeight: 700,
          cursor: 'pointer',
          marginBottom: '1.5rem',
          padding: 0
        }}
      >
        <ArrowLeft size={16} /> {t('security.back_to_profile')}
      </button>

      <h1 className="text-2xl font-bold" style={{ marginBottom: '1.5rem', color: 'var(--wa-teal)' }}>
        {t('security.title')}
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Section: Change Phone */}
        <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', color: 'var(--text-base)' }}>
            <Phone size={18} style={{ color: 'var(--wa-green-dark)' }} /> {t('security.change_phone')}
          </h2>

          {phoneSuccess && (
            <div className="auth-alert auth-alert-success" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
              <CheckCircle size={16} /> {t('security.phone_success')}
            </div>
          )}

          {phoneStep === 1 ? (
            <form onSubmit={handlePhoneChangeRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('security.active_phone')}</label>
                <div className="input-icon-wrap">
                  <Phone size={16} className="input-icon" style={{ color: 'var(--text-muted)' }} />
                  <input
                    className="form-input input-with-icon"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              {phoneError && (
                <div className="auth-alert auth-alert-error" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} /> {phoneError}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={phoneLoading}
                style={{ alignSelf: 'flex-start', background: 'var(--wa-green-dark)', color: '#fff', fontWeight: 600, padding: '.6rem 1.2rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
              >
                {phoneLoading ? t('security.sending') : t('security.request_phone_change')}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t('security.enter_verification_code').replace('{phone}', phone)}</label>
                <div className="input-icon-wrap">
                  <KeyRound size={16} className="input-icon" />
                  <input
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

              {phoneError && (
                <div className="auth-alert auth-alert-error" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} /> {phoneError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('security.didnt_receive_code')}</span>
                {countdown > 0 ? (
                  <span style={{ color: 'var(--wa-teal)', fontWeight: 600 }}>{t('security.resend_in').replace('{countdown}', countdown.toString())}</span>
                ) : (
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={handlePhoneChangeRequest}
                    disabled={phoneLoading}
                  >
                    {t('security.resend_otp')}
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => { setPhoneStep(1); setOtp(''); setPhoneError(''); }}
                  style={{ flex: 1, padding: '.6rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'transparent', cursor: 'pointer' }}
                >
                  {t('security.cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={phoneLoading}
                  style={{ flex: 1, background: 'var(--wa-green-dark)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}
                >
                  {phoneLoading ? t('security.verifying') : t('security.verify_change')}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Section: Change Password */}
        <div className="card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', color: 'var(--text-base)' }}>
            <Lock size={18} style={{ color: 'var(--wa-green-dark)' }} /> {t('security.change_password')}
          </h2>

          {pwSuccess && (
            <div className="auth-alert auth-alert-success" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
              <CheckCircle size={16} /> {t('security.password_success')}
            </div>
          )}

          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">{t('security.new_password')}</label>
              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input
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
              <label className="form-label">{t('security.confirm_new_password')}</label>
              <div className="input-icon-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  className="form-input input-with-icon"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

            {pwError && (
              <div className="auth-alert auth-alert-error" style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} /> {pwError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={pwLoading}
              style={{ alignSelf: 'flex-start', background: 'var(--wa-green-dark)', color: '#fff', fontWeight: 600, padding: '.6rem 1.2rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer' }}
            >
              {pwLoading ? t('security.saving') : t('security.update_password')}
            </button>
          </form>
        </div>

        {/* Section: Danger Zone (Global Logout) */}
        <div className="card" style={{ background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>
            <ShieldAlert size={18} /> {t('security.danger_zone')}
          </h2>
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            {t('security.danger_zone_desc')}
          </p>

          {logoutError && (
            <div className="auth-alert auth-alert-error" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} /> {logoutError}
            </div>
          )}

          <button
            onClick={handleLogoutAll}
            disabled={logoutLoading}
            style={{
              background: 'var(--danger)',
              color: '#fff',
              fontWeight: 700,
              padding: '.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background .15s'
            }}
          >
            {logoutLoading ? t('security.logging_out') : t('security.sign_out_all')}
          </button>
        </div>
      </div>
    </div>
  )
}

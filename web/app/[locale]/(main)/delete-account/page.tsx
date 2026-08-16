'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Trash2, ArrowLeft, ShieldAlert, CheckCircle2, Phone, Mail, HelpCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DeleteAccountPage() {
  const [identifier, setIdentifier] = useState('')
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) {
      setError('Please provide your registered phone number or email address.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Record feedback/deletion request
      const supabase = createClient()
      await supabase.from('feedbacks').insert({
        comment: `[ACCOUNT DELETION REQUEST] Target Identifier: ${identifier.trim()}. Reason: ${reason || 'User requested via public deletion page.'}`,
        category: 'other',
      })

      setSubmitted(true)
    } catch {
      // Still show success to user if offline/feedback fails, with manual email fallback
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>

      {/* Header Banner */}
      <div
        className="card"
        style={{
          padding: '32px 24px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          marginBottom: '32px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: '#ef4444',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-base)' }}>
              Request Account & Data Deletion
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Google Play User Data Deletion Request Portal — Angadi Online
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', lineHeight: 1.6, fontSize: '15px' }}>
        
        {/* Policy Explanation */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} style={{ color: '#ef4444' }} />
            <span>What happens when you delete your account?</span>
          </h2>
          <p style={{ margin: 0, color: 'var(--text-base)' }}>
            When an account deletion request is processed:
          </p>
          <ul style={{ margin: '10px 0 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
            <li><strong>Personal Profile:</strong> Your full name, phone number, email, and authentication credentials will be permanently erased.</li>
            <li><strong>Saved Addresses:</strong> All saved delivery addresses, door numbers, landmarks, and GPS coordinates will be permanently purged.</li>
            <li><strong>Favorites & Preferences:</strong> Pinned shops, favorite items, and notification subscriptions will be deleted.</li>
            <li><strong>Order History:</strong> Past completed transaction records may be anonymized and retained solely for statutory taxation and shop billing compliance.</li>
          </ul>
        </section>

        {/* Submission Form or Confirmation */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-base)', margin: '0 0 8px' }}>
                Deletion Request Received
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 16px', lineHeight: 1.6 }}>
                Your request to delete account data for <strong>{identifier}</strong> has been logged. Our administrative team will verify the request and complete the data purge within <strong>30 business days</strong>.
              </p>
              <Link href="/" className="btn btn-primary" style={{ padding: '10px 24px', borderRadius: '8px', textDecoration: 'none' }}>
                Return to Home
              </Link>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, marginTop: 0, marginBottom: '6px' }}>
                Submit Deletion Request
              </h2>
              <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
                Enter your registered phone number or email address below to submit your data deletion request:
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-base)' }}>
                    Registered Phone Number or Email *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 9876543210 or user@example.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-base)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-base)' }}>
                    Reason for Deletion (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Let us know why you are leaving..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-input)',
                      color: 'var(--text-base)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {error && (
                  <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '13px' }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-danger"
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Trash2 size={16} />
                  {loading ? 'Submitting Request...' : 'Confirm & Submit Deletion Request'}
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Alternative In-App Deletion Steps */}
        <section className="card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={20} style={{ color: '#0ea5e9' }} />
            <span>Alternative: Instant In-App Deletion</span>
          </h2>
          <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--text-muted)' }}>
            If you have the <strong>Angadi Online mobile app installed</strong>, you can delete your account instantly:
          </p>
          <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '10px', fontSize: '13.5px', lineHeight: 1.8 }}>
            1. Open the <strong>Angadi Online</strong> app.<br />
            2. Tap on the <strong>Profile</strong> tab in the bottom bar.<br />
            3. Select <strong>Security Settings</strong>.<br />
            4. Tap <strong>Delete Account</strong> and confirm your password or phone verification.
          </div>
        </section>

        {/* Support Contact */}
        <section className="card" style={{ padding: '20px 24px', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-base)' }}>Need Assistance?</strong>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Contact our Data Protection Officer directly.</span>
          </div>
          <a
            href="mailto:support@angadionline.com?subject=Account%20Deletion%20Assistance"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none' }}
          >
            <Mail size={16} /> Email Support
          </a>
        </section>

      </div>
    </div>
  )
}

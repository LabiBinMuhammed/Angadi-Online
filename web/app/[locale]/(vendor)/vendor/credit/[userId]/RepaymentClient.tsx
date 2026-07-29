'use client'

import { useState } from 'react'
import { recordRepaymentAction } from '@/app/actions/credit'
import { CreditCard, DollarSign, Calendar, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

type Repayment = {
  id: string
  amount: number
  recorded_at: string
  notes?: string
}

export default function RepaymentClient({ shopId, userId, initialRepayments }: { shopId: string; userId: string; initialRepayments: Repayment[] }) {
  const { t } = useTranslation()
  const [repayments, setRepayments] = useState<Repayment[]>(initialRepayments)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Please enter a valid amount greater than 0')
      }

      await recordRepaymentAction(shopId, userId, parsedAmount, notes)
      
      // Update local state list
      const newLog: Repayment = {
        id: Math.random().toString(),
        amount: parsedAmount,
        recorded_at: new Date().toISOString(),
        notes: notes
      }
      setRepayments(prev => [newLog, ...prev])
      
      setAmount('')
      setNotes('')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to record repayment. Ensure the database triggers are applied.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
      
      {/* Record Repayment Form */}
      <div className="vp-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <DollarSign size={20} color="#10b981" />
          <h2 className="vp-title" style={{ fontSize: '1.25rem', margin: 0 }}>{t('vendor_credit.record_repayment_title') || 'Record Repayment'}</h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>{t('vendor_credit.amount_label_with_currency') || 'Amount (₹)'}</label>
            <input
              type="number"
              step="0.01"
              required
              className="vp-input"
              placeholder="e.g. 1500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.35rem' }}>{t('vendor_credit.notes_reference_label') || 'Notes / Reference'}</label>
            <textarea
              className="vp-input"
              rows={3}
              placeholder="e.g. Cash payment received"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.9rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.9rem' }}>
              <CheckCircle size={16} /> {t('vendor_credit.repayment_success_message') || 'Repayment recorded successfully!'}
            </div>
          )}

          <button type="submit" className="vp-btn vp-btn-primary" disabled={loading}>
            {loading ? (t('vendor_credit.submitting_status') || 'Recording...') : (t('vendor_credit.submit_repayment_button') || 'Submit Repayment')}
          </button>
        </form>
      </div>

      {/* Repayment History Logs */}
      <div className="vp-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <CreditCard size={20} color="#8b5cf6" />
          <h2 className="vp-title" style={{ fontSize: '1.25rem', margin: 0 }}>{t('vendor_credit.repayment_history_title') || 'Repayment History'}</h2>
        </div>

        {repayments.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <Calendar size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('vendor_credit.no_repayments_yet_title') || 'No Repayments Yet'}</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{t('vendor_credit.no_repayments_yet_desc') || 'Repayment logs will be listed here once recorded.'}</p>
          </div>
        ) : (
          <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {repayments.map(r => (
              <div key={r.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>- ₹{r.amount}</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {new Date(r.recorded_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {r.notes && (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FileText size={12} /> {r.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

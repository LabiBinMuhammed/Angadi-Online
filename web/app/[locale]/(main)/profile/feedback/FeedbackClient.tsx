'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, AlertCircle, CheckCircle2, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/I18nContext'
import BackButton from '@/components/BackButton'

type Feedback = {
  id: string
  type: string
  rating: number | null
  message: string
  status: string
  created_at: string
  users?: { name: string } | null
}

interface Props {
  initialFeedbacks: Feedback[]
  userId: string
}

export default function FeedbackClient({ initialFeedbacks, userId }: Props) {
  const { t } = useTranslation()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks)
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit')

  // Form State
  const [type, setType] = useState('general')
  const [rating, setRating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!type) {
      setErrorMsg(t('feedback.type_required'))
      return
    }
    if (!message.trim()) {
      setErrorMsg(t('feedback.message_required'))
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    const supabase = createClient()
    const { data, error } = await supabase
      .from('feedbacks')
      .insert({
        user_id: userId,
        type,
        rating,
        message: message.trim(),
        status: 'new'
      })
      .select('*')
      .single()

    setSubmitting(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccess(true)
      if (data) {
        setFeedbacks(prev => [data as Feedback, ...prev])
      }
      // Reset form
      setType('general')
      setRating(null)
      setMessage('')
      // Switch tab to history after a brief delay
      setTimeout(() => {
        setSuccess(false)
        setActiveTab('history')
      }, 3000)
    }
  }

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    new:       { bg: '#eff6ff', color: '#1d4ed8', label: 'New' },
    in_review: { bg: '#fff7ed', color: '#c2410c', label: 'In Review' },
    resolved:  { bg: '#f0fdf4', color: '#15803d', label: 'Resolved' },
    closed:    { bg: '#f1f5f9', color: '#475569', label: 'Closed' }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: var(--bg-base); }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-base); transition: all 0.2s; }
        .back-btn:hover { background: var(--bg-muted); }
        .title { font-size: 28px; font-weight: 800; color: var(--text-base); margin: 0; letter-spacing: -0.5px; }
        
        .tabs { display: flex; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 4px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .tab-btn { flex: 1; padding: 12px; border: none; background: transparent; border-radius: 12px; font-size: 14px; font-weight: 700; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
        .tab-btn.active { background: var(--wa-green-light); color: var(--wa-green-dark); }
        
        .card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 24px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 24px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .form-label { font-size: 14px; font-weight: 700; color: var(--text-base); }
        .form-select { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-base); color: var(--text-base); font-size: 15px; font-weight: 600; outline: none; }
        .form-textarea { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-base); color: var(--text-base); font-size: 15px; font-weight: 500; min-height: 120px; resize: vertical; outline: none; }
        
        .star-container { display: flex; gap: 8px; align-items: center; margin: 4px 0; }
        .star-btn { background: transparent; border: none; cursor: pointer; padding: 4px; outline: none; transition: transform 0.1s; }
        .star-btn:hover { transform: scale(1.15); }
        
        .submit-btn { width: 100%; padding: 14px; border-radius: 14px; background: var(--wa-green-dark); color: #fff; border: none; font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(30,77,30,0.15); transition: all 0.2s; }
        .submit-btn:hover { background: #164016; }
        .submit-btn:disabled { background: var(--border); color: var(--text-muted); cursor: not-allowed; box-shadow: none; }
        
        .alert-error { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 14px; padding: 12px 16px; color: #991b1b; font-size: 14px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 16px; color: #15803d; font-size: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }

        .history-list { display: flex; flex-direction: column; gap: 16px; }
        .history-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 20px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 12px; }
        .history-card-header { display: flex; justify-content: space-between; align-items: center; }
        .history-type { font-size: 14px; font-weight: 700; color: var(--text-base); text-transform: capitalize; }
        .history-status-badge { padding: 4px 10px; border-radius: 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .history-message { font-size: 14px; color: var(--text-base); line-height: 1.5; white-space: pre-wrap; margin: 0; }
        .history-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted); font-weight: 500; border-top: 1px dashed var(--border); padding-top: 10px; }
        .history-date { font-weight: 500; }
      `}} />

      <div className="page-container">
        <div className="header">
          <BackButton fallbackHref={`/${locale}/profile`}>
            <ArrowLeft size={20} />
          </BackButton>
          <h1 className="title">{t('feedback.title')}</h1>
        </div>

        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
            onClick={() => setActiveTab('submit')}
          >
            {t('feedback.submit')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
            id="tab-feedback-history"
          >
            {t('feedback.history')} ({feedbacks.length})
          </button>
        </div>

        {activeTab === 'submit' ? (
          <div className="card">
            {success ? (
              <div className="alert-success">
                <CheckCircle2 size={36} strokeWidth={2.5} />
                <p style={{ margin: 0, fontWeight: 700 }}>{t('feedback.success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {errorMsg && (
                  <div className="alert-error">
                    <AlertCircle size={18} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="feedback-type" className="form-label">{t('feedback.type')} *</label>
                  <select
                    id="feedback-type"
                    className="form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="general">{t('feedback.general')}</option>
                    <option value="suggestion">{t('feedback.suggestion')}</option>
                    <option value="complaint">{t('feedback.complaint')}</option>
                    <option value="bug_report">{t('feedback.bug_report')}</option>
                    <option value="feature_request">{t('feedback.feature_request')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('feedback.rating')}</label>
                  <div className="star-container">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isHighlighted = hoveredRating !== null
                        ? starValue <= hoveredRating
                        : rating !== null && starValue <= rating
                      return (
                        <button
                          key={starValue}
                          type="button"
                          className="star-btn"
                          onMouseEnter={() => setHoveredRating(starValue)}
                          onMouseLeave={() => setHoveredRating(null)}
                          onClick={() => setRating(starValue)}
                        >
                          <Star
                            size={28}
                            color={isHighlighted ? '#f59e0b' : '#cbd5e1'}
                            fill={isHighlighted ? '#f59e0b' : 'transparent'}
                          />
                        </button>
                      )
                    })}
                    {rating && (
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '8px' }}>
                        {rating} / 5
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="feedback-message" className="form-label">{t('feedback.message')} *</label>
                  <textarea
                    id="feedback-message"
                    className="form-textarea"
                    placeholder={t('feedback.placeholder')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  id="submit-feedback-btn"
                  disabled={submitting || !message.trim()}
                >
                  <MessageSquare size={18} />
                  <span>{submitting ? t('common.loading') : t('feedback.submit')}</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="history-list">
            {feedbacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
                <MessageSquare size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontWeight: 600 }}>{t('feedback.empty_history')}</p>
              </div>
            ) : (
              feedbacks.map((f) => {
                const badge = statusColors[f.status] || { bg: '#f1f5f9', color: '#475569', label: f.status }
                const formattedType = t(`feedback.${f.type}`) || f.type
                return (
                  <div key={f.id} className="history-card" id={`fb-history-${f.id}`}>
                    <div className="history-card-header">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="history-type">{formattedType}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                          by {f.users?.name || 'Guest'}
                        </span>
                      </div>
                      <span className="history-status-badge" style={{ backgroundColor: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="history-message">{f.message}</p>

                    <div className="history-footer">
                      <div>
                        {f.rating ? (
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                            {[1, 2, 3, 4, 5].map((sv) => (
                              <Star
                                key={sv}
                                size={12}
                                color={sv <= f.rating! ? '#f59e0b' : '#cbd5e1'}
                                fill={sv <= f.rating! ? '#f59e0b' : 'transparent'}
                              />
                            ))}
                          </div>
                        ) : (
                          <span>—</span>
                        )}
                      </div>
                      <span className="history-date">
                        {new Date(f.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </>
  )
}

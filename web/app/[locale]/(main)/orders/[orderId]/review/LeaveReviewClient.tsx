'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MessageSquare, CheckCircle2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface Props {
  orderId: string
  shopId: string
  shopName: string
  userId: string
}

type RatingKey = 'quality' | 'delivery' | 'accuracy' | 'overall'

const sentimentMap: Record<number, { label: string; emoji: string; color: string }> = {
  1: { label: 'Poor', emoji: '😞', color: '#ef4444' },
  2: { label: 'Fair', emoji: '😐', color: '#f97316' },
  3: { label: 'Good', emoji: '🙂', color: '#eab308' },
  4: { label: 'Very Good', emoji: '😊', color: '#84cc16' },
  5: { label: 'Excellent', emoji: '🤩', color: '#22c55e' }
}

export default function LeaveReviewClient({ orderId, shopId, shopName, userId }: Props) {
  const { t, locale } = useTranslation()
  const router = useRouter()

  // Stepper state
  const [activeStep, setActiveStep] = useState(0)

  // Form ratings state
  const [ratings, setRatings] = useState<Record<RatingKey, number | null>>({
    quality: null,
    delivery: null,
    accuracy: null,
    overall: null
  })

  const [hoveredRatings, setHoveredRatings] = useState<Record<RatingKey, number | null>>({
    quality: null,
    delivery: null,
    accuracy: null,
    overall: null
  })

  // Descriptions for each rating
  const [descriptions, setDescriptions] = useState<Record<RatingKey, string>>({
    quality: '',
    delivery: '',
    accuracy: '',
    overall: ''
  })

  // UI state
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const steps: { key: RatingKey; label: string; question: string; placeholder: string }[] = [
    { key: 'quality', label: t('reviews.product_quality'), question: t('reviews.product_quality_question'), placeholder: t('reviews.product_quality_placeholder') },
    { key: 'delivery', label: t('reviews.delivery'), question: t('reviews.delivery_question'), placeholder: t('reviews.delivery_placeholder') },
    { key: 'accuracy', label: t('reviews.accuracy'), question: t('reviews.accuracy_question'), placeholder: t('reviews.accuracy_placeholder') },
    { key: 'overall', label: t('reviews.overall'), question: t('reviews.overall_question'), placeholder: t('reviews.overall_placeholder') }
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!ratings.quality || !ratings.delivery || !ratings.accuracy || !ratings.overall) {
      setErrorMsg(t('reviews.required_ratings'))
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    const supabase = createClient()
    const { error } = await supabase
      .from('shop_reviews')
      .insert({
        shop_id: shopId,
        user_id: userId,
        order_id: orderId,
        product_quality_rating: ratings.quality,
        delivery_experience_rating: ratings.delivery,
        delivery_timeliness_rating: ratings.delivery,
        order_accuracy_rating: ratings.accuracy,
        overall_experience_rating: ratings.overall,
        product_quality_description: descriptions.quality.trim() || null,
        product_quality_review: descriptions.quality.trim() || null,
        delivery_experience_description: descriptions.delivery.trim() || null,
        delivery_timeliness_review: descriptions.delivery.trim() || null,
        order_accuracy_description: descriptions.accuracy.trim() || null,
        order_accuracy_review: descriptions.accuracy.trim() || null,
        overall_experience_description: descriptions.overall.trim() || null,
        overall_experience_review: descriptions.overall.trim() || null,
        title: null,
        review: null
      })

    setSubmitting(false)

    if (error) {
      setErrorMsg(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push(`/${locale}/orders/${orderId}`)
        router.refresh()
      }, 2500)
    }
  }

  function handleSetRating(key: RatingKey, val: number) {
    setRatings(prev => ({ ...prev, [key]: val }))
  }

  function handleSetHover(key: RatingKey, val: number | null) {
    setHoveredRatings(prev => ({ ...prev, [key]: val }))
  }

  const averageRating = (
    ((ratings.quality || 0) + (ratings.delivery || 0) + (ratings.accuracy || 0) + (ratings.overall || 0)) / 4.0
  ).toFixed(2)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: var(--bg-base); }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-base); transition: all 0.2s; }
        .back-btn:hover { background: var(--bg-muted); }
        .title { font-size: 28px; font-weight: 800; color: var(--text-base); margin: 0; letter-spacing: -0.5px; }
        
        .progress-bar-container { width: 100%; height: 6px; background: var(--border); border-radius: 3px; margin-bottom: 24px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: var(--wa-green-dark); transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        
        .card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 24px; padding: 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.02); margin-bottom: 20px; transition: transform 0.3s; }
        .card-header-gradient { background: linear-gradient(135deg, #1e4d1e, #2b5a2b); color: #fff; border: none; }
        
        .star-container { display: flex; gap: 8px; justify-content: center; margin: 20px 0; }
        .star-btn { background: transparent; border: none; cursor: pointer; padding: 4px; outline: none; transition: transform 0.1s; }
        .star-btn:hover { transform: scale(1.2) rotate(4deg); }
        .star-btn:active { transform: scale(0.9); }
        .star-glow { filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.45)); }
        
        .sentiment-badge { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 800; padding: 8px 16px; border-radius: 12px; margin: 0 auto 16px; width: fit-content; animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        
        .form-textarea { width: 100%; padding: 14px 16px; border-radius: 16px; border: 1px solid var(--border); background: var(--bg-base); color: var(--text-base); font-size: 15px; font-weight: 500; min-height: 100px; resize: vertical; outline: none; transition: border-color 0.2s; }
        .form-textarea:focus { border-color: var(--wa-green-dark); }
        
        .step-navigation { display: flex; gap: 12px; margin-top: 24px; }
        .nav-btn { flex: 1; padding: 14px; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--border); background: var(--bg-surface); color: var(--text-base); transition: all 0.2s; }
        .nav-btn:hover { background: var(--bg-muted); }
        .nav-btn-primary { background: var(--wa-green-dark); color: #fff; border: none; box-shadow: 0 4px 12px rgba(30,77,30,0.15); }
        .nav-btn-primary:hover { background: #164016; }
        .nav-btn-primary:disabled { background: var(--border); color: var(--text-muted); cursor: not-allowed; box-shadow: none; }
        
        .summary-badge-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-radius: 12px; background: var(--bg-base); border: 1px solid var(--border); margin-bottom: 8px; }
        
        .circle-rating-container { display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 16px 0; }
        .circle-rating-ring { width: 100px; height: 100px; border-radius: 50%; border: 6px solid var(--border); border-top-color: var(--wa-green-dark); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: var(--text-base); margin-bottom: 8px; position: relative; }
        
        .alert-error { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 14px; padding: 12px 16px; color: #991b1b; font-size: 14px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 24px 16px; color: #15803d; font-size: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
        
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />

      <div className="page-container">
        <div className="header">
          <Link href={`/${locale}/orders/${orderId}`} className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="title">{t('reviews.title')}</h1>
        </div>

        {/* Stepper Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${((activeStep + 1) / 5) * 100}%` }}></div>
        </div>

        <div className="card card-header-gradient">
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px' }}>{shopName}</h2>
          <p style={{ fontSize: '13px', color: '#b5deb5', margin: 0, fontWeight: 500 }}>
            Order ID: {orderId.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {success ? (
          <div className="card">
            <div className="alert-success">
              <CheckCircle2 size={48} strokeWidth={2.5} style={{ animation: 'popIn 0.3s ease-out' }} />
              <p style={{ margin: 0, fontWeight: 800 }}>{t('reviews.success')}</p>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Redirecting back to order details...</p>
            </div>
          </div>
        ) : (
          <div>
            {errorMsg && (
              <div className="alert-error">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Steps 0 to 3: Individual rating category questions */}
            {activeStep < 4 && (() => {
              const currentStep = steps[activeStep]
              const currentRating = ratings[currentStep.key]
              const hoverRating = hoveredRatings[currentStep.key]
              const displayRating = hoverRating !== null ? hoverRating : currentRating
              const activeSentiment = displayRating ? sentimentMap[displayRating] : null

              return (
                <div className="card" style={{ animation: 'popIn 0.25s ease-out' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Step {activeStep + 1} of 5: {currentStep.label}
                  </span>
                  
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 4px 0', color: 'var(--text-base)' }}>
                    {currentStep.label}
                  </h3>
                  
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                    {currentStep.question}
                  </p>

                  {/* Dynamic Emoticon Sentiment Badge */}
                  <div className="star-container">
                    {[1, 2, 3, 4, 5].map((starValue) => {
                      const isHighlighted = displayRating !== null && starValue <= displayRating
                      return (
                        <button
                          key={starValue}
                          type="button"
                          className="star-btn"
                          onMouseEnter={() => handleSetHover(currentStep.key, starValue)}
                          onMouseLeave={() => handleSetHover(currentStep.key, null)}
                          onClick={() => handleSetRating(currentStep.key, starValue)}
                        >
                          <Star
                            size={36}
                            color={isHighlighted ? '#f59e0b' : '#cbd5e1'}
                            fill={isHighlighted ? '#f59e0b' : 'transparent'}
                            className={isHighlighted ? 'star-glow' : ''}
                          />
                        </button>
                      )
                    })}
                  </div>

                  {activeSentiment && (
                    <div className="sentiment-badge" style={{ backgroundColor: `${activeSentiment.color}15`, color: activeSentiment.color }}>
                      <span>{activeSentiment.emoji}</span>
                      <span>{activeSentiment.label}</span>
                    </div>
                  )}

                  <div className="form-group" style={{ margin: '16px 0 0 0' }}>
                    <textarea
                      className="form-textarea"
                      placeholder={currentStep.placeholder}
                      value={descriptions[currentStep.key]}
                      onChange={(e) => setDescriptions(prev => ({ ...prev, [currentStep.key]: e.target.value }))}
                    />
                  </div>

                  <div className="step-navigation">
                    {activeStep > 0 ? (
                      <button type="button" className="nav-btn" onClick={() => setActiveStep(prev => prev - 1)}>
                        <ChevronLeft size={16} />
                        <span>Back</span>
                      </button>
                    ) : (
                      <Link href={`/${locale}/orders/${orderId}`} className="nav-btn" style={{ textDecoration: 'none' }}>
                        <ChevronLeft size={16} />
                        <span>Cancel</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      className="nav-btn nav-btn-primary"
                      disabled={!currentRating}
                      onClick={() => setActiveStep(prev => prev + 1)}
                    >
                      <span>Continue</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )
            })()}

            {/* Step 4: Summary & Submit page */}
            {activeStep === 4 && (
              <form onSubmit={handleSubmit} className="card" style={{ animation: 'popIn 0.25s ease-out' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Step 5 of 5: Summary
                </span>
                
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 16px 0', color: 'var(--text-base)' }}>
                  Review Summary
                </h3>

                <div className="circle-rating-container">
                  <div className="circle-rating-ring">
                    <span>{averageRating}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Calculated Average Rating
                  </span>
                </div>

                <div style={{ margin: '16px 0 24px 0' }}>
                  {steps.map(({ key, label }) => {
                    const rating = ratings[key] || 0
                    const sentiment = sentimentMap[rating]
                    return (
                      <div key={key} className="summary-badge-item">
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-base)' }}>{label}</span>
                          {descriptions[key] && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              &ldquo;{descriptions[key]}&rdquo;
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: sentiment?.color }}>
                          <span>{rating} ★</span>
                          <span>{sentiment?.emoji}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="step-navigation">
                  <button type="button" className="nav-btn" onClick={() => setActiveStep(3)}>
                    <ChevronLeft size={16} />
                    <span>Edit Ratings</span>
                  </button>

                  <button
                    type="submit"
                    className="nav-btn nav-btn-primary"
                    disabled={submitting}
                  >
                    <MessageSquare size={16} />
                    <span>{submitting ? t('common.loading') : 'Submit Review'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  )
}

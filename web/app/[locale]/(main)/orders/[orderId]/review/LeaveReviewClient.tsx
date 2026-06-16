'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface Props {
  orderId: string
  shopId: string
  shopName: string
  userId: string
}

type RatingKey = 'quality' | 'delivery' | 'accuracy' | 'overall'

export default function LeaveReviewClient({ orderId, shopId, shopName, userId }: Props) {
  const { t, locale } = useTranslation()
  const router = useRouter()

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

  const categories: { key: RatingKey; label: string; question: string; placeholder: string }[] = [
    { key: 'quality', label: t('reviews.product_quality'), question: t('reviews.product_quality_question'), placeholder: t('reviews.product_quality_placeholder') },
    { key: 'delivery', label: t('reviews.delivery'), question: t('reviews.delivery_question'), placeholder: t('reviews.delivery_placeholder') },
    { key: 'accuracy', label: t('reviews.accuracy'), question: t('reviews.accuracy_question'), placeholder: t('reviews.accuracy_placeholder') },
    { key: 'overall', label: t('reviews.overall'), question: t('reviews.overall_question'), placeholder: t('reviews.overall_placeholder') }
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validation
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: var(--bg-base); }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-base); transition: all 0.2s; }
        .back-btn:hover { background: var(--bg-muted); }
        .title { font-size: 28px; font-weight: 800; color: var(--text-base); margin: 0; letter-spacing: -0.5px; }
        
        .card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 24px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .form-label { font-size: 15px; font-weight: 700; color: var(--text-base); }
        .form-input { width: 100%; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-base); color: var(--text-base); font-size: 15px; font-weight: 600; outline: none; }
        .form-textarea { width: 100%; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-base); color: var(--text-base); font-size: 15px; font-weight: 500; min-height: 100px; resize: vertical; outline: none; }
        
        .review-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); }
        .review-row:last-child { border-bottom: none; }
        .row-label { font-size: 15px; font-weight: 700; color: var(--text-base); }
        
        .star-container { display: flex; gap: 4px; }
        .star-btn { background: transparent; border: none; cursor: pointer; padding: 2px; outline: none; transition: transform 0.1s; }
        .star-btn:hover { transform: scale(1.15); }
        
        .submit-btn { width: 100%; padding: 14px; border-radius: 14px; background: var(--wa-green-dark); color: #fff; border: none; font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 12px rgba(30,77,30,0.15); transition: all 0.2s; }
        .submit-btn:hover { background: #164016; }
        .submit-btn:disabled { background: var(--border); color: var(--text-muted); cursor: not-allowed; box-shadow: none; }
        
        .alert-error { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 14px; padding: 12px 16px; color: #991b1b; font-size: 14px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .alert-success { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 24px 16px; color: #15803d; font-size: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
      `}} />
 
       <div className="page-container">
         <div className="header">
           <Link href={`/orders/${orderId}`} className="back-btn">
             <ArrowLeft size={20} />
           </Link>
           <h1 className="title">{t('reviews.title')}</h1>
         </div>
 
         <div className="card" style={{ background: 'linear-gradient(135deg, #1e4d1e, #2b5a2b)', color: '#fff', border: 'none' }}>
           <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px' }}>{shopName}</h2>
           <p style={{ fontSize: '13px', color: '#b5deb5', margin: 0, fontWeight: 500 }}>
             Order ID: {orderId.slice(0, 8).toUpperCase()}
           </p>
         </div>
 
         {success ? (
           <div className="card">
             <div className="alert-success">
               <CheckCircle2 size={48} strokeWidth={2.5} />
               <p style={{ margin: 0, fontWeight: 800 }}>{t('reviews.success')}</p>
               <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Redirecting back to order details...</p>
             </div>
           </div>
         ) : (
           <form onSubmit={handleSubmit}>
             {errorMsg && (
               <div className="alert-error">
                 <AlertCircle size={18} />
                 <span>{errorMsg}</span>
               </div>
             )}
 
             {categories.map(({ key, label, question, placeholder }) => {
               const currentRating = ratings[key]
               const hoverRating = hoveredRatings[key]
               return (
                 <div key={key} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }} id={`review-card-${key}`}>
                   <div>
                     <h3 className="row-label" style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 2px 0' }}>{label}</h3>
                     <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>{question}</p>
                   </div>
                   <div className="star-container" style={{ margin: '4px 0', display: 'flex', gap: '6px' }}>
                     {[1, 2, 3, 4, 5].map((starValue) => {
                       const isHighlighted = hoverRating !== null
                         ? starValue <= hoverRating
                         : currentRating !== null && starValue <= currentRating
                       return (
                         <button
                           key={starValue}
                           type="button"
                           className="star-btn"
                           id={`star-btn-${key}-${starValue}`}
                           onMouseEnter={() => handleSetHover(key, starValue)}
                           onMouseLeave={() => handleSetHover(key, null)}
                           onClick={() => handleSetRating(key, starValue)}
                         >
                           <Star
                             size={28}
                             color={isHighlighted ? '#f59e0b' : '#cbd5e1'}
                             fill={isHighlighted ? '#f59e0b' : 'transparent'}
                           />
                         </button>
                       )
                     })}
                   </div>
                   <div className="form-group" style={{ margin: 0 }}>
                     <textarea
                       className="form-textarea"
                       style={{ minHeight: '60px', padding: '12px 14px', borderRadius: '12px', fontSize: '14px' }}
                       placeholder={placeholder}
                       value={descriptions[key]}
                       onChange={(e) => setDescriptions(prev => ({ ...prev, [key]: e.target.value }))}
                       id={`desc-input-${key}`}
                     />
                   </div>
                 </div>
               )
             })}
 
             <button
               type="submit"
               className="submit-btn"
               id="submit-review-btn"
               style={{ marginTop: '8px' }}
               disabled={submitting || !ratings.quality || !ratings.delivery || !ratings.accuracy || !ratings.overall}
             >
               <MessageSquare size={18} />
               <span>{submitting ? t('common.loading') : t('reviews.submit')}</span>
             </button>
           </form>
         )}
      </div>
    </>
  )
}

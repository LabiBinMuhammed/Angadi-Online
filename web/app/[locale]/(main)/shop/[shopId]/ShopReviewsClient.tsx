'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, User, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { createClient } from '@/lib/supabase/client'

interface Props {
  shopId: string
  shopName: string
  ratingSummary: {
    average_rating: number
    total_reviews: number
    stars: number
    avg_product_quality?: number
    avg_delivery_timeliness?: number
    avg_order_accuracy?: number
    avg_overall_experience?: number
  }
  reviews: any[]
}

export default function ShopReviewsClient({ shopId, shopName, ratingSummary, reviews }: Props) {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const [unreviewedOrderId, setUnreviewedOrderId] = useState<string | null>(null)
  const [checkedOrder, setCheckedOrder] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    async function checkUserAndOrder() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setIsAuthenticated(false)
        setCheckedOrder(true)
        return
      }
      setIsAuthenticated(true)

      // Query user's delivered orders for this shop
      const { data: orders } = await supabase
        .from('orders')
        .select('id, shop_reviews(id)')
        .eq('shop_id', shopId)
        .eq('user_id', user.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })

      if (orders) {
        // Find the first order that doesn't have a review
        const unreviewed = orders.find((o: any) => !o.shop_reviews || o.shop_reviews.length === 0)
        if (unreviewed) {
          setUnreviewedOrderId(unreviewed.id)
        }
      }
      setCheckedOrder(true)
    }

    checkUserAndOrder()
  }, [shopId])

  // Calculate dynamic fallbacks if DB summary doesn't have values
  const totalReviews = reviews.length
  const dynamicAverages = {
    quality: totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.product_quality_rating, 0) / totalReviews : 0,
    delivery: totalReviews > 0 ? reviews.reduce((sum, r) => sum + (r.delivery_timeliness_rating ?? r.delivery_experience_rating ?? 0), 0) / totalReviews : 0,
    accuracy: totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.order_accuracy_rating, 0) / totalReviews : 0,
    overall: totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.overall_experience_rating, 0) / totalReviews : 0,
  }

  const avgQuality = ratingSummary.avg_product_quality || dynamicAverages.quality
  const avgDelivery = ratingSummary.avg_delivery_timeliness || dynamicAverages.delivery
  const avgAccuracy = ratingSummary.avg_order_accuracy || dynamicAverages.accuracy
  const avgOverall = ratingSummary.avg_overall_experience || dynamicAverages.overall

  // Calculate rating distribution counts
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach(r => {
    const rInt = Math.round(r.overall_experience_rating) as 5 | 4 | 3 | 2 | 1
    if (counts[rInt] !== undefined) {
      counts[rInt]++
    }
  })

  const total = reviews.length || 1

  function handleWriteReviewClick() {
    if (!isAuthenticated) {
      router.push(`/${locale}/login?redirect=/shop/${shopId}`)
    } else if (unreviewedOrderId) {
      router.push(`/${locale}/orders/${unreviewedOrderId}/review`)
    } else {
      router.push(`/${locale}/orders`)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .reviews-container { padding: 24px 16px 100px; display: flex; flex-direction: column; gap: 24px; max-width: 680px; margin: 0 auto; }
        
        .analytics-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        @media (min-width: 600px) {
          .analytics-grid { grid-template-columns: 1.1fr 1.3fr; }
        }

        .summary-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 24px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 20px; }
        .rating-number-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; border-bottom: 1px solid var(--border); padding-bottom: 20px; }
        @media (min-width: 600px) {
          .rating-number-wrap { border-bottom: none; border-right: 1px solid var(--border); padding-bottom: 0; padding-right: 20px; }
        }
        
        .rating-num { font-size: 56px; font-weight: 900; color: var(--text-base); line-height: 1; letter-spacing: -2px; }
        .stars-wrap { display: flex; align-items: center; gap: 2px; }
        .rating-count { font-size: 14px; color: var(--text-muted); font-weight: 700; margin-top: 4px; }
        
        .category-analytics { display: flex; flex-direction: column; gap: 14px; flex: 1; justify-content: center; }
        .category-row { display: flex; flex-direction: column; gap: 4px; }
        .category-header { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 800; color: var(--text-base); }
        .category-val { font-size: 12px; color: var(--wa-green-dark); font-weight: 800; display: flex; align-items: center; gap: 2px; }
        .progress-bar-bg { width: 100%; height: 8px; background: var(--bg-base); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: var(--wa-green-dark); border-radius: 4px; transition: width 0.6s ease-out; }
        
        .distribution-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 24px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 16px; }
        .dist-title { font-size: 15px; font-weight: 800; color: var(--text-base); margin: 0; }
        .breakdown-wrap { display: flex; flex-direction: column; gap: 8px; }
        .breakdown-row { display: flex; align-items: center; gap: 12px; font-size: 12px; font-weight: 700; color: var(--text-muted); }
        .breakdown-bar-bg { flex: 1; height: 8px; background: var(--bg-base); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
        .breakdown-bar-fill { height: 100%; background: #f59e0b; border-radius: 4px; transition: width 0.6s ease-out; }
        
        .review-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 24px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.01); display: flex; flex-direction: column; gap: 16px; position: relative; }
        .review-card-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
        .reviewer-info { display: flex; align-items: center; gap: 12px; }
        .reviewer-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--wa-green-light); display: flex; align-items: center; justify-content: center; color: var(--wa-green-dark); font-weight: 800; font-size: 16px; border: 1px solid var(--border); }
        .reviewer-name { font-size: 15px; font-weight: 800; color: var(--text-base); margin: 0; display: flex; align-items: center; gap: 6px; }
        .verified-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 800; color: var(--wa-green-dark); background: rgba(30,77,30,0.06); padding: 2px 6px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .review-date { font-size: 12px; color: var(--text-muted); font-weight: 600; }
        
        .category-reviews-list { display: flex; flex-direction: column; gap: 12px; }
        .cat-item { display: flex; flex-direction: column; gap: 4px; background: var(--bg-base); border: 1px solid var(--border); border-radius: 14px; padding: 12px 14px; }
        .cat-meta { display: flex; align-items: center; justify-content: space-between; }
        .cat-label { font-size: 13px; font-weight: 800; color: var(--text-base); }
        .cat-comment { font-size: 13.5px; color: var(--text-base); line-height: 1.4; margin: 2px 0 0 0; font-style: italic; font-weight: 500; }
        
        .empty-state { background: var(--bg-surface); border: 1px dashed var(--border); border-radius: 24px; padding: 48px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .empty-title { font-size: 18px; font-weight: 800; color: var(--text-base); margin: 0; }
        .empty-subtitle { font-size: 14px; color: var(--text-muted); margin: 0; max-width: 300px; line-height: 1.5; }
        .empty-btn { padding: 12px 24px; background: var(--wa-green-dark); color: #fff; font-size: 14px; font-weight: 800; border-radius: 16px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(30,77,30,0.1); transition: all 0.2s; }
        .empty-btn:hover { background: #164016; }
      `}} />

      <div className="reviews-container">
        {reviews.length === 0 ? (
          /* Redesigned Empty State */
          <div className="empty-state">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.85 }}>
              <circle cx="60" cy="60" r="50" fill="var(--bg-base)" stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4"/>
              <rect x="40" y="45" width="40" height="30" rx="6" fill="var(--bg-surface)" stroke="var(--border)" strokeWidth="3"/>
              <path d="M47 54H65" stroke="var(--border)" strokeWidth="3" strokeLinecap="round"/>
              <path d="M47 62H73" stroke="var(--border)" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="80" cy="80" r="14" fill="#f59e0b" stroke="var(--bg-surface)" strokeWidth="2"/>
              <path d="M80 73.5L82.5 78.5L88 79L84 82.5L85 88L80 85L75 88L76 82.5L72 79L77.5 78.5L80 73.5Z" fill="white"/>
            </svg>
            <h3 className="empty-title">{t('reviews.no_reviews_yet')}</h3>
            <p className="empty-subtitle">
              {t('reviews.no_reviews_sub')}
            </p>
            {checkedOrder && (
              <button onClick={handleWriteReviewClick} className="empty-btn" id="write-first-review-btn">
                <span>{t('reviews.write_first_review')}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Rating Summary + Category Analytics Grid Card */}
            <div className="summary-card">
              <div className="analytics-grid">
                {/* Overall Rating Score */}
                <div className="rating-number-wrap">
                  <span className="rating-num">{Number(ratingSummary.average_rating || dynamicAverages.overall).toFixed(1)}</span>
                  <div className="stars-wrap">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const avg = Number(ratingSummary.average_rating || dynamicAverages.overall)
                      const isFull = s <= Math.round(avg)
                      return (
                        <Star
                          key={s}
                          size={18}
                          color={isFull ? '#f59e0b' : 'var(--border)'}
                          fill={isFull ? '#f59e0b' : 'transparent'}
                        />
                      )
                    })}
                  </div>
                  <span className="rating-count">
                    {ratingSummary.total_reviews || totalReviews} {ratingSummary.total_reviews === 1 ? t('reviews.review_single') : t('reviews.reviews_plural')}
                  </span>
                </div>

                {/* Shop Rating Analytics (Category averages + progress bars) */}
                <div className="category-analytics">
                  {[
                    { label: t('reviews.product_quality'), value: avgQuality },
                    { label: t('reviews.delivery'), value: avgDelivery },
                    { label: t('reviews.accuracy'), value: avgAccuracy },
                    { label: t('reviews.overall'), value: avgOverall },
                  ].map((cat, idx) => {
                    const pct = (cat.value / 5) * 100
                    return (
                      <div key={idx} className="category-row">
                        <div className="category-header">
                          <span>{cat.label}</span>
                          <span className="category-val">
                            {Number(cat.value).toFixed(1)}
                            <Star size={12} fill="currentColor" color="currentColor" />
                          </span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Quick Review Prompt Card */}
            {checkedOrder && (
              <div className="summary-card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <MessageSquare size={20} color="var(--wa-green-dark)" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--text-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {unreviewedOrderId ? 'Share Your Experience' : 'Your Orders'}
                    </h5>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {unreviewedOrderId ? 'Rate your recent order from this shop.' : 'View your orders to write a review.'}
                    </p>
                  </div>
                </div>
                <button onClick={handleWriteReviewClick} className="empty-btn" style={{ padding: '10px 18px', fontSize: '13px', borderRadius: '12px', flexShrink: 0 }}>
                  <span>{unreviewedOrderId ? t('reviews.write_first_review') : t('nav.orders')}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Rating Distribution Card */}
            <div className="distribution-card">
              <h4 className="dist-title">{t('reviews.rating_breakdown')}</h4>
              <div className="breakdown-wrap">
                {[5, 4, 3, 2, 1].map((s) => {
                  const count = (counts as any)[s] || 0
                  const percent = (count / total) * 100
                  return (
                    <div key={s} className="breakdown-row">
                      <span style={{ width: '12px', textAlign: 'right' }}>{s}</span>
                      <Star size={12} fill="#94a3b8" color="#94a3b8" />
                      <div className="breakdown-bar-bg">
                        <div className="breakdown-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <span style={{ width: '28px', textAlign: 'right' }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Reviews List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.map((r) => (
                <div key={r.id} className="review-card" id={`review-card-${r.id}`}>
                  <div className="review-card-header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {(r.users?.name || 'C')[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="reviewer-name">
                          {r.users?.name || t('reviews.customer_fallback')}
                          <span className="verified-badge">
                            <CheckCircle size={10} fill="currentColor" color="var(--bg-surface)" strokeWidth={3} />
                            {t('reviews.verified_purchase')}
                          </span>
                        </h4>
                        <div className="stars-wrap" style={{ marginTop: '2px' }}>
                          {[1, 2, 3, 4, 5].map((s) => {
                            const isFull = s <= Math.round(r.overall_experience_rating)
                            return (
                              <Star
                                key={s}
                                size={12}
                                color={isFull ? '#f59e0b' : 'var(--border)'}
                                fill={isFull ? '#f59e0b' : 'transparent'}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>
                    <span className="review-date">
                      {new Date(r.created_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Sub-ratings Breakdown with Descriptions */}
                  <div className="category-reviews-list">
                    {[
                      { label: t('reviews.product_quality'), rating: r.product_quality_rating, desc: r.product_quality_review ?? r.product_quality_description },
                      { label: t('reviews.delivery'), rating: r.delivery_timeliness_rating ?? r.delivery_experience_rating, desc: r.delivery_timeliness_review ?? r.delivery_experience_description },
                      { label: t('reviews.accuracy'), rating: r.order_accuracy_rating, desc: r.order_accuracy_review ?? r.order_accuracy_description },
                      { label: t('reviews.overall'), rating: r.overall_experience_rating, desc: r.overall_experience_review ?? r.overall_experience_description },
                    ].map((cat, idx) => (
                      <div key={idx} className="cat-item">
                        <div className="cat-meta">
                          <span className="cat-label">{cat.label}</span>
                          <div style={{ display: 'flex', gap: '1px' }}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={11}
                                color={s <= cat.rating ? '#f59e0b' : 'var(--border)'}
                                fill={s <= cat.rating ? '#f59e0b' : 'transparent'}
                              />
                            ))}
                          </div>
                        </div>
                        {cat.desc && (
                          <p className="cat-comment">
                            "{cat.desc}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

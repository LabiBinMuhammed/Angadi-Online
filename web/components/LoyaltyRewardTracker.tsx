'use client'

import { useState, useEffect, useRef } from 'react'
import { Star, Gift, Sparkles, CheckCircle2, RefreshCw, X } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useTranslation } from '@/lib/i18n/I18nContext'

type LoyaltyData = {
  starsCount: number
  scratchCardsUnlocked: number
  totalCreditEarned: number
}

type Props = {
  initialLoyalty?: LoyaltyData
  orderAmount?: number
  orderStatus?: string
  orderId?: string
}

export default function LoyaltyRewardTracker({ initialLoyalty, orderAmount, orderStatus, orderId }: Props) {
  const { t } = useTranslation()
  const [loyalty, setLoyalty] = useState<LoyaltyData>(initialLoyalty || { starsCount: 0, scratchCardsUnlocked: 0, totalCreditEarned: 0 })
  const [loading, setLoading] = useState(!initialLoyalty)
  const [showScratchModal, setShowScratchModal] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimedReward, setClaimedReward] = useState<number | null>(null)
  const [scratchedPercent, setScratchedPercent] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    fetchLoyalty()
  }, [orderId, orderStatus])

  async function fetchLoyalty() {
    try {
      if (orderId && orderStatus === 'delivered') {
        const res = await fetch('/api/loyalty', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'award_order', orderId })
        })
        const data = await res.json()
        if (data.result) {
          setLoyalty({
            starsCount: data.result.newStarsCount || 0,
            scratchCardsUnlocked: data.result.unlockedScratchCard ? 1 : 0,
            totalCreditEarned: 0
          })
          setLoading(false)
          return
        }
      }

      const res = await fetch('/api/loyalty')
      const data = await res.json()
      if (data.loyalty) {
        setLoyalty(data.loyalty)
      }
    } catch (err) {
      console.error('Error loading loyalty status:', err)
    } finally {
      setLoading(false)
    }
  }

  // Draw scratch card foil when modal opens
  useEffect(() => {
    if (showScratchModal && canvasRef.current && claimedReward === null) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#94a3b8'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add metallic shimmer texture
      ctx.fillStyle = '#64748b'
      for (let i = 0; i < 30; i++) {
        ctx.beginPath()
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 20 + 5, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.font = 'bold 15px sans-serif'
      ctx.fillStyle = '#f8fafc'
      ctx.textAlign = 'center'
      ctx.fillText('✨ Rub Here to Scratch & Reveal ✨', canvas.width / 2, canvas.height / 2 + 5)
    }
  }, [showScratchModal, claimedReward])

  function handleScratchMove(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!canvasRef.current || claimedReward !== null) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    const x = clientX - rect.left
    const y = clientY - rect.top

    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, 22, 0, Math.PI * 2)
    ctx.fill()

    // Calculate scratched percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data
    let transparentCount = 0
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentCount++
    }
    const percent = Math.round((transparentCount / (pixels.length / 4)) * 100)
    setScratchedPercent(percent)

    if (percent > 45 && claimedReward === null && !claiming) {
      claimReward()
    }
  }

  async function claimReward() {
    if (claiming) return
    setClaiming(true)
    try {
      const res = await fetch('/api/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim_scratch_card' })
      })
      const data = await res.json()
      if (data.success && data.rewardAmount) {
        setClaimedReward(data.rewardAmount)
        setLoyalty(prev => ({
          starsCount: data.remainingStars ?? 0,
          scratchCardsUnlocked: 0,
          totalCreditEarned: data.totalCreditEarned ?? (prev.totalCreditEarned + data.rewardAmount)
        }))

        // Trigger celebratory confetti
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899']
        })
      }
    } catch (err) {
      console.error('Error claiming scratch card:', err)
    } finally {
      setClaiming(false)
    }
  }

  const isUnlocked = loyalty.starsCount >= 5 || loyalty.scratchCardsUnlocked > 0
  const isOrderEligible = (orderAmount ?? 0) >= 0

  if (loading) {
    return (
      <div style={{
        padding: '1.25rem',
        borderRadius: '20px',
        background: 'var(--bg-surface, #ffffff)',
        border: '1px solid var(--border, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        color: 'var(--fg-muted, #64748b)'
      }}>
        <RefreshCw size={18} className="spin" />
        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
          {t('common.loading') || 'Loading 5-Star Rewards...'}
        </span>
      </div>
    )
  }

  return (
    <div className="loyalty-card-wrap" style={{
      background: 'var(--bg-surface, #ffffff)',
      border: '1px solid var(--border, #e2e8f0)',
      borderRadius: '24px',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Background Decorative Radial Glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '180px',
        height: '180px',
        background: isUnlocked
          ? 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0) 70%)'
          : 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.45)'
          }}>
            <Star size={24} color="#ffffff" fill="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.08rem', fontWeight: 800, margin: 0, color: 'var(--fg, #0f172a)' }}>
              {t('loyalty.club_title') || '5-Star Rewards Club ⭐'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--fg-muted, #64748b)', margin: 0, fontWeight: 500 }}>
              {t('loyalty.progress_label', { stars: Math.min(loyalty.starsCount, 5) }) || `${Math.min(loyalty.starsCount, 5)} / 5 Stars Collected`}
            </p>
          </div>
        </div>

        <div style={{
          background: isUnlocked ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.12)',
          color: isUnlocked ? '#16a34a' : '#d97706',
          border: `1px solid ${isUnlocked ? 'rgba(34, 197, 94, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
          padding: '0.35rem 0.8rem',
          borderRadius: '99px',
          fontSize: '0.82rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <Star size={14} fill={isUnlocked ? '#16a34a' : '#d97706'} />
          <span>{Math.min(loyalty.starsCount, 5)} / 5</span>
        </div>
      </div>

      {/* Order Status Notice (if rendered on Order Page) */}
      {orderAmount !== undefined && (
        <div style={{
          background: isOrderEligible ? 'rgba(34, 197, 94, 0.12)' : 'var(--bg-soft, #f8fafc)',
          border: `1px solid ${isOrderEligible ? 'rgba(34, 197, 94, 0.3)' : 'var(--border, #e2e8f0)'}`,
          borderRadius: '16px',
          padding: '0.7rem 0.9rem',
          fontSize: '0.85rem',
          color: isOrderEligible ? '#15803d' : 'var(--fg-muted, #64748b)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600
        }}>
          <Sparkles size={16} color={isOrderEligible ? '#22c55e' : '#f59e0b'} />
          <span>
            {orderStatus === 'delivered'
              ? (t('loyalty.star_earned_notice') || '🎉 +1 Star Earned on this delivered order!')
              : (t('loyalty.star_earned_notice') || '⭐ +1 Star Earned on delivery!')}
          </span>
        </div>
      )}

      {/* 5-Star Visual Progress Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '0.6rem',
        marginBottom: '1.25rem'
      }}>
        {[1, 2, 3, 4, 5].map(step => {
          const filled = loyalty.starsCount >= step
          return (
            <div key={step} style={{
              background: filled
                ? 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
                : 'var(--bg-soft, #f1f5f9)',
              border: `1.5px solid ${filled ? '#fbbf24' : 'var(--border, #cbd5e1)'}`,
              borderRadius: '16px',
              padding: '0.75rem 0.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem',
              transition: 'all 0.3s ease',
              boxShadow: filled ? '0 4px 14px rgba(245, 158, 11, 0.35)' : 'none',
              transform: filled ? 'scale(1.03)' : 'scale(1)'
            }}>
              <Star
                size={22}
                color={filled ? '#ffffff' : '#94a3b8'}
                fill={filled ? '#ffffff' : 'none'}
              />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: filled ? '#ffffff' : '#94a3b8' }}>
                Star {step}
              </span>
            </div>
          )
        })}
      </div>

      {/* Unlocked Lucky Scratch Card Banner or Progress Info */}
      {isUnlocked ? (
        <div style={{
          background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          borderRadius: '20px',
          padding: '1.1rem 1.35rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 24px -4px rgba(22, 163, 74, 0.45)',
          animation: 'pulseGlow 2s infinite ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Gift size={34} color="#ffffff" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>
                {t('loyalty.scratch_card_unlocked_title') || '🎉 Lucky Scratch Card Unlocked!'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#dcfce7', fontWeight: 500 }}>
                {t('loyalty.scratch_card_unlocked_desc') || 'Scratch to reveal your guaranteed ₹2–₹15 Angadi Credit reward!'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setClaimedReward(null)
              setScratchedPercent(0)
              setShowScratchModal(true)
            }}
            style={{
              background: '#ffffff',
              color: '#15803d',
              border: 'none',
              borderRadius: '14px',
              padding: '0.7rem 1.25rem',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              whiteSpace: 'nowrap'
            }}
          >
            {t('loyalty.scratch_now_btn') || 'Scratch Now 🎟️'}
          </button>
        </div>
      ) : (
        <div style={{
          fontSize: '0.82rem',
          color: 'var(--fg-muted, #64748b)',
          textAlign: 'center',
          fontWeight: 500
        }}>
          {t('loyalty.keep_collecting_notice', { remaining: 5 - loyalty.starsCount, plural: 5 - loyalty.starsCount > 1 ? 's' : '' }) ||
            `⭐ Collect ${5 - loyalty.starsCount} more Star${5 - loyalty.starsCount > 1 ? 's' : ''} to unlock your next Lucky Scratch Card (₹2–₹15 Guaranteed Credit)!`}
        </div>
      )}

      {/* Interactive Scratch Card Modal */}
      {showScratchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-surface, #ffffff)',
            borderRadius: '28px',
            padding: '2rem 1.5rem',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border, #e2e8f0)'
          }}>
            {/* Close Modal X Button */}
            <button
              type="button"
              onClick={() => setShowScratchModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'var(--bg-soft, #f1f5f9)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--fg-muted, #64748b)'
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--fg, #0f172a)', marginBottom: '0.35rem' }}>
              {t('loyalty.scratch_dialog_title') || '🎟️ Lucky Scratch Card'}
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--fg-muted, #64748b)', marginBottom: '1.5rem', lineHeight: 1.45 }}>
              {t('loyalty.scratch_dialog_subtitle') || 'Rub the metallic surface to reveal your guaranteed reward!'}
            </p>

            {/* Scratch Canvas Card Container */}
            <div style={{
              width: '280px',
              height: '180px',
              margin: '0 auto 1.5rem auto',
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.2)',
              background: 'linear-gradient(135deg, #1e293b, #0f172a)'
            }}>
              {/* Underlying Revealed Reward */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f59e0b, #16a34a)',
                color: '#ffffff',
                padding: '1rem'
              }}>
                <Sparkles size={36} color="#ffffff" />
                <div style={{ fontSize: '2rem', fontWeight: 900, margin: '0.25rem 0' }}>
                  {claimedReward !== null ? `₹${claimedReward}` : '₹?'}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Angadi Credit Reward!
                </div>
              </div>

              {/* Erasable Metallic Canvas Foil */}
              {claimedReward === null && (
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={180}
                  onMouseMove={handleScratchMove}
                  onTouchMove={handleScratchMove}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    cursor: 'pointer',
                    touchAction: 'none'
                  }}
                />
              )}
            </div>

            {/* Claim / Congratulations Status */}
            {claimedReward !== null ? (
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a', marginBottom: '0.35rem' }}>
                  {t('loyalty.reward_claimed_title') || '🎉 Congratulations!'}
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--fg-muted, #64748b)', marginBottom: '1.25rem' }}>
                  {t('loyalty.reward_claimed_subtitle', { amount: claimedReward }) || `₹${claimedReward} Angadi Credit added to your wallet!`}
                </p>
                <button
                  type="button"
                  onClick={() => setShowScratchModal(false)}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #16a34a, #15803d)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {t('loyalty.close_btn') || 'Close'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={claimReward}
                disabled={claiming}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: claiming ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 18px -4px rgba(22, 163, 74, 0.4)'
                }}
              >
                {claiming ? (t('common.loading') || 'Revealing...') : (t('loyalty.claim_reward_btn') || 'Scratch & Claim Reward 🎁')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

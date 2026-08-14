'use client'

import { useState, useEffect, useRef } from 'react'
import { Star, Gift, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react'
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

      ctx.fillStyle = '#cbd5e1'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add metallic shimmer texture
      ctx.fillStyle = '#94a3b8'
      for (let i = 0; i < 25; i++) {
        ctx.beginPath()
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 20 + 5, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.font = 'bold 16px sans-serif'
      ctx.fillStyle = '#475569'
      ctx.textAlign = 'center'
      ctx.fillText('✨ Scratch Here to Reveal Reward ✨', canvas.width / 2, canvas.height / 2 + 5)
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

    // Calculate scratched area
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let clearedPixels = 0
    for (let i = 3; i < imgData.data.length; i += 4) {
      if (imgData.data[i] === 0) clearedPixels++
    }
    const percent = Math.round((clearedPixels / (canvas.width * canvas.height)) * 100)
    setScratchedPercent(percent)

    if (percent > 45 && !claiming && claimedReward === null) {
      claimReward()
    }
  }

  async function claimReward() {
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
          starsCount: data.remainingStars || 0,
          scratchCardsUnlocked: 0,
          totalCreditEarned: data.totalCreditEarned || prev.totalCreditEarned + data.rewardAmount
        }))
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899']
        })
      }
    } catch (err) {
      console.error('Error claiming reward:', err)
    } finally {
      setClaiming(false)
    }
  }

  const isUnlocked = loyalty.starsCount >= 5 || loyalty.scratchCardsUnlocked > 0
  const isOrderEligible = orderAmount ? orderAmount >= 150 : false

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      borderRadius: '24px',
      padding: '1.5rem',
      color: '#ffffff',
      boxShadow: '0 12px 30px -8px rgba(15, 23, 42, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '1.75rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Decorative Star Shimmer */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '160px',
        height: '160px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(0,0,0,0) 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
          }}>
            <Star size={22} color="#ffffff" fill="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              {t('loyalty.club_title') || '5-Star Rewards Club ⭐'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
              {t('loyalty.club_subtitle') || 'Earn 1 Star on delivered orders worth ₹150+'}
            </p>
          </div>
        </div>

        <div style={{
          background: isUnlocked ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.15)',
          color: isUnlocked ? '#4ade80' : '#fbbf24',
          border: `1px solid ${isUnlocked ? '#22c55e' : '#f59e0b'}`,
          padding: '0.3rem 0.75rem',
          borderRadius: '99px',
          fontSize: '0.82rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}>
          <Star size={14} fill={isUnlocked ? '#4ade80' : '#fbbf24'} />
          <span>{Math.min(loyalty.starsCount, 5)} / 5 Stars</span>
        </div>
      </div>

      {/* Order Status Notice (if on Order Page) */}
      {orderAmount !== undefined && (
        <div style={{
          background: isOrderEligible ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255, 255, 255, 0.06)',
          border: `1px solid ${isOrderEligible ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
          borderRadius: '14px',
          padding: '0.65rem 0.9rem',
          fontSize: '0.84rem',
          color: isOrderEligible ? '#86efac' : '#cbd5e1',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Sparkles size={16} color={isOrderEligible ? '#4ade80' : '#fbbf24'} />
          <span>
            {isOrderEligible
              ? orderStatus === 'delivered'
                ? (t('loyalty.star_earned_notice') || '🎉 +1 Star Earned on this delivered ₹150+ order!')
                : (t('loyalty.star_pending_notice') || '⭐ This order qualifies for 1 Star upon delivery (₹150+)!')
              : (t('loyalty.order_under_150') || 'Orders worth ₹150 or more earn 1 Star towards a Lucky Scratch Card.')}
          </span>
        </div>
      )}

      {/* 5-Star Visual Progress Tracker */}
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
              background: filled ? 'linear-gradient(135deg, #f59e0b, #b45309)' : 'rgba(255, 255, 255, 0.08)',
              border: `1.5px solid ${filled ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)'}`,
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
                color={filled ? '#ffffff' : '#64748b'}
                fill={filled ? '#ffffff' : 'none'}
              />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: filled ? '#ffffff' : '#64748b' }}>
                Star {step}
              </span>
            </div>
          )
        })}
      </div>

      {/* Unlocked Lucky Scratch Card Banner or Progress Info */}
      {isUnlocked ? (
        <div style={{
          background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
          borderRadius: '18px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 20px -4px rgba(34, 197, 94, 0.5)',
          animation: 'pulseGlow 2s infinite ease-in-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Gift size={32} color="#ffffff" />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#ffffff' }}>
                {t('loyalty.scratch_card_ready') || '🎉 Lucky Scratch Card Unlocked!'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#dcfce7' }}>
                {t('loyalty.scratch_card_desc') || 'Scratch to reveal your guaranteed ₹2–₹15 Angadi Credit reward!'}
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
              borderRadius: '12px',
              padding: '0.65rem 1.1rem',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              whiteSpace: 'nowrap'
            }}
          >
            {t('loyalty.scratch_now_btn') || 'Scratch Now 🎟️'}
          </button>
        </div>
      ) : (
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
          ⭐ Collect <strong>{5 - loyalty.starsCount} more Star{5 - loyalty.starsCount > 1 ? 's' : ''}</strong> to unlock your next <strong>Lucky Scratch Card (₹2–₹15 Guaranteed Credit)</strong>!
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
            maxWidth: '420px',
            width: '100%',
            padding: '2rem 1.5rem',
            textAlign: 'center',
            color: 'var(--fg, #0f172a)',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <button
              type="button"
              onClick={() => setShowScratchModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.05)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <Gift size={44} color="#f59e0b" />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.4rem 0', color: '#0f172a' }}>
              {claimedReward ? '🎉 Reward Unlocked!' : 'Scratch Your Lucky Card 🎟️'}
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 1.5rem 0' }}>
              {claimedReward
                ? 'Your Angadi Credit balance has been updated! The Star counter has reset to 0.'
                : 'Rub your finger or mouse over the card to reveal your guaranteed reward!'}
            </p>

            {/* Scratch Canvas Container */}
            <div style={{
              position: 'relative',
              width: '280px',
              height: '160px',
              margin: '0 auto 1.5rem auto',
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #f59e0b',
              boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)'
            }}>
              {/* Underlying Revealed Reward */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700 }}>
                  You Won! 🎁
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#4ade80' }}>
                  ₹{claimedReward || '??'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#ffffff', opacity: 0.9 }}>
                  Angadi Credit Added!
                </div>
              </div>

              {/* Scratchable Canvas Foil */}
              {claimedReward === null && (
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={160}
                  onMouseMove={handleScratchMove}
                  onTouchMove={handleScratchMove}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    cursor: 'pointer',
                    touchAction: 'none'
                  }}
                />
              )}
            </div>

            {/* Action Buttons */}
            {claimedReward !== null ? (
              <button
                type="button"
                onClick={() => setShowScratchModal(false)}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Claimed! Continue Shopping 🛍️
              </button>
            ) : (
              <button
                type="button"
                onClick={claimReward}
                disabled={claiming}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {claiming ? 'Revealing Reward...' : 'Instant Reveal / Auto-Scratch ⭐'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

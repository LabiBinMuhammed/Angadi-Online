'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import { CheckCircle2, ArrowRight, ShoppingBag, Copy, Check, Clock, ShieldCheck, MapPin, Store } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

type Props = {
  orderId: string
  order?: {
    id: string
    status: string
    total_amount: number
    payment_method?: string | null
    created_at: string
    shops?: { name: string } | null
  } | null
}

export default function OrderSuccessClient({ orderId, order }: Props) {
  const { t, locale } = useTranslation()
  const [copied, setCopied] = useState(false)

  // Trigger celebration confetti on mount
  useEffect(() => {
    // 1. Initial big burst
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.45 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']
    })

    // 2. Cannon bursts from sides
    const timer1 = setTimeout(() => {
      confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } })
      confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } })
    }, 600)

    const timer2 = setTimeout(() => {
      confetti({ particleCount: 40, spread: 100, origin: { y: 0.6 } })
    }, 1800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  function copyOrderId() {
    navigator.clipboard.writeText(orderId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shortId = orderId.substring(0, 8).toUpperCase()
  const totalAmountNum = order?.total_amount ? Number(order.total_amount) : 0
  const totalAmount = totalAmountNum.toFixed(2)

  return (
    <div className="order-success-wrap" style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1rem'

    }}>
      <div className="order-success-card fade-up" style={{
        maxWidth: '560px',
        width: '100%',
        background: 'var(--bg-surface, #ffffff)',
        borderRadius: '28px',
        border: '1px solid var(--border, #e2e8f0)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background glow */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '240px',
          height: '240px',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, rgba(255, 255, 255, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }} />

        {/* Animated Green Checkmark Badge */}
        <div style={{
          width: '96px',
          height: '96px',
          margin: '0 auto 1.5rem auto',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 28px -6px rgba(34, 197, 94, 0.45)',

          animation: 'pulseGlow 2s infinite ease-in-out'
        }}>
          <CheckCircle2 size={56} strokeWidth={2.2} color="#ffffff" />
        </div>

        {/* Success Title & Subtitle */}
        <h1 style={{
          fontSize: '1.85rem',
          fontWeight: 800,
          color: 'var(--fg, #0f172a)',
          margin: '0 0 0.5rem 0',
          letterSpacing: '-0.02em'
        }}>
          {order?.status === 'delivered'
            ? (t('order_success.delivered_title') || 'Order Delivered Successfully! 📦🎉')
            : (t('order_success.title') || 'Order Placed Successfully! 🎉')}
        </h1>

        <p style={{
          fontSize: '0.98rem',
          color: 'var(--fg-muted, #64748b)',
          lineHeight: 1.5,
          margin: '0 auto 1.75rem auto',
          maxWidth: '440px'
        }}>
          {order?.status === 'delivered'
            ? (t('order_success.delivered_subtitle') || 'Your items have been safely delivered! Hope you enjoy your purchase.')
            : (t('order_success.subtitle') || 'Thank you for your order. The shop vendor has been notified and is preparing your items.')}
        </p>

        {/* Order Details Badge Card */}
        <div style={{
          background: 'var(--bg-soft, #f8fafc)',
          borderRadius: '20px',
          padding: '1.25rem 1.5rem',
          border: '1px solid var(--border, #e2e8f0)',
          marginBottom: '1.5rem',
          textAlign: 'left'
        }}>
          {/* Order ID Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.9rem',
            borderBottom: '1px solid var(--border, #e2e8f0)'
          }}>
            <span style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
              {t('order_success.order_id') || 'Order ID'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--wa-green-dark, #2e5b28)',
                background: 'rgba(46, 91, 40, 0.08)',
                padding: '0.2rem 0.6rem',
                borderRadius: '8px'
              }}>
                #{shortId}
              </code>
              <button
                type="button"
                onClick={copyOrderId}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? '#22c55e' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Copy Order ID"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Delivery & Payment Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            paddingTop: '0.9rem'
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>
                {t('order_success.delivery_estimate') || 'Status'}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: order?.status === 'delivered' ? '#22c55e' : 'var(--fg)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={15} color={order?.status === 'delivered' ? '#22c55e' : '#3b82f6'} />
                {order?.status === 'delivered' ? 'Delivered 📦' : (t('order_success.delivery_time') || 'Within 30–45 mins')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.2rem' }}>
                {t('order_success.total_amount') || 'Total Paid / Due'}
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#16a34a' }}>
                ₹{totalAmount}
              </div>
            </div>
          </div>
        </div>



        {/* TWO PRIMARY ACTION BUTTONS */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          {/* Button 1: View Order Details */}
          <Link
            href={`/${locale}/orders/${orderId}`}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.95rem 1.5rem',
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #2e5b28, #22c55e)',
              boxShadow: '0 8px 20px -4px rgba(46, 91, 40, 0.35)',
              textDecoration: 'none'
            }}
          >
            <span>{t('order_success.view_order_btn') || 'View Order Details'}</span>
            <ArrowRight size={18} />
          </Link>

          {/* Button 2: Shop Again */}
          <Link
            href={`/${locale}/home`}
            className="btn btn-outline"
            style={{
              width: '100%',
              padding: '0.9rem 1.5rem',
              fontSize: '0.98rem',
              fontWeight: 700,
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderColor: 'var(--border, #cbd5e1)',
              color: 'var(--fg, #334155)',
              textDecoration: 'none'
            }}
          >
            <ShoppingBag size={18} />
            <span>{t('order_success.shop_again_btn') || 'Shop Again'}</span>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(1); box-shadow: 0 12px 28px -6px rgba(34, 197, 94, 0.45); }
          50% { transform: scale(1.05); box-shadow: 0 16px 36px -4px rgba(34, 197, 94, 0.65); }
          100% { transform: scale(1); box-shadow: 0 12px 28px -6px rgba(34, 197, 94, 0.45); }
        }
      `}</style>
    </div>
  )
}

'use client'

import React from 'react'
import { Star, Check, Circle, AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface AvailabilityRatingProps {
  confidence: number // 1 to 5
  isNotAvailable: boolean
  onConfidenceChange: (stars: number) => void
  onToggleNotAvailable: (notAvailable: boolean) => void
}

const STAR_LABELS: Record<number, { key: string; defaultLabel: string }> = {
  1: { key: 'vendor_album.confidence_1', defaultLabel: 'Rarely available' },
  2: { key: 'vendor_album.confidence_2', defaultLabel: 'Sometimes available' },
  3: { key: 'vendor_album.confidence_3', defaultLabel: 'Usually available' },
  4: { key: 'vendor_album.confidence_4', defaultLabel: 'Almost always available' },
  5: { key: 'vendor_album.confidence_5', defaultLabel: 'Always available' }
}

export default function AvailabilityRating({
  confidence,
  isNotAvailable,
  onConfidenceChange,
  onToggleNotAvailable
}: AvailabilityRatingProps) {
  const { t } = useTranslation()
  const activeRating = Math.max(1, Math.min(5, confidence || 5))
  const activeLabel = t(STAR_LABELS[activeRating].key) || STAR_LABELS[activeRating].defaultLabel

  return (
    <div
      className="album-availability-card"
      style={{
        background: 'var(--bg-muted)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '0.65rem 0.85rem',
        marginTop: '0.5rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-base)'
          }}
        >
          {t('vendor_album.how_often_available') || 'How often do you usually have this?'}
        </span>
      </div>

      {/* 5-Star Confidence Rating */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          opacity: isNotAvailable ? 0.45 : 1,
          transition: 'opacity 0.25s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= activeRating
            return (
              <button
                key={star}
                type="button"
                onClick={() => onConfidenceChange(star)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                id={`star-btn-${star}`}
                title={`${star} Star${star > 1 ? 's' : ''} - ${STAR_LABELS[star].defaultLabel}`}
              >
                <Star
                  size={24}
                  fill={isFilled ? '#eab308' : 'none'}
                  color={isFilled ? '#eab308' : '#94a3b8'}
                  strokeWidth={1.5}
                />
              </button>
            )
          })}
        </div>

        <span
          style={{
            marginLeft: '0.5rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#eab308',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {activeLabel}
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          height: '1px',
          background: 'var(--border)',
          margin: '0.45rem 0'
        }}
      />

      {/* Distinct "Not Available" Toggle Button (Single Compact Line) */}
      <button
        type="button"
        onClick={() => onToggleNotAvailable(!isNotAvailable)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.65rem',
          borderRadius: '8px',
          background: isNotAvailable ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-surface)',
          border: `1px solid ${isNotAvailable ? '#f59e0b' : 'var(--border)'}`,
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s ease'
        }}
        id="not-available-toggle-btn"
      >
        <div
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            border: `1.5px solid ${isNotAvailable ? '#f59e0b' : 'var(--border)'}`,
            background: isNotAvailable ? '#f59e0b' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {isNotAvailable && <Check size={11} color="#fff" strokeWidth={3} />}
        </div>

        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: isNotAvailable ? '#f59e0b' : 'var(--text-base)'
          }}
        >
          {t('vendor_album.not_available') || 'Not available'}
        </span>

        {isNotAvailable && (
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginLeft: '0.25rem'
            }}
          >
            (Hidden from customers)
          </span>
        )}
      </button>
    </div>
  )
}

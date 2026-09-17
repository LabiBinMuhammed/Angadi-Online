'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, MinusCircle, PlusCircle } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface AlbumHeaderProps {
  categoryName: string
  categoryId: string
  currentIndex: number
  totalItems: number
  itemStatus: 'not_added' | 'added' | 'not_available'
  onBackClick: (e: React.MouseEvent) => void
}

export default function AlbumHeader({
  categoryName,
  categoryId,
  currentIndex,
  totalItems,
  itemStatus,
  onBackClick
}: AlbumHeaderProps) {
  const { t, locale, isRtl } = useTranslation()
  const BackIcon = isRtl ? ArrowRight : ArrowLeft
  const displayIndex = totalItems > 0 ? currentIndex + 1 : 0
  const progressPercent = totalItems > 0 ? Math.round((displayIndex / totalItems) * 100) : 0

  return (
    <div className="album-header-wrap" style={{ marginBottom: '1.5rem' }}>
      {/* Top row: Back button, Category name, Item counter, Status badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onBackClick}
            className="vp-btn vp-btn-outline vp-btn-sm"
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-base)'
            }}
            id="album-back-btn"
          >
            <BackIcon size={16} />
            <span>{categoryName}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Status Badge */}
          {itemStatus === 'added' && (
            <span className="album-badge-success">
              <Check size={14} /> {t('vendor_album.status_added') || 'Added'}
            </span>
          )}

          {itemStatus === 'not_available' && (
            <span className="album-badge-warning">
              <MinusCircle size={14} /> {t('vendor_album.status_unavailable') || 'Not available'}
            </span>
          )}

          {itemStatus === 'not_added' && (
            <span className="album-badge-muted">
              <PlusCircle size={14} /> {t('vendor_album.status_not_added') || 'Not added'}
            </span>
          )}

          {/* Product Position Indicator */}
          <div className="album-counter-pill">
            <span>{displayIndex}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, margin: '0 0.25rem' }}>/</span>
            <span style={{ color: 'var(--text-muted)' }}>{totalItems}</span>
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="album-progress-track">
        <div
          className="album-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}

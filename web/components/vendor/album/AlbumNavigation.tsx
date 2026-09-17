'use client'

import React from 'react'
import { ArrowLeft, ArrowRight, Check, FastForward, Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface AlbumNavigationProps {
  isFirst: boolean
  isLast: boolean
  isSaving: boolean
  isSavedJustNow: boolean
  onPrevious: () => void
  onNext: () => void
  onSkip: () => void
  onSaveAndNext: () => void
}

export default function AlbumNavigation({
  isFirst,
  isLast,
  isSaving,
  isSavedJustNow,
  onPrevious,
  onNext,
  onSkip,
  onSaveAndNext
}: AlbumNavigationProps) {
  const { t, isRtl } = useTranslation()

  const PrevIcon = isRtl ? ArrowRight : ArrowLeft
  const NextIcon = isRtl ? ArrowLeft : ArrowRight

  return (
    <div className="album-nav-bar" style={{ marginTop: '0.75rem' }}>
      {/* Action Buttons Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          width: '100%'
        }}
      >
        {/* Left side: Previous button */}
        <button
          type="button"
          onClick={onPrevious}
          disabled={isFirst || isSaving}
          className="vp-btn vp-btn-outline"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '10px',
            fontSize: '0.85rem',
            height: '38px',
            opacity: isFirst ? 0.35 : 1,
            cursor: isFirst ? 'not-allowed' : 'pointer'
          }}
          id="album-prev-btn"
        >
          <PrevIcon size={15} />
          <span>{t('vendor_album.btn_previous') || 'Previous'}</span>
        </button>

        {/* Right side: Skip, Save & Next */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Skip Button */}
          <button
            type="button"
            onClick={onSkip}
            disabled={isSaving}
            className="vp-btn vp-btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '10px',
              fontSize: '0.85rem',
              height: '38px',
              color: 'var(--text-muted)',
              borderColor: 'var(--border)'
            }}
            id="album-skip-btn"
          >
            <span>{t('vendor_album.btn_skip') || 'Skip'}</span>
            <NextIcon size={14} />
          </button>

          {/* Primary: Save & Next Button */}
          <button
            type="button"
            onClick={onSaveAndNext}
            disabled={isSaving}
            className="vp-btn vp-btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 1.1rem',
              borderRadius: '10px',
              fontSize: '0.88rem',
              height: '38px',
              fontWeight: 700,
              background: isSavedJustNow
                ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                : 'linear-gradient(135deg, #2563eb, #3b82f6)',
              boxShadow: isSavedJustNow
                ? '0 3px 12px rgba(34, 197, 94, 0.35)'
                : '0 3px 12px rgba(59, 130, 246, 0.35)',
              transition: 'all 0.25s ease'
            }}
            id="album-save-next-btn"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t('vendor_album.btn_saving') || 'Saving...'}</span>
              </>
            ) : isSavedJustNow ? (
              <>
                <Check size={16} />
                <span>{t('vendor_album.btn_saved') || 'Saved!'}</span>
              </>
            ) : (
              <>
                <span>{isLast ? t('common.save') || 'Save & Finish' : t('vendor_album.btn_save_next') || 'Save & Next'}</span>
                <NextIcon size={15} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Keyboard Shortcut Hint */}
      <div
        className="album-keyboard-hint"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '1.25rem',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}
      >
        <span
          style={{
            background: 'var(--bg-muted)',
            border: '1px solid var(--border)',
            color: 'var(--text-base)',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '0.72rem'
          }}
        >
          ←
        </span>
        <span
          style={{
            background: 'var(--bg-muted)',
            border: '1px solid var(--border)',
            color: 'var(--text-base)',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '0.72rem'
          }}
        >
          →
        </span>
        <span>{t('vendor_album.keyboard_nav_hint') || 'Use arrow keys to navigate products'}</span>
      </div>
    </div>
  )
}

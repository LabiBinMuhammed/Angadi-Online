'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, ArrowLeft, RefreshCw, Sparkles, PackageCheck } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface CompletionViewProps {
  categoryName: string
  categoryId: string
  addedCount: number
  skippedCount: number
  totalCount: number
  onReviewAgain: () => void
}

export default function CompletionView({
  categoryName,
  categoryId,
  addedCount,
  skippedCount,
  totalCount,
  onReviewAgain
}: CompletionViewProps) {
  const { t, locale } = useTranslation()

  return (
    <div
      className="vp-card"
      style={{
        maxWidth: 600,
        margin: '2rem auto',
        padding: '3rem 2rem',
        textAlign: 'center',
        borderRadius: '28px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)'
      }}
      id="category-completion-view"
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.15)',
          color: '#22c55e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem auto'
        }}
      >
        <CheckCircle2 size={40} />
      </div>

      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-base)', margin: '0 0 0.5rem 0' }}>
        {t('vendor_album.completion_title')?.replace('{category}', categoryName) ||
          `✓ ${categoryName} completed`}
      </h2>

      <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: '0 0 2rem 0' }}>
        You have traversed all available catalog templates for this category.
      </p>

      {/* Summary Statistics Pill */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.5rem',
          padding: '1.25rem',
          borderRadius: '18px',
          background: 'var(--bg-muted)',
          border: '1px solid var(--border)',
          marginBottom: '2.5rem',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#22c55e' }}>{addedCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Products Added</div>
        </div>

        <div style={{ width: '1px', background: 'var(--border)' }} />

        <div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>{skippedCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Products Skipped</div>
        </div>

        <div style={{ width: '1px', background: 'var(--border)' }} />

        <div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-base)' }}>{totalCount}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total in Category</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link
          href={`/${locale}/vendor/catalog`}
          className="vp-btn vp-btn-primary"
          style={{
            padding: '0.8rem 1.8rem',
            borderRadius: '14px',
            fontSize: '0.95rem',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          id="back-to-categories-btn"
        >
          <ArrowLeft size={16} />
          <span>{t('vendor_album.back_to_categories') || 'Back to Categories'}</span>
        </Link>

        <button
          type="button"
          onClick={onReviewAgain}
          className="vp-btn vp-btn-outline"
          style={{
            padding: '0.8rem 1.5rem',
            borderRadius: '14px',
            fontSize: '0.95rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-base)'
          }}
          id="review-again-btn"
        >
          <RefreshCw size={16} />
          <span>Review Products Again</span>
        </button>
      </div>
    </div>
  )
}

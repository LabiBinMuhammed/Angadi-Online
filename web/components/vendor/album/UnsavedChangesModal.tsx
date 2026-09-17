'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface UnsavedChangesModalProps {
  isOpen: boolean
  onStay: () => void
  onDiscard: () => void
}

export default function UnsavedChangesModal({
  isOpen,
  onStay,
  onDiscard
}: UnsavedChangesModalProps) {
  const { t } = useTranslation()
  if (!isOpen) return null

  return (
    <>
      <div
        onClick={onStay}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          zIndex: 9999
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '440px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '1.75rem',
          zIndex: 10000,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)'
        }}
        id="unsaved-changes-modal"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f59e0b',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-base)', margin: 0 }}>
            {t('vendor_album.unsaved_title') || 'You have unsaved changes'}
          </h3>
        </div>

        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
          {t('vendor_album.unsaved_message') ||
            'Are you sure you want to leave without saving your edits? Any changes will be lost.'}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onDiscard}
            className="vp-btn vp-btn-outline"
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '12px',
              fontSize: '0.88rem',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#f87171'
            }}
            id="discard-changes-btn"
          >
            {t('vendor_album.unsaved_discard') || 'Discard'}
          </button>
          <button
            type="button"
            onClick={onStay}
            className="vp-btn vp-btn-primary"
            style={{
              padding: '0.65rem 1.35rem',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontWeight: 700
            }}
            id="stay-editing-btn"
          >
            {t('vendor_album.unsaved_stay') || 'Stay'}
          </button>
        </div>
      </div>
    </>
  )
}

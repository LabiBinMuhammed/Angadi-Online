'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, Upload, RotateCcw, Package } from 'lucide-react'
import ImageUploader from '@/components/ImageUploader'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface ProductCardAreaProps {
  shopId: string
  name: string
  onNameChange: (val: string) => void
  description: string
  onDescriptionChange: (val: string) => void
  catalogImage: string
  customImage: string
  onCustomImageChange: (url: string) => void
}

export default function ProductCardArea({
  shopId,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  catalogImage,
  customImage,
  onCustomImageChange
}: ProductCardAreaProps) {
  const { t } = useTranslation()
  const [showUploader, setShowUploader] = useState(false)

  const activeImageUrl = customImage || catalogImage
  const hasCustomImage = !!customImage && customImage !== catalogImage

  return (
    <div
      className="album-product-area"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}
    >
      {/* Product Image Area */}
      <div className="album-image-frame">
        <div className="album-image-canvas">
          {activeImageUrl ? (
            <img
              src={activeImageUrl}
              alt={name}
              loading="lazy"
              referrerPolicy="no-referrer"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '0.5rem',
                transition: 'transform 0.3s ease'
              }}
              onError={e => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={36} />
              <p style={{ fontSize: '0.75rem', margin: '0.35rem 0 0 0' }}>No image available</p>
            </div>
          )}

          {hasCustomImage && (
            <span
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                fontSize: '0.65rem',
                fontWeight: 700,
                color: '#3b82f6',
                background: 'var(--bg-surface)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
            >
              Shop Image
            </span>
          )}

          {/* Floating Image Action Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              zIndex: 10
            }}
          >
            <button
              type="button"
              onClick={() => setShowUploader(!showUploader)}
              className="vp-btn vp-btn-outline vp-btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.72rem',
                padding: '0.3rem 0.65rem',
                borderRadius: '999px',
                background: 'rgba(0, 0, 0, 0.65)',
                color: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
              }}
              id="change-image-btn"
            >
              <Upload size={12} />
              {hasCustomImage ? t('vendor_album.upload_shop_image') || 'Change' : t('vendor_album.upload_shop_image') || 'Upload'}
            </button>

            {hasCustomImage && (
              <button
                type="button"
                onClick={() => onCustomImageChange('')}
                className="vp-btn vp-btn-outline vp-btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '999px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  color: '#f87171',
                  borderColor: 'rgba(239, 68, 68, 0.35)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
                id="reset-image-btn"
                title={t('vendor_album.use_catalog_image') || 'Use Catalog Image'}
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable Image Uploader */}
        {showUploader && (
          <div
            style={{
              width: '100%',
              maxWidth: '400px',
              marginTop: '0.5rem',
              padding: '0.75rem',
              borderRadius: '12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <ImageUploader
              shopId={shopId}
              images={customImage ? [customImage] : []}
              onChange={(urls) => {
                if (urls && urls[0]) {
                  onCustomImageChange(urls[0])
                  setShowUploader(false)
                }
              }}
              maxImages={1}
            />
          </div>
        )}
      </div>

      {/* Combined Compact Name & Description Section */}
      <div
        className="album-info-card"
        style={{
          background: 'var(--bg-muted)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}
      >
        {/* Product Name Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label
            style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
          >
            {t('vendor_album.product_name_label') || 'Product name'} <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            className="album-form-input"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Product name..."
            style={{
              height: '38px',
              fontSize: '0.92rem',
              fontWeight: 600,
              padding: '0.45rem 0.75rem'
            }}
            id="product-name-input"
            required
          />
        </div>

        {/* Product Description Input (Optional) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label
            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}
          >
            {t('vendor_album.description_label') || 'Description'} <span>(Optional)</span>
          </label>
          <input
            type="text"
            className="album-form-input"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={t('vendor_album.description_placeholder') || 'Fresh crisp quality details...'}
            style={{
              height: '34px',
              fontSize: '0.85rem',
              padding: '0.4rem 0.75rem'
            }}
            id="product-description-input"
          />
        </div>
      </div>
    </div>
  )
}

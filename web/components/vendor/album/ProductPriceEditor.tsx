'use client'

import React from 'react'
import { IndianRupee, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

import type { Unit } from '@/types'

export interface VariantPriceItem {
  id?: string
  label: string
  price: string | number
  unitSymbol?: string
  unit_id?: string
  value?: number
  isDefault?: boolean
}

interface ProductPriceEditorProps {
  // If single base price
  hasMultipleVariants: boolean
  basePrice: string
  unitSymbol?: string
  units?: Unit[]
  selectedUnitId?: string
  onUnitChange?: (unitId: string) => void
  onBasePriceChange: (val: string) => void

  // If variants
  variants: VariantPriceItem[]
  onVariantPriceChange: (index: number, val: string) => void
  onVariantLabelChange?: (index: number, val: string) => void
  onRemoveVariant?: (index: number) => void
  onAddVariant?: () => void
}

export default function ProductPriceEditor({
  hasMultipleVariants,
  basePrice,
  unitSymbol = 'kg',
  units = [],
  selectedUnitId,
  onUnitChange,
  onBasePriceChange,
  variants,
  onVariantPriceChange,
  onVariantLabelChange,
  onRemoveVariant,
  onAddVariant
}: ProductPriceEditorProps) {
  const { t } = useTranslation()

  return (
    <div
      className="album-price-card"
      style={{
        background: 'var(--bg-muted)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '0.65rem 0.85rem',
        marginTop: '0.5rem'
      }}
    >
      {!hasMultipleVariants || variants.length === 0 ? (
        // Simple Single Unit Price in 1 compact horizontal row
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%'
          }}
        >
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-base)',
              minWidth: '40px'
            }}
          >
            {t('vendor_album.price_label') || 'Price'}
          </span>

          <div
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: '140px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: '0.65rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.95rem',
                pointerEvents: 'none'
              }}
            >
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="0"
              className="album-form-input"
              value={basePrice}
              onChange={(e) => onBasePriceChange(e.target.value)}
              placeholder="0"
              style={{
                paddingLeft: '1.6rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                height: '36px'
              }}
              id="product-base-price-input"
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap'
              }}
            >
              /
            </span>
            {units && units.length > 0 && onUnitChange ? (
              <select
                value={selectedUnitId}
                onChange={(e) => onUnitChange(e.target.value)}
                aria-label="Select unit"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: 'var(--text-base)',
                  cursor: 'pointer',
                  outline: 'none',
                  height: '34px'
                }}
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.symbol || u.name}
                  </option>
                ))}
              </select>
            ) : (
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap'
                }}
              >
                {unitSymbol}
              </span>
            )}
          </div>
        </div>
      ) : (
        // Variant Pack Sizes Price List (Compact & Editable)
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-base)'
                }}
              >
                {t('vendor_album.price_label') || 'Price Variants'}
              </span>
              {variants.length > 0 && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#60a5fa',
                    background: 'rgba(59, 130, 246, 0.15)',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '8px'
                  }}
                >
                  {variants.length}
                </span>
              )}
            </div>

            {onAddVariant && (
              <button
                type="button"
                onClick={onAddVariant}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '6px'
                }}
              >
                <Plus size={13} />
                <span>Add Variant</span>
              </button>
            )}
          </div>

          {variants.length === 0 ? (
            <div
              style={{
                padding: '0.75rem',
                textAlign: 'center',
                borderRadius: '8px',
                border: '1px dashed var(--border)',
                background: 'var(--bg-surface)'
              }}
            >
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                No variants added yet.
              </p>
              {onAddVariant && (
                <button
                  type="button"
                  onClick={onAddVariant}
                  className="vp-btn vp-btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                >
                  <Plus size={13} style={{ marginRight: '0.25rem' }} /> Add Variant
                </button>
              )}
            </div>
          ) : (
            <div className="variant-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '130px', overflowY: 'auto' }}>
              {variants.map((v, idx) => (
                <div
                  key={v.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.4rem',
                    padding: '0.25rem 0.4rem',
                    borderRadius: '8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {/* Editable Variant Label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      type="text"
                      className="album-form-input"
                      value={v.label}
                      onChange={(e) => onVariantLabelChange?.(idx, e.target.value)}
                      placeholder="Variant name (e.g. 500g)"
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        height: '30px',
                        padding: '0.2rem 0.5rem',
                        width: '100%'
                      }}
                      required
                    />
                  </div>

                  {/* Price Input */}
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '90px' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '0.5rem',
                        color: 'var(--text-muted)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        pointerEvents: 'none'
                      }}
                    >
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="album-form-input"
                      value={v.price}
                      onChange={(e) => onVariantPriceChange(idx, e.target.value)}
                      placeholder="0"
                      style={{
                        paddingLeft: '1.3rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        height: '30px'
                      }}
                      id={`variant-price-input-${idx}`}
                      required
                    />
                  </div>

                  {/* Remove Button */}
                  {onRemoveVariant && (
                    <button
                      type="button"
                      onClick={() => onRemoveVariant(idx)}
                      title="Remove variant"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

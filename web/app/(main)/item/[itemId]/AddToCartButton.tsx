'use client'

import { useState } from 'react'
import type { Item, ItemVariant, ItemSellConfig, Unit } from '@/types'
import { ShoppingBag, Check, Scale } from 'lucide-react'

interface Props {
  item: Item
  variants: ItemVariant[]
  sellConfig: ItemSellConfig | null
  units: Unit[]
}

export default function AddToCartButton({ item, variants, sellConfig, units }: Props) {
  const defaultVariant = variants.find((v) => v.is_default) ?? variants[0]
  const [selected, setSelected] = useState<ItemVariant>(defaultVariant)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const isDynamic = sellConfig?.sell_mode?.toLowerCase() === 'dynamic'

  // Find unit symbol
  function getUnitSymbol(unitId?: string) {
    if (!unitId) return ''
    const unit = units.find((u) => u.id === unitId)
    return unit ? unit.symbol : ''
  }

  // Calculate estimated price range or single price
  function getPriceDisplay(v: ItemVariant) {
    const pricePerUnit = sellConfig?.price_per_base_unit
    
    if (isDynamic && pricePerUnit != null) {
      if (v.min_value != null && v.max_value != null) {
        const minPrice = Number(v.min_value) * Number(pricePerUnit)
        const maxPrice = Number(v.max_value) * Number(pricePerUnit)
        return `₹${minPrice.toFixed(0)} - ₹${maxPrice.toFixed(0)}`
      } else if (v.value != null) {
        const estPrice = Number(v.value) * Number(pricePerUnit)
        return `₹${estPrice.toFixed(0)}`
      }
    }
    
    if (v.price != null) {
      return `₹${Number(v.price).toFixed(0)}`
    }
    
    return 'Price on request'
  }

  function handleAdd() {
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  // Active image url helper
  const activeImageUrl = selected?.image_url || item.image_url || null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Styles for dynamic animation, size cards, and sticky bottom bar */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes imgFade {
          from { opacity: 0.5; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .variant-img {
          animation: imgFade 0.3s ease-out forwards;
        }

        .size-card {
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--bg-surface);
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          position: relative;
          min-height: 100px;
        }

        .size-card:hover {
          border-color: var(--neutral-400);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .size-card.active {
          border-color: var(--wa-green-dark);
          background: #f4fbf7;
          box-shadow: 0 4px 12px rgba(18,140,126,0.08);
        }

        .size-card-check {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--wa-green-dark);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sticky-action-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #fff;
          border-top: 1px solid var(--wa-separator);
          padding: 1rem 1.25rem;
          box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 99;
          transition: bottom 0.2s ease;
        }

        @media (max-width: 767px) {
          .sticky-action-bar {
            bottom: 92px; /* Float above the MobileFooter navigation */
            border-radius: 20px 20px 0 0;
            box-shadow: 0 -6px 24px rgba(0,0,0,0.08);
          }
        }
      ` }} />

      {/* Image Container with Dynamic Swapping & Fade Transition */}
      <div
        style={{
          height: 280,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--bg-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '4rem',
          position: 'relative',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {activeImageUrl ? (
          <img
            key={selected?.id || 'default'}
            src={activeImageUrl}
            alt={item.name}
            className="variant-img"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '4rem' }}>📦</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>No Image Available</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-base)' }}>{item.name}</h1>
        {item.description && (
          <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.95rem' }}>{item.description}</p>
        )}
        
        {/* Sell Mode Badge */}
        {sellConfig && (
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`badge ${isDynamic ? 'badge-warning' : 'badge-neutral'}`} style={{ textTransform: 'capitalize' }}>
              {sellConfig.sell_mode}
            </span>
            {isDynamic && (
              <span className="text-xs text-muted" style={{ fontWeight: 600 }}>
                ⚖️ Pay based on actual weight at delivery
              </span>
            )}
          </div>
        )}
      </div>

      <hr className="divider" style={{ margin: '0.5rem 0' }} />

      {/* Variants Selector */}
      {variants.length > 0 && (
        <section>
          <h2 className="text-base font-semibold" style={{ marginBottom: '1rem', color: 'var(--text-base)' }}>
            {isDynamic ? 'Choose Size Option' : 'Select Option'}
          </h2>

          {isDynamic ? (
            /* Size Cards for Dynamic Items */
            <div className="grid-2">
              {variants.map((v) => {
                const isActive = selected.id === v.id
                const unitSymbol = getUnitSymbol(v.unit_id) || 'kg'
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelected(v)}
                    className={`size-card ${isActive ? 'active' : ''}`}
                  >
                    {isActive && (
                      <div className="size-card-check">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: isActive ? 'var(--wa-green-dark)' : 'var(--text-muted)' }}>
                      <Scale size={16} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {v.label.toLowerCase().includes('small') ? 'SMALL' : 
                         v.label.toLowerCase().includes('medium') ? 'MEDIUM' : 
                         v.label.toLowerCase().includes('large') ? 'LARGE' : 'STANDARD'}
                      </span>
                    </div>

                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-base)', marginTop: '0.25rem' }}>
                      {v.label}
                    </span>

                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {v.min_value != null && v.max_value != null 
                        ? `Approx. ${v.min_value} - ${v.max_value} ${unitSymbol}`
                        : v.value != null 
                          ? `Approx. ${v.value} ${unitSymbol}` 
                          : ''}
                    </span>

                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isActive ? 'var(--wa-green-dark)' : 'var(--text-base)', marginTop: 'auto' }}>
                      {getPriceDisplay(v)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Standard Option Pills */
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {variants.map((v) => {
                const isActive = selected.id === v.id
                return (
                  <button
                    key={v.id}
                    id={`variant-${v.id}`}
                    onClick={() => setSelected(v)}
                    className={`btn`}
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: 'var(--radius-full)',
                      minHeight: '48px',
                      border: isActive ? '2px solid var(--wa-green-dark)' : '1.5px solid var(--border)',
                      background: isActive ? 'var(--wa-green-light)' : 'var(--bg-surface)',
                      color: isActive ? 'var(--wa-green-dark)' : 'var(--text-base)',
                      fontWeight: 600,
                      boxShadow: isActive ? '0 4px 10px rgba(18,140,126,0.06)' : 'none',
                    }}
                  >
                    <span>{v.label}</span>
                    <span style={{ opacity: 0.6, margin: '0 0.25rem' }}>|</span>
                    <span style={{ fontWeight: 700 }}>{getPriceDisplay(v)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Quantity Stepper */}
      {sellConfig?.allow_custom_quantity && (
        <section style={{ marginTop: '0.5rem' }}>
          <h2 className="text-base font-semibold" style={{ marginBottom: '0.75rem', color: 'var(--text-base)' }}>
            Quantity
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              className="btn btn-outline"
              id="qty-decrease"
              style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0 }}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, minWidth: '32px', textAlign: 'center' }}>
              {quantity}
            </span>
            <button
              className="btn btn-outline"
              id="qty-increase"
              style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0 }}
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>
        </section>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="sticky-action-bar">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            {selected?.label || 'Standard'} {quantity > 1 ? `x ${quantity}` : ''}
          </span>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-base)' }}>
            {isDynamic && sellConfig?.price_per_base_unit != null ? (
              <>
                {selected && getPriceDisplay(selected)}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginTop: '-2px' }}>
                  (Estimated weight total)
                </span>
              </>
            ) : (
              selected?.price != null ? `₹${(Number(selected.price) * quantity).toFixed(0)}` :
              sellConfig?.price_per_base_unit != null ? `₹${(Number(sellConfig.price_per_base_unit) * quantity).toFixed(0)}` : 'Price on request'
            )}
          </span>
        </div>

        <button
          id="btn-add-to-cart"
          className={`btn btn-lg ${added ? 'btn-outline' : 'btn-primary'}`}
          style={{
            minHeight: '48px',
            padding: '0.75rem 2rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '1rem',
            background: added ? 'transparent' : 'var(--wa-green-dark)',
            borderColor: added ? 'var(--wa-green-dark)' : 'transparent',
            color: added ? 'var(--wa-green-dark)' : '#fff',
            boxShadow: added ? 'none' : '0 4px 14px rgba(18,140,126,0.2)',
          }}
          onClick={handleAdd}
        >
          {added ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Check size={18} strokeWidth={3} /> Added to Bag
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} /> Add to Bag
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

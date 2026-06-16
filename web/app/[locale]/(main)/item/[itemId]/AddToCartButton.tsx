'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import type { Item, ItemVariant, ItemSellConfig, Unit } from '@/types'
import { ShoppingBag, Check, Scale, RefreshCw, Scissors, Package, Minus, Plus } from 'lucide-react'
import { addToCart } from '../../cart/actions'
import { useTranslation } from '@/lib/i18n/I18nContext'

interface Props {
  item: Item
  variants: ItemVariant[]
  sellConfig: ItemSellConfig | null
  units: Unit[]
}

export default function AddToCartButton({ item, variants, sellConfig, units }: Props) {
  const { t } = useTranslation()
  const defaultVariant = variants.find((v) => v.is_default) ?? variants[0]
  const [selected, setSelected] = useState<ItemVariant>(defaultVariant)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(false)

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

  async function handleAdd() {
    try {
      setLoading(true)
      
      const pricePerUnit = sellConfig?.price_per_base_unit;
      let calculatedPrice = 0;
      
      if (isDynamic && pricePerUnit != null) {
        if (selected.value != null) {
          calculatedPrice = Number(selected.value) * Number(pricePerUnit);
        } else if (selected.min_value != null) {
          calculatedPrice = Number(selected.min_value) * Number(pricePerUnit);
        }
      } else {
        calculatedPrice = selected.price != null ? Number(selected.price) : 0;
      }
      
      await addToCart(item.shop_id, item.id, quantity, calculatedPrice, selected.id);
      
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (e) {
      console.error(e)
      alert("Failed to add item to bag.")
    } finally {
      setLoading(false)
    }
  }

  // Gather all unique images for the carousel slides
  const slideImages = useMemo(() => {
    const urls = new Set<string>()
    
    // 1. Primary product image
    if (item.image_url) {
      urls.add(item.image_url.trim())
    }
    
    // 2. Gallery images
    if (item.item_images) {
      const sorted = [...item.item_images].sort((a, b) => a.sort_order - b.sort_order)
      sorted.forEach(img => {
        if (img.image_url) urls.add(img.image_url.trim())
      })
    }
    
    // 3. Variant images
    variants.forEach(v => {
      if (v.image_url) urls.add(v.image_url.trim())
    })
    
    return Array.from(urls)
  }, [item, variants])

  const [activeImage, setActiveImage] = useState('')
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Sync active image with slide images initially
  useEffect(() => {
    if (slideImages.length > 0 && !activeImage) {
      setActiveImage(slideImages[0])
    }
  }, [slideImages, activeImage])

  // Effect to automatically slide to the selected variant's image if it has one
  useEffect(() => {
    const targetImage = selected?.image_url || item.image_url
    if (targetImage) {
      const trimmed = targetImage.trim();
      setActiveImage(trimmed)
      const idx = slideImages.indexOf(trimmed)
      if (idx !== -1 && sliderRef.current) {
        const container = sliderRef.current
        container.scrollTo({
          left: idx * container.clientWidth,
          behavior: 'smooth'
        })
        setActiveSlideIndex(idx)
      }
    }
  }, [selected, slideImages])

  const handleScroll = () => {
    if (sliderRef.current) {
      const container = sliderRef.current
      const index = Math.round(container.scrollLeft / container.clientWidth)
      if (index !== activeSlideIndex && index >= 0 && index < slideImages.length) {
        setActiveSlideIndex(index)
        if (slideImages[index]) {
          setActiveImage(slideImages[index])
        }
      }
    }
  }

  const renderSellModeBadge = () => {
    if (!sellConfig) return null
    const mode = sellConfig.sell_mode?.toLowerCase()
    let IconComponent = Package
    let title = 'Packed'
    let color = '#2563eb'
    let bgColor = 'rgba(59, 130, 246, 0.08)'

    if (mode === 'manual') {
      IconComponent = Scale
      title = 'By Weight'
      color = '#16a34a'
      bgColor = 'rgba(22, 163, 74, 0.08)'
    } else if (mode === 'dynamic') {
      IconComponent = RefreshCw
      title = 'Variable Weight'
      color = '#ea580c'
      bgColor = 'rgba(234, 88, 12, 0.08)'
    } else if (mode === 'portion') {
      IconComponent = Scissors
      title = 'Portions'
      color = '#9333ea'
      bgColor = 'rgba(147, 51, 234, 0.08)'
    }

    return (
      <div 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          background: bgColor, 
          color: color, 
          padding: '6px 12px', 
          borderRadius: '12px', 
          fontSize: '0.82rem', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          letterSpacing: '0.03em' 
        }}
      >
        <IconComponent size={15} strokeWidth={2.5} />
        <span>{title}</span>
      </div>
    )
  }

  const currentTotalPrice = useMemo(() => {
    const pricePerUnit = sellConfig?.price_per_base_unit;
    if (isDynamic && pricePerUnit != null) {
      if (selected.value != null) {
        return Number(selected.value) * Number(pricePerUnit) * quantity;
      } else if (selected.min_value != null) {
        return Number(selected.min_value) * Number(pricePerUnit) * quantity;
      }
    }
    return selected.price != null ? Number(selected.price) * quantity : 0;
  }, [selected, quantity, sellConfig, isDynamic])

  return (
    <div className="product-detail-container animate-fade-in">
      {/* Styles for responsive redesign */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .product-detail-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        @media (min-width: 768px) {
          .product-detail-container {
            grid-template-columns: 1.15fr 1fr;
            gap: 48px;
            padding: 32px 24px;
          }
        }

        .gallery-section {
          width: 100%;
        }

        .mobile-gallery {
          display: block;
        }
        .desktop-gallery {
          display: none;
        }

        @media (min-width: 768px) {
          .mobile-gallery {
            display: none !important;
          }
          .desktop-gallery {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
        }

        .main-image-viewport {
          width: 100%;
          aspect-ratio: 1.1 / 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(0,0,0,0.02);
          position: relative;
        }

        .main-image-viewport img {
          max-width: 85%;
          max-height: 85%;
          object-fit: contain;
          filter: drop-shadow(0 12px 24px rgba(0,0,0,0.06));
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .main-image-viewport:hover img {
          transform: scale(1.04);
        }

        .thumbnails-grid {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 4px 4px 8px 4px;
        }

        .thumbnail-item {
          width: 72px;
          height: 72px;
          border-radius: 16px;
          border: 2px solid transparent;
          background: #f8fafc;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
          transition: all 0.25s ease;
          flex-shrink: 0;
        }

        .thumbnail-item:hover {
          transform: translateY(-2px);
          border-color: #cbd5e1;
        }

        .thumbnail-item.active {
          border-color: var(--wa-green-dark);
          background: #f4fbf7;
          box-shadow: 0 4px 12px rgba(18,140,126,0.12);
        }

        .thumbnail-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-meta-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .category-tag {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--wa-green-dark);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .product-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--text-base);
          line-height: 1.25;
          letter-spacing: -0.5px;
          margin-top: 4px;
        }
        @media (min-width: 768px) {
          .product-title {
            font-size: 38px;
          }
        }

        .product-description {
          font-size: 15px;
          color: var(--text-muted);
          line-height: 1.6;
        }

        .section-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-base);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 12px;
        }

        .size-card {
          border: 2px solid var(--border);
          border-radius: 20px;
          background: #fff;
          padding: 18px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
        }

        .size-card:hover {
          border-color: var(--neutral-300);
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        .size-card.active {
          border-color: var(--wa-green-dark);
          background: #f4fbf7;
          box-shadow: 0 6px 16px rgba(18,140,126,0.08);
        }

        .size-card-check {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--wa-green-dark);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stepper-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1.5px solid var(--border);
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-base);
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .stepper-btn:hover {
          border-color: var(--wa-green-dark);
          color: var(--wa-green-dark);
          background: #f4fbf7;
        }

        .desktop-checkout-card {
          display: none;
        }
        @media (min-width: 768px) {
          .desktop-checkout-card {
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: #fff;
            border: 1px solid #f1f5f9;
            border-radius: 24px;
            padding: 24px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.03);
            margin-top: 20px;
          }
        }

        .sticky-action-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #fff;
          border-top: 1px solid var(--wa-separator);
          padding: 16px 20px;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 99;
        }
        @media (min-width: 768px) {
          .sticky-action-bar {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .sticky-action-bar {
            bottom: 92px; /* Float above the MobileFooter */
            border-top-left-radius: 24px;
            border-top-right-radius: 24px;
          }
        }
      ` }} />

      {/* ================= LEFT SIDE (Gallery) ================= */}
      <div className="gallery-section">
        {/* Mobile carousel */}
        <div className="mobile-gallery" style={{ position: 'relative', width: '100%' }}>
          <div
            ref={sliderRef}
            onScroll={handleScroll}
            style={{
              height: 300,
              borderRadius: '24px',
              overflowX: 'auto',
              overflowY: 'hidden',
              display: 'flex',
              scrollSnapType: 'x mandatory',
              background: '#f8fafc',
              border: '1px solid #f1f5f9'
            }}
            className="hide-scrollbar"
          >
            {slideImages.map((imgUrl, idx) => (
              <div
                key={idx}
                style={{
                  minWidth: '100%',
                  height: '100%',
                  scrollSnapAlign: 'start',
                  scrollSnapStop: 'always',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  padding: '16px'
                }}
              >
                <img
                  src={imgUrl}
                  alt={`${item.name} slide ${idx + 1}`}
                  style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.06))' }}
                />
              </div>
            ))}
            {slideImages.length === 0 && (
              <div style={{ minWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '3.5rem' }}>📦</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 600 }}>{t('item_details.no_image')}</span>
              </div>
            )}
          </div>
          
          {/* Dot Indicators */}
          {slideImages.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '6px',
              zIndex: 10,
              background: 'rgba(0, 0, 0, 0.35)',
              padding: '4px 8px',
              borderRadius: '10px',
              backdropFilter: 'blur(4px)'
            }}>
              {slideImages.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: idx === activeSlideIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Desktop interactive gallery */}
        <div className="desktop-gallery">
          <div className="main-image-viewport">
            {activeImage ? (
              <img src={activeImage} alt={item.name} className="variant-img" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '4rem' }}>📦</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: 600 }}>{t('item_details.no_image')}</span>
              </div>
            )}
          </div>
          {slideImages.length > 1 && (
            <div className="thumbnails-grid hide-scrollbar">
              {slideImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className={`thumbnail-item ${activeImage === imgUrl ? 'active' : ''}`}
                  onClick={() => setActiveImage(imgUrl)}
                >
                  <img src={imgUrl} alt={`${item.name} thumb ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT SIDE (Details & Choices) ================= */}
      <div className="product-meta-section">
        <div>
          <span className="category-tag">
            {units.length > 0 && sellConfig?.base_unit_id ? t('item_details.unit_base').replace('{unit}', getUnitSymbol(sellConfig.base_unit_id)) : t('item_details.fresh_produce')}
          </span>
          <h1 className="product-title">{item.name}</h1>
          
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {renderSellModeBadge()}
            {isDynamic && (
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⚖️ {t('item_details.price_based_weight')}
              </span>
            )}
          </div>
        </div>

        {item.description && (
          <p className="product-description">{item.description}</p>
        )}

        <div style={{ height: '1px', background: 'var(--wa-separator)', margin: '4px 0' }} />

        {/* Variants Selector */}
        {variants.length > 0 && (
          <section>
            <h2 className="section-title">
              {isDynamic ? t('item_details.choose_size') : t('item_details.select_option')}
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
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isActive ? 'var(--wa-green-dark)' : 'var(--text-light)' }}>
                        <Scale size={14} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {v.label.toLowerCase().includes('small') ? t('item_details.size_small') : 
                           v.label.toLowerCase().includes('medium') ? t('item_details.size_medium') : 
                           v.label.toLowerCase().includes('large') ? t('item_details.size_large') : t('item_details.size_standard')}
                        </span>
                      </div>

                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-base)', marginTop: '2px' }}>
                        {v.label}
                      </span>

                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {v.min_value != null && v.max_value != null 
                          ? `${t('item_details.approx')} ${v.min_value} - ${v.max_value} ${unitSymbol}`
                          : v.value != null 
                            ? `${t('item_details.approx')} ${v.value} ${unitSymbol}` 
                            : ''}
                      </span>

                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isActive ? 'var(--wa-green-dark)' : 'var(--text-base)', marginTop: '8px' }}>
                        {getPriceDisplay(v)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Standard Option Pills */
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {variants.map((v) => {
                  const isActive = selected.id === v.id
                  return (
                    <button
                      key={v.id}
                      id={`variant-${v.id}`}
                      onClick={() => setSelected(v)}
                      className={`btn`}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '24px',
                        minHeight: '44px',
                        border: isActive ? '2px solid var(--wa-green-dark)' : '1.5px solid var(--border)',
                        background: isActive ? 'var(--wa-green-light)' : '#fff',
                        color: isActive ? 'var(--wa-green-dark)' : 'var(--text-base)',
                        fontWeight: 600,
                        boxShadow: isActive ? '0 4px 10px rgba(18,140,126,0.06)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isActive && <Check size={14} strokeWidth={3} />}
                      <span>{v.label}</span>
                      <span style={{ opacity: 0.4 }}>|</span>
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
          <section>
            <h2 className="section-title">{t('item_details.quantity')}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                className="stepper-btn"
                id="qty-decrease"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, minWidth: '28px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                className="stepper-btn"
                id="qty-increase"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </button>
            </div>
          </section>
        )}

        {/* ================= DESKTOP CHECKOUT WIDGET ================= */}
        <div className="desktop-checkout-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {selected?.label || t('item_details.standard_label')} {quantity > 1 ? `x ${quantity}` : ''}
              </span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-base)' }}>
                ₹{currentTotalPrice.toFixed(0)}
                {isDynamic && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, display: 'block', marginTop: '-2px' }}>
                    ({t('item_details.estimated_total')})
                  </span>
                )}
              </span>
            </div>
            
            <button
              id="btn-add-to-cart-desktop"
              disabled={loading}
              className={`btn btn-lg ${added ? 'btn-outline' : 'btn-primary'}`}
              style={{
                minHeight: '50px',
                padding: '0 28px',
                borderRadius: '25px',
                fontSize: '1rem',
                background: added ? 'transparent' : 'var(--wa-green-dark)',
                borderColor: added ? 'var(--wa-green-dark)' : 'transparent',
                color: added ? 'var(--wa-green-dark)' : '#fff',
                boxShadow: added ? 'none' : '0 4px 16px rgba(18,140,126,0.25)',
                transition: 'all 0.2s ease',
              }}
              onClick={handleAdd}
            >
              {loading ? (
                <span className="spinner" style={{ width: '18px', height: '18px' }} />
              ) : added ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={18} strokeWidth={3} /> {t('item_details.added_to_bag')}
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={18} /> {t('item_details.add_to_bag')}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================= MOBILE STICKY BOTTOM ACTION BAR ================= */}
      <div className="sticky-action-bar">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-light)', fontWeight: 700, textTransform: 'uppercase' }}>
            {selected?.label || t('item_details.standard_label')} {quantity > 1 ? `x ${quantity}` : ''}
          </span>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-base)' }}>
            ₹{currentTotalPrice.toFixed(0)}
            {isDynamic && (
              <span style={{ fontSize: '0.68rem', color: 'var(--text-light)', fontWeight: 500, display: 'block', marginTop: '-2px' }}>
                ({t('item_details.est_total')})
              </span>
            )}
          </span>
        </div>

        <button
          id="btn-add-to-cart-mobile"
          disabled={loading}
          className={`btn btn-lg ${added ? 'btn-outline' : 'btn-primary'}`}
          style={{
            minHeight: '46px',
            padding: '0 24px',
            borderRadius: '23px',
            fontSize: '0.95rem',
            background: added ? 'transparent' : 'var(--wa-green-dark)',
            borderColor: added ? 'var(--wa-green-dark)' : 'transparent',
            color: added ? 'var(--wa-green-dark)' : '#fff',
            boxShadow: added ? 'none' : '0 4px 14px rgba(18,140,126,0.2)',
          }}
          onClick={handleAdd}
        >
          {loading ? (
            <span className="spinner" style={{ width: '16px', height: '16px' }} />
          ) : added ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={16} strokeWidth={3} /> {t('item_details.added')}
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShoppingBag size={16} /> {t('item_details.add_to_bag')}
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

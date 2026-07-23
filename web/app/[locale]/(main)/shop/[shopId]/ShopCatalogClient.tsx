'use client'

import React, { useState, useEffect, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { ShoppingCart, Send, Plus, Minus, ChevronDown, X, Heart, Carrot, Apple, Milk, Wheat, Flame, Croissant, GlassWater, Fish, Package, Smile, Paperclip, Scale, RefreshCw, Scissors } from 'lucide-react'
import type { Item, Category, Unit, ItemVariant, ItemSellConfig } from '@/types'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { addToCart as dbAddToCart, removeOrderItem as dbRemoveOrderItem, updateOrderItemQty as dbUpdateOrderItemQty } from '../../cart/actions'

interface Props {
  items: Item[]
  categories: Category[]
  shopId: string
  shopName: string
  units: Unit[]
  restrictionLevel?: number
  initialCartItems?: any[]
}

interface CartItem {
  itemId: string
  name: string
  price: number
  qty: number
  variantLabel?: string
  variantId?: string
  customWeight?: number
  minPrice?: number
  maxPrice?: number
}

interface Selection {
  variantId?: string
  qty: number
  qtyStr?: string
  minPrice?: number
  maxPrice?: number
}

export default function ShopCatalogClient({ items, categories, shopId, shopName, units, restrictionLevel = 0, initialCartItems = [] }: Props) {
  const { locale, t } = useTranslation()
  const [activeCat, setActiveCat] = useState<string>('all')
  const [cart, setCart]         = useState<CartItem[]>([])
  const [selections, setSelections] = useState<Record<string, Selection>>({})
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // Sync with initialCartItems from the server
  useEffect(() => {
    if (initialCartItems) {
      const mapped: CartItem[] = initialCartItems
        .filter((ci: any) => ci.items?.shop_id === shopId || ci.shop_id === shopId)
        .map((ci: any) => {
          const item = items.find(i => i.id === ci.item_id)
          const variant = item?.item_variants?.find(v => v.id === ci.variant_id)
          return {
            itemId: ci.item_id,
            name: item?.name || ci.name || 'Item',
            price: ci.final_price ?? ci.estimated_price ?? 0,
            qty: ci.requested_value,
            variantLabel: variant?.label,
            variantId: ci.variant_id,
            customWeight: item?.item_sell_config?.[0]?.sell_mode?.toLowerCase() === 'manual' ? ci.requested_value : undefined,
            minPrice: ci.min_price,
            maxPrice: ci.max_price
          }
        })
      setCart(mapped)
    }
  }, [initialCartItems, items, shopId])

  const toggleWishlist = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlist(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const filtered = useMemo(() => {
    if (activeCat === 'all') return items
    return items.filter(i => i.category_id === activeCat)
  }, [items, activeCat])

  function getCartItem(itemId: string, variantId?: string, isManualOrDynamic?: boolean) {
    if (isManualOrDynamic) return cart.find(c => c.itemId === itemId)
    return cart.find(c => c.itemId === itemId && c.variantId === variantId)
  }

  function getUnit(unitId?: string) {
    return units.find(u => u.id === unitId)
  }

  function getSelection(item: Item): Selection {
    if (selections[item.id]) return selections[item.id]
    
    const config = Array.isArray(item.item_sell_config) ? item.item_sell_config[0] : item.item_sell_config
    const defaultVariant = item.item_variants?.find(v => v.is_default) || item.item_variants?.[0]
    
    return {
      variantId: defaultVariant?.id,
      qty: config?.sell_mode?.toLowerCase() === 'manual' ? 1 : 1,
      minPrice: undefined,
      maxPrice: undefined
    }
  }

  function updateSelection(itemId: string, updates: Partial<Selection>) {
    setSelections(prev => {
      const newSelection = { ...(prev[itemId] || { qty: 1 }), ...updates };
      
      // Sync to cart if item is already in cart
      const item = items.find(i => i.id === itemId);
      if (item) {
        const config = Array.isArray(item.item_sell_config) ? item.item_sell_config[0] : item.item_sell_config;
        const isManualOrDynamic = config?.sell_mode?.toLowerCase() === 'manual' || config?.sell_mode?.toLowerCase() === 'dynamic';
        
        setCart(prevCart => {
          const existingIndex = prevCart.findIndex(c => 
            c.itemId === item.id && 
            (isManualOrDynamic ? true : c.variantId === newSelection.variantId)
          );

          if (existingIndex > -1) {
            const newCart = [...prevCart];
            const existing = { ...newCart[existingIndex] };

            if (config?.sell_mode?.toLowerCase() === 'manual' && updates.qty !== undefined) {
              existing.qty = updates.qty;
              existing.price = (config.price_per_base_unit ?? 0) * updates.qty;
              existing.customWeight = updates.qty;
            } else if (config?.sell_mode?.toLowerCase() === 'dynamic') {
              if (updates.minPrice !== undefined) existing.minPrice = updates.minPrice;
              if (updates.maxPrice !== undefined) existing.maxPrice = updates.maxPrice;
            }
            
            newCart[existingIndex] = existing;
            return newCart;
          }
          return prevCart;
        });
      }

      return {
        ...prev,
        [itemId]: newSelection
      };
    });
  }

  function addToCart(item: Item, isIncrement: boolean = false) {
    if (restrictionLevel >= 3) return
    const selection = getSelection(item)
    const config = Array.isArray(item.item_sell_config) ? item.item_sell_config[0] : item.item_sell_config
    const isManualOrDynamic = config?.sell_mode?.toLowerCase() === 'manual' || config?.sell_mode?.toLowerCase() === 'dynamic'
    
    const variant = item.item_variants?.find(v => v.id === selection.variantId)
    let price = 0
    
    if (config?.sell_mode?.toLowerCase() === 'manual') {
      price = config.price_per_base_unit ?? 0
    } else if (config?.sell_mode?.toLowerCase() === 'dynamic' && variant) {
      price = (config.price_per_base_unit ?? 0) * (variant.value ?? 1.0)
    } else if (variant) {
      price = variant.price ?? 0
    } else {
      price = item.price ?? 0
    }

    const qty = config?.sell_mode?.toLowerCase() === 'manual' ? selection.qty : 1

    startTransition(async () => {
      try {
        await dbAddToCart(shopId, item.id, isIncrement ? 1 : qty, price, selection.variantId)
      } catch (err) {
        console.error('Failed to add to cart:', err)
      }
    })
  }

  function removeFromCart(item: Item, isDecrement: boolean = false) {
    const selection = getSelection(item)
    const config = Array.isArray(item.item_sell_config) ? item.item_sell_config[0] : item.item_sell_config
    const isManualOrDynamic = config?.sell_mode?.toLowerCase() === 'manual' || config?.sell_mode?.toLowerCase() === 'dynamic'

    const existingIndex = cart.findIndex(c => 
      c.itemId === item.id && 
      (isManualOrDynamic ? true : c.variantId === selection.variantId)
    )
    
    if (existingIndex === -1) return

    const existing = cart[existingIndex]
    const dbItem = initialCartItems?.find((ci: any) => 
      ci.item_id === item.id && 
      (isManualOrDynamic ? true : ci.variant_id === selection.variantId)
    )

    if (!dbItem) return

    startTransition(async () => {
      try {
        if (config?.sell_mode?.toLowerCase() === 'manual') {
          if (isDecrement) {
            const newQty = existing.qty - 1
            if (newQty <= 0) {
              await dbRemoveOrderItem(dbItem.orderId, dbItem.id)
            } else {
              await dbUpdateOrderItemQty(dbItem.orderId, dbItem.id, newQty)
            }
          } else {
            await dbRemoveOrderItem(dbItem.orderId, dbItem.id)
          }
        } else {
          // Packed / Portion / Dynamic
          if (existing.qty <= 1) {
            await dbRemoveOrderItem(dbItem.orderId, dbItem.id)
          } else {
            await dbUpdateOrderItemQty(dbItem.orderId, dbItem.id, existing.qty - 1)
          }
        }
      } catch (err) {
        console.error('Failed to remove from cart:', err)
      }
    })
  }

  const totalItems  = cart.reduce((s, c) => s + (c.customWeight ? 1 : c.qty), 0)
  const totalPrice  = cart.reduce((s, c) => s + c.price * (c.customWeight ? 1 : c.qty), 0)

  return (
    <div className="catalog-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        /* ─── Premium Product Card Styles ─── */
        .premium-card {
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
          cursor: default;
          height: 100%;
        }
        .premium-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
        }
        .premium-card-top {
          position: relative;
          aspect-ratio: 1.1;
          background: #f7f9fa;
          overflow: hidden;
        }
        .premium-wishlist {
          position: absolute;
          top: 12px; left: 12px;
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          border: none; cursor: pointer;
          z-index: 10;
          color: #8696a0;
          transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .premium-wishlist:hover {
          transform: scale(1.1);
          background: #ffffff;
        }
        .premium-wishlist.active {
          color: #ef4444;
        }
        .premium-wishlist.active svg {
          fill: #ef4444;
        }
        .premium-badge {
          position: absolute;
          top: 12px; left: 12px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #ffffff;
          z-index: 5;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .badge-fixed {
          background: linear-gradient(135deg, #128c7e, #075e54);
        }
        .badge-manual {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }
        .badge-portion {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        .badge-dynamic {
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
        }
        .premium-card-middle {
          padding: 12px 16px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .premium-shop-name {
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--wa-green-dark);
        }
        .premium-product-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #111b21;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 2.6em;
        }
        .premium-price-container {
          margin-top: 4px;
          height: 28px;
          display: flex;
          align-items: center;
        }
        .premium-card-price {
          font-size: 1.2rem;
          font-weight: 800;
          color: #111b21;
          display: inline-block;
        }
        .premium-card-bottom {
          padding: 0 16px 16px;
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .premium-pills-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 4px 2px;
          margin: 0 -4px;
        }
        .premium-pills-scroll::-webkit-scrollbar {
          display: none;
        }
        .premium-pill {
          flex-shrink: 0;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1.5px solid #e9edef;
          font-size: 0.78rem;
          font-weight: 600;
          background: #ffffff;
          color: #54656f;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
          user-select: none;
          outline: none;
        }
        .premium-pill:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .premium-pill.active {
          background: var(--wa-green-light);
          border-color: var(--wa-green);
          color: var(--wa-green-dark);
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(37, 211, 102, 0.15);
        }
        .custom-input-pill {
          width: 80px;
          text-align: center;
          padding: 4px 8px;
        }
        .custom-input-pill::placeholder {
          color: #8696a0;
        }
        .custom-input-pill:focus {
          border-color: var(--wa-green);
          background: var(--wa-green-light);
          color: var(--wa-green-dark);
        }
        .premium-cta-btn {
          width: 100%;
          padding: 12px 16px;
          border-radius: 12px;
          background: var(--wa-green);
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
          transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
          height: 46px;
        }
        .premium-cta-btn:hover {
          background: var(--wa-green-dark);
          box-shadow: 0 6px 16px rgba(18, 140, 126, 0.4);
          transform: scale(1.02);
        }
        .premium-cta-btn:active {
          transform: scale(0.98);
        }
        .premium-stepper {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 12px;
          border: 2px solid var(--wa-green);
          background: #ffffff;
          overflow: hidden;
          height: 46px;
          box-shadow: 0 2px 8px rgba(37, 211, 102, 0.1);
        }
        .stepper-btn {
          width: 46px; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: var(--wa-green-light);
          color: var(--wa-green-dark);
          cursor: pointer;
          transition: background 0.15s;
          border: none; outline: none;
        }
        .stepper-btn:hover {
          background: var(--wa-green);
          color: #ffffff;
        }
        .stepper-val {
          font-size: 0.95rem;
          font-weight: 800;
          color: #111b21;
        }
        @keyframes cardImgFade {
          from { opacity: 0.4; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        .premium-card-img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          animation: cardImgFade 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          will-change: opacity, transform;
        }
        @keyframes pricePop {
          0% { transform: scale(0.9); opacity: 0.7; }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); opacity: 1; }
        }
        .premium-price-pop {
          display: inline-block;
          animation: pricePop 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards;
          will-change: transform, opacity;
        }
        .premium-dynamic-inputs {
          display: flex;
          gap: 8px;
          width: 100%;
        }
        .dynamic-input-pill {
          flex: 1;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1.5px solid #e9edef;
          font-size: 0.78rem;
          font-weight: 600;
          text-align: center;
          background: #ffffff;
          color: #111b21;
          outline: none;
          transition: all 0.2s;
          width: 50%;
        }
        .dynamic-input-pill:focus {
          border-color: var(--wa-green);
          background: var(--wa-green-light);
          color: var(--wa-green-dark);
        }
      `}} />

      {restrictionLevel >= 3 && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fca5a5',
          borderRadius: '16px',
          padding: '16px',
          margin: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#991b1b',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{t('catalog.blocked_title')}</h4>
            <p style={{ margin: '2px 0 0', fontSize: '0.85rem', opacity: 0.9 }}>
              {t('catalog.blocked_desc')}
            </p>
          </div>
        </div>
      )}

      {/* ── Category chips ───────────────────────────────── */}
      <div className="catalog-cats">
        <button
          className={`cat-chip${activeCat === 'all' ? ' active' : ''}`}
          onClick={() => setActiveCat('all')}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`cat-chip${activeCat === cat.id ? ' active' : ''}`}
            onClick={() => setActiveCat(cat.id)}
          >
            {renderCatIcon(cat.id)} {cat.name}
          </button>
        ))}
      </div>

      {/* ── Product grid ─────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="catalog-grid">
          {filtered.map(item => {
            const config     = Array.isArray(item.item_sell_config) ? item.item_sell_config[0] : item.item_sell_config
            const selection  = getSelection(item)
            const isManualOrDynamic = config?.sell_mode?.toLowerCase() === 'manual' || config?.sell_mode?.toLowerCase() === 'dynamic'
            const cartItem   = getCartItem(item.id, selection.variantId, isManualOrDynamic)
            const variants   = item.item_variants || []
            const price      = config?.sell_mode?.toLowerCase() === 'manual'
              ? (config.price_per_base_unit ?? 0) * selection.qty
              : variants.find(v => v.id === selection.variantId)?.price ?? item.price ?? 0

            const activeVariant = variants.find(v => v.id === selection.variantId)
            const mainImageUrl = (item.image_url || '').trim() || (item.item_images?.[0]?.image_url || '').trim() || null
            const variantImageUrl = (activeVariant?.image_url || '').trim() || null

            return (
              <div key={item.id} className="premium-card" id={`product-${item.id}`}>
                {/* TOP: Image, Sell Badge, Wishlist */}
                <div className="premium-card-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getSellModeBadge(config?.sell_mode, t)}
                  <button 
                    type="button"
                    className={`premium-wishlist ${wishlist.has(item.id) ? 'active' : ''}`}
                    onClick={(e) => toggleWishlist(e, item.id)}
                  >
                    <Heart size={18} />
                  </button>
                  {mainImageUrl ? (
                    <img 
                      key={mainImageUrl}
                      src={mainImageUrl} 
                      alt={item.name} 
                      className="premium-card-img" 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="product-img-placeholder">
                      <div className="placeholder-checker" />
                    </div>
                  )}

                  {/* Variant Image Overlay (PIP) */}
                  {variantImageUrl && variantImageUrl !== mainImageUrl && (
                    <div 
                      style={{ 
                        position: 'absolute', 
                        bottom: '12px', 
                        right: '12px', 
                        width: '46px', 
                        height: '46px', 
                        borderRadius: '12px', 
                        border: '2.5px solid #ffffff', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.16)', 
                        overflow: 'hidden', 
                        background: '#ffffff', 
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <img 
                        src={variantImageUrl} 
                        alt="variant" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                  )}
                </div>

                {/* MIDDLE: Shop name, Product name, Dynamic Price */}
                <div className="premium-card-middle">
                  <span className="premium-shop-name">{shopName}</span>
                  <h3 className="premium-product-name">{item.name}</h3>
                  <div className="premium-price-container">
                    <span key={price} className="premium-card-price premium-price-pop">
                      {getDynamicPriceDisplay(item, config, selection, price)}
                    </span>
                  </div>
                </div>

                {/* BOTTOM: Scrollable Variant Selector, CTA / Stepper */}
                <div className="premium-card-bottom">
                  <div className="premium-pills-scroll" onClick={e => e.stopPropagation()}>
                    {config?.sell_mode?.toLowerCase() === 'manual' ? (
                      // Manual weight presets + inline custom input
                      <>
                        {getQuickWeightPresets(getUnit(config.base_unit_id)?.symbol).map(p => {
                          const isActive = selection.qty === p.value;
                          return (
                            <button
                              key={p.label}
                              type="button"
                              className={`premium-pill ${isActive ? 'active' : ''}`}
                              onClick={(e) => {
                                  e.stopPropagation();
                                  updateSelection(item.id, { qty: p.value, qtyStr: String(p.value) });
                                }}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                        <input 
                          type="number"
                          step="0.1"
                          placeholder={t('catalog.custom')}
                          className={`premium-pill custom-input-pill ${!getQuickWeightPresets(getUnit(config.base_unit_id)?.symbol).some(p => p.value === selection.qty) && selection.qty > 0 ? 'active' : ''}`}
                          value={selection.qtyStr ?? ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            updateSelection(item.id, { qty: parseFloat(e.target.value) || 0, qtyStr: e.target.value });
                          }}
                        />
                      </>
                    ) : config?.sell_mode?.toLowerCase() === 'dynamic' ? (
                      // Dynamic range inputs side by side
                      <div className="premium-dynamic-inputs" onClick={e => e.stopPropagation()}>
                        <input 
                          type="number" 
                          placeholder={t('catalog.min_price')} 
                          className="dynamic-input-pill"
                          value={selection.minPrice || ''}
                          onChange={(e) => updateSelection(item.id, { minPrice: parseFloat(e.target.value) || undefined })}
                        />
                        <input 
                          type="number" 
                          placeholder={t('catalog.max_price')} 
                          className="dynamic-input-pill"
                          value={selection.maxPrice || ''}
                          onChange={(e) => updateSelection(item.id, { maxPrice: parseFloat(e.target.value) || undefined })}
                        />
                      </div>
                    ) : (
                      // Fixed / Portion: standard variant selection
                      variants.map(v => (
                        <button
                          key={v.id}
                          type="button"
                          className={`premium-pill ${selection.variantId === v.id ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSelection(item.id, { variantId: v.id });
                          }}
                        >
                          {v.label}
                        </button>
                      ))
                    )}
                  </div>

                  {/* Action CTA or Quantity Stepper */}
                  <div onClick={e => e.stopPropagation()}>
                    {cartItem ? (
                      <div className="premium-stepper" style={isPending ? { opacity: 0.7, pointerEvents: 'none' } : undefined}>
                        <button 
                          type="button" 
                          className="stepper-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item, true);
                          }}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="stepper-val">
                          {config?.sell_mode?.toLowerCase() === 'manual'
                            ? `${cartItem.qty} ${getUnit(config.base_unit_id)?.symbol || ''}`
                            : cartItem.qty}
                        </span>
                        <button 
                          type="button" 
                          className="stepper-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item, true);
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        className="premium-cta-btn" 
                        disabled={restrictionLevel >= 3 || isPending}
                        style={restrictionLevel >= 3 ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#94a3b8' } : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (restrictionLevel >= 3) return;
                          addToCart(item);
                        }}
                      >
                        <Plus size={16} />
                        <span>{t('catalog.add_to_cart')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', margin: '0 auto 12px' }}><Package size={48} /></span>
          <p className="font-semibold">{t('catalog.no_items')}</p>
          <p className="text-sm">{t('catalog.try_selecting')}</p>
        </div>
      )}

      {/* ── Bottom bar ───────────────────────────────────── */}
      <div className="catalog-bottom-bar">
        <div className="bottom-bar-input-wrap">
          <button className="bottom-icon-btn" aria-label="Emoji" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Smile size={20} /></button>
          <button className="bottom-icon-btn" aria-label="Attach" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Paperclip size={20} /></button>
          <input
            type="text"
            className="bottom-input"
            placeholder={t('catalog.search_placeholder')}
            id="catalog-message-input"
          />
        </div>

        {totalItems > 0 ? (
          <Link 
            href={`/${locale}/cart`}
            className="cart-summary-btn" 
            id="catalog-cart-btn"
            style={restrictionLevel >= 3 ? { opacity: 0.5, pointerEvents: 'none', backgroundColor: '#94a3b8', boxShadow: 'none' } : undefined}
          >
            <ShoppingCart size={16} />
            <span>{totalItems} {totalItems === 1 ? 'Item' : 'Items'} ₹{totalPrice.toFixed(0)}</span>
            <Send size={16} />
          </Link>
        ) : (
          <button 
            className="send-fab" 
            aria-label="Send" 
            id="catalog-send-btn"
            disabled={restrictionLevel >= 3}
            style={restrictionLevel >= 3 ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#94a3b8', boxShadow: 'none' } : undefined}
          >
            <Send size={20} />
          </button>
        )}
      </div>
    </div>
  )
}

function renderCatIcon(catId: string | null | undefined, size = 16) {
  const map: Record<string, any> = {
    'cat-veg': <Carrot size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />,
    'cat-fruit': <Apple size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />,
    'cat-dairy': <Milk size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />,
    'cat-grain': <Wheat size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />,
    'cat-spice': <Flame size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />,
    'cat-bakery': <Croissant size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />,
    'cat-oil': <GlassWater size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />,
    'cat-meat': <Fish size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />,
  }
  return map[catId ?? ''] ?? <Package size={size} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
}

function getQuickWeightPresets(unitSymbol?: string) {
  const sym = (unitSymbol || '').toLowerCase();
  if (sym === 'kg') {
    return [
      { label: '250g', value: 0.25 },
      { label: '500g', value: 0.5 },
      { label: '1kg', value: 1.0 },
      { label: '2kg', value: 2.0 }
    ];
  }
  if (sym === 'l') {
    return [
      { label: '250ml', value: 0.25 },
      { label: '500ml', value: 0.5 },
      { label: '1L', value: 1.0 },
      { label: '2L', value: 2.0 }
    ];
  }
  if (sym === 'g') {
    return [
      { label: '100g', value: 100 },
      { label: '250g', value: 250 },
      { label: '500g', value: 500 },
      { label: '1kg', value: 1000 }
    ];
  }
  if (sym === 'ml') {
    return [
      { label: '100ml', value: 100 },
      { label: '250ml', value: 250 },
      { label: '500ml', value: 500 },
      { label: '1L', value: 1000 }
    ];
  }
  return [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '5', value: 5 },
    { label: '10', value: 10 }
  ];
}

function getSellModeBadge(mode?: string, t?: any) {
  let IconComponent = Package;
  let bgColor = 'rgba(59, 130, 246, 0.12)';
  let iconColor = '#2563eb';
  let title = t ? t('catalog.packed') : 'Packed';
  
  const m = (mode || 'Fixed').toLowerCase();
  if (m === 'manual') {
    IconComponent = Scale;
    bgColor = 'rgba(34, 197, 94, 0.12)';
    iconColor = '#16a34a';
    title = t ? t('catalog.by_weight') : 'By Weight';
  } else if (m === 'fixed') {
    IconComponent = Package;
    bgColor = 'rgba(59, 130, 246, 0.12)';
    iconColor = '#2563eb';
    title = t ? t('catalog.packed') : 'Packed';
  } else if (m === 'dynamic') {
    IconComponent = RefreshCw;
    bgColor = 'rgba(249, 115, 22, 0.12)';
    iconColor = '#ea580c';
    title = t ? t('catalog.variable_weight') : 'Variable Weight';
  } else if (m === 'portion') {
    IconComponent = Scissors;
    bgColor = 'rgba(168, 85, 247, 0.12)';
    iconColor = '#9333ea';
    title = t ? t('catalog.portions') : 'Portions';
  }

  return (
    <div 
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}
      title={title}
    >
      <IconComponent size={15} color={iconColor} strokeWidth={2.5} />
    </div>
  );
}

function getDynamicPriceDisplay(item: Item, config: ItemSellConfig | undefined, selection: Selection, price: number) {
  if (config?.sell_mode?.toLowerCase() === 'dynamic') {
    const min = selection.minPrice;
    const max = selection.maxPrice;
    if (min !== undefined && max !== undefined) {
      return `₹${min.toFixed(0)} - ₹${max.toFixed(0)}`;
    }
    if (min !== undefined) {
      return `₹${min.toFixed(0)} - ...`;
    }
    if (max !== undefined) {
      return `... - ₹${max.toFixed(0)}`;
    }
    return 'Pay Later';
  }
  return price > 0 ? `₹${price.toFixed(0)}` : '—';
}


'use client'

import { useState, useMemo, useEffect } from 'react'
import { ShoppingCart, Send, Plus, Minus, ChevronDown, X, Heart } from 'lucide-react'
import type { Item, Category, Unit, ItemVariant, ItemSellConfig } from '@/types'

interface Props {
  items: Item[]
  categories: Category[]
  shopId: string
  shopName: string
  units: Unit[]
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

export default function ShopCatalogClient({ items, categories, shopId, shopName, units }: Props) {
  const [activeCat, setActiveCat] = useState<string>('all')
  const [cart, setCart]         = useState<CartItem[]>([])
  const [selections, setSelections] = useState<Record<string, Selection>>({})
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())

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
    
    const config = item.item_sell_config?.[0]
    const defaultVariant = item.item_variants?.find(v => v.is_default) || item.item_variants?.[0]
    
    return {
      variantId: defaultVariant?.id,
      qty: config?.sell_mode === 'Manual' ? 1 : 1,
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
        const config = item.item_sell_config?.[0];
        const isManualOrDynamic = config?.sell_mode === 'Manual' || config?.sell_mode === 'Dynamic';
        
        setCart(prevCart => {
          const existingIndex = prevCart.findIndex(c => 
            c.itemId === item.id && 
            (isManualOrDynamic ? true : c.variantId === newSelection.variantId)
          );

          if (existingIndex > -1) {
            const newCart = [...prevCart];
            const existing = { ...newCart[existingIndex] };

            if (config?.sell_mode === 'Manual' && updates.qty !== undefined) {
              existing.qty = updates.qty;
              existing.price = (config.price_per_base_unit ?? 0) * updates.qty;
              existing.customWeight = updates.qty;
            } else if (config?.sell_mode === 'Dynamic') {
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
    const selection = getSelection(item)
    const config = item.item_sell_config?.[0]
    const isManualOrDynamic = config?.sell_mode === 'Manual' || config?.sell_mode === 'Dynamic'
    
    setCart(prev => {
      const existingIndex = prev.findIndex(c => 
        c.itemId === item.id && 
        (isManualOrDynamic ? true : c.variantId === selection.variantId)
      )

      if (existingIndex > -1) {
        const newCart = [...prev]
        const existing = { ...newCart[existingIndex] }

        if (config?.sell_mode === 'Manual') {
          // If incrementing via card button, add 1. Otherwise use modal's selection.
          existing.qty = isIncrement ? existing.qty + 1 : selection.qty
          existing.price = (config.price_per_base_unit ?? 0) * existing.qty
          existing.customWeight = existing.qty
        } else if (config?.sell_mode === 'Dynamic') {
          existing.minPrice = selection.minPrice
          existing.maxPrice = selection.maxPrice
          existing.qty = isIncrement ? existing.qty + 1 : selection.qty
        } else {
          // Packed / Portion
          existing.qty += 1
        }
        
        newCart[existingIndex] = existing
        return newCart
      }

      // Add new item
      const variant = item.item_variants?.find(v => v.id === selection.variantId)
      let price = 0
      
      if (config?.sell_mode === 'Manual') {
        price = (config.price_per_base_unit ?? 0) * selection.qty
      } else if (variant) {
        price = variant.price ?? 0
      }

      return [...prev, { 
        itemId: item.id, 
        name: item.name, 
        price, 
        qty: selection.qty || 1, 
        variantLabel: variant?.label,
        variantId: selection.variantId,
        customWeight: config?.sell_mode === 'Manual' ? selection.qty : undefined,
        minPrice: selection.minPrice,
        maxPrice: selection.maxPrice
      }]
    })
  }

  function removeFromCart(item: Item, isDecrement: boolean = false) {
    const selection = getSelection(item)
    const config = item.item_sell_config?.[0]
    const isManualOrDynamic = config?.sell_mode === 'Manual' || config?.sell_mode === 'Dynamic'

    setCart(prev => {
      const existingIndex = prev.findIndex(c => 
        c.itemId === item.id && 
        (isManualOrDynamic ? true : c.variantId === selection.variantId)
      )
      
      if (existingIndex === -1) return prev

      const existing = prev[existingIndex]
      
      if (config?.sell_mode === 'Manual') {
        if (isDecrement) {
          const newQty = existing.qty - 1
          if (newQty <= 0) return prev.filter((_, i) => i !== existingIndex)
          const newCart = [...prev]
          newCart[existingIndex] = { 
            ...existing, 
            qty: newQty, 
            customWeight: newQty, 
            price: (config.price_per_base_unit ?? 0) * newQty 
          }
          return newCart
        }
        return prev.filter((_, i) => i !== existingIndex)
      }

      // Packed / Portion / Dynamic
      if (existing.qty <= 1) return prev.filter((_, i) => i !== existingIndex)
      
      const newCart = [...prev]
      newCart[existingIndex] = { ...existing, qty: existing.qty - 1 }
      return newCart
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
          top: 12px; right: 12px;
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
            {getCatIcon(cat.id)} {cat.name}
          </button>
        ))}
      </div>

      {/* ── Product grid ─────────────────────────────────── */}
      {filtered.length > 0 ? (
        <div className="catalog-grid">
          {filtered.map(item => {
            const config     = item.item_sell_config?.[0]
            const selection  = getSelection(item)
            const isManualOrDynamic = config?.sell_mode === 'Manual' || config?.sell_mode === 'Dynamic'
            const cartItem   = getCartItem(item.id, selection.variantId, isManualOrDynamic)
            const variants   = item.item_variants || []
            const price      = config?.sell_mode === 'Manual'
              ? (config.price_per_base_unit ?? 0) * selection.qty
              : variants.find(v => v.id === selection.variantId)?.price ?? item.price ?? 0

            const activeVariant = variants.find(v => v.id === selection.variantId)
            const activeImageUrl = activeVariant?.image_url || item.item_variants?.[0]?.image_url || null

            return (
              <div key={item.id} className="premium-card" id={`product-${item.id}`}>
                {/* TOP: Image, Sell Badge, Wishlist */}
                <div className="premium-card-top">
                  {getSellModeBadge(config?.sell_mode)}
                  <button 
                    type="button"
                    className={`premium-wishlist ${wishlist.has(item.id) ? 'active' : ''}`}
                    onClick={(e) => toggleWishlist(e, item.id)}
                  >
                    <Heart size={18} />
                  </button>
                  {activeImageUrl ? (
                    <img 
                      key={activeImageUrl}
                      src={activeImageUrl} 
                      alt={item.name} 
                      className="premium-card-img" 
                    />
                  ) : (
                    <div className="product-img-placeholder">
                      <div className="placeholder-checker" />
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
                    {config?.sell_mode === 'Manual' ? (
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
                          placeholder="Custom"
                          className={`premium-pill custom-input-pill ${!getQuickWeightPresets(getUnit(config.base_unit_id)?.symbol).some(p => p.value === selection.qty) && selection.qty > 0 ? 'active' : ''}`}
                          value={selection.qtyStr ?? ''}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            updateSelection(item.id, { qty: parseFloat(e.target.value) || 0, qtyStr: e.target.value });
                          }}
                        />
                      </>
                    ) : config?.sell_mode === 'Dynamic' ? (
                      // Dynamic range inputs side by side
                      <div className="premium-dynamic-inputs" onClick={e => e.stopPropagation()}>
                        <input 
                          type="number" 
                          placeholder="Min Price" 
                          className="dynamic-input-pill"
                          value={selection.minPrice || ''}
                          onChange={(e) => updateSelection(item.id, { minPrice: parseFloat(e.target.value) || undefined })}
                        />
                        <input 
                          type="number" 
                          placeholder="Max Price" 
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
                      <div className="premium-stepper">
                        <button 
                          type="button"
                          className="stepper-btn minus" 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item, true);
                          }}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="stepper-val">{cartItem.qty}</span>
                        <button 
                          type="button"
                          className="stepper-btn plus" 
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
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item);
                        }}
                      >
                        <Plus size={16} />
                        <span>Add to Cart</span>
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
          <span className="empty-state-icon">📦</span>
          <p className="font-semibold">No items in this category</p>
          <p className="text-sm">Try selecting a different category</p>
        </div>
      )}

      {/* ── Bottom bar ───────────────────────────────────── */}
      <div className="catalog-bottom-bar">
        <div className="bottom-bar-input-wrap">
          <button className="bottom-icon-btn" aria-label="Emoji"><span>😊</span></button>
          <button className="bottom-icon-btn" aria-label="Attach"><span>📎</span></button>
          <input
            type="text"
            className="bottom-input"
            placeholder="Search in shop or type a message..."
            id="catalog-message-input"
          />
        </div>

        {totalItems > 0 ? (
          <button className="cart-summary-btn" id="catalog-cart-btn">
            <ShoppingCart size={16} />
            <span>{totalItems} {totalItems === 1 ? 'Item' : 'Items'} ₹{totalPrice.toFixed(0)}</span>
            <Send size={16} />
          </button>
        ) : (
          <button className="send-fab" aria-label="Send" id="catalog-send-btn">
            <Send size={20} />
          </button>
        )}
      </div>
    </div>
  )
}

function getCatIcon(catId: string | null | undefined): string {
  const map: Record<string, string> = {
    'cat-veg': '🥦', 'cat-fruit': '🍎', 'cat-dairy': '🥛',
    'cat-grain': '🌾', 'cat-spice': '🌶️', 'cat-bakery': '🍞',
    'cat-oil': '🫙', 'cat-meat': '🥩',
  }
  return map[catId ?? ''] ?? '📦'
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

function getSellModeBadge(mode?: string) {
  if (!mode) return null;
  const badgeClass = `premium-badge badge-${mode.toLowerCase()}`;
  let label = mode;
  if (mode === 'Fixed') label = 'Packed';
  if (mode === 'Manual') label = 'By Weight';
  return <span className={badgeClass}>{label.toUpperCase()}</span>;
}

function getDynamicPriceDisplay(item: Item, config: ItemSellConfig | undefined, selection: Selection, price: number) {
  if (config?.sell_mode === 'Dynamic') {
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


'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import {
  Search, Bell, ChevronDown, Heart, Plus, Minus,
  Home, LayoutGrid, ShoppingBag, User as UserIcon, Store, ShieldCheck, Trash2
} from 'lucide-react'
import type { Shop, Item, Category, Unit } from '@/types'
import { addToCart, removeOrderItem, updateOrderItemQty } from '../cart/actions'
import AddressDropdownClient from '../AddressDropdownClient'

// Helpers
function initials(name: string) {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.substring(0, Math.min(name.length, 2)).toUpperCase()
}

function getCatIcon(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('vegetable') || n.includes('veg')) return '🥦'
  if (n.includes('fruit'))      return '🍎'
  if (n.includes('dairy'))      return '🥛'
  if (n.includes('grain') || n.includes('rice') || n.includes('wheat')) return '🌾'
  if (n.includes('spice'))      return '🌶️'
  if (n.includes('bakery') || n.includes('bread')) return '🍞'
  if (n.includes('oil'))        return '🫙'
  if (n.includes('meat') || n.includes('fish'))    return '🥩'
  if (n.includes('snack'))      return '🍿'
  if (n.includes('personal') || n.includes('care')) return '🧴'
  if (n.includes('beverage') || n.includes('drink')) return '🥤'
  return '📦'
}

interface Props {
  shops: Shop[]
  allItems: Record<string, Item[]>
  categories: Category[]
  units: Unit[]
  initialCartItems: any[]
  user?: User | null
  role?: string
  locationName?: string
  addresses?: any[]
}

export default function HomeClient({
  shops,
  allItems,
  categories,
  units,
  initialCartItems,
  user,
  role,
  locationName,
  addresses = []
}: Props) {
  const [shopSearch, setShopSearch] = useState('')
  const [itemSearch, setItemSearch] = useState('')
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set())
  
  // Local quantity state for items not in the cart
  const [localQtys, setLocalQtys] = useState<Record<string, number>>({})
  // Controlled input strings for manual quantity text fields
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({})
  
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Synced cart items state
  const [cartItems, setCartItems] = useState<any[]>(initialCartItems)

  useEffect(() => {
    setCartItems(initialCartItems)
  }, [initialCartItems])

  const toggleLike = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    setLikedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const searchParams = useSearchParams()
  const selectedShopId = searchParams?.get('shop')

  const userName = user?.user_metadata?.name || 'Yona'

  const allPopularItems = useMemo(() => {
    return Object.values(allItems).flat().slice(0, 10)
  }, [allItems])

  const availableCategories = useMemo(() => {
    const items = selectedShopId && allItems[selectedShopId] ? allItems[selectedShopId] : allPopularItems
    const categoryIds = new Set(items.map(i => i.category_id).filter(Boolean))
    let cats = categories.filter(c => categoryIds.has(c.id))
    if (cats.length === 0) cats = categories.slice(0, 4)
    if (cats.length === 0) {
      cats = [
        { id: '1', name: 'Fruits', is_active: true, updated_at: '' },
        { id: '2', name: 'Veggies', is_active: true, updated_at: '' },
        { id: '3', name: 'Bread', is_active: true, updated_at: '' },
        { id: '4', name: 'Meat', is_active: true, updated_at: '' }
      ]
    }
    return cats
  }, [selectedShopId, allItems, allPopularItems, categories])

  const findCartItem = (item: Item, variant: any) => {
    const sellConfig = item.item_sell_config?.[0]
    const sellMode = sellConfig?.sell_mode || 'Fixed'
    const isManualOrDynamic = sellMode === 'Manual' || sellMode === 'Dynamic'
    
    return cartItems.find((ci: any) => {
      if (ci.item_id !== item.id) return false
      if (isManualOrDynamic) {
        return true
      } else {
        return ci.variant_id === variant?.id
      }
    })
  }

  const formatQty = (qty: number) => {
    if (qty % 1 === 0) {
      return qty.toString()
    } else {
      return qty.toFixed(1)
    }
  }

  // Update quantity (either in-cart or local)
  const handleUpdateQty = (itemId: string, currentCartItem: any, newQty: number) => {
    if (newQty <= 0) {
      if (currentCartItem) {
        handleRemoveItem(currentCartItem.orderId, currentCartItem.id, itemId)
      }
      return
    }

    if (currentCartItem) {
      // Optimistically update
      setCartItems(prev => prev.map(ci => ci.id === currentCartItem.id ? { ...ci, requested_value: newQty } : ci))
      setQtyInputs(prev => ({ ...prev, [itemId]: formatQty(newQty) }))
      
      startTransition(async () => {
        try {
          await updateOrderItemQty(currentCartItem.orderId, currentCartItem.id, newQty)
        } catch (err: any) {
          alert('Failed to update quantity: ' + (err.message || err))
          setCartItems(initialCartItems)
        }
      })
    } else {
      setLocalQtys(prev => ({ ...prev, [itemId]: newQty }))
      setQtyInputs(prev => ({ ...prev, [itemId]: formatQty(newQty) }))
    }
  }

  // Remove item from cart
  const handleRemoveItem = (orderId: string, orderItemId: string, itemId: string) => {
    // Optimistically update
    setCartItems(prev => prev.filter(ci => ci.id !== orderItemId))
    setLocalQtys(prev => ({ ...prev, [itemId]: 1.0 }))
    setQtyInputs(prev => ({ ...prev, [itemId]: '1' }))
    
    startTransition(async () => {
      try {
        await removeOrderItem(orderId, orderItemId)
      } catch (err: any) {
        alert('Failed to remove item: ' + (err.message || err))
        setCartItems(initialCartItems)
      }
    })
  }

  // Add item to cart
  const handleAdd = (shopId: string, item: Item, variant: any) => {
    const sellConfig = item.item_sell_config?.[0]
    const defaultQty = sellConfig?.sell_mode === 'Manual' ? (localQtys[item.id] ?? 1.0) : 1.0
    const qty = defaultQty
    const price = variant?.price || sellConfig?.price_per_base_unit || 0.0

    startTransition(async () => {
      try {
        await addToCart(shopId, item.id, qty, price, variant?.id)
      } catch (err: any) {
        alert('Failed to add to cart: ' + (err.message || err))
      }
    })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        main.page { padding: 0 !important; max-width: 100% !important; background: #fafafa; }
        header.wa-sidebar-top { display: none !important; }
        body { background: #fafafa; overflow: hidden; }
        ::-webkit-scrollbar { width: 0px; background: transparent; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }

        .desktop-sidebar { display: none; }
        .sidebar-text { display: none; }
        .left-panel, .right-panel { display: flex; flex-direction: column; flex: 1; }
        
        @media (max-width: 767px) {
          .left-panel.hidden-on-mobile { display: none !important; }
          .right-panel.hidden-on-mobile { display: none !important; }
        }
        .sidebar-item {
          display: flex; align-items: center; justify-content: center;
          padding: 12px; border-radius: 16px; margin-bottom: 8px;
          transition: background 0.2s; color: #999; text-decoration: none;
        }
        .sidebar-item.active { background: #e8f9ec; color: #4cd964; }
        .sidebar-item:hover { background: #f0f2f5; }

        @media (min-width: 768px) {
          .desktop-sidebar { 
            display: flex; flex-direction: column; 
            width: 80px; border-right: 1px solid #f0f0f0; 
            background: #fff; align-items: center; padding-top: 32px;
          }
          .mobile-footer { display: none !important; }
        }

        @media (min-width: 1024px) {
          .desktop-sidebar { width: 240px; align-items: flex-start; padding: 32px 24px; }
          .sidebar-item { justify-content: flex-start; width: 100%; gap: 16px; padding: 14px 20px; }
          .sidebar-text { display: block; font-weight: 700; font-size: 15px; }
        }

        @keyframes cardImgSlide {
          0% { opacity: 0; transform: translateX(15px) scale(0.95); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes pricePop {
          0% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        .price-pop {
          display: inline-block;
          animation: pricePop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.2) forwards;
          will-change: transform, opacity;
        }

        .homepage-item-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          align-items: start;
        }
        @media (max-width: 540px) {
          .homepage-item-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            align-items: start;
          }
        }

        .homepage-item-card {
          background: #fff;
          border-radius: 28px;
          padding: 16px 16px 30px 16px;
          position: relative;
          box-shadow: 0 8px 24px rgba(0,0,0,0.03);
          transition: all 0.25s ease;
        }
        @media (max-width: 375px) {
          .homepage-item-card {
            padding: 12px 12px 30px 12px;
            border-radius: 20px;
          }
        }
      `}} />

      <div style={{
        display: 'flex',
        width: '100%',
        background: '#fafafa',
        height: '100dvh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* ================= DESKTOP SIDEBAR ================= */}
        <div className="desktop-sidebar" style={{ zIndex: 100 }}>
          <div style={{ marginBottom: '40px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #4cd964, #32b84a)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Home size={24} />
            </div>
            <span className="sidebar-text" style={{ fontSize: '20px', fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.5px', margin: 0 }}>Market</span>
          </div>

          <Link href="/home" className="sidebar-item active" style={{ color: '#4cd964' }}>
            <Home size={26} strokeWidth={2.5} />
            <span className="sidebar-text">Home</span>
          </Link>
          <Link href="/orders" className="sidebar-item">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
            </svg>
            <span className="sidebar-text">Orders</span>
          </Link>
          <Link href="/cart" className="sidebar-item">
            <ShoppingBag size={26} strokeWidth={2.5} />
            <span className="sidebar-text">Bag</span>
          </Link>
          <Link href="/profile" className="sidebar-item">
            <UserIcon size={26} strokeWidth={2.5} />
            <span className="sidebar-text">Profile</span>
          </Link>
        </div>

        {/* ================= LEFT SIDE ================= */}
        <div className={`left-panel ${selectedShopId ? 'hidden-on-mobile' : ''}`} style={{
          position: 'relative',
          height: '100%',
          overflowY: 'auto',
          borderRight: '1px solid #eee',
          paddingBottom: '100px',
        }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 10px', background: '#fafafa', position: 'sticky', top: 0, zIndex: 10 }}>
            <Link href="/profile" style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#ffcc80', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '18px', textDecoration: 'none' }}>
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#fff', fontWeight: 'bold' }}>{initials(userName)}</span>
              )}
            </Link>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', border: '1px solid #eeeeee', padding: '8px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 600, color: '#1a1a1a', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <span>Home</span>
              <ChevronDown size={16} color="#1a1a1a" style={{ marginLeft: '4px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(role === 'shop_owner' || role === 'admin') && (
                <Link href="/vendor/dashboard" title="Vendor Panel" style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0, color: '#555' }}>
                  <Store size={20} />
                </Link>
              )}
              {role === 'admin' && (
                <Link href="/admin/dashboard" title="Admin Panel" style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0, color: '#555' }}>
                  <ShieldCheck size={20} />
                </Link>
              )}
              <Link href="/notifications" style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0, color: '#555' }}>
                <Bell size={20} />
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', background: '#ff4757', borderRadius: '50%', border: '2px solid #fff' }} />
              </Link>
            </div>
          </div>

          {/* Greeting */}
          <div style={{ padding: '16px 24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
              Hey {userName} <span style={{fontSize: '24px'}}>👋</span>
            </h1>
            <p style={{ fontSize: '15px', color: '#888', margin: 0, fontWeight: 500 }}>Find fresh groceries you want</p>
          </div>

          {/* Search */}
          <div style={{ padding: '8px 24px 20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f0f2f5', borderRadius: '18px', padding: '0 16px' }}>
                <Search size={20} color="#999" />
                <input 
                  placeholder="Search shops..." 
                  value={shopSearch}
                  onChange={e => setShopSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', padding: '16px 12px', fontSize: '15px', width: '100%', outline: 'none', color: '#333', fontWeight: 500 }}
                />
              </div>
              <button style={{ width: '54px', height: '54px', borderRadius: '18px', background: '#4cd964', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', flexShrink: 0, boxShadow: '0 4px 12px rgba(76,217,100,0.3)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                  <rect x="7" y="7" width="10" height="10" rx="2"></rect>
                </svg>
              </button>
            </div>
          </div>

          {/* Shops */}
          <div style={{ padding: '10px 24px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(() => {
                const baseShops = shops.length > 0 ? shops : [
                  { id: 'dummy1', name: 'Vp Store', logo_url: '' } as any,
                  { id: 'dummy2', name: 'Cp Store', logo_url: '' } as any
                ]
                const filteredShops = baseShops.filter(s => s.name.toLowerCase().includes(shopSearch.toLowerCase()))
                
                if (filteredShops.length === 0) {
                  return <p style={{ fontSize: '14px', color: '#888', textAlign: 'center', padding: '20px 0' }}>No shops found.</p>
                }
                
                return filteredShops.map((shop, i) => {
                  const bgColors = ['#fcedef', '#f4e9f9']
                  const bg = bgColors[i % bgColors.length]
                  const shopItems = allItems[shop.id] || []
                  const imgUrl = shop.logo_url
                  const productCount = shops.length > 0 ? shopItems.length : (i === 0 ? 122 : 75)
                  const subtitle = i === 0 ? 'Best organic fresh vegetables' : 'Great deals on fruit'
                  return (
                    <Link href={`/home?shop=${shop.id}`} key={shop.id} style={{ textDecoration: 'none' }}>
                      <div style={{ background: bg, borderRadius: '24px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '80px', height: '80px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 12px rgba(0,0,0,0.1)', overflow: 'hidden', flexShrink: 0 }}>
                          {imgUrl ? (
                            <img src={imgUrl} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#aaa' }}>{initials(shop.name)}</span>
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: '#1a1a1a' }}>{shop.name}</h3>
                          <p style={{ fontSize: '14px', color: '#555', margin: '0 0 8px 0', fontWeight: 500 }}>{productCount} products</p>
                          <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', marginBottom: '8px' }}></div>
                          <p style={{ fontSize: '13px', color: '#444', margin: 0, fontWeight: 500 }}>{subtitle}</p>
                        </div>
                      </div>
                    </Link>
                  )
                })
              })()}
            </div>
          </div>

        </div>

        {/* ================= RIGHT SIDE ================= */}
        <div className={`right-panel ${!selectedShopId ? 'hidden-on-mobile' : ''}`} style={{
          position: 'relative',
          height: '100%',
          overflowY: 'auto',
          paddingBottom: '100px',
        }}>
          
          {/* Top Shop Header */}
          <div style={{ padding: '20px 24px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            {selectedShopId && (
              <Link href="/home" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: '#fff', borderRadius: '12px', color: '#1a1a1a', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} className="md-hidden-back-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </Link>
            )}
            <style dangerouslySetInnerHTML={{ __html: `
              @media (min-width: 768px) { .md-hidden-back-btn { display: none !important; } }
            `}} />
            <div style={{ flex: 1 }}>
              {(() => {
                const shop = shops.find(s => s.id === selectedShopId) || (shops.length > 0 ? shops[0] : { id: 'dummy1', name: 'Vp Store', logo_url: '' } as any);
                const shopItems = allItems[shop.id] || []
                const imgUrl = shop.logo_url
                const productCount = shops.length > 0 ? shopItems.length : 122
                return (
                  <div style={{ background: '#fcedef', borderRadius: '24px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '60px', height: '60px', background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 12px rgba(0,0,0,0.1)', overflow: 'hidden', flexShrink: 0 }}>
                      {imgUrl ? (
                        <img src={imgUrl} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#aaa' }}>{initials(shop.name)}</span>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: '#1a1a1a' }}>{shop.name}</h3>
                      <p style={{ fontSize: '13px', color: '#555', margin: 0, fontWeight: 500 }}>{productCount} products</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Item Search */}
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f5f7f5', borderRadius: '18px', padding: '0 16px' }}>
              <input 
                placeholder="Search items..." 
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', padding: '14px 12px', fontSize: '15px', width: '100%', outline: 'none', color: '#333', fontWeight: 500 }}
              />
              <Search size={20} color="#4cd964" strokeWidth={2.5} />
            </div>
          </div>



          {/* Categories */}
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#1a1a1a', letterSpacing: '-0.5px' }}>Categories</h2>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {selectedCategory && (
                  <button onClick={() => setSelectedCategory(null)} style={{ background: 'none', border: 'none', color: '#ff4757', fontWeight: 700, cursor: 'pointer', marginRight: '8px' }}>CLEAR</button>
                )}
                NOV 07
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingTop: '8px', paddingBottom: '12px', paddingLeft: '4px', paddingRight: '4px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              {availableCategories.map((cat, i) => {
                const bgColors = ['#f4f5f7', '#fdf6f0', '#fdf5eb', '#fceef0']
                const isSelected = selectedCategory === cat.id
                return (
                  <div 
                    key={cat.id || i} 
                    onClick={() => setSelectedCategory(prev => prev === cat.id ? null : cat.id)}
                    style={{ 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', 
                      cursor: 'pointer', flexShrink: 0,
                      opacity: selectedCategory && !isSelected ? 0.5 : 1,
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ 
                      width: '64px', height: '64px', borderRadius: '22px', 
                      background: isSelected ? '#e8f9ec' : bgColors[i % bgColors.length], 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px',
                      boxShadow: isSelected ? '0 6px 16px rgba(0,0,0,0.08)' : 'none',
                      border: isSelected ? '2px solid #4cd964' : '2px solid transparent'
                    }}>
                      {getCatIcon(cat.name)}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#1a1a1a' : '#555' }}>{cat.name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Shop Items */}
          <div style={{ padding: '0 24px 24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 20px 0', color: '#1a1a1a', letterSpacing: '-0.5px' }}>
              {selectedShopId ? 'Shop Items' : 'Popular'}
            </h2>
            <div className="homepage-item-grid">
              {(() => {
                let itemsToShow = selectedShopId && allItems[selectedShopId] 
                  ? allItems[selectedShopId] 
                  : allPopularItems;

                if (selectedCategory) {
                  itemsToShow = itemsToShow.filter(item => item.category_id === selectedCategory)
                }

                if (itemSearch) {
                  itemsToShow = itemsToShow.filter(item => item.name.toLowerCase().includes(itemSearch.toLowerCase()))
                }
                
                if (itemsToShow.length === 0) {
                  return <p style={{ gridColumn: '1 / -1', fontSize: '14px', color: '#888', textAlign: 'center', padding: '20px 0' }}>No items found.</p>
                }

                return itemsToShow.map((item, i) => {
                  const variants = item.item_variants || []
                  const sellConfig = item.item_sell_config?.[0]
                  
                  const isManual = sellConfig?.sell_mode === 'Manual'
                  const isDynamic = sellConfig?.sell_mode === 'Dynamic'
                  const isPortion = sellConfig?.sell_mode === 'Portion'
                  const isPacked = !sellConfig || sellConfig?.sell_mode === 'Fixed'

                  const currentVariantId = selectedVariants[item.id] || variants.find(v => v.is_default)?.id || variants[0]?.id || ''
                  const currentVariant = variants.find(v => v.id === currentVariantId)
                  
                  const cartItem = findCartItem(item, currentVariant)

                  let price = 0
                  let priceUnit = ''
                  if (isManual) {
                    const qty = cartItem ? cartItem.requested_value : (localQtys[item.id] ?? 1.0)
                    price = (sellConfig?.price_per_base_unit || 0.0) * qty
                    const unitSymbol = units.find(u => u.id === sellConfig?.base_unit_id)?.symbol || 'kg'
                    priceUnit = ` / ${unitSymbol}`
                  } else {
                    price = currentVariant?.price || 0.0
                  }

                  const currentQty = cartItem ? cartItem.requested_value : (localQtys[item.id] ?? 1.0)
                  const formattedQty = formatQty(currentQty)
                  const displayQty = qtyInputs[item.id] !== undefined ? qtyInputs[item.id] : formattedQty

                  const activeImageUrl = (currentVariant?.image_url || '').trim() || (item.image_url || '').trim() || (item.item_images?.[0]?.image_url || '').trim() || null

                  return (
                    <div key={item.id} className="homepage-item-card">
                      {/* Heart Button */}
                      <div 
                        onClick={(e) => toggleLike(e, item.id)}
                        style={{ position: 'absolute', top: '14px', right: '14px', width: '28px', height: '28px', borderRadius: '50%', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, cursor: 'pointer' }}
                      >
                        <Heart 
                          size={14} 
                          color={likedItems.has(item.id) ? "#ff4757" : "#ccc"} 
                          fill={likedItems.has(item.id) ? "#ff4757" : "none"} 
                          style={{ transition: 'all 0.2s ease' }}
                        />
                      </div>
                      
                      {/* Image Frame */}
                      <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                        {activeImageUrl ? (
                          <img 
                            key={activeImageUrl}
                            src={activeImageUrl} 
                            alt={item.name} 
                            style={{ 
                              maxWidth: '100%', 
                              maxHeight: '100%', 
                              objectFit: 'contain', 
                              filter: 'drop-shadow(0 12px 16px rgba(0,0,0,0.12))',
                              animation: 'cardImgSlide 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards'
                            }} 
                          />
                        ) : (
                          <span style={{ fontSize: '48px' }}>{getCatIcon(categories.find(c => c.id === item.category_id)?.name || 'Fruit')}</span>
                        )}
                      </div>

                      {/* Item Details */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', margin: '0 0 6px 0' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1a1a1a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{item.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                          <span 
                            key={price}
                            className="price-pop"
                            style={{ fontSize: '15px', fontWeight: 800, color: '#4cd964' }}
                          >
                            ₹{price.toFixed(0)}
                          </span>
                          {priceUnit && (
                            <span style={{ fontSize: '11px', color: '#999', fontWeight: 600 }}>{priceUnit}</span>
                          )}
                        </div>
                      </div>

                      {/* Dropdown Selector Area Replaced with Attractive Variant Cards */}
                      <div style={{ marginTop: '8px', marginBottom: '12px' }}>
                        {((isDynamic || isPortion || (isPacked && variants.length > 1)) && variants.length > 0) ? (
                          <div 
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              padding: '4px 0',
                            }}
                          >
                            {variants.map(v => {
                              const isActive = v.id === currentVariantId;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => setSelectedVariants(prev => ({ ...prev, [item.id]: v.id }))}
                                  style={{
                                    display: 'inline-block',
                                    flexShrink: 0,
                                    padding: '4px 8px',
                                    borderRadius: '8px',
                                    border: isActive ? '2px solid #4cd964' : '1px solid #e2e8f0',
                                    background: isActive ? 'linear-gradient(135deg, #e8f9ec, #dcfce7)' : '#ffffff',
                                    color: isActive ? '#15803d' : '#4b5563',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                                    boxShadow: isActive ? '0 4px 10px rgba(76, 217, 100, 0.15)' : 'none',
                                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                    outline: 'none'
                                  }}
                                >
                                  {v.label}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ height: '32px' }}></div>
                        )}
                      </div>

                      {/* Action Bar (Absolute Row) */}
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        right: '8px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {isManual ? (
                          // Manual Selling Mode Action UI
                          cartItem ? (
                            <>
                              <div style={{
                                flex: 1,
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                background: 'rgba(76, 217, 100, 0.1)',
                                borderRadius: '16px',
                                padding: '0 12px'
                              }}>
                                <input
                                  type="text"
                                  value={displayQty}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setQtyInputs(prev => ({ ...prev, [item.id]: val }))
                                    const parsed = parseFloat(val)
                                    if (!isNaN(parsed) && parsed > 0) {
                                      handleUpdateQty(item.id, cartItem, parsed)
                                    }
                                  }}
                                  onBlur={() => {
                                    setQtyInputs(prev => {
                                      const next = { ...prev }
                                      delete next[item.id]
                                      return next
                                    })
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    width: '100%',
                                    outline: 'none',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#32b84a'
                                  }}
                                />
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#32b84a',
                                  marginLeft: '4px',
                                  flexShrink: 0
                                }}>
                                  {units.find(u => u.id === sellConfig?.base_unit_id)?.symbol || 'kg'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveItem(cartItem.orderId, cartItem.id, item.id)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  background: '#ffebeb',
                                  borderRadius: '50%',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ff4757',
                                  cursor: 'pointer',
                                  flexShrink: 0
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <div style={{
                                flex: 1,
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                background: '#f5f5f5',
                                borderRadius: '16px',
                                padding: '0 12px'
                              }}>
                                <input
                                  type="text"
                                  value={displayQty}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setQtyInputs(prev => ({ ...prev, [item.id]: val }))
                                    const parsed = parseFloat(val)
                                    if (!isNaN(parsed) && parsed > 0) {
                                      setLocalQtys(prev => ({ ...prev, [item.id]: parsed }))
                                    }
                                  }}
                                  onBlur={() => {
                                    setQtyInputs(prev => {
                                      const next = { ...prev }
                                      delete next[item.id]
                                      return next
                                    })
                                  }}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    width: '100%',
                                    outline: 'none',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: '#1a1a1a'
                                  }}
                                />
                                <span style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#555555',
                                  marginLeft: '4px',
                                  flexShrink: 0
                                }}>
                                  {units.find(u => u.id === sellConfig?.base_unit_id)?.symbol || 'kg'}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAdd(item.shop_id || '', item, currentVariant)}
                                disabled={isPending}
                                style={{
                                  height: '32px',
                                  padding: '0 12px',
                                  background: '#4cd964',
                                  borderRadius: '16px',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontWeight: 'bold',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  flexShrink: 0
                                }}
                              >
                                Add
                              </button>
                            </>
                          )
                        ) : (
                          // Non-manual Mode Action UI
                          cartItem ? (
                            <div style={{
                              flex: 1,
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'rgba(76, 217, 100, 0.1)',
                              borderRadius: '16px',
                              border: '1px solid rgba(76, 217, 100, 0.3)',
                              padding: '0 8px'
                            }}>
                              <button 
                                onClick={() => handleUpdateQty(item.id, cartItem, cartItem.requested_value - 1)}
                                style={{ border: 'none', background: 'transparent', color: '#32b84a', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Minus size={14} strokeWidth={2.5} />
                              </button>
                              <span style={{ fontSize: '14px', fontWeight: 800, color: '#32b84a' }}>{formattedQty}</span>
                              <button 
                                onClick={() => handleUpdateQty(item.id, cartItem, cartItem.requested_value + 1)}
                                style={{ border: 'none', background: 'transparent', color: '#32b84a', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Plus size={14} strokeWidth={2.5} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div style={{
                                flex: 1,
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: '#f5f5f5',
                                borderRadius: '16px',
                                padding: '0 8px'
                              }}>
                                <button 
                                  onClick={() => handleUpdateQty(item.id, null, (localQtys[item.id] ?? 1.0) - 1)}
                                  style={{ border: 'none', background: 'transparent', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                  <Minus size={12} strokeWidth={2} />
                                </button>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a1a' }}>{formattedQty}</span>
                                <button 
                                  onClick={() => handleUpdateQty(item.id, null, (localQtys[item.id] ?? 1.0) + 1)}
                                  style={{ border: 'none', background: 'transparent', color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                  <Plus size={12} strokeWidth={2} />
                                </button>
                              </div>
                              <button
                                onClick={() => handleAdd(item.shop_id || '', item, currentVariant)}
                                disabled={isPending}
                                style={{
                                  height: '32px',
                                  padding: '0 12px',
                                  background: '#4cd964',
                                  borderRadius: '16px',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontWeight: 'bold',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  flexShrink: 0
                                }}
                              >
                                Add
                              </button>
                            </>
                          )
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

        </div>

      </div>
    </>
  )
}

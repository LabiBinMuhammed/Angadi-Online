'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import {
  Search, Bell, ChevronDown, Heart, Plus, Minus,
  Home, LayoutGrid, ShoppingBag, User as UserIcon, Store, ShieldCheck, Trash2,
  Carrot, Apple, Milk, Wheat, Flame, Croissant, GlassWater, Fish, Cookie, Package, CupSoda, Scale, RefreshCw, Scissors,
  Bookmark, History, MessageSquare
} from 'lucide-react'
import { togglePinnedShop, toggleFavoriteItem } from '@/app/actions/newFeatures'
import type { Shop, Item, Category, Unit } from '@/types'
import { addToCart, removeOrderItem, updateOrderItemQty } from '../cart/actions'
import AddressDropdownClient from '../AddressDropdownClient'
import { useTheme } from '@/components/ThemeProvider'
import { useTranslation } from '@/lib/i18n/I18nContext'

// Helpers
function initials(name?: string) {
  if (!name) return 'S'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.substring(0, Math.min(name.length, 2)).toUpperCase()
}

function renderCatIcon(name: string, size = 28, color?: string) {
  const n = name.toLowerCase()
  if (n.includes('vegetable') || n.includes('veg')) return <Carrot size={size} color={color} />
  if (n.includes('fruit'))      return <Apple size={size} color={color} />
  if (n.includes('dairy'))      return <Milk size={size} color={color} />
  if (n.includes('grain') || n.includes('rice') || n.includes('wheat')) return <Wheat size={size} color={color} />
  if (n.includes('spice'))      return <Flame size={size} color={color} />
  if (n.includes('bakery') || n.includes('bread')) return <Croissant size={size} color={color} />
  if (n.includes('oil'))        return <GlassWater size={size} color={color} />
  if (n.includes('meat') || n.includes('fish'))    return <Fish size={size} color={color} />
  if (n.includes('snack'))      return <Cookie size={size} color={color} />
  if (n.includes('personal') || n.includes('care')) return <GlassWater size={size} color={color} />
  if (n.includes('beverage') || n.includes('drink')) return <CupSoda size={size} color={color} />
  return <Package size={size} color={color} />
}

function getSellModeBadge(mode?: string) {
  let IconComponent = Package;
  let bgColor = 'rgba(59, 130, 246, 0.12)';
  let iconColor = '#2563eb';
  let title = 'Packed';
  
  const m = (mode || 'Fixed').toLowerCase();
  if (m === 'manual') {
    IconComponent = Scale;
    bgColor = 'rgba(34, 197, 94, 0.12)';
    iconColor = '#16a34a';
    title = 'By Weight';
  } else if (m === 'fixed') {
    IconComponent = Package;
    bgColor = 'rgba(59, 130, 246, 0.12)';
    iconColor = '#2563eb';
    title = 'Packed';
  } else if (m === 'dynamic') {
    IconComponent = RefreshCw;
    bgColor = 'rgba(249, 115, 22, 0.12)';
    iconColor = '#ea580c';
    title = 'Variable Weight';
  } else if (m === 'portion') {
    IconComponent = Scissors;
    bgColor = 'rgba(168, 85, 247, 0.12)';
    iconColor = '#9333ea';
    title = 'Portions';
  }

  return (
    <div 
      style={{
        position: 'absolute',
        top: '0px',
        right: '0px',
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
  initialPinnedShopIds?: string[]
  initialFavoriteItemIds?: string[]
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
  addresses = [],
  initialPinnedShopIds = [],
  initialFavoriteItemIds = []
}: Props) {
  const { theme } = useTheme()
  const { locale, t } = useTranslation()
  const router = useRouter()
  const [shopSearch, setShopSearch] = useState('')
  const [currentDateStr, setCurrentDateStr] = useState('')

  useEffect(() => {
    setCurrentDateStr(new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(new Date()).toUpperCase())
  }, [])
  const [itemSearch, setItemSearch] = useState('')
  const [pinnedShopIds, setPinnedShopIds] = useState<Set<string>>(new Set(initialPinnedShopIds))
  const [likedItemIds, setLikedItemIds] = useState<Set<string>>(new Set(initialFavoriteItemIds))
  const [toast, setToast] = useState<string | null>(null)
  
  // Local quantity state for items not in the cart
  const [localQtys, setLocalQtys] = useState<Record<string, number>>({})
  // Controlled input strings for manual quantity text fields
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({})
  
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // Track which item IDs are in "just added" success state (prevents rage-clicks)
  const [cartSuccessItems, setCartSuccessItems] = useState<Set<string>>(new Set())

  // Synced cart items state
  const [cartItems, setCartItems] = useState<any[]>(initialCartItems)

  useEffect(() => {
    setCartItems(initialCartItems)
  }, [initialCartItems])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleTogglePinShop = (e: React.MouseEvent, shopId: string, shopName: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      showToast('Please login to pin shops')
      return
    }
    const isPinned = pinnedShopIds.has(shopId)
    if (!isPinned && pinnedShopIds.size >= 3) {
      showToast('You can only pin up to 3 shops. Please unpin a shop first.')
      return
    }
    setPinnedShopIds(prev => {
      const next = new Set(prev)
      if (isPinned) next.delete(shopId)
      else next.add(shopId)
      return next
    })
    
    startTransition(async () => {
      try {
        await togglePinnedShop(shopId)
        showToast(isPinned ? `${shopName} unpinned` : `${shopName} pinned`)
      } catch (err) {
        console.error(err)
        // Rollback
        setPinnedShopIds(prev => {
          const next = new Set(prev)
          if (isPinned) next.add(shopId)
          else next.delete(shopId)
          return next
        })
        showToast('Failed to update pin')
      }
    })
  }

  const handleToggleFavoriteItem = (e: React.MouseEvent, itemId: string, itemName: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      showToast('Please login to favorite items')
      return
    }
    const isLiked = likedItemIds.has(itemId)
    setLikedItemIds(prev => {
      const next = new Set(prev)
      if (isLiked) next.delete(itemId)
      else next.add(itemId)
      return next
    })
    
    startTransition(async () => {
      try {
        await toggleFavoriteItem(itemId)
        showToast(isLiked ? `${itemName} removed from favorites` : `${itemName} favorited`)
      } catch (err) {
        console.error(err)
        // Rollback
        setLikedItemIds(prev => {
          const next = new Set(prev)
          if (isLiked) next.add(itemId)
          else next.delete(itemId)
          return next
        })
        showToast('Failed to update favorite')
      }
    })
  }

  const searchParams = useSearchParams()
  const selectedShopId = searchParams?.get('shop')

  // Redirection: If selectedShopId is invalid/dummy but we have real database shops, redirect the URL
  useEffect(() => {
    if (selectedShopId && shops.length > 0) {
      const exists = shops.some(s => s.id === selectedShopId)
      if (!exists) {
        router.replace(`/${locale}/home?shop=${shops[0].id}`)
      }
    }
  }, [selectedShopId, shops, locale, router])

  const activeShop = useMemo(() => {
    // 1. Try to find the shop matching selectedShopId
    const found = shops.find(s => s.id === selectedShopId)
    if (found) return found
    
    // 2. If selectedShopId is a dummy ID or invalid, but we have real shops, fallback to first real shop
    if (shops.length > 0) {
      return shops[0]
    }
    
    // 3. Fallback to dummy shops if no real shops exist in the database
    if (selectedShopId === 'dummy2') {
      return { id: 'dummy2', name: 'Cp Store', logo_url: '' } as any
    }
    return { id: 'dummy1', name: 'Vp Store', logo_url: '' } as any
  }, [shops, selectedShopId])

  const hasSelectedShop = !!selectedShopId
  const effectiveShopId = activeShop?.id || selectedShopId || ''

  const userName = user?.user_metadata?.name || 'Yona'

  const allPopularItems = useMemo(() => {
    return Object.values(allItems).flat().slice(0, 10)
  }, [allItems])

  const availableCategories = useMemo(() => {
    const items = hasSelectedShop ? (allItems[effectiveShopId] || []) : allPopularItems
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
  }, [hasSelectedShop, effectiveShopId, allItems, allPopularItems, categories])

  const findCartItem = (item: Item, variant: any) => {
    const sellConfig = Array.isArray(item.item_sell_config) ? item.item_sell_config[0] : item.item_sell_config
    const sellMode = sellConfig?.sell_mode || 'Fixed'
    const isManualOrDynamic = sellMode.toLowerCase() === 'manual' || sellMode.toLowerCase() === 'dynamic'
    
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
          showToast('Failed to update quantity. Please try again.')
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
        showToast('Failed to remove item. Please try again.')
        setCartItems(initialCartItems)
      }
    })
  }

  // Add item to cart
  const handleAdd = (shopId: string, item: Item, variant: any) => {
    if (cartSuccessItems.has(item.id)) return // prevent rage-click during success state
    const sellConfig = Array.isArray(item.item_sell_config) ? item.item_sell_config[0] : item.item_sell_config
    const defaultQty = sellConfig?.sell_mode?.toLowerCase() === 'manual' ? (localQtys[item.id] ?? 1.0) : 1.0
    const qty = defaultQty
    const price = variant?.price || sellConfig?.price_per_base_unit || 0.0

    startTransition(async () => {
      try {
        await addToCart(shopId, item.id, qty, price, variant?.id)
        showToast(`🛒 ${item.name} added to cart`)
        // Temporarily mark this item as success to prevent duplicate adds
        setCartSuccessItems(prev => new Set(prev).add(item.id))
        setTimeout(() => {
          setCartSuccessItems(prev => {
            const next = new Set(prev)
            next.delete(item.id)
            return next
          })
        }, 1500)
      } catch (err: any) {
        showToast('Failed to add to cart. Please try again.')
      }
    })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        main.page { padding: 0 !important; max-width: 100% !important; background: var(--bg-base); overflow: hidden !important; }
        header.wa-sidebar-top { display: none !important; }
        body { background: var(--bg-base); overflow: hidden; }
        ::-webkit-scrollbar { width: 0px; background: transparent; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        
        .toast { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: #1f2937; color: #fff; padding: 12px 24px; border-radius: 20px; font-size: 14px; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 1000; animation: toastFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes toastFadeIn { from { opacity: 0; bottom: 80px; } to { opacity: 1; bottom: 100px; } }

        .left-panel, .right-panel { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        
        /* Desktop: left panel has fixed width, right fills rest */
        @media (min-width: 768px) {
          .left-panel { flex: 0 0 380px; max-width: 380px; }
          .right-panel { flex: 1; min-width: 0; }
        }

        /* Mobile: each panel takes the full width, toggled via hidden-on-mobile */
        @media (max-width: 767px) {
          .left-panel, .right-panel { flex: 0 0 100%; width: 100%; max-width: 100%; }
          .left-panel.hidden-on-mobile { display: none !important; }
          .right-panel.hidden-on-mobile { display: none !important; }
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
          background: var(--bg-surface);
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

        .marketplace-shops-container {
          padding: 10px 24px 24px;
        }

        .marketplace-shop-card {
          border-radius: 24px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.2s ease;
        }
        .marketplace-shop-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.04);
        }
        .marketplace-shop-logo {
          width: 80px;
          height: 80px;
          background: var(--bg-surface);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 12px rgba(0,0,0,0.1);
          overflow: hidden;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .marketplace-shop-details {
          flex: 1;
          min-width: 0;
        }

        @media (max-width: 900px) {
          .marketplace-shop-card {
            flex-direction: row;
            align-items: center;
            gap: 16px;
            padding: 16px;
          }
          .marketplace-shop-logo {
            width: 70px;
            height: 70px;
          }
        }
        @media (max-width: 767px) {
          .marketplace-shop-card {
            flex-direction: row;
            align-items: center;
            gap: 20px;
            padding: 20px;
          }
          .marketplace-shop-logo {
            width: 80px;
            height: 80px;
          }
        }
        @media (max-width: 480px) {
          .marketplace-shop-card {
            flex-direction: row;
            align-items: center;
            gap: 16px;
            padding: 16px;
          }
          .marketplace-shop-logo {
            width: 70px;
            height: 70px;
          }
        }
        @media (max-width: 375px) {
          .marketplace-shops-container {
            padding: 10px 16px 16px;
          }
        }
      `}} />

      <div style={{
        display: 'flex',
        width: '100%',
        background: 'var(--bg-base)',
        height: '100dvh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        
        {/* Sidebar is rendered globally in MainLayout */}

        {/* ================= LEFT SIDE ================= */}
        <div className={`left-panel ${selectedShopId ? 'hidden-on-mobile' : ''}`} style={{
          position: 'relative',
          height: '100%',
          overflowY: 'auto',
          borderRight: '1px solid var(--border)',
          paddingBottom: '100px',
        }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 10px', background: 'var(--bg-base)', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 600, color: 'var(--text-base)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <span>{t('nav.home')}</span>
              <ChevronDown size={16} color="var(--text-base)" style={{ marginLeft: '4px' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(role === 'shop_owner' || role === 'admin') && (
                <Link href="/vendor/dashboard" title="Vendor Panel" style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0, color: 'var(--text-base)' }}>
                  <Store size={20} />
                </Link>
              )}
              {role === 'admin' && (
                <Link href="/admin/dashboard" title="Admin Panel" style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0, color: 'var(--text-base)' }}>
                  <ShieldCheck size={20} />
                </Link>
              )}
              <Link href="/recent-purchases" title={t('recent_purchases.title')} style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0, color: 'var(--text-base)' }}>
                <History size={20} />
              </Link>
              <Link href="/favorites" title={t('favorites.title')} style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0, color: 'var(--text-base)' }}>
                <Heart size={20} />
              </Link>
              <Link href="/notifications" style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-surface)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0, color: 'var(--text-base)' }}>
                <Bell size={20} />
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '8px', height: '8px', background: '#ff4757', borderRadius: '50%', border: '2px solid var(--bg-surface)' }} />
              </Link>
            </div>
          </div>

          {/* Greeting */}
          <div style={{ padding: '16px 24px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-base)', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
              {t('home.hey')} {userName} <span style={{fontSize: '24px'}}>👋</span>
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{t('home.welcome_subtitle')}</p>
          </div>

          {/* Search */}
          <div style={{ padding: '8px 24px 20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-muted)', borderRadius: '18px', padding: '0 16px' }}>
                <Search size={20} color="var(--text-muted)" />
                <input 
                  placeholder={t('home.search_shops')} 
                  value={shopSearch}
                  onChange={e => setShopSearch(e.target.value)}
                  style={{ border: 'none', background: 'transparent', padding: '16px 12px', fontSize: '15px', width: '100%', outline: 'none', color: 'var(--text-base)', fontWeight: 500 }}
                />
              </div>
            </div>
          </div>



          {/* Shops */}
          <div className="marketplace-shops-container">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(() => {
                const baseShops = shops.length > 0 ? shops : [
                  { id: 'dummy1', name: 'Vp Store', logo_url: '' } as any,
                  { id: 'dummy2', name: 'Cp Store', logo_url: '' } as any
                ]
                const filteredShops = baseShops.filter(s => s.name.toLowerCase().includes(shopSearch.toLowerCase()))
                const sortedShops = [...filteredShops].sort((a, b) => {
                  const aPinned = pinnedShopIds.has(a.id) ? 1 : 0
                  const bPinned = pinnedShopIds.has(b.id) ? 1 : 0
                  return bPinned - aPinned
                })
                
                if (sortedShops.length === 0) {
                  return <p style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>{t('home.no_shops_found')}</p>
                }
                
                return sortedShops.map((shop, i) => {
                  const bgColors = theme === 'dark' ? ['var(--bg-muted)', 'var(--bg-muted)'] : ['#fcedef', '#f4e9f9']
                  const bg = bgColors[i % bgColors.length]
                  const shopItems = allItems[shop.id] || []
                  const imgUrl = shop.logo_url
                  const productCount = shops.length > 0 ? shopItems.length : (i === 0 ? 122 : 75)
                  const subtitle = i === 0 ? t('home.best_organic') : t('home.great_deals')
                  return (
                    <Link href={`/home?shop=${shop.id}`} key={shop.id} style={{ textDecoration: 'none' }}>
                      <div className="marketplace-shop-card" style={{ background: bg }}>
                        <div className="marketplace-shop-logo">
                          {imgUrl ? (
                            <img src={imgUrl} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-light)' }}>{initials(shop.name)}</span>
                          )}
                        </div>
                        <div className="marketplace-shop-details" style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{shop.name}</h3>
                      <button
                          type="button"
                          onClick={(e) => handleTogglePinShop(e, shop.id, shop.name)}
                          aria-label={pinnedShopIds.has(shop.id) ? `Unpin ${shop.name}` : `Pin ${shop.name}`}
                          style={{ border: 'none', background: 'transparent', padding: '4px', cursor: 'pointer', color: pinnedShopIds.has(shop.id) ? 'var(--wa-green-dark)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                        >
                              <Bookmark size={18} fill={pinnedShopIds.has(shop.id) ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 8px 0', fontWeight: 500 }}>{productCount} {t('home.products')}</p>
                          <div style={{ height: '1px', background: 'var(--border)', marginBottom: '8px' }}></div>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{subtitle}</p>
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
        <div className={`right-panel ${!hasSelectedShop ? 'hidden-on-mobile' : ''}`} style={{
          position: 'relative',
          height: '100%',
          overflowY: 'auto',
          paddingBottom: '100px',
        }}>
          
          {/* Top Shop Header */}
          <div style={{ padding: '20px 24px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            {hasSelectedShop && (
              <Link href="/home" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'var(--bg-surface)', borderRadius: '12px', color: 'var(--text-base)', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} className="md-hidden-back-btn">
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
                const shop = activeShop;
                const shopItems = shop ? (allItems[shop?.id] || []) : []
                const imgUrl = shop?.logo_url
                const productCount = shopItems.length
                const shopHeaderBg = theme === 'dark' ? 'var(--bg-muted)' : '#fcedef'
                return (
                  <div style={{ background: shopHeaderBg, borderRadius: '24px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0, flex: 1 }}>
                      <div style={{ width: '60px', height: '60px', background: 'var(--bg-surface)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 12px rgba(0,0,0,0.1)', overflow: 'hidden', flexShrink: 0 }}>
                        {imgUrl ? (
                          <img src={imgUrl} alt={shop?.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-light)' }}>{initials(shop?.name)}</span>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-base)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shop?.name || ''}</h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{productCount} {t('home.products')}</p>
                      </div>
                    </div>
                    {shops.length > 0 && shop?.id !== 'dummy1' && shop?.id !== 'dummy2' && (
                      <Link 
                        href={`/shop/${shop?.id}?tab=reviews`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px',
                          background: 'var(--bg-surface)',
                          borderRadius: '50%',
                          color: 'var(--wa-green-dark)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                          flexShrink: 0,
                          cursor: 'pointer',
                        }}
                        title="Shop Reviews & Feedback"
                      >
                        <MessageSquare size={20} />
                      </Link>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Item Search */}
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-muted)', borderRadius: '18px', padding: '0 16px' }}>
              <input 
                placeholder={t('home.search_items')} 
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', padding: '14px 12px', fontSize: '15px', width: '100%', outline: 'none', color: 'var(--text-base)', fontWeight: 500 }}
              />
              <Search size={20} color="var(--wa-green)" strokeWidth={2.5} />
            </div>
          </div>

          {/* Categories */}
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-base)', letterSpacing: '-0.5px' }}>{t('nav.categories')}</h2>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {selectedCategory && (
                  <button onClick={() => setSelectedCategory(null)} style={{ background: 'none', border: 'none', color: '#ff4757', fontWeight: 700, cursor: 'pointer', marginRight: '8px' }}>{t('home.clear')}</button>
                )}
                {currentDateStr}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingTop: '8px', paddingBottom: '12px', paddingLeft: '4px', paddingRight: '4px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
              {availableCategories.map((cat, i) => {
                const bgColors = theme === 'dark' ? ['var(--bg-muted)', 'var(--bg-muted)', 'var(--bg-muted)', 'var(--bg-muted)'] : ['#f4f5f7', '#fdf6f0', '#fdf5eb', '#fceef0']
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
                      background: isSelected ? 'var(--wa-green-light)' : bgColors[i % bgColors.length], 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: isSelected ? '0 6px 16px rgba(0,0,0,0.08)' : 'none',
                      border: isSelected ? '2px solid var(--wa-green)' : '2px solid transparent'
                    }}>
                      {renderCatIcon(cat.name, 28, isSelected ? 'var(--wa-green-dark)' : 'var(--text-muted)')}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--text-base)' : 'var(--text-muted)' }}>{cat.name}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Shop Items */}
          <div style={{ padding: '0 24px 24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 20px 0', color: 'var(--text-base)', letterSpacing: '-0.5px' }}>
              {hasSelectedShop ? t('home.shop_items') : t('home.popular')}
            </h2>
            <div className="homepage-item-grid">
              {(() => {
                let itemsToShow = hasSelectedShop 
                  ? (allItems[effectiveShopId] || []) 
                  : allPopularItems;

                if (selectedCategory) {
                  itemsToShow = itemsToShow.filter(item => item.category_id === selectedCategory)
                }

                if (itemSearch) {
                  itemsToShow = itemsToShow.filter(item => item.name.toLowerCase().includes(itemSearch.toLowerCase()))
                }
                
                if (itemsToShow.length === 0) {
                  return <p style={{ gridColumn: '1 / -1', fontSize: '14px', color: 'var(--text-light)', textAlign: 'center', padding: '20px 0' }}>{t('common.no_items')}</p>
                }

                return itemsToShow.map((item, i) => {
                  const variants = item.item_variants || []
                  const sellConfig = Array.isArray(item.item_sell_config) ? item.item_sell_config[0] : item.item_sell_config
                  
                  const modeLower = sellConfig?.sell_mode?.toLowerCase()
                  const isManual = modeLower === 'manual'
                  const isDynamic = modeLower === 'dynamic'
                  const isPortion = modeLower === 'portion'
                  const isPacked = !sellConfig || modeLower === 'fixed' || modeLower === 'packed'

                  const currentVariantId = selectedVariants[item.id] || variants.find(v => v.is_default)?.id || variants[0]?.id || ''
                  const currentVariant = variants.find(v => v.id === currentVariantId)
                  
                  let price = 0
                  let priceUnit = ''
                  if (isManual) {
                    const qty = localQtys[item.id] ?? 1.0
                    price = (sellConfig?.price_per_base_unit || 0.0) * qty
                    const unitSymbol = units.find(u => u.id === sellConfig?.base_unit_id)?.symbol || 'kg'
                    priceUnit = ` / ${unitSymbol}`
                  } else {
                    price = currentVariant?.price || 0.0
                  }

                  const currentQty = localQtys[item.id] ?? 1.0
                  const formattedQty = formatQty(currentQty)
                  const displayQty = qtyInputs[item.id] !== undefined ? qtyInputs[item.id] : formattedQty

                  const mainImageUrl = (item.image_url || '').trim() || (item.item_images?.[0]?.image_url || '').trim() || null
                  const variantImageUrl = (currentVariant?.image_url || '').trim() || null

                  return (
                    <div key={item.id} className="homepage-item-card" style={{ position: 'relative' }}>
                      {/* Favorite Heart Button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavoriteItem(e, item.id, item.name)}
                        aria-label={likedItemIds.has(item.id) ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          border: 'none',
                          background: 'var(--bg-surface)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: likedItemIds.has(item.id) ? '#ff4757' : 'var(--text-light)',
                          cursor: 'pointer',
                          zIndex: 10,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          transition: 'transform 0.2s'
                        }}
                      >
                        <Heart size={16} fill={likedItemIds.has(item.id) ? '#ff4757' : 'none'} />
                      </button>

                      {/* Image Frame - aspect-ratio for CLS prevention */}
                      <div style={{ aspectRatio: '1/1', maxHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', width: '100%', position: 'relative' }}>
                        {/* Product Type Badge */}
                        {getSellModeBadge(sellConfig?.sell_mode)}
                        {mainImageUrl ? (
                          <img 
                            key={mainImageUrl}
                            src={mainImageUrl} 
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
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', width: '100%', height: '100%' }}>
                            {renderCatIcon(categories.find(c => c.id === item.category_id)?.name || 'Fruit', 48)}
                          </span>
                        )}

                        {/* Variant Image Overlay (Half size / PIP) */}
                        {variantImageUrl && variantImageUrl !== mainImageUrl && (
                          <div 
                            style={{ 
                              position: 'absolute', 
                              bottom: '-6px', 
                              right: '4px', 
                              width: '46px', 
                              height: '46px', 
                              borderRadius: '12px', 
                              border: '2.5px solid var(--bg-surface)', 
                              boxShadow: '0 4px 12px rgba(0,0,0,0.16)', 
                              overflow: 'hidden', 
                              background: 'var(--bg-surface)', 
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

                      {/* Item Details */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', margin: '0 0 6px 0' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-base)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{item.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                          <span 
                            key={price}
                            className="price-pop"
                            style={{ fontSize: '15px', fontWeight: 800, color: 'var(--wa-green)' }}
                          >
                            ₹{price.toFixed(0)}
                          </span>
                          {priceUnit && (
                            <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 600 }}>{priceUnit}</span>
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
                                    border: isActive ? '2px solid var(--wa-green)' : '1px solid var(--border)',
                                    background: isActive ? 'linear-gradient(135deg, var(--wa-green-light), var(--wa-green-light))' : 'var(--bg-surface)',
                                    color: isActive ? 'var(--wa-green-dark)' : 'var(--text-muted)',
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
                          <>
                            <div style={{
                              flex: 1,
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              background: 'var(--bg-muted)',
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
                                  color: 'var(--text-base)'
                                }}
                              />
                              <span style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                                marginLeft: '4px',
                                flexShrink: 0
                              }}>
                                {units.find(u => u.id === sellConfig?.base_unit_id)?.symbol || 'kg'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleAdd(item.shop_id || '', item, currentVariant)}
                              disabled={isPending || cartSuccessItems.has(item.id)}
                              aria-label={cartSuccessItems.has(item.id) ? 'Added to cart' : `Add ${item.name} to cart`}
                              style={{
                                height: '32px',
                                padding: '0 12px',
                                background: cartSuccessItems.has(item.id) ? 'var(--wa-green-dark)' : 'var(--wa-green)',
                                borderRadius: '16px',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                cursor: cartSuccessItems.has(item.id) ? 'default' : 'pointer',
                                flexShrink: 0,
                                transition: 'background 0.2s ease'
                              }}
                            >
                              {cartSuccessItems.has(item.id) ? '✓' : t('home.add')}
                            </button>
                          </>
                        ) : (
                          // Non-manual Mode Action UI
                          <>
                            <div style={{
                              flex: 1,
                              height: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'var(--bg-muted)',
                              borderRadius: '16px',
                              padding: '0 8px'
                            }}>
                              <button 
                                onClick={() => handleUpdateQty(item.id, null, (localQtys[item.id] ?? 1.0) - 1)}
                                style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Minus size={12} strokeWidth={2} />
                              </button>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-base)' }}>{formattedQty}</span>
                              <button 
                                onClick={() => handleUpdateQty(item.id, null, (localQtys[item.id] ?? 1.0) + 1)}
                                style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Plus size={12} strokeWidth={2} />
                              </button>
                            </div>
                            <button
                              onClick={() => handleAdd(item.shop_id || '', item, currentVariant)}
                              disabled={isPending}
                              style={{
                                height: '32px',
                                padding: '0 12px',
                                background: 'var(--wa-green)',
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
                              {cartSuccessItems.has(item.id) ? '✓' : t('home.add')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

        </div>

        {toast && <div className="global-toast">{toast}</div>}

      </div>
    </>
  )
}

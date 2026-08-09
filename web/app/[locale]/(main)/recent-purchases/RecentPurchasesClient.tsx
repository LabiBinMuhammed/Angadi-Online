'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, History, Search, ShoppingCart, Loader2, Check } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'
import BackButton from '@/components/BackButton'
import { addToCart } from '../cart/actions'

interface RecentPurchaseItem {
  item_id: string
  product_name: string
  shop_id: string
  shop_name: string
  last_purchased_date: string
  last_purchased_qty: number
  last_purchased_price: number
  last_variant_id: string
  total_ordered_count: number
  image_url: string | null
  is_active: boolean
  has_variants: boolean
  item_status: string
}

interface Props {
  initialPurchases: RecentPurchaseItem[]
}

export default function RecentPurchasesClient({ initialPurchases }: Props) {
  const { t } = useTranslation()
  const [purchases] = useState<RecentPurchaseItem[]>(initialPurchases)
  const [daysFilter, setDaysFilter] = useState<'7' | '30' | '90' | 'all'>('90')
  const [sortBy, setSortBy] = useState<'recent' | 'ordered'>('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [addingItemId, setAddingItemId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleReorder = async (item: RecentPurchaseItem) => {
    if (!item.is_active || item.item_status === 'out_of_stock') {
      showToast(`${item.product_name} is currently out of stock`)
      return
    }

    setAddingItemId(item.item_id)
    
    startTransition(async () => {
      try {
        await addToCart(
          item.shop_id,
          item.item_id,
          1, // default qty to reorder is 1
          item.last_purchased_price,
          item.last_variant_id
        )
        showToast(`${item.product_name} added to cart`)
      } catch (err: any) {
        console.error(err)
        showToast(err.message || 'Failed to add to cart')
      } finally {
        setAddingItemId(null)
      }
    })
  }

  // Filter & Sort Logic Client-side for instant updates
  const filteredPurchases = purchases
    .filter(item => {
      // 1. Date Filter
      if (daysFilter !== 'all') {
        const limitDays = parseInt(daysFilter, 10)
        const purchaseDate = new Date(item.last_purchased_date)
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - limitDays)
        if (purchaseDate < cutoffDate) return false
      }

      // 2. Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchName = item.product_name.toLowerCase().includes(query)
        const matchShop = item.shop_name.toLowerCase().includes(query)
        if (!matchName && !matchShop) return false
      }

      return true
    })
    .sort((a, b) => {
      if (sortBy === 'ordered') {
        return b.total_ordered_count - a.total_ordered_count
      } else {
        return new Date(b.last_purchased_date).getTime() - new Date(a.last_purchased_date).getTime()
      }
    })

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: var(--bg-base); }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; position: relative; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-base); transition: all 0.2s; cursor: pointer; }
        .back-btn:active { transform: scale(0.95); }
        .title { font-size: 28px; font-weight: 800; color: var(--text-base); margin: 0; letter-spacing: -0.5px; }

        .toast { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: #1f2937; color: #fff; padding: 12px 24px; border-radius: 20px; font-size: 14px; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 1000; animation: toastFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes toastFadeIn { from { opacity: 0; bottom: 80px; } to { opacity: 1; bottom: 100px; } }

        .search-container { position: relative; margin-bottom: 20px; }
        .search-input { width: 100%; height: 50px; background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 0 20px 0 48px; font-size: 15px; color: var(--text-base); outline: none; transition: border-color 0.2s; font-weight: 500; }
        .search-input:focus { border-color: var(--wa-green); }
        .search-icon { position: absolute; left: 16px; top: 15px; color: var(--text-muted); }

        .filters-section { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
        .filter-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .filter-row::-webkit-scrollbar { display: none; }
        .filter-pill { padding: 8px 16px; border-radius: 20px; background: var(--bg-surface); border: 1px solid var(--border); font-size: 13px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .filter-pill.active { background: var(--wa-green-light); color: var(--wa-green-dark); border-color: var(--wa-green); }

        .items-list { display: flex; flex-direction: column; gap: 12px; }
        .item-card { background: var(--bg-surface); border-radius: 20px; border: 1px solid var(--border); padding: 16px; display: flex; align-items: center; gap: 16px; position: relative; transition: transform 0.2s; }
        .item-card.disabled { opacity: 0.6; }
        
        .img-box { width: 70px; height: 70px; border-radius: 14px; background: var(--bg-muted); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; position: relative; }
        .img-item { width: 100%; height: 100%; object-fit: cover; }
        .img-placeholder { font-size: 24px; color: var(--text-light); }

        .details-box { flex: 1; min-width: 0; }
        .item-name { font-size: 16px; font-weight: 800; color: var(--text-base); margin: 0 0 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .shop-name { font-size: 13px; color: var(--text-muted); margin: 0 0 6px 0; font-weight: 600; }
        .purchased-info { font-size: 12px; color: var(--text-muted); font-weight: 500; display: flex; flex-wrap: wrap; gap: 8px; }
        .purchased-tag { background: var(--bg-muted); padding: 2px 8px; border-radius: 12px; }

        .price-section { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
        .item-price { font-size: 16px; font-weight: 800; color: var(--text-base); }
        .reorder-btn { background: var(--wa-green); color: #fff; border: none; border-radius: 16px; padding: 8px 16px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(76,217,100,0.2); transition: all 0.2s; }
        .reorder-btn:hover { background: var(--wa-green-dark); }
        .reorder-btn:disabled { background: var(--border); color: var(--text-muted); box-shadow: none; cursor: not-allowed; }
        
        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; }
        .empty-icon { font-size: 64px; margin-bottom: 24px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; }
        .empty-title { font-size: 24px; font-weight: 800; color: var(--text-base); margin: 0 0 8px; }
        .empty-sub { font-size: 15px; color: var(--text-muted); margin: 0 0 32px; font-weight: 500; }
        .browse-btn { background: var(--wa-green); color: #fff; border: none; border-radius: 24px; padding: 16px 32px; font-size: 16px; font-weight: 700; text-decoration: none; box-shadow: 0 8px 20px rgba(76,217,100,0.3); transition: all 0.2s; }
        .browse-btn:active { transform: scale(0.98); }
      `}} />

      <div className="page-container">
        {toast && <div className="toast">{toast}</div>}

        <div className="header">
          <BackButton fallbackHref={`/${locale}/profile`}>
            <ArrowLeft size={20} />
          </BackButton>
          <h1 className="title">{t('recent_purchases.title')}</h1>
        </div>

        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder={t('common.search')} 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filters-section">
          <div className="filter-row">
            <button 
              className={`filter-pill ${daysFilter === '7' ? 'active' : ''}`}
              onClick={() => setDaysFilter('7')}
            >
              {t('recent_purchases.filter_7')}
            </button>
            <button 
              className={`filter-pill ${daysFilter === '30' ? 'active' : ''}`}
              onClick={() => setDaysFilter('30')}
            >
              {t('recent_purchases.filter_30')}
            </button>
            <button 
              className={`filter-pill ${daysFilter === '90' ? 'active' : ''}`}
              onClick={() => setDaysFilter('90')}
            >
              {t('recent_purchases.filter_90')}
            </button>
            <button 
              className={`filter-pill ${daysFilter === 'all' ? 'active' : ''}`}
              onClick={() => setDaysFilter('all')}
            >
              {t('recent_purchases.filter_all')}
            </button>
          </div>

          <div className="filter-row">
            <button 
              className={`filter-pill ${sortBy === 'recent' ? 'active' : ''}`}
              onClick={() => setSortBy('recent')}
            >
              {t('recent_purchases.sort_recent')}
            </button>
            <button 
              className={`filter-pill ${sortBy === 'ordered' ? 'active' : ''}`}
              onClick={() => setSortBy('ordered')}
            >
              {t('recent_purchases.sort_ordered')}
            </button>
          </div>
        </div>

        {filteredPurchases.length > 0 ? (
          <div className="items-list">
            {filteredPurchases.map((item) => {
              const isAvailable = item.is_active && item.item_status !== 'out_of_stock'
              const isAdding = addingItemId === item.item_id

              return (
                <div key={item.item_id} className={`item-card ${!isAvailable ? 'disabled' : ''}`}>
                  <div className="img-box">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} className="img-item" />
                    ) : (
                      <span className="img-placeholder">{item.product_name.substring(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  
                  <div className="details-box">
                    <h3 className="item-name">{item.product_name}</h3>
                    <p className="shop-name">{item.shop_name}</p>
                    <div className="purchased-info">
                      <span className="purchased-tag">
                        {t('recent_purchases.last_purchased')}: {formatDate(item.last_purchased_date)}
                      </span>
                      <span className="purchased-tag">
                        x{item.total_ordered_count} Ordered
                      </span>
                    </div>
                  </div>

                  <div className="price-section">
                    <span className="item-price">₹{item.last_purchased_price.toFixed(2)}</span>
                    <button 
                      className="reorder-btn" 
                      onClick={() => handleReorder(item)}
                      disabled={!isAvailable || isPending || isAdding}
                    >
                      {isAdding ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : !isAvailable ? (
                        t('recent_purchases.out_of_stock')
                      ) : (
                        <>
                          <ShoppingCart size={14} />
                          {t('purchase_history.reorder')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <History size={64} style={{ opacity: 0.3 }} />
            </div>
            <h2 className="empty-title">{t('recent_purchases.no_purchases')}</h2>
            <p className="empty-sub">{t('recent_purchases.start_shopping')}</p>
            <Link href="/home" className="browse-btn">
              {t('pinned_shops.open_shop')}
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

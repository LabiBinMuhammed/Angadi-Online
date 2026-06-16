'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Heart, ShoppingCart, Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { toggleFavoriteItem } from '@/app/actions/newFeatures'
import { addToCart } from '../cart/actions'

interface FavoriteItemType {
  id: string
  item: {
    id: string
    name: string
    price: number
    image_url?: string | null
    shop_id: string
    shop_name?: string
    is_active: boolean
    status: string
    variant_id?: string | null
  }
}

interface Props {
  initialFavorites: FavoriteItemType[]
}

export default function FavoritesClient({ initialFavorites }: Props) {
  const { t } = useTranslation()
  const [favorites, setFavorites] = useState<FavoriteItemType[]>(initialFavorites)
  const [isPending, startTransition] = useTransition()
  const [addingItemId, setAddingItemId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleRemove = (itemId: string, itemName: string) => {
    // Optimistic UI update
    const previous = [...favorites]
    setFavorites(prev => prev.filter(f => f.item.id !== itemId))

    startTransition(async () => {
      try {
        await toggleFavoriteItem(itemId)
        showToast(t('favorites.success_removed'))
      } catch (err) {
        console.error(err)
        setFavorites(previous)
        showToast(t('favorites.err_remove'))
      }
    })
  }

  const handleAddToCart = async (fav: FavoriteItemType) => {
    const item = fav.item
    if (!item.is_active || item.status === 'out_of_stock') {
      showToast(t('favorites.err_out_of_stock'))
      return
    }

    setAddingItemId(item.id)
    
    startTransition(async () => {
      try {
        await addToCart(
          item.shop_id,
          item.id,
          1,
          item.price || 0,
          item.variant_id || undefined
        )
        showToast(t('favorites.success_added_cart'))
      } catch (err: any) {
        console.error(err)
        showToast(err.message || t('favorites.err_add_cart'))
      } finally {
        setAddingItemId(null)
      }
    })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { background: var(--bg-base); }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 24px 24px 100px; position: relative; }
        .header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .back-btn { width: 44px; height: 44px; border-radius: 50%; background: var(--bg-surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-base); transition: all 0.2s; cursor: pointer; }
        .back-btn:active { transform: scale(0.95); }
        .title { font-size: 28px; font-weight: 800; color: var(--text-base); margin: 0; letter-spacing: -0.5px; }

        .toast { position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: #1f2937; color: #fff; padding: 12px 24px; border-radius: 20px; font-size: 14px; font-weight: 600; box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 1000; animation: toastFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes toastFadeIn { from { opacity: 0; bottom: 80px; } to { opacity: 1; bottom: 100px; } }

        .fav-grid { display: flex; flex-direction: column; gap: 16px; }
        .fav-card { background: var(--bg-surface); border-radius: 24px; border: 1px solid var(--border); padding: 16px; display: flex; align-items: center; gap: 16px; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.02); transition: transform 0.2s; }
        .fav-card:hover { transform: translateY(-1px); }

        .img-box { width: 72px; height: 72px; border-radius: 16px; background: var(--bg-muted); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
        .img-item { width: 100%; height: 100%; object-fit: cover; }
        .img-placeholder { font-size: 24px; color: var(--text-light); font-weight: 800; }

        .details-box { flex: 1; min-width: 0; }
        .item-name { font-size: 16px; font-weight: 800; color: var(--text-base); margin: 0 0 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .shop-name { font-size: 13px; color: var(--text-muted); margin: 0; font-weight: 600; }

        .action-container { display: flex; align-items: center; gap: 12px; }
        .price-text { font-size: 17px; font-weight: 900; color: var(--text-base); white-space: nowrap; margin-right: 4px; }
        
        .round-btn { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: all 0.2s; }
        .round-btn.remove { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
        .round-btn.remove:hover { background: rgba(239, 68, 68, 0.15); }
        .round-btn.cart { background: var(--wa-green-light); color: var(--wa-green-dark); }
        .round-btn.cart:hover { background: var(--wa-green); color: #fff; }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; }
        .empty-icon { font-size: 64px; margin-bottom: 24px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; }
        .empty-title { font-size: 24px; font-weight: 800; color: var(--text-base); margin: 0 0 8px; }
        .empty-sub { font-size: 15px; color: var(--text-muted); margin: 0 0 32px; font-weight: 500; }
        .browse-btn { background: var(--wa-green); color: #fff; border: none; border-radius: 24px; padding: 16px 32px; font-size: 16px; font-weight: 700; text-decoration: none; box-shadow: 0 8px 20px rgba(76,217,100,0.3); transition: all 0.2s; }
      `}} />

      <div className="page-container">
        {toast && <div className="toast">{toast}</div>}

        <div className="header">
          <Link href="/profile" className="back-btn">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="title">{t('favorites.title')}</h1>
        </div>

        {favorites.length > 0 ? (
          <div className="fav-grid">
            {favorites.map((fav) => {
              const item = fav.item
              const isAvailable = item.is_active && item.status !== 'out_of_stock'
              
              return (
                <div key={fav.id} className="fav-card">
                  <div className="img-box">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="img-item" />
                    ) : (
                      <span className="img-placeholder">{item.name.substring(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  
                  <div className="details-box">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="shop-name">{item.shop_name || 'Village Market Shop'}</p>
                  </div>

                  <div className="action-container">
                    <span className="price-text">₹{item.price.toFixed(2)}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemove(item.id, item.name)} 
                      className="round-btn remove"
                      title={t('favorites.success_removed')}
                      disabled={isPending}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleAddToCart(fav)} 
                      className="round-btn cart"
                      title={t('common.add_to_cart')}
                      disabled={!isAvailable || addingItemId === item.id || isPending}
                    >
                      {addingItemId === item.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ShoppingCart size={16} />
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
              <Heart size={64} style={{ opacity: 0.3 }} />
            </div>
            <h2 className="empty-title">{t('favorites.no_favorites')}</h2>
            <p className="empty-sub">{t('favorites.add_prompt')}</p>
            <Link href="/home" className="browse-btn">
              {t('pinned_shops.open_shop')}
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

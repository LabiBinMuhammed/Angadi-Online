'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bookmark, Store, ExternalLink, Trash2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'
import BackButton from '@/components/BackButton'
import { togglePinnedShop } from '@/app/actions/newFeatures'

interface PinnedShopItem {
  id: string
  shop: {
    id: string
    name: string
    type: string
    logo_url?: string | null
  }
}

interface Props {
  initialPinned: PinnedShopItem[]
}

export default function PinnedShopsClient({ initialPinned }: Props) {
  const { t, locale } = useTranslation()
  const [pinnedList, setPinnedList] = useState<PinnedShopItem[]>(initialPinned)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const handleUnpin = (shopId: string, shopName: string) => {
    // Optimistic UI update
    const previousList = [...pinnedList]
    setPinnedList(prev => prev.filter(item => item.shop.id !== shopId))

    startTransition(async () => {
      try {
        await togglePinnedShop(shopId)
        showToast(t('pinned_shops.success_unpinned'))
      } catch (err) {
        console.error(err)
        // Rollback
        setPinnedList(previousList)
        showToast(t('pinned_shops.err_unpin'))
      }
    })
  }

  const initials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.substring(0, Math.min(name.length, 2)).toUpperCase()
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

        .shops-grid { display: flex; flex-direction: column; gap: 16px; }
        .shop-card { background: var(--bg-surface); border-radius: 24px; border: 1px solid var(--border); padding: 20px; display: flex; align-items: center; gap: 16px; text-decoration: none; position: relative; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 20px rgba(0,0,0,0.02); }
        .shop-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.05); }
        .shop-card:active { transform: scale(0.99); }
        
        .logo-box { width: 60px; height: 60px; border-radius: 18px; background: var(--bg-muted); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; }
        .logo-img { width: 100%; height: 100%; object-fit: cover; }
        .logo-txt { font-size: 20px; font-weight: 800; color: var(--text-light); }
        
        .details-box { flex: 1; min-width: 0; }
        .shop-name { font-size: 17px; font-weight: 800; color: var(--text-base); margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .shop-type { font-size: 13px; color: var(--text-muted); margin: 0; font-weight: 600; text-transform: capitalize; }
        
        .actions-box { display: flex; align-items: center; gap: 10px; z-index: 10; }
        .action-btn { width: 38px; height: 38px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .action-btn.unpin { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
        .action-btn.unpin:hover { background: rgba(239, 68, 68, 0.15); }
        .action-btn.go { background: var(--wa-green-light); color: var(--wa-green-dark); }
        .action-btn.go:hover { background: var(--wa-green); color: #fff; }

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
          <h1 className="title">{t('pinned_shops.title')}</h1>
        </div>

        {pinnedList.length > 0 ? (
          <div className="shops-grid">
            {pinnedList.map((item) => {
              const shop = item.shop
              const initialsName = initials(shop.name)
              return (
                <div key={item.id} style={{ position: 'relative' }}>
                  <Link href={`/home?shop=${shop.id}`} className="shop-card">
                    <div className="logo-box">
                      {shop.logo_url ? (
                        <img src={shop.logo_url} alt={shop.name} className="logo-img" />
                      ) : (
                        <span className="logo-txt">{initialsName}</span>
                      )}
                    </div>
                    <div className="details-box">
                      <h3 className="shop-name">{shop.name}</h3>
                      <p className="shop-type">{shop.type}</p>
                    </div>
                    <div className="actions-box" onClick={(e) => e.preventDefault()}>
                      <button 
                        type="button" 
                        onClick={() => handleUnpin(shop.id, shop.name)} 
                        className="action-btn unpin" 
                        title={t('pinned_shops.unpin_shop')}
                        disabled={isPending}
                      >
                        <Trash2 size={18} />
                      </button>
                      <Link href={`/home?shop=${shop.id}`} className="action-btn go" title={t('pinned_shops.open_shop')}>
                        <ExternalLink size={18} />
                      </Link>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Bookmark size={64} style={{ opacity: 0.3 }} />
            </div>
            <h2 className="empty-title">{t('pinned_shops.no_pinned')}</h2>
            <p className="empty-sub">{t('pinned_shops.pin_prompt')}</p>
            <Link href="/home" className="browse-btn">
              {t('pinned_shops.open_shop')}
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

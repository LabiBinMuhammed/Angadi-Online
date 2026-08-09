'use client'

import { useState, useEffect } from 'react'
import ShopCatalogClient from './ShopCatalogClient'
import ShopReviewsClient from './ShopReviewsClient'
import { useTranslation } from '@/lib/i18n/I18nContext'
import type { Item, Category } from '@/types'
import { MessageSquare, ArrowLeft, Star, Store, MapPin, CheckCircle2 } from 'lucide-react'
import BackButton from '@/components/BackButton'

interface Props {
  items: Item[]
  categories: Category[]
  shopId: string
  shopName: string
  units: any[]
  restrictionLevel: number
  ratingSummary: {
    average_rating: number
    total_reviews: number
    stars: number
  }
  reviews: any[]
  logoUrl?: string | null
  initials?: string
  distance?: string | null
  initialCartItems: any[]
}

export default function ShopPageClient({
  items,
  categories,
  shopId,
  shopName,
  units,
  restrictionLevel,
  ratingSummary,
  reviews,
  logoUrl,
  initials,
  distance,
  initialCartItems
}: Props) {
  const { t, locale } = useTranslation()
  const [activeTab, setActiveTab] = useState<'catalog' | 'reviews'>('catalog')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'reviews') {
        setActiveTab('reviews')
      }
    }
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .shop-header-card {
          background: linear-gradient(135deg, rgba(37, 211, 102, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%), var(--bg-surface);
          border-bottom: 1px solid var(--border);
          padding: 16px 20px 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(12px);
        }

        .shop-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
        }

        .shop-header-main {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .shop-avatar-box {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, var(--wa-green), #10b981);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          font-size: 20px;
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.25);
          flex-shrink: 0;
          overflow: hidden;
        }

        .shop-avatar-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .shop-online-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid var(--bg-surface);
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
        }

        .shop-info-meta {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .shop-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .shop-name-heading {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-base);
          margin: 0;
          letter-spacing: -0.4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .shop-tags-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 12px;
          color: var(--text-muted);
        }

        .rating-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
          padding: 2px 8px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 12px;
        }

        .tabs-header-nav {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .header-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-muted);
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .header-tab-btn:hover {
          color: var(--text-base);
        }

        .header-tab-btn.active {
          color: var(--wa-green);
          border-bottom-color: var(--wa-green);
        }

        .review-count-badge {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 12px;
          background: var(--bg-muted);
          color: var(--text-base);
          font-weight: 800;
        }

        .header-tab-btn.active .review-count-badge {
          background: rgba(37, 211, 102, 0.15);
          color: var(--wa-green);
        }
      `}} />

      {/* ── Redesigned Shop Hero Header ─────────────────────────────── */}
      <div className="shop-header-card">
        <div className="shop-header-top">
          <div className="shop-header-main">
            <BackButton fallbackHref={`/${locale}/home`}>
              <ArrowLeft size={20} />
            </BackButton>

            <div className="shop-avatar-box">
              {logoUrl ? <img src={logoUrl} alt={shopName} /> : initials}
              <span className="shop-online-dot" />
            </div>

            <div className="shop-info-meta">
              <div className="shop-title-row">
                <h1 className="shop-name-heading">{shopName}</h1>
                <CheckCircle2 size={16} color="var(--wa-green)" />
              </div>
              
              <div className="shop-tags-row">
                {ratingSummary.total_reviews > 0 ? (
                  <span className="rating-badge-pill">
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    {ratingSummary.average_rating.toFixed(1)} ({ratingSummary.total_reviews})
                  </span>
                ) : (
                  <span className="rating-badge-pill" style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                    New Shop
                  </span>
                )}
                <span>·</span>
                <span style={{ color: '#22c55e', fontWeight: 600 }}>{t('catalog.open')}</span>
                {distance && (
                  <>
                    <span>·</span>
                    <span><MapPin size={11} style={{ display: 'inline', marginRight: 2 }} />{distance}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Nav Tabs */}
        <div className="tabs-header-nav">
          <button
            className={`header-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
            id="shop-tab-catalog"
          >
            <Store size={16} />
            {t('reviews.catalog_tab')}
          </button>
          
          <button
            className={`header-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
            id="shop-tab-reviews"
          >
            <MessageSquare size={16} />
            {t('reviews.tab_title')}
            <span className="review-count-badge">{ratingSummary.total_reviews}</span>
          </button>
        </div>
      </div>

      <div className="shop-tab-content">
        {activeTab === 'catalog' ? (
          <ShopCatalogClient
            items={items}
            categories={categories}
            shopId={shopId}
            shopName={shopName}
            units={units}
            restrictionLevel={restrictionLevel}
            initialCartItems={initialCartItems}
          />
        ) : (
          <ShopReviewsClient
            shopId={shopId}
            shopName={shopName}
            ratingSummary={ratingSummary}
            reviews={reviews}
          />
        )}
      </div>
    </>
  )
}

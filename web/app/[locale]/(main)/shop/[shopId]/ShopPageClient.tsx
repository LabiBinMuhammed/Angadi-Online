'use client'

import { useState, useEffect } from 'react'
import ShopCatalogClient from './ShopCatalogClient'
import ShopReviewsClient from './ShopReviewsClient'
import { useTranslation } from '@/lib/i18n/I18nContext'
import type { Item, Category } from '@/types'
import Link from 'next/link'
import { Video, Phone, Search, MoreVertical, MessageSquare, ArrowLeft } from 'lucide-react'

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
  distance
}: Props) {
  const { t } = useTranslation()
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
        .tabs-container { display: flex; background: var(--bg-surface); border-bottom: 1px solid var(--border); }
        .tab-btn { flex: 1; text-align: center; padding: 14px; font-size: 15px; font-weight: 700; color: var(--text-muted); cursor: pointer; background: transparent; border: none; border-bottom: 3px solid transparent; transition: all 0.2s; outline: none; }
        .tab-btn:hover { color: var(--text-base); }
        .tab-btn.active { color: var(--wa-green-dark); border-bottom-color: var(--wa-green-dark); }
        .tab-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; background: var(--border); color: var(--text-base); margin-left: 6px; font-weight: 800; }
        .tab-btn.active .tab-badge { background: var(--wa-green-light); color: var(--wa-green-dark); }
      `}} />

      {/* ── WA-style Shop Header ─────────────────────────────── */}
      <div className="shop-chat-header">
        <div className="shop-chat-header-left">
          {/* Back Button */}
          <Link href="/home" className="shop-chat-icon-btn" style={{ marginRight: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={t('vendor_nav.back_to_marketplace')}>
            <ArrowLeft size={20} />
          </Link>
          {/* Avatar */}
          <div className="shop-chat-avatar">
            {logoUrl
              ? <img src={logoUrl} alt={shopName} />
              : initials}
          </div>
          {/* Info */}
          <div className="shop-chat-info">
            <h1 className="shop-chat-name">{shopName}</h1>
            <p className="shop-chat-status">
              <span className="shop-open-dot" />
              {t('catalog.open')}
              {distance && ` · ${distance} ${t('catalog.away')}`}
              {' · '}
              <span className="shop-click-info">{t('catalog.click_for_info')}</span>
            </p>
          </div>
        </div>

        {/* Right action icons */}
        <div className="shop-chat-actions">
          {/* Feedback Icon / Button */}
          <button 
            className={`shop-chat-icon-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            style={{ position: 'relative' }}
            onClick={() => setActiveTab(activeTab === 'reviews' ? 'catalog' : 'reviews')}
            title={t('catalog.read_reviews')}
            aria-label="Feedback"
          >
            <MessageSquare size={20} style={activeTab === 'reviews' ? { color: 'var(--wa-green-dark)' } : undefined} />
            {ratingSummary.total_reviews > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--wa-green-dark)',
                color: 'white',
                fontSize: '9px',
                fontWeight: 800,
                borderRadius: '50%',
                width: '15px',
                height: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {ratingSummary.total_reviews}
              </span>
            )}
          </button>
          <button className="shop-chat-icon-btn" aria-label="Video call"><Video size={20} /></button>
          <button className="shop-chat-icon-btn" aria-label="Voice call"><Phone size={20} /></button>
          <button className="shop-chat-icon-btn" aria-label="Search"><Search size={20} /></button>
          <button className="shop-chat-icon-btn" aria-label="More options"><MoreVertical size={20} /></button>
        </div>
      </div>

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
          id="shop-tab-catalog"
        >
          {t('reviews.catalog_tab')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
          id="shop-tab-reviews"
        >
          {t('reviews.tab_title')}
          <span className="tab-badge">{ratingSummary.total_reviews}</span>
        </button>
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

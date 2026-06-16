'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Shop } from '@/types'
import { useTranslation } from '@/lib/i18n/I18nContext'

type Props = { initialShops: Shop[] }
type ViewMode = 'grid' | 'list'

const TYPES = ['all', 'grocery', 'meat', 'vegetables', 'dairy', 'bakery', 'general']

export default function ShopsClient({ initialShops }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('all')
  const [view, setView] = useState<ViewMode>('grid')

  const filtered = initialShops.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchType = activeType === 'all' || (s.type ?? '').toLowerCase().includes(activeType)
    return matchSearch && matchType
  })

  return (
    <>
      {/* Search + toggle */}
      <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', marginBottom: '1rem' }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <span className="search-bar-icon">🔍</span>
          <input
            id="shops-search"
            placeholder={t('shops_page.filter_placeholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="toggle-group">
          <button
            className={`toggle-btn${view === 'grid' ? ' active' : ''}`}
            id="view-grid"
            onClick={() => setView('grid')}
          >⊞</button>
          <button
            className={`toggle-btn${view === 'list' ? ' active' : ''}`}
            id="view-list"
            onClick={() => setView('list')}
          >☰</button>
        </div>
      </div>

      {/* Category chips */}
      <div className="chip-row">
        {TYPES.map(type => (
          <button
            key={type}
            className={`chip${activeType === type ? ' active' : ''}`}
            id={`chip-${type}`}
            onClick={() => setActiveType(type)}
          >
            {t('shops_page.types.' + type)}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
        {filtered.length === 1
          ? t('shops_page.shop_found').replace('{count}', filtered.length.toString())
          : t('shops_page.shops_found').replace('{count}', filtered.length.toString())}
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🏪</span>
          <p className="font-semibold">{t('shops_page.no_shops_match')}</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid-3">
          {filtered.map(shop => (
            <Link
              key={shop.id}
              href={`/home/shop/${shop.id}`}
              id={`shop-grid-${shop.id}`}
              className="card"
              style={{ display: 'block' }}
            >
              <div style={{
                height: 120,
                background: 'linear-gradient(135deg, var(--wa-teal), var(--wa-green-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
              }}>🏪</div>
              <div className="card-body">
                <p className="font-semibold">{shop.name}</p>
                {shop.type && <p className="text-sm text-muted">{shop.type}</p>}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="wa-list">
          {filtered.map(shop => (
            <Link
              key={shop.id}
              href={`/home/shop/${shop.id}`}
              id={`shop-list-${shop.id}`}
              className="wa-list-item"
            >
              <div className="wa-avatar">🏪</div>
              <div className="wa-item-body">
                <p className="wa-item-title">{shop.name}</p>
                <p className="wa-item-sub">{shop.type ?? t('shops_page.general_store')}</p>
              </div>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>›</span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

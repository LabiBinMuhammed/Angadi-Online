'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Shop } from '@/types'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { formatShopType } from '@/lib/utils/formatters'

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
    const matchType = activeType === 'all' || s.type === activeType
    return matchSearch && matchType
  })

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="text-xl font-bold" style={{ marginBottom: '0.25rem' }}>
          {t('shops.all_shops') || 'All Shops'}
        </h1>
        <p className="text-sm text-muted">
          {t('shops.subtitle') || 'Explore local shops in your village'}
        </p>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          id="shops-search-input"
          className="wa-input"
          placeholder={t('shops.search_placeholder') || 'Search shops...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--card-bg)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button
            type="button"
            className={`btn btn-sm ${view === 'grid' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView('grid')}
          >
            Grid
          </button>
          <button
            type="button"
            className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView('list')}
          >
            List
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        {TYPES.map(type => (
          <button
            key={type}
            type="button"
            className={`btn btn-sm ${activeType === type ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveType(type)}
            style={{ textTransform: 'capitalize', flexShrink: 0 }}
          >
            {type === 'all' ? (t('shops.all') || 'All') : formatShopType(type, t)}
          </button>
        ))}
      </div>

      {/* Grid or List */}
      {view === 'grid' ? (
        <div className="grid grid-2">
          {filtered.map(shop => (
            <Link
              key={shop.id}
              href={`/home/shop/${shop.id}`}
              id={`shop-grid-${shop.id}`}
              className="card text-center overflow-hidden"
            >
              <div style={{
                height: 120,
                background: 'linear-gradient(135deg, var(--wa-teal), var(--wa-green-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
              }}>🏪</div>
              <div className="card-body">
                <p className="font-semibold">{shop.name}</p>
                {shop.type && <p className="text-sm text-muted">{formatShopType(shop.type, t)}</p>}
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

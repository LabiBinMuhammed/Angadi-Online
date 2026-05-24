'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Shop } from '@/types'

type Props = { initialShops: Shop[] }
type ViewMode = 'grid' | 'list'

const TYPES = ['All', 'Grocery', 'Meat', 'Vegetables', 'Dairy', 'Bakery', 'General']

export default function ShopsClient({ initialShops }: Props) {
  const [search, setSearch] = useState('')
  const [activeType, setActiveType] = useState('All')
  const [view, setView] = useState<ViewMode>('grid')

  const filtered = initialShops.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchType = activeType === 'All' || (s.type ?? '').toLowerCase().includes(activeType.toLowerCase())
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
            placeholder="Filter shops…"
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
        {TYPES.map(t => (
          <button
            key={t}
            className={`chip${activeType === t ? ' active' : ''}`}
            id={`chip-${t}`}
            onClick={() => setActiveType(t)}
          >{t}</button>
        ))}
      </div>

      {/* Count */}
      <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
        {filtered.length} shop{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">🏪</span>
          <p className="font-semibold">No shops match your filter</p>
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
                <p className="wa-item-sub">{shop.type ?? 'General Store'}</p>
              </div>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>›</span>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

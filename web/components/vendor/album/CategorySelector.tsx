'use client'

import React, { useState, useMemo } from 'react'
import { Search, Sparkles, BookOpen, AlertCircle } from 'lucide-react'
import CategoryCard from './CategoryCard'
import { useTranslation } from '@/lib/i18n/I18nContext'

export interface CategoryWithStats {
  id: string
  name: string
  display_order?: number
  totalDemoItems: number
  addedShopItems: number
}

interface CategorySelectorProps {
  categories: CategoryWithStats[]
  shopName?: string
}

export default function CategorySelector({
  categories,
  shopName
}: CategorySelectorProps) {
  const { t, locale, isRtl } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories
    const term = searchTerm.toLowerCase().trim()
    return categories.filter((cat) => cat.name.toLowerCase().includes(term))
  }, [categories, searchTerm])

  const totalAdded = categories.reduce((sum, c) => sum + c.addedShopItems, 0)
  const totalAvailable = categories.reduce((sum, c) => sum + c.totalDemoItems, 0)
  const overallPercent = totalAvailable > 0 ? Math.round((totalAdded / totalAvailable) * 100) : 0

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div
        className="vp-card"
        style={{
          marginBottom: '2rem',
          padding: '2rem',
          borderRadius: '24px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.8rem', borderRadius: '999px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              <BookOpen size={14} />
              <span>{t('vendor_nav.catalog_album') || 'Vendor Catalog Album'}</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-base)', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
              {t('vendor_album.my_catalog_title') || 'My Catalog'}
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>
              {t('vendor_album.my_catalog_subtitle') || 'Add & manage products quickly from the master catalog'}
              {shopName ? ` for ${shopName}` : ''}
            </p>
          </div>

          {/* Overall Catalog Progress Pill */}
          <div
            style={{
              background: 'var(--bg-muted)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '1rem 1.4rem',
              minWidth: '220px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>Catalog Setup</span>
              <span style={{ color: 'var(--text-base)', fontWeight: 700 }}>{overallPercent}%</span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-base)', marginBottom: '0.5rem' }}>
              {totalAdded} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalAvailable} added</span>
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'var(--bg-surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${overallPercent}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: '1.75rem', position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: isRtl ? 'auto' : '1.1rem',
              right: isRtl ? '1.1rem' : 'auto',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            className="album-form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('vendor_album.search_categories_placeholder') || 'Search categories...'}
            style={{
              width: '100%',
              paddingLeft: isRtl ? '1.25rem' : '2.85rem',
              paddingRight: isRtl ? '2.85rem' : '1.25rem',
              height: '52px',
              borderRadius: '16px',
              fontSize: '0.95rem'
            }}
            id="category-search-input"
          />
        </div>
      </div>

      {/* Category Grid */}
      {filteredCategories.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {filteredCategories.map((cat) => (
            <CategoryCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              totalProducts={cat.totalDemoItems}
              addedProducts={cat.addedShopItems}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <div
          className="vp-card"
          style={{
            textAlign: 'center',
            padding: '3rem 1.5rem',
            borderRadius: '20px',
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border)'
          }}
        >
          <AlertCircle size={36} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-base)', marginBottom: '0.5rem' }}>No categories found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            No category matching &quot;{searchTerm}&quot;. Try a different search term.
          </p>
        </div>
      )}
    </div>
  )
}

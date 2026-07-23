'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, Package, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { useProductSearch, Item } from '@/lib/hooks/useProductSearch'

interface TranslationRow {
  language_code: string
  name?: string
  description?: string
}

interface ItemImage {
  image_url: string
  is_primary: boolean
}

export default function SearchClient() {
  const { locale, t } = useTranslation()
  const { query, setQuery, results, loading } = useProductSearch('', locale)
  const [recent, setRecent] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const stored = localStorage.getItem('vm_recent_searches')
    if (stored) setRecent(JSON.parse(stored))
  }, [])

  function saveRecent(term: string) {
    const updated = [term, ...recent.filter(r => r !== term)].slice(0, 6)
    setRecent(updated)
    localStorage.setItem('vm_recent_searches', JSON.stringify(updated))
  }

  function clearRecent() {
    setRecent([])
    localStorage.removeItem('vm_recent_searches')
  }

  // Helper function to resolve translated fields with fallback
  function getTranslatedField(item: Item, field: 'name' | 'description'): string {
    // 1. Check active locale
    const activeTrans = item.item_translations?.find(t => t.language_code === locale)
    if (activeTrans && activeTrans[field]) {
      return activeTrans[field] as string
    }

    // 2. Fall back to English
    const enTrans = item.item_translations?.find(t => t.language_code === 'en')
    if (enTrans && enTrans[field]) {
      return enTrans[field] as string
    }

    // 3. Fall back to default table column value
    return (item[field] || '') as string
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 1rem' }}>
      {/* Search bar */}
      <div className="search-bar" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '0.5rem 1rem' }}>
        <span style={{ color: '#64748b', marginRight: '0.5rem', display: 'flex', alignItems: 'center' }}>
          <Search size={20} />
        </span>
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          placeholder={t('common.search')}
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '1rem' }}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        )}
      </div>

      {/* Recent searches */}
      {!query && recent.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)', margin: 0 }}>Recent searches</p>
            <button className="btn-ghost text-sm" onClick={clearRecent} style={{ fontSize: '.8rem', background: 'transparent', border: 'none', color: '#60a5fa', cursor: 'pointer' }}>Clear</button>
          </div>
          <div className="chip-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {recent.map(r => (
              <button key={r} className="chip" onClick={() => setQuery(r)} id={`recent-${r}`} style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: '0.85rem' }}>{r}</button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <div className="spinner" />
        </div>
      )}

      {/* Results */}
      {!loading && query && (
        results.length > 0 ? (
          <div className="wa-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results.map(item => {
              const name = getTranslatedField(item, 'name')
              const description = getTranslatedField(item, 'description')
              const imageUrl = item.image_url || item.item_images?.find(i => i.is_primary)?.image_url || ''

              return (
                <Link
                  key={item.id}
                  href={`/${locale}/shop/${item.shop_id}`}
                  className="wa-list-item"
                  id={`search-result-${item.id}`}
                  onClick={() => saveRecent(query)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '0.75rem 1rem', textDecoration: 'none', transition: 'all 0.2s' }}
                >
                  <div style={{ width: 48, height: 48, borderRadius: '10px', overflow: 'hidden', background: '#1e293b', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {imageUrl ? (
                      <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Package size={24} style={{ color: '#64748b' }} />
                    )}
                  </div>
                  <div className="wa-item-body" style={{ flex: 1 }}>
                    <p className="wa-item-title" style={{ fontWeight: 700, color: '#fff', margin: 0, fontSize: '0.95rem' }}>{name}</p>
                    <p className="wa-item-sub" style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      {description ? (description.length > 60 ? `${description.slice(0, 60)}...` : description) : t('common.view_details')}
                    </p>
                  </div>
                  <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center' }}>
                    <ArrowRight size={18} />
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <span className="empty-state-icon" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
            <p className="font-semibold" style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>{t('common.no_items')}</p>
            <p className="text-sm" style={{ color: '#64748b', marginTop: '0.5rem' }}>Try a different keyword</p>
          </div>
        )
      )}

      {/* Default Prompt */}
      {!query && recent.length === 0 && (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <span className="empty-state-icon" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🛍️</span>
          <p className="font-semibold" style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Search for products</p>
          <p className="text-sm" style={{ color: '#64748b', marginTop: '0.5rem' }}>Type a product name to search the market</p>
        </div>
      )}
    </div>
  )
}

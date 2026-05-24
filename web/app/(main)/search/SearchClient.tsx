'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { Shop } from '@/types'

export default function SearchClient() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Shop[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const stored = localStorage.getItem('vm_recent_searches')
    if (stored) setRecent(JSON.parse(stored))
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('shops')
        .select('id, name, type, location_id, created_at, updated_at')
        .ilike('name', `%${query.trim()}%`)
        .limit(20)
      setResults((data ?? []) as Shop[])
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function saveRecent(term: string) {
    const updated = [term, ...recent.filter(r => r !== term)].slice(0, 6)
    setRecent(updated)
    localStorage.setItem('vm_recent_searches', JSON.stringify(updated))
  }

  function clearRecent() {
    setRecent([])
    localStorage.removeItem('vm_recent_searches')
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Search bar */}
      <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
        <span className="search-bar-icon">🔍</span>
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          placeholder="Search shops…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>✕</button>
        )}
      </div>

      {/* Recent searches */}
      {!query && recent.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Recent searches</p>
            <button className="btn-ghost text-sm" onClick={clearRecent} style={{ fontSize: '.8rem' }}>Clear</button>
          </div>
          <div className="chip-row">
            {recent.map(r => (
              <button key={r} className="chip" onClick={() => setQuery(r)} id={`recent-${r}`}>{r}</button>
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
          <div className="wa-list">
            {results.map(shop => (
              <Link
                key={shop.id}
                href={`/home/shop/${shop.id}`}
                className="wa-list-item"
                id={`search-result-${shop.id}`}
                onClick={() => saveRecent(query)}
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
        ) : (
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>
            <p className="font-semibold">No shops found</p>
            <p className="text-sm">Try a different keyword</p>
          </div>
        )
      )}

      {/* Prompt */}
      {!query && recent.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">🏪</span>
          <p className="font-semibold">Search for shops</p>
          <p className="text-sm">Type a shop name to find it</p>
        </div>
      )}
    </div>
  )
}

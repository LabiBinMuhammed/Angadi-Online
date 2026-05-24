'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Search, CheckCircle } from 'lucide-react'
import type { Location } from '@/types'
import { useRouter } from 'next/navigation'
import { setLocationCookie } from './actions'

export default function LocationClient({ locations, currentLocationId }: { locations: Location[], currentLocationId?: string | null }) {
  const [search, setSearch] = useState('')
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  const filtered = locations.filter(loc => 
    loc.name?.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSelect(id: string) {
    if (isPending) return
    setIsPending(true)
    try {
      await setLocationCookie(id)
      router.push('/home')
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--wa-separator)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--wa-separator)' }}>
          <div className="search-bar">
            <Search size={18} className="search-bar-icon" />
            <input 
              type="text" 
              placeholder="Search for a village..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ outline: 'none', border: 'none', width: '100%', padding: '0.2rem' }} 
            />
          </div>
        </div>

        <div style={{ padding: '0.5rem 0', opacity: isPending ? 0.6 : 1, pointerEvents: isPending ? 'none' : 'auto' }}>
          {filtered.length > 0 ? (
            filtered.map(location => {
              const isCurrent = location.id === currentLocationId
              return (
                <button 
                  key={location.id} 
                  onClick={() => handleSelect(location.id)}
                  style={{ 
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', 
                    color: 'var(--text-base)', background: 'transparent', border: 'none', textAlign: 'left',
                    borderBottom: '1px solid var(--wa-separator)',
                    cursor: 'pointer'
                  }}
                  className="hover-bg"
                >
                  <MapPin size={20} color={isCurrent ? "var(--wa-green-dark)" : "var(--text-muted)"} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: isCurrent ? 'var(--wa-green-dark)' : 'inherit' }}>
                      {location.name || 'Unnamed Location'}
                    </div>
                    {location.type && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{location.type}</div>}
                  </div>
                  {isCurrent && <CheckCircle size={18} color="var(--wa-green-dark)" />}
                </button>
              )
            })
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No villages found matching "{search}"
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .hover-bg:hover { background: var(--wa-bg); }
        .hover-bg:last-child { border-bottom: none !important; }
      `}} />
    </>
  )
}

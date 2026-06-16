'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown, Check, Plus } from 'lucide-react'
import Link from 'next/link'
import type { UserAddress } from '@/types'
import { useTranslation } from '@/lib/i18n/I18nContext'

type Props = {
  addresses: UserAddress[]
}

export default function AddressDropdownClient({ addresses }: Props) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selected_address_id')
      if (stored && addresses.find(a => a.id === stored)) return stored
    }
    const def = addresses.find(a => a.is_default)
    return def ? def.id : (addresses[0]?.id || null)
  })

  useEffect(() => {
    if (selectedId) {
      localStorage.setItem('selected_address_id', selectedId)
    }
  }, [selectedId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedAddress = addresses.find(a => a.id === selectedId)

  if (addresses.length === 0) {
    return (
      <Link href="/profile/addresses" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--wa-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--wa-green-dark)' }}>
          <MapPin size={20} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <b style={{ fontSize: '.95rem', letterSpacing: '-0.01em' }}>{t('address.add_address')}</b>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('address.to_see_local_shops')}</span>
        </div>
      </Link>
    )
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', border: '1px solid var(--border)', 
          padding: '8px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 600, color: 'var(--text-base)', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'pointer', maxWidth: '180px'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedAddress?.label || t('address.select_address')}
        </span>
        <ChevronDown size={16} color="var(--text-light)" style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div 
          style={{
            position: 'absolute', top: '110%', left: 0, width: '280px',
            background: 'var(--bg-surface)', border: '1px solid var(--border)', 
            borderRadius: '20px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
            zIndex: 200, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px'
          }}
          className="fade-up"
        >
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
            <b style={{ fontSize: '12px', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('address.saved_addresses')}</b>
          </div>
          
          {addresses.map(addr => (
            <button
              key={addr.id}
              onClick={() => {
                setSelectedId(addr.id)
                setIsOpen(false)
              }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '12px', background: selectedId === addr.id ? 'var(--wa-green-light)' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '16px',
                width: '100%', transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = selectedId === addr.id ? 'var(--wa-green-light)' : 'var(--bg-muted)'}
              onMouseOut={(e) => e.currentTarget.style.background = selectedId === addr.id ? 'var(--wa-green-light)' : 'transparent'}
            >
              <div style={{ marginTop: '2px', color: selectedId === addr.id ? 'var(--wa-green)' : 'var(--text-light)' }}>
                {selectedId === addr.id ? <Check size={18} strokeWidth={3} /> : <MapPin size={18} strokeWidth={2.5} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <b style={{ fontSize: '14px', color: 'var(--text-base)' }}>
                  {addr.label} {addr.is_default && <span style={{ fontSize: '10px', background: 'var(--bg-muted)', padding: '2px 6px', borderRadius: '8px', marginLeft: '6px', color: 'var(--text-muted)', fontWeight: 700 }}>{t('address.default')}</span>}
                </b>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4, fontWeight: 500 }}>
                  {addr.address_line_1}
                  {addr.address_line_2 ? `, ${addr.address_line_2}` : ''}
                </span>
              </div>
            </button>
          ))}
          
          <div style={{ marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
            <Link 
              href="/profile/addresses" 
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px',
                color: 'var(--wa-green)', textDecoration: 'none', fontWeight: 700, fontSize: '14px',
                borderRadius: '16px', transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-muted)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={18} strokeWidth={3} /> {t('address.add_new_address')}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

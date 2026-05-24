'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown, Check, Plus } from 'lucide-react'
import Link from 'next/link'
import type { UserAddress } from '@/types'

type Props = {
  addresses: UserAddress[]
}

export default function AddressDropdownClient({ addresses }: Props) {
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
          <b style={{ fontSize: '.95rem', letterSpacing: '-0.01em' }}>Add Address</b>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To see local shops</span>
        </div>
      </Link>
    )
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #f0f0f0', 
          padding: '8px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: 600, color: '#333', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'pointer', maxWidth: '180px'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedAddress?.label || 'Select Address'}
        </span>
        <ChevronDown size={16} color="#888" style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div 
          style={{
            position: 'absolute', top: '110%', left: 0, width: '280px',
            background: '#fff', border: '1px solid #f0f0f0', 
            borderRadius: '20px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
            zIndex: 200, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px'
          }}
          className="fade-up"
        >
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', marginBottom: '4px' }}>
            <b style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saved Addresses</b>
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
                padding: '12px', background: selectedId === addr.id ? '#e8f9ec' : 'transparent',
                border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '16px',
                width: '100%', transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = selectedId === addr.id ? '#e8f9ec' : '#f5f7f5'}
              onMouseOut={(e) => e.currentTarget.style.background = selectedId === addr.id ? '#e8f9ec' : 'transparent'}
            >
              <div style={{ marginTop: '2px', color: selectedId === addr.id ? '#4cd964' : '#999' }}>
                {selectedId === addr.id ? <Check size={18} strokeWidth={3} /> : <MapPin size={18} strokeWidth={2.5} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <b style={{ fontSize: '14px', color: selectedId === addr.id ? '#1a1a1a' : '#333' }}>
                  {addr.label} {addr.is_default && <span style={{ fontSize: '10px', background: '#f0f0f0', padding: '2px 6px', borderRadius: '8px', marginLeft: '6px', color: '#555', fontWeight: 700 }}>Default</span>}
                </b>
                <span style={{ fontSize: '13px', color: '#777', lineHeight: 1.4, fontWeight: 500 }}>
                  {addr.address_line_1}
                  {addr.address_line_2 ? `, ${addr.address_line_2}` : ''}
                </span>
              </div>
            </button>
          ))}
          
          <div style={{ marginTop: '4px', borderTop: '1px solid #f0f0f0', paddingTop: '4px' }}>
            <Link 
              href="/profile/addresses" 
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px',
                color: '#4cd964', textDecoration: 'none', fontWeight: 700, fontSize: '14px',
                borderRadius: '16px', transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#f5f7f5'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={18} strokeWidth={3} /> Add New Address
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

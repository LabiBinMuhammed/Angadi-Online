'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Category = { id: string; name: string }
type Unit     = { id: string; name: string; symbol: string }
type Mapping  = { id: string; category_id: string; unit_group_id: string }
type UnitGroup = { id: string; name: string }

export default function CategoryUnitMappingClient({
  categories,
  unitGroups,
  mappings: initial,
}: {
  categories: Category[]
  unitGroups: UnitGroup[]
  mappings: Mapping[]
}) {
  const [mappings, setMappings]     = useState(initial)
  const [selectedCat, setSelectedCat] = useState(categories[0]?.id ?? '')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const catMappings       = mappings.filter(m => m.category_id === selectedCat)
  const mappedUnitGroupIds = new Set(catMappings.map(m => m.unit_group_id))

  async function toggleUnitGroup(ugId: string) {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const existing = catMappings.find(m => m.unit_group_id === ugId)
    if (existing) {
      const { error: e } = await supabase.from('category_unit_groups').delete().eq('id', existing.id)
      if (e) { setError(e.message); setSaving(false); return }
      setMappings(prev => prev.filter(m => m.id !== existing.id))
    } else {
      const { data, error: e } = await supabase
        .from('category_unit_groups')
        .insert({ category_id: selectedCat, unit_group_id: ugId })
        .select('*')
        .single()
      if (e) { setError(e.message); setSaving(false); return }
      if (data) setMappings(prev => [...prev, data as Mapping])
    }
    setSaving(false)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem', maxWidth: 720 }}>
      {/* Category picker */}
      <div>
        <p className="form-label" style={{ marginBottom: '.5rem' }}>Select Category</p>
        <div className="wa-list">
          {categories.map(cat => (
            <button
              key={cat.id}
              id={`map-cat-${cat.id}`}
              className={`wa-list-item${selectedCat === cat.id ? ' active' : ''}`}
              style={{
                background: selectedCat === cat.id ? 'var(--wa-bg)' : 'transparent',
                fontWeight: selectedCat === cat.id ? 700 : 400,
              }}
              onClick={() => { setSelectedCat(cat.id); setError('') }}
            >
              <div className="wa-item-body"><p className="wa-item-title">{cat.name}</p></div>
              <span className="wa-badge-count">{mappings.filter(m => m.category_id === cat.id).length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Unit Group toggle */}
      <div>
        <p className="form-label" style={{ marginBottom: '.5rem' }}>
          Allowed Unit Groups {saving && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(saving…)</span>}
        </p>
        {error && <p className="form-error" style={{ marginBottom: '.5rem' }}>{error}</p>}
        <div className="wa-list">
          {unitGroups.map(ug => {
            const mapped = mappedUnitGroupIds.has(ug.id)
            return (
              <button
                key={ug.id}
                id={`map-ug-${ug.id}`}
                className="wa-list-item"
                style={{ background: mapped ? '#f0fdf4' : '#fff' }}
                onClick={() => toggleUnitGroup(ug.id)}
                disabled={saving}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: mapped ? 'var(--wa-green)' : 'var(--neutral-200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: mapped ? '#fff' : 'transparent', fontSize: '.8rem', flexShrink: 0,
                }}>✓</div>
                <div className="wa-item-body">
                  <p className="wa-item-title">{ug.name}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

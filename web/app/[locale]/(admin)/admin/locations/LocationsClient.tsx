'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, Plus, Trash2, Edit2, X, Check, AlertCircle, Navigation, Map } from 'lucide-react'

type Location = {
  id: string
  name: string
  latitude?: number | null
  longitude?: number | null
  type?: string | null
}

type Props = {
  initialLocations: Location[]
}

const LOCATION_TYPES = [
  { value: 'market', label: 'Market' },
  { value: 'town', label: 'Town' },
  { value: 'city', label: 'City' },
  { value: 'village', label: 'Village' },
  { value: 'colony', label: 'Colony' },
  { value: 'block', label: 'Block' }
];

export default function LocationsClient({ initialLocations }: Props) {
  const [locations, setLocations] = useState<Location[]>(initialLocations)
  
  // Add Form State
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('market')
  const [newLat, setNewLat] = useState('')
  const [newLng, setNewLng] = useState('')
  
  // Edit Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('market')
  const [editLat, setEditLat] = useState('')
  const [editLng, setEditLng] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return

    setLoading(true)
    setError('')

    const payload = {
      name: newName.trim(),
      type: newType,
      latitude: newLat ? parseFloat(newLat) : null,
      longitude: newLng ? parseFloat(newLng) : null,
    }

    const { data, error: insertError } = await supabase
      .from('locations')
      .insert(payload)
      .select()
      .single()

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    if (data) {
      setLocations(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setNewType('market')
      setNewLat('')
      setNewLng('')
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return

    setLoading(true)
    setError('')

    const payload = {
      name: editName.trim(),
      type: editType,
      latitude: editLat ? parseFloat(editLat) : null,
      longitude: editLng ? parseFloat(editLng) : null,
    }

    const { error: updateError } = await supabase
      .from('locations')
      .update(payload)
      .eq('id', id)

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setLocations(prev =>
      prev.map(loc => loc.id === id ? { ...loc, ...payload } : loc)
        .sort((a, b) => a.name.localeCompare(b.name))
    )
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this location?')) return

    setError('')

    const { error: deleteError } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setLocations(prev => prev.filter(loc => loc.id !== id))
  }

  function startEdit(loc: Location) {
    setEditingId(loc.id)
    setEditName(loc.name)
    setEditType(loc.type || 'market')
    setEditLat(loc.latitude?.toString() || '')
    setEditLng(loc.longitude?.toString() || '')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Modern Add Form */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        padding: '1.75rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
          <div style={{ background: 'var(--wa-green-dark)', color: 'white', padding: '0.4rem', borderRadius: '10px', boxShadow: '0 4px 10px rgba(17, 153, 142, 0.2)' }}>
            <Plus size={18} strokeWidth={3} />
          </div>
          Add New Location
        </h2>
        
        <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'end' }}>
          
          {/* Name Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Location Name</label>
            <div className="input-icon-wrap">
              <MapPin size={16} className="input-icon" />
              <input
                className="form-input input-with-icon"
                type="text"
                placeholder="e.g. Downtown Area"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                style={{ width: '100%', background: 'white', border: '1px solid var(--wa-separator)', borderRadius: '10px' }}
              />
            </div>
          </div>

          {/* Type Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Location Type</label>
            <div className="input-icon-wrap">
              <Map size={16} className="input-icon" />
              <select 
                className="form-input input-with-icon"
                value={newType}
                onChange={e => setNewType(e.target.value)}
                style={{ width: '100%', background: 'white', cursor: 'pointer', appearance: 'none', border: '1px solid var(--wa-separator)', borderRadius: '10px' }}
              >
                {LOCATION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Coordinates */}
          <div style={{ display: 'flex', gap: '1rem', flexDirection: 'row' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Latitude</label>
              <div className="input-icon-wrap">
                <Navigation size={16} className="input-icon" />
                <input
                  className="form-input input-with-icon"
                  type="number"
                  step="any"
                  placeholder="0.000000"
                  value={newLat}
                  onChange={e => setNewLat(e.target.value)}
                  style={{ width: '100%', background: 'white', border: '1px solid var(--wa-separator)', borderRadius: '10px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Longitude</label>
              <div className="input-icon-wrap">
                <Navigation size={16} className="input-icon" />
                <input
                  className="form-input input-with-icon"
                  type="number"
                  step="any"
                  placeholder="0.000000"
                  value={newLng}
                  onChange={e => setNewLng(e.target.value)}
                  style={{ width: '100%', background: 'white', border: '1px solid var(--wa-separator)', borderRadius: '10px' }}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={loading || !newName.trim()}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.85rem 2rem',
                background: loading || !newName.trim() ? 'var(--neutral-300)' : 'linear-gradient(135deg, var(--wa-green-dark) 0%, #11998e 100%)',
                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                border: 'none', borderRadius: '12px', 
                cursor: loading || !newName.trim() ? 'not-allowed' : 'pointer',
                boxShadow: loading || !newName.trim() ? 'none' : '0 6px 16px rgba(17, 153, 142, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : (
                <>
                  <Check size={18} strokeWidth={3} /> Save Location
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div style={{
          padding: '1rem', borderRadius: '12px',
          background: '#fee2e2', color: '#991b1b',
          border: '1px solid #fca5a5', fontSize: '0.9rem', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.1)'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Locations List */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid var(--wa-separator)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        overflow: 'hidden',
      }}>
        {locations.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ background: 'var(--neutral-100)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <MapPin size={28} color="var(--neutral-400)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-base)', marginBottom: '0.25rem' }}>No Locations Yet</h3>
            <p style={{ fontSize: '0.9rem' }}>Add your first location using the form above.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {locations.map(loc => (
              <div key={loc.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--wa-separator)',
                transition: 'background 0.2s',
              }}>
                {editingId === loc.id ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '0.75rem', width: '100%', alignItems: 'center' }}>
                    <input
                      className="form-input"
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Name"
                      autoFocus
                      style={{ padding: '0.6rem', height: 'auto', borderRadius: '8px' }}
                    />
                    <select 
                      className="form-input"
                      value={editType}
                      onChange={e => setEditType(e.target.value)}
                      style={{ padding: '0.6rem', height: 'auto', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      {LOCATION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <input
                      className="form-input"
                      type="number"
                      step="any"
                      value={editLat}
                      onChange={e => setEditLat(e.target.value)}
                      placeholder="Lat"
                      style={{ padding: '0.6rem', height: 'auto', borderRadius: '8px', width: '100px' }}
                    />
                    <input
                      className="form-input"
                      type="number"
                      step="any"
                      value={editLng}
                      onChange={e => setEditLng(e.target.value)}
                      placeholder="Lng"
                      style={{ padding: '0.6rem', height: 'auto', borderRadius: '8px', width: '100px' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem', gridColumn: '1 / -1', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button
                        onClick={() => handleUpdate(loc.id)}
                        disabled={loading}
                        style={{ background: 'var(--wa-green)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                      >
                        <Check size={16} /> Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={loading}
                        style={{ background: 'var(--neutral-200)', color: 'var(--neutral-700)', border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
                      >
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'linear-gradient(135deg, rgba(17,153,142,0.1) 0%, rgba(56,239,125,0.1) 100%)', padding: '0.75rem', borderRadius: '12px', color: 'var(--wa-green-dark)' }}>
                        <MapPin size={22} strokeWidth={2.5} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-base)', fontSize: '1.05rem' }}>{loc.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <span style={{ textTransform: 'capitalize', background: 'var(--neutral-100)', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>{loc.type || 'Unspecified'}</span>
                          {(loc.latitude && loc.longitude) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Navigation size={12} />
                              {loc.latitude}, {loc.longitude}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => startEdit(loc)}
                        style={{ background: 'var(--neutral-100)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s' }}
                        title="Edit"
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--neutral-200)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'var(--neutral-100)'}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s' }}
                        title="Delete"
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}


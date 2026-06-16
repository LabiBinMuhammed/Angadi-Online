'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createShopAction } from '@/app/[locale]/(vendor)/vendor/shop/actions'
import { useTranslation } from '@/lib/i18n/I18nContext'

import { Plus, X, Store, User, Tag, MapPin, Loader2 } from 'lucide-react'

type ShopRow = {
  id: string; name: string; type?: string; created_at: string; is_active?: boolean; location_id?: string | null;
  shop_owners: Array<{ users: { name: string; phone: string } | null }> | null
  locations?: { name: string } | null
}

type UserRow = { id: string; name: string; phone: string; role: string }
type LocationRow = { id: string; name: string }

const SHOP_TYPES = ['grocery', 'dairy', 'meat', 'bakery', 'fruit', 'spice', 'oil', 'general']

export default function ShopManagementClient({ 
  shops: initial,
  users,
  locations
}: { 
  shops: ShopRow[];
  users: UserRow[];
  locations: LocationRow[];
}) {
  const router = useRouter()
  const { locale } = useTranslation()
  const [shops, setShops] = useState<ShopRow[]>(initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  
  /* Create Modal State */
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newShop, setNewShop] = useState({ name: '', type: '', locationId: '', userId: '' })
  const [error, setError] = useState('')

  const filtered = shops.filter(s => {
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase())
    const isActive = s.is_active !== false
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'active' 
        ? isActive 
        : !isActive
    const matchesLocation = locationFilter === 'all'
      ? true
      : s.location_id === locationFilter
    return matchesSearch && matchesStatus && matchesLocation
  })

  async function toggleShopActive(shop: ShopRow) {
    const isActive = shop.is_active !== false
    const next = !isActive
    const currentType = shop.type || 'general'
    const newType = next 
      ? (currentType.endsWith('_inactive') ? currentType.slice(0, -9) : currentType) 
      : (currentType.endsWith('_inactive') ? currentType : currentType + '_inactive')
      
    const supabase = createClient()
    await supabase.from('shops').update({ type: newType }).eq('id', shop.id)
    setShops(prev => prev.map(s => s.id === shop.id ? { ...s, type: newType, is_active: next } : s))
    router.refresh()
  }

  async function deleteShop(shop: ShopRow) {
    if (!window.confirm(`Delete shop "${shop.name}"? This cannot be undone.`)) return
    const supabase = createClient()
    await supabase.from('shops').delete().eq('id', shop.id)
    setShops(prev => prev.filter(s => s.id !== shop.id))
    router.refresh()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newShop.name || !newShop.userId) {
      setError('Name and Owner are required')
      return
    }

    setCreating(true)
    setError('')
    const supabase = createClient()

    try {
      const result = await createShopAction(
        newShop.userId,
        newShop.name,
        newShop.type || null,
        newShop.locationId || null
      )

      if (result.error || !result.shop) {
        throw new Error(result.error || 'Failed to create shop')
      }

      // 3. Update local state
      const selectedUser = users.find(u => u.id === newShop.userId)
      const fullShop: ShopRow = {
        ...result.shop,
        is_active: true,
        shop_owners: [{ users: { name: selectedUser?.name || '', phone: selectedUser?.phone || '' } }]
      }
      
      setShops([fullShop, ...shops])
      setShowCreate(false)
      setNewShop({ name: '', type: '', locationId: '', userId: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Toggle Bar */}
        <div className="toggle-group" style={{ display: 'flex' }}>
          <button 
            type="button" 
            className={`toggle-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active
          </button>
          <button 
            type="button" 
            className={`toggle-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            Inactive
          </button>
        </div>

        {/* Location Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <select
            className="form-input"
            style={{ width: '180px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '.45rem .75rem' }}
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
          >
            <option value="all">All Locations</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <span className="search-bar-icon">🔍</span>
          <input placeholder="Search shops…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <button 
          className="btn btn-primary" 
          id="btn-add-shop"
          onClick={() => setShowCreate(true)}
          style={{ background: 'var(--wa-green-dark)' }}
        >
          <Plus size={18} /> Create Shop
        </button>
      </div>

      <div className="desktop-only-table" style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead><tr><th>Shop</th><th>Owner</th><th>Type</th><th>Location</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(shop => {
              const owner = shop.shop_owners?.[0]?.users
              return (
                <tr key={shop.id} id={`admin-shop-${shop.id}`}>
                  <td className="font-medium">{shop.name}</td>
                  <td>
                    <p className="text-sm">{owner?.name ?? '—'}</p>
                    <p className="text-sm text-muted">{owner?.phone}</p>
                  </td>
                  <td>{shop.type ? <span className="badge badge-neutral">{shop.type.replace('_inactive', '')}</span> : '—'}</td>
                  <td className="text-sm text-muted">{(shop as any).locations?.name ?? '—'}</td>
                  <td>
                    <button 
                      onClick={() => toggleShopActive(shop)}
                      className={`badge ${shop.is_active !== false ? 'badge-success' : 'badge-danger'}`}
                      style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                      title="Click to toggle status"
                    >
                      {shop.is_active !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="text-sm text-muted">{new Date(shop.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button id={`delete-shop-${shop.id}`} className="btn btn-sm"
                        style={{ background: 'rgba(239,68,68,.1)', color: 'var(--danger)', border: 'none' }}
                        onClick={() => deleteShop(shop)}>
                        Delete
                      </button>
                      <Link href={`/${locale}/admin/shops/${shop.id}`} id={`view-shop-${shop.id}`} className="btn btn-sm btn-outline">
                        Details →
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View: Cards */}
      <div className="mobile-only-grid" style={{ display: 'none', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map(shop => {
          const owner = shop.shop_owners?.[0]?.users
          return (
            <div key={shop.id} className="card card-body" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: '#fff', border: '1px solid var(--wa-separator)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>{shop.name}</h4>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Owner: <span style={{ color: '#0f172a', fontWeight: 500 }}>{owner?.name ?? '—'}</span>
                </p>
              </div>
              <div>
                <Link 
                  href={`/${locale}/admin/shops/${shop.id}`} 
                  className="btn btn-sm btn-outline"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  Details →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card fade-up" style={{ width: '100%', maxWidth: 500, background: '#fff' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="font-bold">Create New Shop</h3>
              <button onClick={() => setShowCreate(false)} className="btn-ghost" style={{ padding: '.25rem' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Shop Name *</label>
                <div style={{ position: 'relative' }}>
                  <Store size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    className="form-input" 
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="e.g. Village Grocery"
                    value={newShop.name}
                    onChange={e => setNewShop({ ...newShop, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Owner *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <select 
                    className="form-input" 
                    style={{ paddingLeft: '2.5rem' }}
                    value={newShop.userId}
                    onChange={e => setNewShop({ ...newShop, userId: e.target.value })}
                    required
                  >
                    <option value="">Select a user...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.phone})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Shop Type</label>
                  <div style={{ position: 'relative' }}>
                    <Tag size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                    <select 
                      className="form-input" 
                      style={{ paddingLeft: '2.5rem' }}
                      value={newShop.type}
                      onChange={e => setNewShop({ ...newShop, type: e.target.value })}
                    >
                      <option value="">Select type...</option>
                      {SHOP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                    <select 
                      className="form-input" 
                      style={{ paddingLeft: '2.5rem' }}
                      value={newShop.locationId}
                      onChange={e => setNewShop({ ...newShop, locationId: e.target.value })}
                    >
                      <option value="">Select location...</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {error && <p className="form-error">{error}</p>}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '.5rem' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={creating} className="btn btn-primary" style={{ flex: 1, background: 'var(--wa-green-dark)' }}>
                  {creating ? <Loader2 size={18} className="spinner" /> : 'Create Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

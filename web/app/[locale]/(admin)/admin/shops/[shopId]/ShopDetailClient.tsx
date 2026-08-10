'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Store, User, Phone, MapPin, Tag, Calendar, ShoppingBag, Eye, EyeOff,
  Coins, Clock, AlertTriangle, ShieldCheck, Check, X, Users, UserPlus, UserMinus, Mail
} from 'lucide-react'
import { 
  extendTrialAction, 
  changeRateAction, 
  toggleEnabledAction,
  waiveAction
} from '@/app/actions/commission'
import { addShopOwnerAction, removeShopOwnerAction } from '@/app/[locale]/(vendor)/vendor/shop/actions'

type ItemRow = {
  id: string
  name: string
  is_active: boolean
  category_id?: string | null
  item_images: Array<{ image_url: string }>
  item_sell_config: any
  item_variants: Array<{ price?: number }>
}

type ShopOwnerRow = {
  user_id?: string
  users: { id?: string; name: string; phone: string; email?: string } | null
}

type ShopRow = {
  id: string
  name: string
  type?: string
  is_active?: boolean
  created_at: string
  shop_owners: ShopOwnerRow[] | null
  locations?: { name: string } | null
}

type UserRow = {
  id: string
  name: string
  phone: string
  email?: string
  role?: string
}

export default function ShopDetailClient({
  shop: initialShop,
  initialItems,
  categories,
  subscription: initialSubscription,
  reports: initialReports,
  allUsers = []
}: {
  shop: ShopRow
  initialItems: ItemRow[]
  categories: Array<{ id: string; name: string }>
  subscription: any
  reports: any[]
  allUsers?: UserRow[]
}) {
  const router = useRouter()
  const [shop, setShop] = useState(initialShop)
  const [items, setItems] = useState(initialItems)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Co-owner state
  const [showAddOwnerModal, setShowAddOwnerModal] = useState(false)
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('')
  const [ownerActionLoading, setOwnerActionLoading] = useState(false)
  const [ownerError, setOwnerError] = useState<string | null>(null)

  
  // Commission settings state
  const [sub, setSub] = useState(initialSubscription)
  const [reports, setReports] = useState(initialReports)
  const [rateEdit, setRateEdit] = useState(false)
  const [newRate, setNewRate] = useState(sub ? sub.commission_rate.toString() : '5.0')
  const [extDays, setExtDays] = useState('7')
  
  // Waive state
  const [showWaiveModal, setShowWaiveModal] = useState(false)
  const [waiveAmount, setWaiveAmount] = useState('')
  const [waiveReason, setWaiveReason] = useState('')
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  const filteredItems = items.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category_id === categoryFilter
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'active' 
        ? item.is_active 
        : !item.is_active
    return matchesCategory && matchesStatus
  })

  const owner = shop.shop_owners?.[0]?.users
  const shopActive = shop.is_active !== false

  async function toggleShopActive() {
    const isActive = shop.is_active !== false
    const next = !isActive
    const currentType = shop.type || 'general'
    const newType = next 
      ? (currentType.endsWith('_inactive') ? currentType.slice(0, -9) : currentType) 
      : (currentType.endsWith('_inactive') ? currentType : currentType + '_inactive')
      
    const supabase = createClient()
    await supabase.from('shops').update({ type: newType }).eq('id', shop.id)
    setShop(prev => ({ ...prev, type: newType, is_active: next }))
    router.refresh()
  }

  async function toggleItemActive(item: ItemRow) {
    const next = !item.is_active
    const supabase = createClient()
    await supabase.from('items').update({ is_active: next }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: next } : i))
  }

  // Commission handlers
  async function handleToggleEnabled() {
    if (!sub) return
    const nextEnabled = !sub.commission_enabled
    await toggleEnabledAction(shop.id, nextEnabled)
    setSub((prev: any) => ({ ...prev, commission_enabled: nextEnabled }))
  }

  async function handleRateSave() {
    if (!sub) return
    const rate = parseFloat(newRate)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert('Please enter a valid percentage rate (0-100).')
      return
    }
    await changeRateAction(shop.id, rate)
    setSub((prev: any) => ({ ...prev, commission_rate: rate }))
    setRateEdit(false)
  }

  async function handleExtendTrial() {
    if (!sub) return
    const days = parseInt(extDays)
    if (isNaN(days) || days <= 0) {
      alert('Please select or enter a valid number of days.')
      return
    }
    await extendTrialAction(shop.id, days)
    const targetDate = new Date(sub.trial_end_date > new Date().toISOString() ? sub.trial_end_date : new Date())
    const newEnd = new Date(targetDate.getTime() + days * 24 * 60 * 60 * 1000)
    setSub((prev: any) => ({ ...prev, trial_end_date: newEnd.toISOString(), is_trial_active: true }))
    alert(`Trial extended by ${days} days!`)
  }

  async function handleWaiveSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedReport || !waiveAmount || !waiveReason) return
    setLoading(true)
    try {
      await waiveAction(
        'custom',
        selectedReport.id,
        shop.id,
        parseFloat(waiveAmount),
        waiveReason
      )
      setReports(prev => prev.map(r => r.id === selectedReport.id ? {
        ...r,
        total_commission: Math.max(0, Number(r.total_commission) - parseFloat(waiveAmount)),
        balance_due: Math.max(0, Number(r.balance_due) - parseFloat(waiveAmount)),
        payment_status: Math.max(0, Number(r.balance_due) - parseFloat(waiveAmount)) === 0 ? 'paid' : (r.amount_paid > 0 ? 'partially_paid' : 'pending')
      } : r))
      setShowWaiveModal(false)
      setSelectedReport(null)
      setWaiveAmount('')
      setWaiveReason('')
      alert('Commission waived successfully.')
      router.refresh()
    } catch (err: any) {
      alert('Waive failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Co-owner handlers
  async function handleAddOwner() {
    if (!selectedUserIdToAdd) {
      setOwnerError('Please select a user to add as co-owner.')
      return
    }

    setOwnerActionLoading(true)
    setOwnerError(null)

    try {
      const res = await addShopOwnerAction(shop.id, selectedUserIdToAdd)
      if (res.error || !res.user) {
        setOwnerError(res.error || 'Failed to add co-owner')
      } else {
        const addedUser = res.user
        setShop(prev => ({
          ...prev,
          shop_owners: [
            ...(prev.shop_owners || []),
            { user_id: addedUser.id, users: { id: addedUser.id, name: addedUser.name, phone: addedUser.phone } }
          ]
        }))
        setShowAddOwnerModal(false)
        setSelectedUserIdToAdd('')
        router.refresh()
      }
    } catch (err: any) {
      setOwnerError(err.message || 'An error occurred')
    } finally {
      setOwnerActionLoading(false)
    }
  }

  async function handleRemoveOwner(userId: string) {
    if ((shop.shop_owners?.length || 0) <= 1) {
      alert('Cannot remove the only owner of a shop. Every shop must have at least 1 owner.')
      return
    }

    if (!confirm('Are you sure you want to remove this owner from the shop?')) return

    setOwnerActionLoading(true)
    try {
      const res = await removeShopOwnerAction(shop.id, userId)
      if (res.error) {
        alert('Remove failed: ' + res.error)
      } else {
        setShop(prev => ({
          ...prev,
          shop_owners: (prev.shop_owners || []).filter(o => o.user_id !== userId && o.users?.id !== userId)
        }))
        router.refresh()
      }
    } catch (err: any) {
      alert('Remove failed: ' + err.message)
    } finally {
      setOwnerActionLoading(false)
    }
  }

  const ownersList = shop.shop_owners || []
  const availableUsersToAdd = allUsers.filter(u => !ownersList.some(o => o.user_id === u.id || o.users?.id === u.id))

  return (
    <div className="shop-detail-grid">
      {/* Left Column Wrapper */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
        
        {/* Left Column: Metadata */}
        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="wa-avatar" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
              🏪
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ margin: 0 }}>{shop.name}</h2>
              <span className="badge badge-neutral" style={{ marginTop: '0.25rem' }}>{(shop.type || 'general').replace('_inactive', '')}</span>
            </div>
          </div>

          <div className="divider" style={{ margin: '0.5rem 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
              <MapPin size={18} style={{ color: 'var(--wa-green-dark)' }} />
              <div>
                <p className="font-semibold" style={{ margin: 0 }}>Location</p>
                <p className="text-muted" style={{ margin: 0 }}>{shop.locations?.name ?? '—'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
              <Calendar size={18} style={{ color: 'var(--wa-green-dark)' }} />
              <div>
                <p className="font-semibold" style={{ margin: 0 }}>Created On</p>
                <p className="text-muted" style={{ margin: 0 }}>{new Date(shop.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
          </div>

          <div className="divider" style={{ margin: '0.5rem 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="font-semibold" style={{ margin: 0 }}>Shop Status</p>
              <p className="text-sm text-muted" style={{ margin: 0 }}>Allow customers to order</p>
            </div>
            <button 
              onClick={toggleShopActive}
              className={`badge ${shopActive ? 'badge-success' : 'badge-danger'}`}
              style={{ border: 'none', padding: '0.4rem 1rem', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              {shopActive ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>

        {/* Shop Owners & Collaborators Card (Up to 3 Max) */}
        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--wa-green-dark)' }} />
              Shop Owners ({ownersList.length}/3)
            </h3>
            {ownersList.length < 3 ? (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={() => { setOwnerError(null); setShowAddOwnerModal(true); }}
              >
                <UserPlus size={14} /> Add Co-Owner
              </button>
            ) : (
              <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>Max 3 Owners</span>
            )}
          </div>

          <div className="divider" style={{ margin: '0.25rem 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {ownersList.map((o, idx) => {
              const u = o.users
              const uid = o.user_id || u?.id
              return (
                <div key={uid || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--wa-bg-soft, #f8fafc)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="font-bold" style={{ fontSize: '0.9rem', color: '#0f172a' }}>{u?.name || 'Unknown User'}</span>
                      {idx === 0 ? (
                        <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>Primary</span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>Co-Owner {idx + 1}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted" style={{ margin: '0.15rem 0 0' }}>📱 {u?.phone || 'No Phone'}</p>
                  </div>
                  {ownersList.length > 1 && uid && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', padding: '0.35rem 0.5rem' }}
                      title="Remove Co-owner"
                      disabled={ownerActionLoading}
                      onClick={() => handleRemoveOwner(uid)}
                    >
                      <UserMinus size={15} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>


        {/* Left Column: Commission & Trial settings */}
        {sub && (
          <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Coins size={18} style={{ color: 'var(--wa-green-dark)' }} />
              Commission & Trial
            </h3>
            
            <div className="divider" style={{ margin: '0.5rem 0' }} />

            {/* Trial Status */}
            <div>
              <p className="font-semibold" style={{ fontSize: '0.85rem', margin: 0 }}>Trial Status</p>
              {sub.is_trial_active ? (
                <div style={{ marginTop: '0.25rem' }}>
                  <span className="badge badge-success">Active Trial</span>
                  <p className="text-xs text-muted" style={{ marginTop: '0.25rem', marginInline: 0 }}>
                    Ends on: {new Date(sub.trial_end_date).toLocaleDateString()}<br/>
                    ({Math.max(0, Math.ceil((new Date(sub.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days remaining)
                  </p>
                </div>
              ) : (
                <div style={{ marginTop: '0.25rem' }}>
                  <span className="badge badge-neutral">Trial Expired</span>
                </div>
              )}
            </div>

            {/* Extend Trial */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Extend Trial</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select 
                  value={extDays} 
                  onChange={e => setExtDays(e.target.value)} 
                  className="form-input"
                  style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                >
                  <option value="7">7 Days</option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                </select>
                <button 
                  onClick={handleExtendTrial}
                  className="btn btn-sm btn-outline"
                >
                  Extend
                </button>
              </div>
            </div>

            <div className="divider" style={{ margin: '0.5rem 0' }} />

            {/* Commission Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="font-semibold" style={{ fontSize: '0.85rem', margin: 0 }}>Commission Enabled</p>
                <p className="text-xs text-muted" style={{ margin: 0 }}>Charge commission on orders</p>
              </div>
              <button 
                onClick={handleToggleEnabled}
                className={`badge ${sub.commission_enabled ? 'badge-success' : 'badge-danger'}`}
                style={{ border: 'none', cursor: 'pointer' }}
              >
                {sub.commission_enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Commission Rate */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="font-semibold" style={{ fontSize: '0.85rem', margin: 0 }}>Commission Rate</p>
              </div>
              {rateEdit ? (
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={newRate}
                    onChange={e => setNewRate(e.target.value)}
                    className="form-input" 
                    style={{ width: '60px', padding: '0.25rem', fontSize: '0.85rem', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.85rem' }}>%</span>
                  <button onClick={handleRateSave} className="btn btn-sm" style={{ padding: '0.25rem', color: '#10b981' }}><Check size={16} /></button>
                  <button onClick={() => { setRateEdit(false); setNewRate(sub.commission_rate.toString()); }} className="btn btn-sm" style={{ padding: '0.25rem', color: '#ef4444' }}><X size={16} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span className="font-bold">{sub.commission_rate}%</span>
                  <button 
                    onClick={() => setRateEdit(true)} 
                    className="btn btn-sm btn-outline"
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Overdue Restriction Level */}
            {sub.restriction_level > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.8rem' }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Restriction Level {sub.restriction_level} Active</strong>
                  {sub.restriction_level === 1 && " (Warning Banner shown)"}
                  {sub.restriction_level === 2 && " (Reduced Visibility)"}
                  {sub.restriction_level === 3 && " (Blocked from placing orders)"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column Wrapper */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Right Column: Products List */}
        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={22} style={{ color: 'var(--wa-green-dark)' }} />
              <h2 className="font-bold text-lg" style={{ margin: 0 }}>Products List ({filteredItems.length})</h2>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                className="form-input"
                style={{ width: '160px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '.35rem .5rem', fontSize: '0.85rem' }}
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <select
                className="form-input"
                style={{ width: '130px', background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '.35rem .5rem', fontSize: '0.85rem' }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Listed</option>
                <option value="inactive">Hidden</option>
              </select>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">🛍️</span>
              <p>No products match the selected filters.</p>
            </div>
          ) : (
            <div className="product-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const img = item.item_images?.[0]?.image_url
                    
                    const rawConfig = item.item_sell_config
                    const config = Array.isArray(rawConfig) ? rawConfig[0] : rawConfig
                    
                    let priceDisplay = '—'
                    if (config) {
                      const sellMode = config.sell_mode?.toLowerCase()
                      if ((sellMode === 'manual' || sellMode === 'dynamic') && config.price_per_base_unit) {
                        priceDisplay = `₹${config.price_per_base_unit} / base unit`
                      } else if (config.price_per_base_unit) {
                        priceDisplay = `₹${config.price_per_base_unit}`
                      } else if (item.item_variants && item.item_variants.length > 0) {
                        const prices = item.item_variants.map(v => v.price).filter(p => p !== undefined)
                        if (prices.length > 0) {
                          const min = Math.min(...prices)
                          const max = Math.max(...prices)
                          priceDisplay = min === max ? `₹${min}` : `₹${min} - ₹${max}`
                        }
                      }
                    } else if (item.item_variants && item.item_variants.length > 0) {
                      const prices = item.item_variants.map(v => v.price).filter(p => p !== undefined)
                      if (prices.length > 0) {
                        const min = Math.min(...prices)
                        const max = Math.max(...prices)
                        priceDisplay = min === max ? `₹${min}` : `₹${min} - ₹${max}`
                      }
                    }

                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ width: '40px', height: '40px', background: '#f0f2f5', borderRadius: 'var(--radius-sm)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {img ? (
                              <img src={img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Tag size={16} style={{ color: 'var(--neutral-400)' }} />
                            )}
                          </div>
                        </td>
                        <td className="font-medium product-name-cell">{item.name}</td>
                        <td className="product-price-cell">{priceDisplay}</td>
                        <td>
                          <button
                            onClick={() => toggleItemActive(item)}
                            className="btn btn-sm btn-outline"
                            style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            {item.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                            <span className="actions-btn-text">{item.is_active ? 'Hide' : 'Show'}</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Billing History */}
        <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Coins size={20} style={{ color: 'var(--wa-green-dark)' }} />
            Billing History
          </h3>
          <div className="divider" style={{ margin: '0.5rem 0' }} />
          
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Orders</th>
                  <th>Sales</th>
                  <th>Commission Due</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                      No commission reports generated yet.
                    </td>
                  </tr>
                ) : (
                  reports.map(r => (
                    <tr key={r.id}>
                      <td className="font-semibold">{r.month}/{r.year}</td>
                      <td>{r.total_orders}</td>
                      <td>₹{Number(r.total_sales).toFixed(2)}</td>
                      <td className="font-bold" style={{ color: 'var(--wa-green-dark)' }}>₹{Number(r.total_commission).toFixed(2)}</td>
                      <td>₹{Number(r.amount_paid).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${r.payment_status === 'paid' ? 'badge-success' : r.payment_status === 'partially_paid' ? 'badge-warning' : 'badge-danger'}`}>
                          {r.payment_status}
                        </span>
                      </td>
                      <td>
                        {r.payment_status !== 'paid' && (
                          <button
                            onClick={() => {
                              setSelectedReport(r)
                              setWaiveAmount(r.balance_due.toString())
                              setShowWaiveModal(true)
                            }}
                            className="btn btn-sm btn-outline"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                          >
                            Waive
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Waive Modal */}
      {showWaiveModal && selectedReport && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card fade-up" style={{ width: '100%', maxWidth: 450, background: '#fff', borderRadius: '16px' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="font-bold" style={{ margin: 0, color: '#0f172a' }}>Waive Commission - {shop.name}</h3>
              <button onClick={() => { setShowWaiveModal(false); setSelectedReport(null); }} className="btn-ghost" style={{ padding: '.25rem' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleWaiveSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p className="text-sm text-muted">
                Waiving outstanding dues on the report for <strong>{selectedReport.month}/{selectedReport.year}</strong>.
              </p>
              
              <div className="form-group">
                <label className="form-label">Waive Amount (₹) *</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedReport.balance_due}
                  value={waiveAmount}
                  onChange={e => setWaiveAmount(e.target.value)}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
                <span className="text-xs text-muted" style={{ marginTop: '0.25rem', display: 'block' }}>
                  Maximum Waivable: ₹{selectedReport.balance_due.toFixed(2)}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Waiver *</label>
                <textarea 
                  placeholder="Explain why this commission is being waived (required)"
                  value={waiveReason}
                  onChange={e => setWaiveReason(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', minHeight: '80px', color: '#0f172a' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { setShowWaiveModal(false); setSelectedReport(null); }} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, background: '#ef4444' }}>
                  {loading ? 'Processing...' : 'Apply Waiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Co-Owner Modal (Max 3 Owners) */}
      {showAddOwnerModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card fade-up" style={{ width: '100%', maxWidth: 450, background: '#fff', borderRadius: '16px' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="font-bold" style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={18} style={{ color: 'var(--wa-green-dark)' }} /> Add Shop Co-Owner ({ownersList.length}/3)
              </h3>
              <button onClick={() => setShowAddOwnerModal(false)} className="btn-ghost" style={{ padding: '.25rem' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ownerError && (
                <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem' }}>
                  ⚠️ {ownerError}
                </div>
              )}

              <p className="text-sm text-muted">
                Select an existing registered user to assign as co-owner for <strong>{shop.name}</strong>. Maximum 3 owners per shop allowed.
              </p>

              <div className="form-group">
                <label className="form-label">Select Registered User *</label>
                <select
                  value={selectedUserIdToAdd}
                  onChange={e => setSelectedUserIdToAdd(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '0.6rem' }}
                >
                  <option value="">-- Choose User --</option>
                  {availableUsersToAdd.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.phone || u.email || 'No Contact'}) - Role: {u.role || 'customer'}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddOwnerModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button
                  type="button"
                  disabled={ownerActionLoading || !selectedUserIdToAdd}
                  onClick={handleAddOwner}
                  className="btn btn-primary"
                  style={{ flex: 1, background: 'var(--wa-green-dark)' }}
                >
                  {ownerActionLoading ? 'Adding...' : 'Add Co-Owner'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


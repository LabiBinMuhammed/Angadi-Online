'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateShopAction, addShopOwnerAction, removeShopOwnerAction } from '../actions'
import { Store, Tag, MapPin, Rocket, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff, Plus, ShoppingBag, CreditCard, LayoutGrid, Users, UserPlus, Trash2, X } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'
import FileUploadInput from '@/components/FileUploadInput'

type Location = { id: string; name: string }

type ShopOwnerRow = {
  user_id?: string
  users: {
    id: string
    name: string
    phone?: string | null
    email?: string | null
  } | null
}

type Shop = {
  id: string
  name: string
  type: string | null
  location_id: string | null
  logo_url?: string | null
  banner_url?: string | null
  description?: string | null
  opening_time?: string | null
  closing_time?: string | null
  created_at: string
  updated_at: string
  locations: { id: string; name: string } | null
  shop_owners?: ShopOwnerRow[] | null
}

type UserOption = {
  id: string
  name: string
  phone: string | null
  email: string | null
}

type Props = {
  shop: Shop
  locations: Location[]
  allUsers?: UserOption[]
}

const SHOP_TYPES = [
  'grocery', 'dairy', 'meat', 'bakery',
  'fruit', 'spice', 'oil', 'general',
]

export default function ShopDetailClient({ shop: initialShop, locations, allUsers = [] }: Props) {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const [shop, setShop]               = useState<Shop>(initialShop)
  const [name, setName]               = useState(initialShop.name || '')
  const [type, setType]               = useState(initialShop.type ? initialShop.type.replace('_inactive', '') : '')
  const [locationId, setLocationId]   = useState(initialShop.location_id || '')
  const [logoUrl, setLogoUrl]         = useState(initialShop.logo_url || '')
  const [bannerUrl, setBannerUrl]     = useState(initialShop.banner_url || '')
  const [description, setDescription] = useState(initialShop.description || '')
  const [openingTime, setOpeningTime] = useState(initialShop.opening_time || '')
  const [closingTime, setClosingTime] = useState(initialShop.closing_time || '')
  const [isActive, setIsActive]       = useState(!initialShop.type?.endsWith('_inactive'))
  const [saving, setSaving]           = useState(false)
  const [success, setSuccess]         = useState('')
  const [error, setError]             = useState('')

  // Co-owner state
  const [showAddOwnerModal, setShowAddOwnerModal]   = useState(false)
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('')
  const [ownerActionLoading, setOwnerActionLoading]   = useState(false)
  const [ownerError, setOwnerError]                 = useState<string | null>(null)

  async function handleAddOwner(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUserIdToAdd) return

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

    if (!confirm('Are you sure you want to remove this co-owner from the shop?')) return

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


  const shopInitials = name
    ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    setError('')

    const result = await updateShopAction(
      shop.id,
      name.trim(),
      type || null,
      locationId || null,
      isActive,
      {
        logoUrl,
        bannerUrl,
        description,
        openingTime,
        closingTime,
      }
    )

    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    setSuccess(t('vendor_shop.shop_updated_success_msg'))
    setSaving(false)
    router.refresh()
    setTimeout(() => {
      setSuccess('')
    }, 3000)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Back button & Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/vendor/shop" className="vp-btn vp-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', width: 'auto' }}>
          <ArrowLeft size={16} /> {t('vendor_shop.back_to_shops')}
        </Link>
      </div>

      {/* Header card representing the shop profile */}
      <div className="vp-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '20px',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: '2rem', flexShrink: 0,
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
        }}>
          {shopInitials}
        </div>
        <div>
          <h1 className="vp-title" style={{ fontSize: '1.8rem', margin: 0 }}>{name || 'Your Shop'}</h1>
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="vp-badge vp-badge-info">
              {type ? type.charAt(0).toUpperCase() + type.slice(1) : t('vendor_shop.no_type_set')}
            </span>
            {locations.find(l => l.id === locationId)?.name && (
              <>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={14} /> {locations.find(l => l.id === locationId)?.name}
                </span>
              </>
            )}
            <span>•</span>
            <span className={`vp-badge ${isActive ? 'vp-badge-success' : 'vp-badge-danger'}`} style={{
              background: isActive ? '' : 'rgba(239, 68, 68, 0.15)',
              color: isActive ? '' : '#fca5a5',
              border: isActive ? '' : '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              {isActive ? `✓ ${t('vendor_shop.active_label')}` : `✕ ${t('vendor_shop.inactive_label')}`}
            </span>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Edit Form */}
        <div className="vp-card">
          <h2 className="vp-title" style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>{t('vendor_shop.edit_shop_details_title')}</h2>

          <form onSubmit={handleSave}>
            <div className="vp-form-group">
              <label className="vp-label" htmlFor="shop-name">{t('vendor_shop.shop_name_label')}</label>
              <div style={{ position: 'relative' }}>
                <Store size={18} style={{ position: 'absolute', [locale === 'ar' ? 'right' : 'left']: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  id="shop-name"
                  className="vp-input"
                  style={{ [locale === 'ar' ? 'paddingRight' : 'paddingLeft']: '2.75rem' }}
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="vp-form-group">
              <label className="vp-label" htmlFor="shop-type">{t('vendor_shop.shop_type_label')}</label>
              <div style={{ position: 'relative' }}>
                <Tag size={18} style={{ position: 'absolute', [locale === 'ar' ? 'right' : 'left']: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <select
                  id="shop-type"
                  className="vp-select"
                  style={{ [locale === 'ar' ? 'paddingRight' : 'paddingLeft']: '2.75rem', appearance: 'none' }}
                  value={type}
                  onChange={e => setType(e.target.value)}
                >
                  <option value="">{t('vendor_shop.select_type_placeholder')}</option>
                  {SHOP_TYPES.map(t => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="vp-form-group">
              <label className="vp-label" htmlFor="shop-location">{t('vendor_shop.location_label')}</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', [locale === 'ar' ? 'right' : 'left']: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <select
                  id="shop-location"
                  className="vp-select"
                  style={{ [locale === 'ar' ? 'paddingRight' : 'paddingLeft']: '2.75rem', appearance: 'none' }}
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                >
                  <option value="">{t('vendor_shop.no_location_placeholder')}</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Logo / Shop Photo File Upload */}
            <FileUploadInput
              id="shop-logo"
              label="Logo / Shop Photo"
              value={logoUrl}
              onChange={setLogoUrl}
              aspectRatio="square"
              placeholder="Click or drag logo file here"
              helperText="Optional - 🔥 More Important"
            />

            {/* Banner Image File Upload */}
            <FileUploadInput
              id="shop-banner"
              label="Banner Image"
              value={bannerUrl}
              onChange={setBannerUrl}
              aspectRatio="banner"
              placeholder="Click or drag banner file here"
              helperText="Optional - 🔥 More Important"
            />

            {/* Description */}
            <div className="vp-form-group">
              <label className="vp-label" htmlFor="shop-desc" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Description</span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Optional - 🔥 More Important</span>
              </label>
              <textarea
                id="shop-desc"
                className="vp-input"
                rows={3}
                placeholder="Brief description about your shop and offerings..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                style={{ padding: '0.75rem 1rem', resize: 'vertical' }}
              />
            </div>

            {/* Opening Hours (2 Inputs) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="vp-form-group">
                <label className="vp-label" htmlFor="shop-opening" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>Opening Time</span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', width: 'fit-content' }}>Optional - 🔥 More Important</span>
                </label>
                <input
                  id="shop-opening"
                  className="vp-input"
                  type="time"
                  value={openingTime}
                  onChange={e => setOpeningTime(e.target.value)}
                />
              </div>

              <div className="vp-form-group">
                <label className="vp-label" htmlFor="shop-closing" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span>Closing Time</span>
                  <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', width: 'fit-content' }}>Optional - 🔥 More Important</span>
                </label>
                <input
                  id="shop-closing"
                  className="vp-input"
                  type="time"
                  value={closingTime}
                  onChange={e => setClosingTime(e.target.value)}
                />
              </div>
            </div>

            {/* Active / Inactive Status Toggle */}
            <div className="vp-form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <div>
                <span className="vp-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  {isActive ? <Eye size={18} color="#4cd964" /> : <EyeOff size={18} color="#ff4757" />} {t('vendor_shop.shop_status_label')}
                </span>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                  {isActive ? t('vendor_shop.shop_visible_desc') : t('vendor_shop.shop_hidden_desc')}
                </p>
              </div>
              <button
                type="button"
                className={`vp-btn ${isActive ? 'vp-btn-primary' : 'vp-btn-outline'}`}
                style={{
                  width: 'auto',
                  padding: '0.5rem 1rem',
                  fontSize: '0.9rem',
                  background: isActive ? '#4cd964' : 'transparent',
                  borderColor: isActive ? '#4cd964' : '#ff4757',
                  color: isActive ? '#fff' : '#ff4757'
                }}
                onClick={() => setIsActive(!isActive)}
              >
                {isActive ? t('vendor_shop.deactivate_button') : t('vendor_shop.activate_button')}
              </button>
            </div>

            {error && (
              <div style={{
                padding: '1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '1.5rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem'
              }}>
                <AlertCircle size={20} /> {error}
              </div>
            )}
            {success && (
              <div style={{
                padding: '1rem', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)',
                color: '#86efac', border: '1px solid rgba(34, 197, 94, 0.3)', marginBottom: '1.5rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem'
              }}>
                <CheckCircle size={20} /> {success}
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <button type="submit" className="vp-btn vp-btn-primary" disabled={saving}>
                {saving ? t('vendor_shop.saving_loading') : <><Rocket size={20} /> {t('vendor_shop.save_changes_button')}</>}
              </button>
            </div>
          </form>
        </div>

        {/* Shop Quick Actions */}
        <div>
          <h2 className="vp-title" style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>{t('vendor_shop.shop_operations_title')}</h2>
          <div className="vp-quick-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <Link href="/vendor/items/new" className="vp-card vp-quick-action" style={{ padding: '1.5rem', gap: '1rem' }}>
              <div className="vp-quick-icon" style={{ width: 50, height: 50 }}>
                <Plus size={24} color="#60a5fa" />
              </div>
              <span className="vp-quick-label" style={{ fontSize: '1rem' }}>{t('vendor_shop.add_product_action')}</span>
            </Link>
            <Link href="/vendor/items" className="vp-card vp-quick-action" style={{ padding: '1.5rem', gap: '1rem' }}>
              <div className="vp-quick-icon" style={{ width: 50, height: 50 }}>
                <LayoutGrid size={24} color="#c084fc" />
              </div>
              <span className="vp-quick-label" style={{ fontSize: '1rem' }}>{t('vendor_shop.manage_catalog_action')}</span>
            </Link>
            <Link href="/vendor/orders" className="vp-card vp-quick-action" style={{ padding: '1.5rem', gap: '1rem' }}>
              <div className="vp-quick-icon" style={{ width: 50, height: 50 }}>
                <ShoppingBag size={24} color="#fbbf24" />
              </div>
              <span className="vp-quick-label" style={{ fontSize: '1rem' }}>{t('vendor_shop.manage_orders_action')}</span>
            </Link>
            <Link href="/vendor/credit" className="vp-card vp-quick-action" style={{ padding: '1.5rem', gap: '1rem' }}>
              <div className="vp-quick-icon" style={{ width: 50, height: 50 }}>
                <CreditCard size={24} color="#34d399" />
              </div>
              <span className="vp-quick-label" style={{ fontSize: '1rem' }}>{t('vendor_shop.customer_credit_action')}</span>
            </Link>
          </div>
        </div>

        {/* Shop Co-Owners Section */}
        <div className="vp-card" style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 className="vp-title" style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#34d399" />
                {t('vendor_shop.shop_owners_title') || 'Shop Owners / Co-Owners'}
                <span className="vp-badge vp-badge-info" style={{ fontSize: '0.8rem', padding: '0.15rem 0.6rem' }}>
                  {ownersList.length}/3
                </span>
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                {t('vendor_shop.co_owners_desc') || 'Collaborate up to 3 owners on a single shop with full vendor access.'}
              </p>
            </div>
            {ownersList.length < 3 ? (
              <button
                type="button"
                className="vp-btn vp-btn-primary"
                onClick={() => { setShowAddOwnerModal(true); setOwnerError(null); }}
                style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <UserPlus size={16} /> {t('vendor_shop.add_co_owner_btn') || '+ Add Co-Owner'}
              </button>
            ) : (
              <span className="vp-badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#fde047', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '0.3rem 0.75rem' }}>
                Max 3 Owners Limit Reached
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {ownersList.length === 0 ? (
              <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                No registered owners recorded.
              </div>
            ) : (
              ownersList.map((owner, idx) => {
                const u = owner.users
                const uid = owner.user_id || u?.id
                return (
                  <div key={uid || idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.9rem 1.1rem', borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', background: '#3b82f6',
                        color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
                      }}>
                        {u?.name ? u.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--fg)' }}>
                          {u?.name || 'Owner User'} {idx === 0 && <span style={{ fontSize: '0.75rem', background: '#22c55e', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.35rem' }}>Primary Owner</span>}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {u?.phone || u?.email || 'Registered User'}
                        </div>
                      </div>
                    </div>

                    {ownersList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOwner(uid!)}
                        disabled={ownerActionLoading}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)',
                          padding: '0.35rem 0.75rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: '0.35rem'
                        }}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Modal to Add Co-Owner */}
        {showAddOwnerModal && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
          }}>
            <div className="vp-card" style={{ width: '100%', maxWidth: '480px', position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowAddOwnerModal(false)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>

              <h3 className="vp-title" style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} color="#34d399" /> Add Shop Co-Owner (Max 3)
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                Select a registered user to collaborate on managing this shop.
              </p>

              {ownerError && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  {ownerError}
                </div>
              )}

              <form onSubmit={handleAddOwner}>
                <div className="vp-form-group">
                  <label className="vp-label" htmlFor="select-co-owner">Select Registered User</label>
                  <select
                    id="select-co-owner"
                    className="vp-input"
                    value={selectedUserIdToAdd}
                    onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                    required
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="">-- Choose User --</option>
                    {availableUsersToAdd.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.phone || u.email || 'No contact info'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="vp-btn vp-btn-outline"
                    onClick={() => setShowAddOwnerModal(false)}
                    style={{ width: 'auto' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="vp-btn vp-btn-primary"
                    disabled={ownerActionLoading || !selectedUserIdToAdd}
                    style={{ width: 'auto' }}
                  >
                    {ownerActionLoading ? 'Adding...' : 'Add Co-Owner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


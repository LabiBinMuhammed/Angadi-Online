'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateShopAction } from '../actions'
import { Store, Tag, MapPin, Rocket, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff, Plus, ShoppingBag, CreditCard, LayoutGrid } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

type Location = { id: string; name: string }

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
}

type Props = {
  shop: Shop
  locations: Location[]
}

const SHOP_TYPES = [
  'grocery', 'dairy', 'meat', 'bakery',
  'fruit', 'spice', 'oil', 'general',
]

export default function ShopDetailClient({ shop, locations }: Props) {
  const { t, locale } = useTranslation()
  const router = useRouter()
  const [name, setName]               = useState(shop.name || '')
  const [type, setType]               = useState(shop.type ? shop.type.replace('_inactive', '') : '')
  const [locationId, setLocationId]   = useState(shop.location_id || '')
  const [logoUrl, setLogoUrl]         = useState(shop.logo_url || '')
  const [bannerUrl, setBannerUrl]     = useState(shop.banner_url || '')
  const [description, setDescription] = useState(shop.description || '')
  const [openingTime, setOpeningTime] = useState(shop.opening_time || '')
  const [closingTime, setClosingTime] = useState(shop.closing_time || '')
  const [isActive, setIsActive]       = useState(!shop.type?.endsWith('_inactive'))
  const [saving, setSaving]           = useState(false)
  const [success, setSuccess]         = useState('')
  const [error, setError]             = useState('')

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

            {/* Logo / Shop Photo */}
            <div className="vp-form-group">
              <label className="vp-label" htmlFor="shop-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Logo / Shop Photo</span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Optional - 🔥 More Important</span>
              </label>
              <input
                id="shop-logo"
                className="vp-input"
                type="text"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
              />
            </div>

            {/* Banner Image */}
            <div className="vp-form-group">
              <label className="vp-label" htmlFor="shop-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Banner Image</span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>Optional - 🔥 More Important</span>
              </label>
              <input
                id="shop-banner"
                className="vp-input"
                type="text"
                placeholder="https://example.com/banner.png"
                value={bannerUrl}
                onChange={e => setBannerUrl(e.target.value)}
              />
            </div>

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
                  type="text"
                  placeholder="e.g. 08:00 AM"
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
                  type="text"
                  placeholder="e.g. 10:00 PM"
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
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createShopAction } from './actions'
import { Store, Tag, MapPin, Rocket, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react'
import { useTranslation } from '@/lib/i18n/I18nContext'

type Location = { id: string; name: string }

type Shop = {
  id: string
  name: string
  type: string | null
  location_id: string | null
  created_at: string
  updated_at: string
  locations: { id: string; name: string } | null
}

type Props = {
  userId: string
  shops: Shop[]
  locations: Location[]
}

const SHOP_TYPES = [
  'grocery', 'dairy', 'meat', 'bakery',
  'fruit', 'spice', 'oil', 'general',
]

export default function ShopProfileClient({ userId, shops, locations }: Props) {
  const { t, locale } = useTranslation()
  const [name, setName]         = useState('')
  const [type, setType]         = useState('')
  const [locationId, setLocationId] = useState('')
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState('')
  const [error, setError]       = useState('')

  const hasShop = shops.length > 0

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess('')
    setError('')

    const result = await createShopAction(
      userId,
      name.trim(),
      type || null,
      locationId || null
    )

    if (result.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    setSuccess(t('vendor_shop.shop_created_success_msg'))
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Page header */}
      <div className="vp-header">
        <div>
          <h1 className="vp-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Store size={32} color="#60a5fa" /> {t('vendor_shop.shop_profile_title')}
          </h1>
          <p className="vp-subtitle">
            {hasShop ? t('vendor_dashboard.manage_shop_settings_subtitle') : t('vendor_dashboard.setup_shop_subtitle')}
          </p>
        </div>
      </div>

      {/* Existing Shops List */}
      {hasShop && (
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 className="vp-title" style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>{t('vendor_dashboard.your_shops_title')}</h2>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {shops.map((s) => {
              const shopInitials = s.name
                ? s.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                : '?'
              return (
                <Link
                  href={`/vendor/shop/${s.id}`}
                  key={s.id}
                  className="vp-card vp-shop-card"
                >
                  <div className="vp-shop-card-avatar">
                    {shopInitials}
                  </div>
                  <div className="vp-shop-card-info">
                    <p style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
                      {s.name || 'Your Shop Name'}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="vp-badge vp-badge-info">
                        {s.type ? (s.type.replace('_inactive', '')).charAt(0).toUpperCase() + (s.type.replace('_inactive', '')).slice(1) : t('vendor_shop.no_type_set')}
                      </span>
                      {s.locations?.name && (
                        <>
                          <span>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <MapPin size={14} /> {s.locations.name}
                          </span>
                        </>
                      )}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                      {t('vendor_shop.active_since').replace('{date}', new Date(s.created_at).toLocaleDateString(locale === 'ml' ? 'ml-IN' : locale === 'hi' ? 'hi-IN' : locale === 'ar' ? 'ar-EG' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' }))}
                    </p>
                  </div>
                  <div className="vp-shop-card-status">
                    {s.type?.endsWith('_inactive') ? (
                      <span className="vp-badge vp-badge-danger" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        ✕ {t('vendor_shop.inactive_label')}
                      </span>
                    ) : (
                      <span className="vp-badge vp-badge-success" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                        ✓ {t('vendor_shop.active_label')}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Edit form */}
      <div className="vp-card">
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 className="vp-title" style={{ fontSize: '1.4rem' }}>{t('vendor_shop.create_new_shop_title')}</h2>
        </div>

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
                placeholder={t('vendor_shop.shop_name_placeholder')}
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
            {locations.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                {t('vendor_shop.no_locations_warning')}
              </p>
            )}
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
            <button id="btn-save-shop" type="submit" className="vp-btn vp-btn-primary" disabled={saving}>
              {saving ? t('vendor_shop.creating_loading') : <><Rocket size={20} /> {t('vendor_shop.create_shop_button')}</>}
            </button>
          </div>
        </form>
      </div>

      {!hasShop && (
        <div style={{
          marginTop: '1.5rem', padding: '1.25rem', borderRadius: '16px',
          background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
          color: '#93c5fd', display: 'flex', gap: '1rem', alignItems: 'flex-start',
          fontSize: '0.95rem', lineHeight: 1.6
        }}>
          <Lightbulb size={24} style={{ flexShrink: 0, color: '#60a5fa' }} />
          <div>
            <strong style={{ color: '#fff' }}>{t('vendor_shop.getting_started_title')}</strong> {t('vendor_shop.getting_started_desc_1')}{' '}
            <strong style={{ color: '#fff' }}>{t('vendor_shop.manage_items_link')}</strong> {t('vendor_shop.getting_started_desc_2')}
          </div>
        </div>
      )}
    </div>
  )
}

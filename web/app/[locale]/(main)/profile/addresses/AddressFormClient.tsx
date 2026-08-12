'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserAddress } from '@/types'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { MapPin, User, Phone, Home, Building, Navigation, Trash2, Save, ArrowLeft } from 'lucide-react'

// Simple OSM reverse geocode
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return data.display_name ?? ''
  } catch { return '' }
}

type Props = { address: UserAddress | null }

const LABELS = ['Home', 'Work', 'Other']

export default function AddressFormClient({ address }: Props) {
  const router = useRouter()
  const isEdit = !!address
  const { t } = useTranslation()

  const labelsMap: Record<string, string> = {
    'Home': t('address.label_home') || 'Home',
    'Work': t('address.label_work') || 'Work',
    'Other': t('address.label_other') || 'Other',
  }

  const [form, setForm] = useState({
    label:          address?.label ?? 'Home',
    contact_name:   address?.contact_name ?? '',
    contact_phone:  address?.contact_phone ?? '',
    house_name:     address?.house_name ?? '',
    address_line_1: address?.address_line_1 ?? '',
    address_line_2: address?.address_line_2 ?? '',
    landmark:       address?.landmark ?? '',
    village:        address?.village ?? '',
    delivery_note:  address?.delivery_note ?? '',
    latitude:       address?.latitude ?? null as number | null,
    longitude:      address?.longitude ?? null as number | null,
    is_default:     address?.is_default ?? false,
  })
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: string, val: unknown) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function detectLocation() {
    setLocating(true)
    setError(null)
    if (!navigator.geolocation) {
      setError(t('address.err_location_denied') || 'Geolocation is not supported by your browser')
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        set('latitude', lat)
        set('longitude', lng)
        const addrStr = await reverseGeocode(lat, lng)
        if (addrStr && !form.address_line_1) {
          set('address_line_1', addrStr.split(',').slice(0, 2).join(', '))
        }
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        setError(err.message || t('address.err_location_denied') || 'Location permission denied')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = form.contact_name.trim()
    const phone = form.contact_phone.trim()
    const house = form.house_name.trim()
    const line1 = form.address_line_1.trim()
    const line2 = form.address_line_2.trim()
    const village = form.village.trim()
    const landmark = form.landmark.trim()

    if (!name) {
      setError(t('address.err_name_required') || 'Contact name is required')
      return
    }
    if (!phone) {
      setError(t('address.err_phone_required') || 'Contact phone is required')
      return
    }
    
    // Construct address_line_1 (MUST NOT BE EMPTY for Supabase NOT NULL constraint)
    let fullLine1 = line1
    if (house) {
      fullLine1 = fullLine1 ? `${house}, ${fullLine1}` : house
    }
    fullLine1 = fullLine1.replace(/^,\s*|,\s*$/g, '')

    if (!fullLine1) {
      setError(t('address.err_fields_required') || 'Street address or House/Building name is required')
      return
    }

    let fullLine2 = line2
    if (village) {
      fullLine2 = fullLine2 ? `${fullLine2}, ${village}` : village
    }
    fullLine2 = fullLine2.replace(/^,\s*|,\s*$/g, '')

    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) {
        throw new Error(t('address.err_not_logged_in') || 'Please log in to save address')
      }

      if (form.is_default) {
        try {
          await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user.id)
        } catch (e) {
          console.warn('Failed to reset default addresses:', e)
        }
      }

      const payload = {
        user_id: user.id,
        label: form.label,
        contact_name: name,
        contact_phone: phone,
        address_line_1: fullLine1,
        address_line_2: fullLine2 || null,
        landmark: landmark || null,
        latitude: form.latitude,
        longitude: form.longitude,
        is_default: form.is_default,
        is_active: true,
      }

      if (isEdit && address) {
        const { error: updateErr } = await supabase
          .from('user_addresses')
          .update(payload)
          .eq('id', address.id)
        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase
          .from('user_addresses')
          .insert(payload)
        if (insertErr) throw insertErr
      }

      router.push('/profile/addresses')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to save address. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!address) return
    if (!confirm(t('address.confirm_delete') || 'Are you sure you want to delete this address?')) return
    
    setDeleting(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: delErr } = await supabase
        .from('user_addresses')
        .update({ is_active: false })
        .eq('id', address.id)

      if (delErr) throw delErr
      router.push('/profile/addresses')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to delete address')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ maxWidth: 580, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {error && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', background: '#fee2e2', color: '#dc2626', fontSize: '0.875rem', fontWeight: 500, border: '1px solid #fca5a5' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Address Type Label */}
      <div className="form-group">
        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>
          {t('address.label_title') || 'Address Type'}
        </label>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          {LABELS.map(l => (
            <button
              type="button"
              key={l}
              id={`label-${l}`}
              className={`chip${form.label === l ? ' active' : ''}`}
              onClick={() => set('label', l)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '10px',
                border: form.label === l ? '2px solid #25d366' : '1px solid #e5e7eb',
                background: form.label === l ? '#ecfdf5' : '#f9fafb',
                color: form.label === l ? '#22c55e' : '#374151',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {labelsMap[l] ?? l}
            </button>
          ))}
        </div>
      </div>

      {/* Contact Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="contact-name" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            <User size={14} style={{ display: 'inline', marginRight: 4 }} />
            {t('address.contact_name_req') || 'Full Name'} *
          </label>
          <input
            id="contact-name"
            className="form-input"
            value={form.contact_name}
            onChange={e => set('contact_name', e.target.value)}
            placeholder={t('checkout.placeholder_fullname') || 'e.g. Muhammed Labeeb'}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="contact-phone" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            <Phone size={14} style={{ display: 'inline', marginRight: 4 }} />
            {t('address.contact_phone_req') || 'Phone Number'} *
          </label>
          <input
            id="contact-phone"
            className="form-input"
            type="tel"
            value={form.contact_phone}
            onChange={e => set('contact_phone', e.target.value)}
            placeholder={t('checkout.placeholder_phone') || 'e.g. 9876543210'}
          />
        </div>
      </div>

      {/* Address Details */}
      <div className="form-group">
        <label className="form-label" htmlFor="house-name" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
          <Home size={14} style={{ display: 'inline', marginRight: 4 }} />
          {t('address.house_name_label') || 'House / Villa / Building Name'}
        </label>
        <input
          id="house-name"
          className="form-input"
          value={form.house_name}
          onChange={e => set('house_name', e.target.value)}
          placeholder="e.g. Al Madeena Villa, Door #4"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="addr1" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
          <Building size={14} style={{ display: 'inline', marginRight: 4 }} />
          {t('address.addr1_req') || 'Street Address / Locality'} *
        </label>
        <input
          id="addr1"
          className="form-input"
          value={form.address_line_1}
          onChange={e => set('address_line_1', e.target.value)}
          placeholder={t('checkout.placeholder_street') || 'e.g. Main Street, Near Mosque'}
        />
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="addr2" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {t('address.addr2_label') || 'Apartment / Floor (Optional)'}
          </label>
          <input
            id="addr2"
            className="form-input"
            value={form.address_line_2}
            onChange={e => set('address_line_2', e.target.value)}
            placeholder={t('checkout.placeholder_apt') || 'e.g. Flat 2B'}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="landmark" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
            <Navigation size={14} style={{ display: 'inline', marginRight: 4 }} />
            {t('address.landmark_label') || 'Landmark (Optional)'}
          </label>
          <input
            id="landmark"
            className="form-input"
            value={form.landmark}
            onChange={e => set('landmark', e.target.value)}
            placeholder={t('checkout.placeholder_landmark') || 'e.g. Near Water Tank'}
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="village" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
          <MapPin size={14} style={{ display: 'inline', marginRight: 4 }} />
          {t('address.village_label') || 'Village / City / Area'}
        </label>
        <input
          id="village"
          className="form-input"
          value={form.village}
          onChange={e => set('village', e.target.value)}
          placeholder="e.g. Kizhisseri / Kondotty"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="delivery-note" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
          📝 {t('address.delivery_note_label') || 'Delivery Instructions (Optional)'}
        </label>
        <input
          id="delivery-note"
          className="form-input"
          value={form.delivery_note}
          onChange={e => set('delivery_note', e.target.value)}
          placeholder="e.g. Leave at front door if unavailable"
        />
      </div>

      {/* Map pin location detector */}
      <div className="form-group" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <label className="form-label" style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>
          📍 {t('address.location_pin') || 'GPS Pin Location'}
        </label>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline"
            id="detect-location"
            onClick={detectLocation}
            disabled={locating}
            style={{ borderRadius: '10px', fontSize: '0.85rem' }}
          >
            {locating ? (
              <><span className="spinner" style={{ width: 14, height: 14 }} /> {t('address.detecting') || 'Locating...'}</>
            ) : (
              `📍 ${t('address.use_my_location') || 'Use Current Location'}`
            )}
          </button>
          {form.latitude && form.longitude && (
            <span className="text-sm text-muted" style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
            </span>
          )}
        </div>
        {form.latitude && form.longitude && (
          <div style={{ marginTop: '.75rem', borderRadius: '10px', overflow: 'hidden', border: '1px solid #cbd5e1', height: 180 }}>
            <iframe
              title="map"
              width="100%"
              height="180"
              style={{ border: 0 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.longitude - 0.002},${form.latitude - 0.002},${form.longitude + 0.002},${form.latitude + 0.002}&layer=mapnik&marker=${form.latitude},${form.longitude}`}
            />
          </div>
        )}
      </div>

      {/* Default Checkbox */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer', padding: '0.5rem 0' }}>
        <input
          type="checkbox"
          id="is-default"
          checked={form.is_default}
          onChange={e => set('is_default', e.target.checked)}
          style={{ accentColor: '#25d366', width: 18, height: 18, cursor: 'pointer' }}
        />
        <span className="font-medium" style={{ fontSize: '0.9rem', color: '#1f2937' }}>
          {t('address.set_as_default') || 'Set as default delivery address'}
        </span>
      </label>

      {/* Submit Buttons */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <button
          type="submit"
          id="save-address-btn"
          className="btn btn-primary"
          disabled={saving || deleting}
          style={{ flex: 1, background: '#25d366', borderColor: '#25d366', padding: '0.75rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600 }}
        >
          {saving ? (t('address.saving') || 'Saving...') : isEdit ? (t('address.update_address') || 'Update Address') : (t('address.add_address') || 'Save Address')}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-outline"
            disabled={saving || deleting}
            style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.75rem 1.25rem', borderRadius: '12px' }}
          >
            {deleting ? '...' : <Trash2 size={18} />}
          </button>
        )}
      </div>
    </form>
  )
}

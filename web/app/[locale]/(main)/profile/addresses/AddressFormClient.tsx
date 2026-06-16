'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserAddress } from '@/types'
import { useTranslation } from '@/lib/i18n/I18nContext'

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
    'Home': t('address.label_home'),
    'Work': t('address.label_work'),
    'Other': t('address.label_other'),
  }

  const [form, setForm] = useState({
    label:          address?.label ?? 'Home',
    contact_name:   address?.contact_name ?? '',
    contact_phone:  address?.contact_phone ?? '',
    address_line_1: address?.address_line_1 ?? '',
    address_line_2: address?.address_line_2 ?? '',
    landmark:       address?.landmark ?? '',
    latitude:       address?.latitude ?? null as number | null,
    longitude:      address?.longitude ?? null as number | null,
    is_default:     address?.is_default ?? false,
  })
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: string, val: unknown) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function detectLocation() {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        set('latitude', lat)
        set('longitude', lng)
        const addr = await reverseGeocode(lat, lng)
        if (addr && !form.address_line_1) set('address_line_1', addr.split(',').slice(0, 2).join(', '))
        setLocating(false)
      },
      () => { setLocating(false); setError(t('address.err_location_denied')) }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.contact_name || !form.address_line_1) {
      setError(t('address.err_fields_required'))
      return
    }
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (form.is_default) {
      await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', user!.id)
    }

    const payload = { ...form, user_id: user!.id, is_active: true }
    if (isEdit) {
      await supabase.from('user_addresses').update(payload).eq('id', address!.id)
    } else {
      await supabase.from('user_addresses').insert(payload)
    }

    router.push('/profile/addresses')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 540, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {error && <p className="form-error">{error}</p>}

      {/* Label */}
      <div className="form-group">
        <label className="form-label">{t('address.label_title')}</label>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {LABELS.map(l => (
            <button
              type="button"
              key={l}
              id={`label-${l}`}
              className={`chip${form.label === l ? ' active' : ''}`}
              onClick={() => set('label', l)}
            >{labelsMap[l] ?? l}</button>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="form-group">
        <label className="form-label" htmlFor="contact-name">{t('address.contact_name_req')}</label>
        <input id="contact-name" className="form-input" value={form.contact_name}
          onChange={e => set('contact_name', e.target.value)} placeholder={t('checkout.placeholder_fullname')} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="contact-phone">{t('address.contact_phone_req')}</label>
        <input id="contact-phone" className="form-input" type="tel" value={form.contact_phone}
          onChange={e => set('contact_phone', e.target.value)} placeholder={t('checkout.placeholder_phone')} />
      </div>

      {/* Address */}
      <div className="form-group">
        <label className="form-label" htmlFor="addr1">{t('address.addr1_req')}</label>
        <input id="addr1" className="form-input" value={form.address_line_1}
          onChange={e => set('address_line_1', e.target.value)} placeholder={t('checkout.placeholder_street')} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="addr2">{t('address.addr2_label')}</label>
        <input id="addr2" className="form-input" value={form.address_line_2}
          onChange={e => set('address_line_2', e.target.value)} placeholder={t('checkout.placeholder_apt')} />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="landmark">{t('address.landmark_label')}</label>
        <input id="landmark" className="form-input" value={form.landmark}
          onChange={e => set('landmark', e.target.value)} placeholder={t('checkout.placeholder_landmark')} />
      </div>

      {/* Map pin via OSM */}
      <div className="form-group">
        <label className="form-label">📍 {t('address.location_pin')}</label>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <button type="button" className="btn btn-outline" id="detect-location" onClick={detectLocation} disabled={locating}>
            {locating ? <><span className="spinner" style={{ width: 16, height: 16 }} /> {t('address.detecting')}</> : `📍 ${t('address.use_my_location')}`}
          </button>
          {form.latitude && form.longitude && (
            <span className="text-sm text-muted">
              {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
            </span>
          )}
        </div>
        {form.latitude && form.longitude && (
          <div style={{ marginTop: '.75rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', height: 200 }}>
            <iframe
              title="map"
              width="100%" height="200"
              style={{ border: 0 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.longitude - 0.002},${form.latitude - 0.002},${form.longitude + 0.002},${form.latitude + 0.002}&layer=mapnik&marker=${form.latitude},${form.longitude}`}
            />
          </div>
        )}
      </div>

      {/* Default */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer' }}>
        <input type="checkbox" id="is-default" checked={form.is_default}
          onChange={e => set('is_default', e.target.checked)}
          style={{ accentColor: 'var(--wa-green-dark)', width: 18, height: 18 }} />
        <span className="font-medium">{t('address.set_as_default')}</span>
      </label>

      <button
        type="submit"
        id="save-address-btn"
        className="btn btn-primary btn-full"
        disabled={saving}
        style={{ background: 'var(--wa-teal)' }}
      >
        {saving ? t('address.saving') : isEdit ? t('address.update_address') : t('address.add_address')}
      </button>
    </form>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { UserAddress } from '@/types'
import { MapPin, Plus, ArrowLeft, Phone, User, Home, Building, CheckCircle2 } from 'lucide-react'
import BackButton from '@/components/BackButton'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../messages/en.json')
  }
  const t = (key: string) => {
    const parts = key.split('.')
    let curr = messages as any
    for (const part of parts) {
      if (!curr) return key
      curr = curr[part]
    }
    return typeof curr === 'string' ? curr : key
  }

  return { title: t('address.my_addresses') || 'My Addresses' }
}

export default async function AddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../messages/en.json')
  }
  const t = (key: string) => {
    const parts = key.split('.')
    let curr = messages as any
    for (const part of parts) {
      if (!curr) return key
      curr = curr[part]
    }
    return typeof curr === 'string' ? curr : key
  }

  const { data: addresses } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  const addressList = (addresses ?? []) as UserAddress[]

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <BackButton fallbackHref={`/${locale}/profile`} className="btn btn-ghost btn-sm" style={{ borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> {t('address.back_to_profile') || 'Profile'}
          </BackButton>
          <h1 className="text-2xl font-bold" style={{ fontSize: '1.5rem', letterSpacing: '-0.5px' }}>
            {t('address.my_addresses') || 'My Saved Addresses'}
          </h1>
        </div>
        <Link href="/profile/addresses/new" className="btn btn-primary btn-sm" id="btn-add-address" style={{ background: '#25d366', borderColor: '#25d366', borderRadius: '10px' }}>
          <Plus size={16} style={{ marginRight: 4 }} /> {t('address.add_new') || 'Add New'}
        </Link>
      </div>

      {addressList.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {addressList.map((addr) => {
            const formattedLine1 = [addr.house_name, addr.address_line_1].filter(Boolean).join(', ')
            const formattedLine2 = [addr.address_line_2, addr.village].filter(Boolean).join(', ')

            return (
              <div
                key={addr.id}
                id={`address-${addr.id}`}
                className="card"
                style={{
                  padding: '1.25rem',
                  borderRadius: '16px',
                  border: addr.is_default ? '2px solid #25d366' : '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  background: '#ffffff',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.6rem' }}>
                      <span className="font-semibold" style={{ fontSize: '1rem', color: '#0f172a', fontWeight: 700 }}>
                        {addr.label || 'Home'}
                      </span>
                      {addr.is_default && (
                        <span className="badge badge-success" style={{ background: '#dcfce7', color: '#22c55e', border: 'none', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                          <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 3 }} />
                          {t('address.default') || 'Default'}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', color: '#334155', fontSize: '0.9rem' }}>
                      <p style={{ fontWeight: 600, color: '#1e293b' }}>
                        <User size={14} style={{ display: 'inline', marginRight: 5, color: '#64748b' }} />
                        {addr.contact_name} &nbsp;·&nbsp;
                        <Phone size={14} style={{ display: 'inline', margin: '0 5px', color: '#64748b' }} />
                        {addr.contact_phone}
                      </p>

                      {formattedLine1 && (
                        <p style={{ marginTop: 2 }}>
                          <Home size={14} style={{ display: 'inline', marginRight: 5, color: '#64748b' }} />
                          {formattedLine1}
                        </p>
                      )}

                      {formattedLine2 && (
                        <p style={{ color: '#64748b' }}>
                          <MapPin size={14} style={{ display: 'inline', marginRight: 5, color: '#64748b' }} />
                          {formattedLine2}
                        </p>
                      )}

                      {addr.landmark && (
                        <p className="text-sm text-muted" style={{ color: '#64748b', fontSize: '0.85rem' }}>
                          Near: {addr.landmark}
                        </p>
                      )}

                      {addr.delivery_note && (
                        <p style={{ background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '8px', borderLeft: '3px solid #25d366', fontSize: '0.8rem', color: '#475569', marginTop: '0.3rem' }}>
                          📝 {addr.delivery_note}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/profile/addresses/${addr.id}`}
                    className="btn btn-ghost btn-sm"
                    id={`btn-edit-addr-${addr.id}`}
                    style={{ borderRadius: '10px', color: '#25d366', fontWeight: 600 }}
                  >
                    {t('address.edit') || 'Edit'}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: '3rem 1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '1px border-dashed #cbd5e1' }}>
          <span className="empty-state-icon" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📍</span>
          <p className="font-semibold" style={{ fontSize: '1.1rem', color: '#334155', marginBottom: '1.25rem' }}>
            {t('address.no_addresses_saved') || 'No saved addresses found'}
          </p>
          <Link href="/profile/addresses/new" className="btn btn-primary" id="btn-add-first-address" style={{ background: '#25d366', borderColor: '#25d366', borderRadius: '12px', padding: '0.75rem 1.5rem' }}>
            + {t('address.add_address') || 'Add New Address'}
          </Link>
        </div>
      )}
    </div>
  )
}

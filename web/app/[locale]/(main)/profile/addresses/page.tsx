import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { UserAddress } from '@/types'

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

  return { title: t('address.my_addresses') }
}

export default async function AddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .order('is_default', { ascending: false })

  const addressList = (addresses ?? []) as UserAddress[]

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <Link href="/profile" className="btn btn-ghost btn-sm">← {t('address.back_to_profile')}</Link>
          <h1 className="text-2xl font-bold">{t('address.my_addresses')}</h1>
        </div>
        <Link href="/profile/addresses/new" className="btn btn-primary btn-sm" id="btn-add-address">
          + {t('address.add_new')}
        </Link>
      </div>

      {addressList.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 540 }}>
          {addressList.map((addr) => (
            <div key={addr.id} id={`address-${addr.id}`} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem' }}>
                    <span className="font-semibold">{addr.label}</span>
                    {addr.is_default && <span className="badge badge-success">{t('address.default')}</span>}
                  </div>
                  <p>{addr.contact_name} · {addr.contact_phone}</p>
                  <p className="text-sm text-muted">{addr.address_line_1}</p>
                  {addr.address_line_2 && <p className="text-sm text-muted">{addr.address_line_2}</p>}
                  {addr.landmark && <p className="text-sm text-muted">{t('address.near')}: {addr.landmark}</p>}
                </div>
                <Link href={`/profile/addresses/${addr.id}`} className="btn btn-ghost btn-sm" id={`btn-edit-addr-${addr.id}`}>
                  {t('address.edit')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon">📍</span>
          <p className="font-semibold">{t('address.no_addresses_saved')}</p>
          <Link href="/profile/addresses/new" className="btn btn-primary" id="btn-add-first-address">
            {t('address.add_address')}
          </Link>
        </div>
      )}
    </>
  )
}

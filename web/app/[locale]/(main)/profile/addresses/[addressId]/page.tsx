import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AddressFormClient from '../AddressFormClient'
import type { UserAddress } from '@/types'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../../messages/en.json')
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

  return { title: t('address.update_address') }
}

export default async function EditAddressPage({ params }: { params: Promise<{ addressId: string, locale: string }> }) {
  const { addressId, locale } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('id', addressId)
    .single()

  if (!data) notFound()

  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../../../messages/en.json')
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

  return (
    <>
      <h1 className="text-2xl font-bold" style={{ marginBottom: '1.5rem' }}>{t('address.update_address')}</h1>
      <AddressFormClient address={data as UserAddress} />
    </>
  )
}

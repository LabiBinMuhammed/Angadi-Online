import type { Metadata } from 'next'
import AddressFormClient from '../AddressFormClient'

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

  return { title: t('address.add_address') }
}

export default async function AddAddressPage({ params }: { params: Promise<{ locale: string }> }) {
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

  return (
    <>
      <h1 className="text-2xl font-bold" style={{ marginBottom: '1.5rem' }}>{t('address.add_address')}</h1>
      <AddressFormClient address={null} />
    </>
  )
}

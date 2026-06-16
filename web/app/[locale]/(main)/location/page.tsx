import type { Metadata } from 'next'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import LocationClient from './LocationClient'
import { cookies } from 'next/headers'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../messages/en.json')
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

  return {
    title: t('location.title'),
    description: t('location.description'),
  }
}

export default async function LocationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const cookieStore = await cookies()
  const currentLocationId = cookieStore.get('selected_location_id')?.value
  
  const activeLocale = ['en', 'ml', 'hi', 'ar'].includes(locale) ? locale : 'en'
  let messages = {}
  try {
    messages = require(`../../../../messages/${activeLocale}.json`)
  } catch (e) {
    messages = require('../../../../messages/en.json')
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

  // Fetch locations from server
  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
    .order('name')

  if (error) {
    console.error("Error fetching locations:", error)
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#128c7e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
          <MapPin size={32} />
        </div>
        <h1 className="text-2xl font-bold">{t('location.title')}</h1>
        <p className="text-muted mt-2">
          {t('location.description')}
        </p>
      </div>

      <LocationClient locations={locations || []} currentLocationId={currentLocationId} />
    </div>
  )
}

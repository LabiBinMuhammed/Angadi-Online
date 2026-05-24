import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import LocationsClient from './LocationsClient'

export const metadata: Metadata = { title: 'Manage Locations — Admin Panel' }

export default async function AdminLocationsPage() {
  const supabase = await createClient()

  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, latitude, longitude, type')
    .order('name')

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-base)', letterSpacing: '-.02em' }}>
          📍 Manage Locations
        </h1>
        <p style={{ fontSize: '.88rem', color: 'var(--text-muted)', marginTop: '.25rem' }}>
          Add or edit regions where shops are located.
        </p>
      </div>

      <LocationsClient initialLocations={locations ?? []} />
    </div>
  )
}

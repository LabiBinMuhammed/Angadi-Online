import type { Metadata } from 'next'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import LocationClient from './LocationClient'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Change Village',
  description: 'Select your buying village',
}

export default async function LocationPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const currentLocationId = cookieStore.get('selected_location_id')?.value
  
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
        <h1 className="text-2xl font-bold">Select Your Village</h1>
        <p className="text-muted mt-2">
          Choose a village to see the local shops and items available near you.
        </p>
      </div>

      <LocationClient locations={locations || []} currentLocationId={currentLocationId} />
    </div>
  )
}

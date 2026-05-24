'use server'

import { cookies } from 'next/headers'

export async function setLocationCookie(locationId: string) {
  const cookieStore = await cookies()
  cookieStore.set('selected_location_id', locationId, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  })
}

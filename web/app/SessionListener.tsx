'use client'

import { useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function SessionListener() {
  useEffect(() => {
    // Initializing the browser client automatically sets up session refreshing
    // natively within the Supabase client logic. We do not need a manual visibilitychange
    // listener, as that causes unnecessary API calls which lead to rate limits.
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  return null
}

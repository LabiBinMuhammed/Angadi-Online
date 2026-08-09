import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (value === '' || options?.maxAge === 0) {
                cookieStore.set(name, '', { ...options, maxAge: 0 })
              } else {
                cookieStore.set(name, value, { ...options, maxAge: options?.maxAge ?? 3153600000 })
              }
            })
          } catch {
            // Server Component — cookies set via middleware
          }
        },
      },
    }
  )
}


import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write cookies to both the request and the response so that
          // the session is properly forwarded to Server Components.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, { ...options, maxAge: 3153600000 })
          )
        },
      },
    }
  )

  // To prevent rate limiting from Next.js Link prefetching triggering middleware repeatedly,
  // we use getSession() instead of getUser(). getSession() decodes the JWT locally without
  // making a network request to Supabase on every route change or prefetch.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const user = session?.user

  const { pathname } = request.nextUrl

  // Helper to preserve cookies on redirects
  const redirect = (url: URL) => {
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie => {
      res.cookies.set(cookie.name, cookie.value)
    })
    return res
  }

  // Routes that don't require authentication
  const publicRoutes = ['/login', '/signup']
  const isPublicRoute =
    publicRoutes.some((r) => pathname.startsWith(r)) || pathname === '/'

  // Unauthenticated user → redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return redirect(loginUrl)
  }

  // Already authenticated → don't allow accessing /login or /signup
  if (user && isPublicRoute) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/home'
    return redirect(homeUrl)
  }

  // Role-based route guard
  if (user && (pathname.startsWith('/vendor') || pathname.startsWith('/admin'))) {
    // 1. Get role from JWT metadata (fast, no network request)
    const metadataRole = user.user_metadata?.role as string | undefined

    // 2. Only hit the DB if we don't have a role in metadata, OR if we need to verify a shop_owner's setup
    let role = metadataRole

    if (!role) {
      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      role = userRow?.role
    }

    // Access control
    if (pathname.startsWith('/vendor') && role !== 'shop_owner' && role !== 'admin') {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = '/home'
      return redirect(homeUrl)
    }

    if (pathname.startsWith('/admin') && role !== 'admin') {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = '/home'
      return redirect(homeUrl)
    }

    // 3. Shop Setup Check (Only for shop_owners visiting vendor pages other than /vendor/shop)
    // We only do this if it's NOT a prefetch request to save on API calls
    const isPrefetch = request.headers.get('next-router-prefetch') || request.headers.get('purpose') === 'prefetch'

    if (role === 'shop_owner' && pathname.startsWith('/vendor') && pathname !== '/vendor/shop' && !isPrefetch) {
      const { data: ownerRow } = await supabase
        .from('shop_owners')
        .select('shop_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!ownerRow?.shop_id) {
        const setupUrl = request.nextUrl.clone()
        setupUrl.pathname = '/vendor/shop'
        return redirect(setupUrl)
      }
    }
  }

  // Always return the supabaseResponse so cookies are properly forwarded
  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

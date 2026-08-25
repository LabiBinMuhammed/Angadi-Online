import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const locales = ['en', 'ml', 'hi', 'ar']
const defaultLocale = 'ml'


// Helper to determine the locale for a request
function getLocale(request: NextRequest): string {
  // 1. Check NEXT_LOCALE cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale
  }

  // 2. Parse browser Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    const matched = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().substring(0, 2))
      .find(lang => locales.includes(lang))
    
    if (matched) return matched
  }

  // 3. Fallback to default English
  return defaultLocale
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Skip middleware completely for static assets & files
  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|css)$/.test(pathname)

  if (isStaticAsset) {
    return NextResponse.next()
  }

  // 2. Locale Redirect Check
  const isApiRoute = pathname.startsWith('/api')

  if (!isApiRoute) {
    const pathnameIsMissingLocale = locales.every(
      locale => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    )

    if (pathnameIsMissingLocale) {
      const locale = getLocale(request)
      const targetPath = pathname === '/' ? '/home' : pathname
      const redirectUrl = new URL(
        `/${locale}${targetPath}${request.nextUrl.search}`,
        request.url
      )
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Extract the locale prefix and resolve clean pathname for auth guards
  const locale = pathname.split('/')[1]
  let cleanPathname = pathname
  for (const loc of locales) {
    if (pathname.startsWith(`/${loc}/`)) {
      cleanPathname = pathname.substring(loc.length + 1)
      break
    } else if (pathname === `/${loc}`) {
      cleanPathname = '/'
      break
    }
  }

  // 2. Supabase Auth Guards
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            if (value === '' || options?.maxAge === 0) {
              supabaseResponse.cookies.set(name, '', { ...options, maxAge: 0 })
            } else {
              supabaseResponse.cookies.set(name, value, { ...options, maxAge: options?.maxAge ?? 3153600000 })
            }
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Helper to preserve cookies on redirects
  const redirect = (url: URL) => {
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie => {
      res.cookies.set(cookie.name, cookie.value)
    })
    return res
  }

  // Routes that don't require authentication
  const authOnlyRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']
  const publicContentRoutes = ['/privacy', '/terms', '/delete-account']
  const publicRoutes = [...authOnlyRoutes, ...publicContentRoutes]

  const isPublicRoute =
    publicRoutes.some((r) => cleanPathname.startsWith(r)) ||
    cleanPathname === '/' ||
    pathname.startsWith('/api')

  // Unauthenticated user → redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = `/${locale}/login`
    return redirect(loginUrl)
  }

  // Resolve selected_location_id if user is authenticated but cookie is missing
  if (user && !request.cookies.has('selected_location_id')) {
    const { data: addrs } = await supabase
      .from('user_addresses')
      .select('location_id')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)

    let locationId = addrs?.[0]?.location_id

    if (!locationId) {
      const { data: firstLoc } = await supabase
        .from('locations')
        .select('id')
        .order('name')
        .limit(1)
        .maybeSingle()
      locationId = firstLoc?.id
    }

    if (locationId) {
      request.cookies.set('selected_location_id', locationId)
      supabaseResponse.cookies.set('selected_location_id', locationId, { maxAge: 3153600000, path: '/' })
    }
  }

  // Already authenticated → don't allow accessing auth pages (e.g. /login, /signup), but allow /privacy, /terms, /delete-account
  const isAuthPage = authOnlyRoutes.some((r) => cleanPathname.startsWith(r))
  if (user && isAuthPage && !pathname.startsWith('/api')) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = `/${locale}/home`
    return redirect(homeUrl)
  }

  // Role-based route guard
  if (user && (cleanPathname.startsWith('/vendor') || cleanPathname.startsWith('/admin'))) {
    // Query public.users table first for authoritative role
    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    let role = userRow?.role || (user.user_metadata?.role as string | undefined)

    // Fallback: If user is listed in shop_owners table, treat them as shop_owner!
    if (role !== 'shop_owner' && role !== 'admin') {
      const { data: isOwner } = await supabase
        .from('shop_owners')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
      if (isOwner) {
        role = 'shop_owner'
      }
    }

    // Access control
    if (cleanPathname.startsWith('/vendor') && role !== 'shop_owner' && role !== 'admin') {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = `/${locale}/home`
      return redirect(homeUrl)
    }

    if (cleanPathname.startsWith('/admin') && role !== 'admin') {
      const homeUrl = request.nextUrl.clone()
      homeUrl.pathname = `/${locale}/home`
      return redirect(homeUrl)
    }

    // Shop Setup Check (Only for shop_owners visiting vendor pages other than /vendor/shop)
    const isPrefetch = request.headers.get('next-router-prefetch') || request.headers.get('purpose') === 'prefetch'

    if (role === 'shop_owner' && cleanPathname.startsWith('/vendor') && cleanPathname !== '/vendor/shop' && !isPrefetch) {
      const { data: ownerRow } = await supabase
        .from('shop_owners')
        .select('shop_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (!ownerRow?.shop_id) {
        const setupUrl = request.nextUrl.clone()
        setupUrl.pathname = `/${locale}/vendor/shop`
        return redirect(setupUrl)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|js|css)$).*)',
  ],
}

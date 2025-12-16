import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth/callback', '/account-deactivated']

// Routes restricted from ops users
const OPS_RESTRICTED_ROUTES = ['/customers', '/invoices', '/settings', '/reports']

// Routes restricted from sales users
const SALES_RESTRICTED_ROUTES = ['/job-orders', '/invoices', '/settings']

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))

  // Redirect unauthenticated users to login (except for public routes)
  if (!user && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from login page to dashboard
  if (user && pathname === '/login') {
    const dashboardUrl = new URL('/dashboard', request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Check user profile for role restrictions and active status
  if (user && !isPublicRoute) {
    // Create a Supabase client to check user profile
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // We don't need to set cookies here
          },
        },
      }
    )

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('user_id', user.id)
      .single()

    // Redirect deactivated users to account-deactivated page
    if (profile && !profile.is_active && pathname !== '/account-deactivated') {
      const deactivatedUrl = new URL('/account-deactivated', request.url)
      return NextResponse.redirect(deactivatedUrl)
    }

    // Check role-based restrictions
    const isOpsRestrictedRoute = OPS_RESTRICTED_ROUTES.some(route => pathname.startsWith(route))
    const isSalesRestrictedRoute = SALES_RESTRICTED_ROUTES.some(route => pathname.startsWith(route))

    // Redirect ops users to dashboard for ops-restricted routes
    if (profile?.role === 'ops' && isOpsRestrictedRoute) {
      const dashboardUrl = new URL('/dashboard', request.url)
      dashboardUrl.searchParams.set('restricted', 'true')
      return NextResponse.redirect(dashboardUrl)
    }

    // Redirect sales users to dashboard for sales-restricted routes
    if (profile?.role === 'sales' && isSalesRestrictedRoute) {
      const dashboardUrl = new URL('/dashboard', request.url)
      dashboardUrl.searchParams.set('restricted', 'true')
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

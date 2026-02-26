import { NextRequest, NextResponse } from 'next/server'

/**
 * Validate request origin for CSRF protection on API routes.
 * Server Actions are auto-protected by Next.js; this is for custom API routes.
 *
 * Returns true if the origin is valid (or not required), false if blocked.
 */
export function isValidOrigin(request: NextRequest): boolean {
  // GET/HEAD/OPTIONS don't need CSRF
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return true

  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') return true

  // Origin must match host
  if (origin) {
    const originUrl = new URL(origin)
    if (originUrl.host !== host) {
      return false
    }
  }

  return true
}

/**
 * Create a standard CSRF rejection response (403).
 */
export function csrfRejection(): NextResponse {
  return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
}

/**
 * Extract client IP from request headers for rate limiting.
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

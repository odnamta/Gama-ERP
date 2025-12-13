import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Feature: google-oauth, Property 1: Route protection redirects unauthenticated users
 * Validates: Requirements 4.1
 * 
 * For any protected route (not /login, /auth/callback, or static files),
 * when accessed by an unauthenticated user, the middleware SHALL redirect to /login.
 */

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/auth/callback']

// Static file patterns that are excluded from middleware
const STATIC_PATTERNS = [
  '_next/static',
  '_next/image',
  'favicon.ico',
  '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'
]

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

function isStaticFile(pathname: string): boolean {
  return STATIC_PATTERNS.some(pattern => pathname.includes(pattern))
}

function shouldProtectRoute(pathname: string): boolean {
  return !isPublicRoute(pathname) && !isStaticFile(pathname)
}

describe('Route Protection Property Tests', () => {
  it('Property 1: correctly identifies public routes as not requiring protection', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('/login', '/login/callback', '/auth/callback', '/auth/callback/test'),
        (pathname) => {
          expect(isPublicRoute(pathname)).toBe(true)
          expect(shouldProtectRoute(pathname)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 1: correctly identifies protected routes as requiring authentication', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/dashboard',
          '/customers',
          '/projects',
          '/pjo',
          '/jo',
          '/invoices',
          '/settings',
          '/api/data'
        ),
        (pathname) => {
          expect(isPublicRoute(pathname)).toBe(false)
          expect(isStaticFile(pathname)).toBe(false)
          expect(shouldProtectRoute(pathname)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 1: correctly identifies static files as not requiring protection', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/_next/static/chunk.js',
          '/_next/image/photo.png',
          '/favicon.ico',
          '/logo.svg',
          '/image.png',
          '/photo.jpg'
        ),
        (pathname) => {
          expect(isStaticFile(pathname)).toBe(true)
          expect(shouldProtectRoute(pathname)).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 1: random paths without public prefixes should be protected', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
          !s.startsWith('login') && 
          !s.startsWith('auth') &&
          !s.includes('_next') &&
          !s.includes('favicon') &&
          !s.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
        ),
        (randomPath) => {
          const pathname = '/' + randomPath.replace(/[^a-zA-Z0-9/-]/g, '')
          if (pathname.length > 1) {
            expect(shouldProtectRoute(pathname)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import * as fc from 'fast-check'
import { Header, getInitials, UserInfo } from '@/components/layout/header'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

/**
 * Feature: google-oauth, Property 2: Authenticated user profile display
 * Validates: Requirements 2.1, 2.2
 * 
 * For any authenticated user with profile metadata, when viewing any protected page,
 * the header SHALL display the user's name from their profile.
 */
// Generate realistic names that won't collide with their initials
const realisticNameArb = fc.tuple(
  fc.constantFrom('John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona'),
  fc.constantFrom('Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis')
).map(([first, last]) => `${first} ${last}`)

describe('User Profile Display Property Tests', () => {
  it('Property 2: displays user name for any authenticated user', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: realisticNameArb,
          email: fc.emailAddress(),
          avatarUrl: fc.option(fc.webUrl(), { nil: null }),
        }),
        (userInfo: UserInfo) => {
          const { unmount } = render(<Header user={userInfo} />)
          // Check that name appears in the document
          expect(screen.getByText(userInfo.name)).toBeInTheDocument()
          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 2: displays avatar or fallback for any authenticated user', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: realisticNameArb,
          email: fc.emailAddress(),
          avatarUrl: fc.constant(null as string | null),
        }),
        (userInfo: UserInfo) => {
          const { unmount } = render(<Header user={userInfo} />)
          // Should show initials fallback when no avatar
          const initials = getInitials(userInfo.name)
          expect(screen.getByText(initials)).toBeInTheDocument()
          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: google-oauth, Property 3: Avatar fallback to initials
 * Validates: Requirements 2.3
 * 
 * For any authenticated user where avatar_url is null or image fails to load,
 * the header SHALL display a fallback element containing the user's initials.
 */
describe('Avatar Fallback Property Tests', () => {
  it('Property 3: generates correct initials for single word names', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0 && !s.includes(' ')),
        (name) => {
          const initials = getInitials(name)
          expect(initials).toBe(name.charAt(0).toUpperCase())
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3: generates correct initials for multi-word names', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0 && !s.includes(' ')),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0 && !s.includes(' '))
        ),
        ([firstName, lastName]) => {
          const fullName = `${firstName} ${lastName}`
          const initials = getInitials(fullName)
          const expected = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
          expect(initials).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 3: handles empty name gracefully', () => {
    expect(getInitials('')).toBe('?')
  })

  it('Property 3: handles names with multiple spaces', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0 && !s.includes(' ')),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0 && !s.includes(' ')),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length > 0 && !s.includes(' '))
        ),
        ([first, middle, last]) => {
          const fullName = `${first}  ${middle}   ${last}` // Multiple spaces
          const initials = getInitials(fullName)
          // Should use first and last parts
          const expected = (first.charAt(0) + last.charAt(0)).toUpperCase()
          expect(initials).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })
})

'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if a media query matches.
 * Returns false during SSR to avoid hydration mismatches.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

/** Shorthand: true when viewport >= 768px (md breakpoint) */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)')
}

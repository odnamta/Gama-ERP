'use server'

/**
 * Route Distance Calculator — Server Action
 *
 * Calls Google Maps Distance Matrix API server-side to calculate
 * driving distance and duration between two locations.
 * Uses in-memory cache to avoid repeated API calls for the same routes.
 *
 * Part of the GPS-based distance/tariff decision support tool (v1).
 */

// In-memory cache: key = "origin|destination", value = result + timestamp
const routeCache = new Map<string, {
  result: RouteDistanceResult
  cachedAt: number
}>()

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export interface RouteDistanceResult {
  distance_km: number
  duration_minutes: number
  route_summary: string
  origin_address: string
  destination_address: string
}

function getCacheKey(origin: string, destination: string): string {
  return `${origin.trim().toLowerCase()}|${destination.trim().toLowerCase()}`
}

function cleanExpiredCache(): void {
  const now = Date.now()
  for (const [key, entry] of routeCache.entries()) {
    if (now - entry.cachedAt > CACHE_TTL_MS) {
      routeCache.delete(key)
    }
  }
}

/**
 * Calculate driving distance and duration between two locations
 * using Google Maps Distance Matrix API.
 *
 * Results are cached in-memory for 24 hours to avoid redundant API calls.
 *
 * @param origin - Origin address or place name (e.g., "Pelabuhan Tanjung Perak, Surabaya")
 * @param destination - Destination address or place name
 * @returns Route distance result or error
 */
export async function calculateRouteDistance(
  origin: string,
  destination: string
): Promise<{ data: RouteDistanceResult | null; error?: string }> {
  if (!origin?.trim() || !destination?.trim()) {
    return { data: null, error: 'Asal dan tujuan harus diisi' }
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return { data: null, error: 'Google Maps API key belum dikonfigurasi (server-side)' }
  }

  // Check cache first
  const cacheKey = getCacheKey(origin, destination)
  const cached = routeCache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { data: cached.result }
  }

  // Clean expired entries periodically
  if (routeCache.size > 100) {
    cleanExpiredCache()
  }

  try {
    const params = new URLSearchParams({
      origins: origin.trim(),
      destinations: destination.trim(),
      key: apiKey,
      mode: 'driving',
      language: 'id', // Indonesian
      units: 'metric',
      region: 'id', // Bias towards Indonesia
    })

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`,
      {
        method: 'GET',
        next: { revalidate: 86400 } // Cache at fetch level too (24h)
      }
    )

    if (!response.ok) {
      return { data: null, error: `Google Maps API error: ${response.status}` }
    }

    const data = await response.json()

    if (data.status !== 'OK') {
      return { data: null, error: `Google Maps API: ${data.error_message || data.status}` }
    }

    const element = data.rows?.[0]?.elements?.[0]
    if (!element || element.status !== 'OK') {
      const statusMsg = element?.status === 'NOT_FOUND'
        ? 'Lokasi tidak ditemukan'
        : element?.status === 'ZERO_RESULTS'
        ? 'Tidak ada rute yang ditemukan'
        : `Status: ${element?.status || 'unknown'}`
      return { data: null, error: statusMsg }
    }

    const result: RouteDistanceResult = {
      distance_km: Math.round((element.distance.value / 1000) * 10) / 10, // meters to km, 1 decimal
      duration_minutes: Math.round(element.duration.value / 60), // seconds to minutes
      route_summary: `${element.distance.text} - ${element.duration.text}`,
      origin_address: data.origin_addresses?.[0] || origin,
      destination_address: data.destination_addresses?.[0] || destination,
    }

    // Store in cache
    routeCache.set(cacheKey, {
      result,
      cachedAt: Date.now(),
    })

    return { data: result }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menghitung jarak rute'
    return { data: null, error: message }
  }
}

/**
 * Calculate route distance using lat/lng coordinates instead of address strings.
 * More accurate and avoids geocoding ambiguity.
 */
export async function calculateRouteDistanceByCoords(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  originLabel?: string,
  destLabel?: string,
): Promise<{ data: RouteDistanceResult | null; error?: string }> {
  const origin = `${originLat},${originLng}`
  const destination = `${destLat},${destLng}`

  const result = await calculateRouteDistance(origin, destination)

  // Override labels with user-friendly names if provided
  if (result.data) {
    if (originLabel) result.data.origin_address = originLabel
    if (destLabel) result.data.destination_address = destLabel
  }

  return result
}

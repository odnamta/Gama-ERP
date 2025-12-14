'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, Loader2 } from 'lucide-react'

export interface LocationData {
  formattedAddress: string
  placeId: string
  lat: number
  lng: number
}

interface PlacesAutocompleteProps {
  value: string
  onChange: (value: string, locationData?: LocationData) => void
  placeholder?: string
  disabled?: boolean
  restrictToCountry?: string
  id?: string
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: google.maps.places.AutocompleteOptions
          ) => google.maps.places.Autocomplete
        }
      }
    }
  }
}

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder = 'Enter location',
  disabled = false,
  restrictToCountry = 'id', // Indonesia by default
  id,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isApiLoaded, setIsApiLoaded] = useState(false)

  // Check if Google Maps API is loaded
  const checkApiLoaded = useCallback(() => {
    if (window.google?.maps?.places) {
      setIsApiLoaded(true)
      return true
    }
    return false
  }, [])

  // Initialize autocomplete when API is ready
  useEffect(() => {
    if (!inputRef.current) return

    // Check immediately
    if (checkApiLoaded()) {
      initAutocomplete()
      return
    }

    // Poll for API load (in case script loads after component mounts)
    const interval = setInterval(() => {
      if (checkApiLoaded()) {
        initAutocomplete()
        clearInterval(interval)
      }
    }, 500)

    // Cleanup after 10 seconds if API never loads
    const timeout = setTimeout(() => {
      clearInterval(interval)
    }, 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkApiLoaded])

  function initAutocomplete() {
    if (!inputRef.current || !window.google?.maps?.places || autocompleteRef.current) return

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: restrictToCountry ? { country: restrictToCountry } : undefined,
        fields: ['formatted_address', 'place_id', 'geometry'],
        types: ['geocode', 'establishment'],
      })

      autocomplete.addListener('place_changed', () => {
        setIsLoading(true)
        const place = autocomplete.getPlace()

        if (place.formatted_address && place.place_id && place.geometry?.location) {
          const locationData: LocationData = {
            formattedAddress: place.formatted_address,
            placeId: place.place_id,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }
          onChange(place.formatted_address, locationData)
        } else {
          // Fallback if place data is incomplete
          onChange(inputRef.current?.value || '')
        }
        setIsLoading(false)
      })

      autocompleteRef.current = autocomplete
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error)
    }
  }

  // Handle manual input changes (fallback mode)
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className="pl-9"
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
      </div>
      {!isApiLoaded && (
        <p className="text-xs text-muted-foreground mt-1">
          Location autocomplete unavailable - manual entry enabled
        </p>
      )}
    </div>
  )
}

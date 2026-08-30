import { useState, useEffect } from 'react'
import { reverseGeocode } from '../services/api'

interface GeolocationState {
  lat: number
  lng: number
  locationName: string
  loading: boolean
  error: string | null
}

const LAHORE_DEFAULT = { lat: 31.5204, lng: 74.3587 }

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: LAHORE_DEFAULT.lat,
    lng: LAHORE_DEFAULT.lng,
    locationName: 'Lahore',
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, loading: false, error: 'Geolocation not supported' }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const name = await reverseGeocode(lat, lng)
        setState({ lat, lng, locationName: name, loading: false, error: null })
      },
      () => {
        setState((s) => ({
          ...s,
          lat: LAHORE_DEFAULT.lat,
          lng: LAHORE_DEFAULT.lng,
          locationName: 'Lahore',
          loading: false,
          error: 'Location permission denied — using Lahore as default',
        }))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  return state
}

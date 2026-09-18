import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import {
  fetchAqiByCoords,
  fetchForecast,
  fetchAdvisory,
  fetchTip,
  AqiReading,
  ForecastPoint,
  Advisory,
  RioTip,
} from '../services/api'

interface AqiState {
  current: AqiReading | null
  forecast: ForecastPoint[]
  advisory: Advisory | null
  tip: RioTip | null
  profile: string
  loading: boolean
  error: string | null
  locationName: string
  lat: number
  lng: number
  setProfile: (p: string) => void
  refresh: () => void
}

const AqiContext = createContext<AqiState | null>(null)

export function useAqi() {
  const ctx = useContext(AqiContext)
  if (!ctx) throw new Error('useAqi must be used within AqiProvider')
  return ctx
}

export function AqiProvider({ children }: { children: ReactNode }) {
  const { lat, lng, locationName, loading: geoLoading } = useGeolocation()
  const [current, setCurrent] = useState<AqiReading | null>(null)
  const [forecast, setForecast] = useState<ForecastPoint[]>([])
  const [advisory, setAdvisory] = useState<Advisory | null>(null)
  const [tip, setTip] = useState<RioTip | null>(null)
  const [profile, setProfileState] = useState(() => {
    // Load saved profile from localStorage on init; fall back to 'citizen'
    try {
      const saved = localStorage.getItem('mehfooze_profile')
      if (saved) {
        const data = JSON.parse(saved)
        const valid = ['citizen', 'parent', 'patient', 'commuter', 'student']
        if (valid.includes(data.profile)) return data.profile
      }
    } catch {}
    return 'citizen'
  })

  const setProfile = (p: string) => {
    setProfileState(p)
    // Persist to localStorage so SafeHabitsPage and ProfilePage stay in sync
    try {
      const existing = JSON.parse(localStorage.getItem('mehfooze_profile') || '{}')
      localStorage.setItem('mehfooze_profile', JSON.stringify({ ...existing, profile: p }))
    } catch {}
  }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    if (geoLoading) return
    setLoading(true)
    setError(null)

    fetchAqiByCoords(lat, lng)
      .then((data) => {
        setCurrent(data)
        return fetchForecast(lat, lng)
      })
      .then((data) => setForecast(data))
      .catch(() => setError('Could not load AQI data for your location'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [lat, lng, geoLoading])

  useEffect(() => {
    if (!current) return
    fetchForecast(current.lat, current.lng).then(setForecast)
  }, [current?.lat, current?.lng])

  useEffect(() => {
    fetchAdvisory(profile).then(setAdvisory).catch(() => {})
  }, [profile])

  useEffect(() => {
    if (!current) return
    fetchTip(profile, current.aqi).then(setTip).catch(() => {})
  }, [current?.aqi, profile])

  return (
    <AqiContext.Provider value={{
      current, forecast, advisory, tip, profile,
      loading: loading || geoLoading, error, locationName, lat, lng,
      setProfile, refresh: load,
    }}>
      {children}
    </AqiContext.Provider>
  )
}

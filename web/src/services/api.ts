/**
 * Mehfooze API client — web frontend.
 *
 * SECURITY RULE: This file must NEVER contain API keys for AQICN, Firebase Admin,
 * Google Directions, or any other paid/sensitive service. All external API calls
 * are made by the backend. The frontend only calls the Mehfooze backend API.
 *
 * The only "API key" permitted here is the Firebase client config (apiKey), which
 * is a public project identifier by design — it does not grant server-side access.
 */

// Backend API base URL — empty string uses Vite proxy in dev, full URL in production
export const API_BASE = import.meta.env.VITE_API_URL || ''

// Nominatim is used only for reverse geocoding (no key required, no sensitive data)
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export interface AqiReading {
  aqi: number
  pm25: number
  pm10: number
  o3: number
  no2: number
  co: number
  so2: number
  stationId: string
  name: string
  updatedAt: string
  lat: number
  lng: number
  temperature?: number
  humidity?: number
  wind_speed?: number
  source?: string
}

export interface ForecastPoint {
  hour: number
  aqi: number
  temperature?: number
  humidity?: number
  windSpeed?: number
}

export interface RouteResult {
  distance: number
  duration: number
  steps: { instruction: string; distance: number; duration: number }[]
  coordinates: [number, number][]
}

export interface Advisory {
  profile: string
  message: string
  actions: string[]
  aqi: number
  aqiCategory: string
  aqiColour: string
  generatedAt: string
}

export interface CityRanking {
  rank: number
  city: string
  country: string
  flag: string
  aqi: number
}

export interface RioTip {
  tip: string
  period: string
  aqiTier: string
  aqi: number
  profile: string
  generatedAt: string
}

// ── AQI Data (backend only — keys never exposed) ─────────────────────────────

/**
 * Fetch live AQI + weather for all zones from the Mehfooze backend.
 * Backend fetches from Open-Meteo + AQICN server-side.
 */
export async function fetchCurrentFromBackend(): Promise<AqiReading[]> {
  const res = await fetch(`${API_BASE}/api/current`)
  if (!res.ok) throw new Error(`Backend /api/current returned ${res.status}`)
  return res.json()
}

/**
 * Fetch AQI for the user's nearest zone based on coordinates.
 * Finds closest zone from the backend's current readings.
 */
export async function fetchAqiByCoords(lat: number, lng: number): Promise<AqiReading> {
  const readings: AqiReading[] = await fetchCurrentFromBackend()
  if (!readings.length) throw new Error('No readings from backend')

  // Find nearest zone using Euclidean distance (sufficient for Lahore's ~30km radius)
  let nearest = readings[0]
  let minDist = Infinity
  for (const r of readings) {
    const dist = Math.hypot(r.lat - lat, r.lng - lng)
    if (dist < minDist) {
      minDist = dist
      nearest = r
    }
  }
  return nearest
}

// ── Forecast (backend) ────────────────────────────────────────────────────────

/**
 * Fetch AQI forecast from the Mehfooze backend for the zone nearest to coordinates.
 */
export async function fetchForecast(lat: number, lng: number): Promise<ForecastPoint[]> {
  // Determine nearest zone slug from backend readings
  let zoneId = 'gulberg'
  try {
    const readings: AqiReading[] = await fetchCurrentFromBackend()
    if (readings.length) {
      let minDist = Infinity
      for (const r of readings) {
        const dist = Math.hypot(r.lat - lat, r.lng - lng)
        if (dist < minDist) { minDist = dist; zoneId = r.stationId }
      }
    }
  } catch {}

  const res = await fetch(`${API_BASE}/api/forecast/${zoneId}`)
  if (!res.ok) throw new Error(`Forecast unavailable for zone ${zoneId}`)
  return res.json()
}

// ── Advisory (backend) ────────────────────────────────────────────────────────

/**
 * Fetch profile-specific advisory from the Mehfooze backend.
 */
export async function fetchAdvisory(profile: string): Promise<Advisory> {
  // Validate profile ID against canonical list
  const validProfiles = ['citizen', 'parent', 'patient', 'commuter', 'student']
  const safeProfile = validProfiles.includes(profile) ? profile : 'citizen'

  try {
    const res = await fetch(`${API_BASE}/api/advisory/${safeProfile}`)
    if (res.ok) return res.json()
  } catch {}

  // Static offline fallback — never calls external APIs from frontend
  const fallbacks: Record<string, { message: string; actions: string[] }> = {
    citizen:  { message: 'Check air quality before heading outside today.', actions: ['Check AQI before going out', 'Wear a mask if AQI > 100'] },
    parent:   { message: 'Check school zone air quality before sending children out.', actions: ['Check school zone AQI', 'Keep children indoors if AQI > 150'] },
    patient:  { message: 'Avoid outdoor exertion. Carry your inhaler.', actions: ['Stay indoors if possible', 'Carry inhaler', 'Use air purifier'] },
    commuter: { message: 'Wear an N95 mask during your commute if AQI is elevated.', actions: ['Wear N95 mask', 'Keep vehicle windows closed'] },
    student:  { message: 'Check AQI before outdoor sports today.', actions: ['Check AQI before outdoor activity', 'Move exercise indoors if AQI > 100'] },
  }
  const { message, actions } = fallbacks[safeProfile] ?? fallbacks.citizen
  return {
    profile: safeProfile,
    message,
    actions,
    aqi: 120,
    aqiCategory: 'Moderate',
    aqiColour: '#ffff00',
    generatedAt: new Date().toISOString(),
  }
}

// ── Proactive Tip (backend) ───────────────────────────────────────────────────

export async function fetchTip(profile: string = 'citizen', aqi: number = 50): Promise<RioTip> {
  try {
    const res = await fetch(`${API_BASE}/api/tips?profile=${profile}&aqi=${aqi}`)
    if (res.ok) return res.json()
  } catch {}
  return {
    tip: 'Check air quality before heading out. Stay safe!',
    period: 'afternoon',
    aqiTier: 'moderate',
    aqi,
    profile,
    generatedAt: new Date().toISOString(),
  }
}

// ── City Rankings (backend) ───────────────────────────────────────────────────

export async function fetchGlobalRankings(): Promise<CityRanking[]> {
  try {
    const res = await fetch(`${API_BASE}/api/rankings`)
    if (res.ok) return res.json()
  } catch {}
  return []
}

// ── Geocoding (Nominatim — no key needed) ────────────────────────────────────

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    const addr = data.address
    if (addr) {
      return addr.city || addr.town || addr.village || addr.county || addr.state || 'Your Location'
    }
    return data.display_name?.split(',')[0] ?? 'Your Location'
  } catch {
    return 'Your Location'
  }
}

export async function geocode(query: string): Promise<{ lat: number; lng: number; name: string }[]> {
  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=pk`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return data.map((item: Record<string, unknown>) => ({
      lat: parseFloat(item.lat as string),
      lng: parseFloat(item.lon as string),
      name: item.display_name as string,
    }))
  } catch {
    return []
  }
}

// ── Routing (OSRM — no key, public server) ───────────────────────────────────

export async function fetchRoute(
  startLat: number, startLng: number, endLat: number, endLng: number
): Promise<RouteResult> {
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`
  )
  const data = await res.json()
  if (!data.routes?.length) throw new Error('No route found')

  const route = data.routes[0]
  return {
    distance: route.distance,
    duration: route.duration,
    steps: route.legs[0].steps.map((s: { distance?: number; duration?: number; maneuver?: { type?: string } }) => ({
      instruction: (s.maneuver?.type as string) ?? 'continue',
      distance: s.distance ?? 0,
      duration: s.duration ?? 0,
    })),
    coordinates: (route.geometry.coordinates as [number, number][]) ?? [],
  }
}

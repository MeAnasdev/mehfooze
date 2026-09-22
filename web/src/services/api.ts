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
  precipitation?: number
  windDirection?: number
  raining?: boolean
  varianceFlag?: boolean
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

// ── Pollution Reports (Phase 1) ────────────────────────────────────────────

export type ReportType =
  | 'waste_burning'
  | 'industrial_smoke'
  | 'construction_dust'
  | 'dirty_vehicle'
  | 'other'

export interface PollutionReport {
  id: string
  userId: string
  type: ReportType
  lat: number
  lng: number
  photoUrl: string | null
  note: string | null
  nearestZone: string | null
  nearestAqi: number | null
  sensorCorroborated: boolean
  likelySource: string | null
  corroborationNote: string | null
  status: 'submitted' | 'under_review' | 'verified' | 'routed' | 'resolved' | 'dismissed'
  routedTo: string | null
  resolutionNote: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateReportInput {
  userId: string
  type: ReportType
  lat: number
  lng: number
  photoUrl?: string | null
  note?: string | null
}

// ── Source Attribution (Phase 3) ────────────────────────────────────────────

export interface SourceAttribution {
  zone: string
  aqi: number | null
  attributed: boolean
  source: string | null
  distanceKm: number | null
  direction: string | null
  windFrom: string | null
  confidence: 'likely' | 'possible' | 'none'
  message: string
  attributionSource: string
}

/** Fetch source attribution for a zone (likely upwind industrial source). */
export async function fetchAttribution(zoneId: string): Promise<SourceAttribution | null> {
  try {
    const res = await fetch(`${API_BASE}/api/attribution/${zoneId}`)
    if (res.ok) return res.json()
  } catch {}
  return null
}

// ── Satellite Overlay (Phase 4) ─────────────────────────────────────────────

export interface SatelliteZone {
  zoneId: string
  name: string
  lat: number
  lng: number
  no2: number | null
  unit: string
}

export interface SatelliteOverlay {
  available: boolean
  meta: {
    source: string
    gas: string
    resolution: string
    cadence: string
    note: string
  }
  zones: SatelliteZone[]
  message: string
}

/** Fetch Sentinel-5P regional NO2 satellite overlay (degrades gracefully). */
export async function fetchSatellite(): Promise<SatelliteOverlay | null> {
  try {
    const res = await fetch(`${API_BASE}/api/satellite`)
    if (res.ok) return res.json()
  } catch {}
  return null
}

// ── Flood Monitoring (Open-Meteo GloFAS) ────────────────────────────────────

export interface RiverStatus {
  id: string
  name: string
  urdu: string
  lat: number
  lng: number
  discharge: number | null
  status: { level: string; label: string; color: string }
  status24h: { level: string; label: string; color: string }
  peak7d: number | null
  series: { date: string; discharge: number }[]
}

export interface FloodOverview {
  rivers: RiverStatus[]
  anyFloodRisk: boolean
  updatedAt: string
  source: { authority: string; url: string; note: string }
}

/** Fetch live river-discharge flood monitoring for Punjab rivers. */
export async function fetchFlood(): Promise<FloodOverview | null> {
  try {
    const res = await fetch(`${API_BASE}/api/flood`)
    if (res.ok) return res.json()
  } catch {}
  return null
}

// ── AQICN Stations heatmap (dense map) ──────────────────────────────────────

export interface AqiStation {
  lat: number
  lng: number
  aqi: number
  station: string
}

/** Fetch all real AQICN stations in the Lahore region (dense station map). */
export async function fetchStations(): Promise<AqiStation[]> {
  try {
    const res = await fetch(`${API_BASE}/api/stations`)
    if (res.ok) return res.json()
  } catch {}
  return []
}

/** Submit a pollution report to the backend (runs corroboration server-side). */
export async function submitReport(input: CreateReportInput): Promise<PollutionReport> {
  const res = await fetch(`${API_BASE}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`Report submission failed (${res.status})`)
  return res.json()
}

/** Fetch the current user's own reports. */
export async function fetchMyReports(userId: string): Promise<PollutionReport[]> {
  const res = await fetch(`${API_BASE}/api/reports/mine?userId=${encodeURIComponent(userId)}`)
  if (!res.ok) return []
  return res.json()
}

// ── Government Dashboard (Phase 2) ──────────────────────────────────────────

export interface PriorityZone {
  rank: number
  zoneId: string
  name: string
  lat: number
  lng: number
  aqi: number
  aqiCategory: string
  aqiColour: string
  population: number
  priorityScore: number
  scoreNote: string
}

export interface ReportStats {
  total: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  byZone: Record<string, number>
  windowDays: number
}

export interface CaseTrend {
  reportId: string
  zone: string | null
  createdAt: string
  before: { t: string; aqi: number }[]
  after: { t: string; aqi: number }[]
  beforeAvg: number | null
  afterAvg: number | null
  improved: boolean
  note: string
}

/** Fetch population-weighted zone priority ranking. */
export async function fetchPriorityZones(): Promise<PriorityZone[]> {
  const res = await fetch(`${API_BASE}/api/priority`)
  if (!res.ok) return []
  return res.json()
}

/** Fetch all pollution reports (government queue), optionally filtered. */
export async function fetchAllReports(status?: string, zone?: string): Promise<PollutionReport[]> {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  if (zone) params.set('zone', zone)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_BASE}/api/reports${qs}`)
  if (!res.ok) return []
  return res.json()
}

/** Update a report's case status (government action). */
export async function updateReportStatus(
  reportId: string,
  status: string,
  routedTo?: string,
  resolutionNote?: string,
): Promise<PollutionReport> {
  const res = await fetch(`${API_BASE}/api/reports/${reportId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, routedTo, resolutionNote }),
  })
  if (!res.ok) throw new Error(`Status update failed (${res.status})`)
  return res.json()
}

/** Fetch report statistics (counts by type/status/zone). */
export async function fetchReportStats(): Promise<ReportStats | null> {
  const res = await fetch(`${API_BASE}/api/reports/stats`)
  if (!res.ok) return null
  return res.json()
}

/** Fetch before/after AQI trend for a case. */
export async function fetchCaseTrend(reportId: string): Promise<CaseTrend | null> {
  const res = await fetch(`${API_BASE}/api/reports/${reportId}/trend`)
  if (!res.ok) return null
  return res.json()
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
export async function fetchAdvisory(profile: string, zone?: string): Promise<Advisory> {
  // Validate profile ID against canonical list
  const validProfiles = ['citizen', 'parent', 'patient', 'commuter', 'student']
  const safeProfile = validProfiles.includes(profile) ? profile : 'citizen'

  // Pass zone for local (rain-aware) advisory when known
  const zoneParam = zone ? `?zone=${encodeURIComponent(zone)}` : ''

  try {
    const res = await fetch(`${API_BASE}/api/advisory/${safeProfile}${zoneParam}`)
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

const AQICN_TOKEN = import.meta.env.VITE_AQICN_TOKEN
const AQICN_BASE = 'https://api.waqi.info'

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1'
const OPEN_METEO_AQI = 'https://air-quality-api.open-meteo.com/v1'
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export interface AqiReading {
  aqi: number
  pm25: number
  pm10: number
  o3: number
  no2: number
  co: number
  so2: number
  station: string
  time: string
  lat: number
  lng: number
  temperature?: number
  humidity?: number
  wind_speed?: number
}

export interface ForecastPoint {
  hour: number
  aqi: number
  temperature: number
  humidity: number
  windSpeed: number
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

// Fetch advisory from backend (or build locally if backend unavailable)
export async function fetchAdvisory(profile: string): Promise<Advisory> {
  try {
    const res = await fetch(`/api/advisory/${profile}`)
    if (res.ok) return res.json()
  } catch {}
  // Fallback: build locally from AQICN data
  const aqiRes = await fetch(`${AQICN_BASE}/feed/lahore/?token=${AQICN_TOKEN}`)
  const aqiData = await aqiRes.json()
  const aqi = aqiData.data?.aqi ?? 120
  const category = aqi <= 50 ? 'Good' : aqi <= 100 ? 'Moderate' : aqi <= 150 ? 'Unhealthy for Sensitive Groups' : aqi <= 200 ? 'Unhealthy' : 'Very Unhealthy'
  const advice: Record<string, { message: string; actions: string[] }> = {
    citizen: { message: 'Air quality is acceptable. Sensitive groups should limit prolonged outdoor exertion.', actions: ['Limit prolonged outdoor exertion'] },
    parent: { message: 'Keep children indoors. Air quality is unhealthy for sensitive groups.', actions: ['Keep children indoors', 'Cancel outdoor activities'] },
    patient: { message: 'Avoid outdoor exertion. Use air purifier indoors.', actions: ['Avoid outdoor exertion', 'Use air purifier'] },
    worker: { message: 'Wear N95 mask if working outdoors. Take frequent breaks.', actions: ['Wear N95 mask', 'Take frequent breaks'] },
  }
  const { message, actions } = advice[profile] ?? advice.citizen
  return { profile, message, actions, aqi, aqiCategory: category, aqiColour: '', generatedAt: new Date().toISOString() }
}

// Fetch AQI for a single coordinate (user's location)
export async function fetchAqiByCoords(lat: number, lng: number): Promise<AqiReading> {
  const res = await fetch(`${AQICN_BASE}/feed/geo:${lat};${lng}/?token=${AQICN_TOKEN}`)
  const data = await res.json()
  if (data.status !== 'ok') throw new Error('AQICN error')
  return {
    aqi: data.data.aqi,
    pm25: data.data.iaqi?.pm25?.v ?? 0,
    pm10: data.data.iaqi?.pm10?.v ?? 0,
    o3: data.data.iaqi?.o3?.v ?? 0,
    no2: data.data.iaqi?.no2?.v ?? 0,
    co: data.data.iaqi?.co?.v ?? 0,
    so2: data.data.iaqi?.so2?.v ?? 0,
    station: data.data.city?.name ?? 'Your Location',
    time: data.data.time?.iso ?? new Date().toISOString(),
    lat,
    lng,
    temperature: data.data.iaqi?.t?.v,
    humidity: data.data.iaqi?.h?.v,
    wind_speed: data.data.iaqi?.w?.v,
  }
}

// Fetch AQI for Lahore zones (used as fallback / map markers)
export async function fetchLahoreAqi(): Promise<AqiReading[]> {
  const zones = [
    { name: 'Gulberg', lat: 31.5204, lng: 74.3587 },
    { name: 'Johar Town', lat: 31.4631, lng: 74.2946 },
    { name: 'Shahdara', lat: 31.6184, lng: 74.4826 },
    { name: 'Model Town', lat: 31.4856, lng: 74.3146 },
    { name: 'DHA', lat: 31.4710, lng: 74.4180 },
  ]

  const results = await Promise.allSettled(
    zones.map(async (zone) => {
      const res = await fetch(`${AQICN_BASE}/feed/geo:${zone.lat};${zone.lng}/?token=${AQICN_TOKEN}`)
      const data = await res.json()
      if (data.status !== 'ok') throw new Error('AQICN error')
      return {
        aqi: data.data.aqi,
        pm25: data.data.iaqi?.pm25?.v ?? 0,
        pm10: data.data.iaqi?.pm10?.v ?? 0,
        station: data.data.city?.name ?? zone.name,
        time: data.data.time?.iso ?? new Date().toISOString(),
        lat: zone.lat,
        lng: zone.lng,
      }
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<AqiReading> => r.status === 'fulfilled')
    .map((r) => r.value)
}

// Reverse geocode coordinates to a place name
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`
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

// Fetch forecast from Open-Meteo
export async function fetchForecast(lat: number, lng: number): Promise<ForecastPoint[]> {
  const res = await fetch(
    `${OPEN_METEO_AQI}/air-quality?latitude=${lat}&longitude=${lng}&hourly=us_aqi,pm2_5,pm10&forecast_days=3`
  )
  const weatherRes = await fetch(
    `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&forecast_days=3`
  )

  const aqiData = await res.json()
  const weatherData = await weatherRes.json()

  const now = new Date()
  const points: ForecastPoint[] = []

  for (let i = 0; i < Math.min(aqiData.hourly?.us_aqi?.length ?? 0, 72); i++) {
    const time = new Date(aqiData.hourly.time[i])
    if (time < now) continue
    points.push({
      hour: Math.round((time.getTime() - now.getTime()) / 3600000),
      aqi: aqiData.hourly.us_aqi[i] ?? 120,
      temperature: weatherData.hourly?.temperature_2m?.[i] ?? 25,
      humidity: weatherData.hourly?.relative_humidity_2m?.[i] ?? 50,
      windSpeed: weatherData.hourly?.wind_speed_10m?.[i] ?? 5,
    })
  }

  return points.slice(0, 48)
}

// Geocode with Nominatim
export async function geocode(query: string): Promise<{ lat: number; lng: number; name: string }[]> {
  const res = await fetch(
    `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=pk`
  )
  const data = await res.json()
  return data.map((item: Record<string, unknown>) => ({
    lat: parseFloat(item.lat as string),
    lng: parseFloat(item.lon as string),
    name: item.display_name as string,
  }))
}

// Route from OSRM
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
    steps: route.legs[0].steps.map((s: { distance?: number; duration?: number; maneuver?: { type?: string; } }) => ({
      instruction: (s.maneuver?.type as string) ?? 'continue',
      distance: (s.distance ?? 0),
      duration: (s.duration ?? 0),
    })),
    coordinates: (route.geometry.coordinates as [number, number][]) ?? [],
  }
}

// Fetch global city rankings from AQICN
export async function fetchGlobalRankings(): Promise<CityRanking[]> {
  const cities = [
    { city: 'Delhi', country: 'India', flag: '🇮🇳', lat: 28.6139, lng: 77.2090 },
    { city: 'Lahore', country: 'Pakistan', flag: '🇵🇰', lat: 31.5204, lng: 74.3587 },
    { city: 'Dhaka', country: 'Bangladesh', flag: '🇧🇩', lat: 23.8103, lng: 90.4125 },
    { city: 'Kolkata', country: 'India', flag: '🇮🇳', lat: 22.5726, lng: 88.3639 },
    { city: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', lat: -6.2088, lng: 106.8456 },
    { city: 'Dubai', country: 'UAE', flag: '🇦🇪', lat: 25.2048, lng: 55.2708 },
    { city: 'Karachi', country: 'Pakistan', flag: '🇵🇰', lat: 24.8607, lng: 67.0011 },
    { city: 'Mumbai', country: 'India', flag: '🇮🇳', lat: 19.0760, lng: 72.8777 },
    { city: 'Cairo', country: 'Egypt', flag: '🇪🇬', lat: 30.0444, lng: 31.2357 },
    { city: 'Istanbul', country: 'Turkey', flag: '🇹🇷', lat: 41.0082, lng: 28.9784 },
  ]

  const results = await Promise.allSettled(
    cities.map(async (c) => {
      const res = await fetch(`${AQICN_BASE}/feed/geo:${c.lat};${c.lng}/?token=${AQICN_TOKEN}`)
      const data = await res.json()
      return { ...c, aqi: data.data?.aqi ?? 0 }
    })
  )

  const ranked = results
    .filter((r): r is PromiseFulfilledResult<CityRanking & { lat: number; lng: number }> => r.status === 'fulfilled')
    .map((r) => r.value)
    .sort((a, b) => b.aqi - a.aqi)

  return ranked.map((c, i) => ({ rank: i + 1, city: c.city, country: c.country, flag: c.flag, aqi: c.aqi }))
}

// Fetch proactive tip from Rio
export async function fetchTip(profile: string = 'citizen', aqi: number = 50): Promise<RioTip> {
  try {
    const res = await fetch(`/api/tips?profile=${profile}&aqi=${aqi}`)
    if (res.ok) return res.json()
  } catch {}
  // Fallback tip
  return {
    tip: 'Check air quality before heading out. Stay safe!',
    period: 'afternoon',
    aqiTier: 'moderate',
    aqi,
    profile,
    generatedAt: new Date().toISOString(),
  }
}

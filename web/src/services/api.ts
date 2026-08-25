import axios from 'axios'
import type { ZoneReading, ForecastPoint, Advisory, RouteSegment } from '../types/api'

const BASE = '/api'

const client = axios.create({
  baseURL: BASE,
  timeout: 10_000,
})

/** GET /current — live AQI for all monitored zones */
export async function fetchCurrentAqi(): Promise<ZoneReading[]> {
  const { data } = await client.get<ZoneReading[]>('/current')
  return data
}

/** GET /forecast/:zone — 24–72h forecast for a zone */
export async function fetchForecast(zone: string): Promise<ForecastPoint[]> {
  const { data } = await client.get<ForecastPoint[]>(`/forecast/${zone}`)
  return data
}

/** GET /advisory/:profile — plain-language advisory for user profile */
export async function fetchAdvisory(profile: string): Promise<Advisory> {
  const { data } = await client.get<Advisory>(`/advisory/${profile}`)
  return data
}

/** POST /route — route AQI colour strip + flood-risk flags */
export async function fetchRouteOverlay(
  origin: string,
  destination: string,
): Promise<RouteSegment[]> {
  const { data } = await client.post<RouteSegment[]>('/route', {
    origin,
    destination,
  })
  return data
}

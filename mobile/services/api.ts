import { AqiReading, ForecastPoint, Advisory, CityRanking, RouteResult } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchCurrentAqi(): Promise<{ zones: AqiReading[] }> {
  return apiFetch<{ zones: AqiReading[] }>('/current');
}

export async function fetchLahoreAqi(): Promise<AqiReading[]> {
  const res = await apiFetch<{ zones: AqiReading[] }>('/current');
  return res.zones ?? [];
}

export async function fetchForecast(zoneId: string): Promise<ForecastPoint[]> {
  return apiFetch<ForecastPoint[]>(`/forecast/${zoneId}`);
}

export async function fetchAdvisory(profile: string): Promise<Advisory> {
  return apiFetch<Advisory>(`/advisory/${profile}`);
}

export async function fetchExposure(zoneId: string): Promise<{ hours: { hour: number; aqi: number; pm25: number; pm10: number; o3: number; no2: number }[] }> {
  return apiFetch(`/exposure/${zoneId}`);
}

export async function fetchRankings(): Promise<CityRanking[]> {
  return apiFetch<CityRanking[]>('/rankings');
}

export async function fetchRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteResult> {
  return apiFetch<RouteResult>(
    `/route?start_lat=${startLat}&start_lng=${startLng}&end_lat=${endLat}&end_lng=${endLng}`
  );
}

export async function fetchTip(profile: string, aqi: number): Promise<{ tip: string; period: string; aqiTier: string }> {
  return apiFetch(`/tips?profile=${profile}&aqi=${aqi}`);
}

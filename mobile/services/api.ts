import { AqiReading, ForecastPoint, Advisory, CityRanking, RouteResult } from '../types';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchCurrentAqi(lat: number, lng: number): Promise<AqiReading> {
  return apiFetch<AqiReading>(`/current?lat=${lat}&lng=${lng}`);
}

export async function fetchForecast(lat: number, lng: number): Promise<ForecastPoint[]> {
  return apiFetch<ForecastPoint[]>(`/forecast?lat=${lat}&lng=${lng}`);
}

export async function fetchAdvisory(profile: string): Promise<Advisory> {
  return apiFetch<Advisory>(`/advisory/${profile}`);
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

export async function fetchLahoreAqi(): Promise<AqiReading[]> {
  return apiFetch<AqiReading[]>('/lahore-aqi');
}

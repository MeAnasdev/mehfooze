export interface AqiReading {
  stationId: string;
  name: string;
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  co: number;
  so2: number;
  updatedAt: string;
  lat: number;
  lng: number;
  temperature?: number;
  humidity?: number;
  wind_speed?: number;
  source?: string;
}

export interface ForecastPoint {
  hour: number;
  aqi: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

export interface RouteResult {
  distance: number;
  duration: number;
  steps: { instruction: string; distance: number; duration: number }[];
  coordinates: [number, number][];
}

export interface Advisory {
  profile: string;
  message: string;
  actions: string[];
  aqi: number;
  aqiCategory: string;
  aqiColour: string;
  generatedAt: string;
}

export interface CityRanking {
  rank: number;
  city: string;
  country: string;
  flag: string;
  aqi: number;
}

export type ProfileType = 'citizen' | 'parent' | 'patient' | 'worker';

export type TabRoute = 'home' | 'exposure' | 'map' | 'habits' | 'profile';

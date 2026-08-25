/** Live AQI reading for a single station / zone */
export interface ZoneReading {
  stationId: string
  name: string
  lat: number
  lng: number
  aqi: number
  updatedAt: string // ISO 8601
}

/** Single point in a 24–72h AQI forecast */
export interface ForecastPoint {
  hour: number  // hours from now (1, 2, … 72)
  aqi: number
}

/** Profile-specific plain-language advisory */
export interface Advisory {
  profile: string
  message: string
  actions: string[]
  generatedAt: string
}

/** Route segment with AQI overlay (Travel Mode) */
export interface RouteSegment {
  segmentId: string
  from: [number, number]
  to: [number, number]
  aqiEstimate: number
  floodRisk: boolean
  checklist: string[]
}

export function aqiColour(aqi: number): string {
  if (aqi <= 50) return '#22c55e'
  if (aqi <= 100) return '#eab308'
  if (aqi <= 150) return '#f97316'
  if (aqi <= 200) return '#ef4444'
  if (aqi <= 300) return '#a855f7'
  return '#7f1d1d'
}

export function aqiCategory(aqi: number): string {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

export function aqiLabel(aqi: number): string {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'USG'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

export function aqiAdvice(aqi: number): { message: string; actions: string[] } {
  if (aqi <= 50) return { message: 'Air quality is satisfactory. Enjoy outdoor activities!', actions: [] }
  if (aqi <= 100) return { message: 'Air quality is acceptable. Unusually sensitive people should limit prolonged outdoor exertion.', actions: ['Limit prolonged outdoor exertion'] }
  if (aqi <= 150) return { message: 'Members of sensitive groups may experience health effects. General public is less likely to be affected.', actions: ['Sensitive groups reduce outdoor exertion', 'Wear mask if outdoors', 'Keep windows closed'] }
  if (aqi <= 200) return { message: 'Everyone may begin to experience health effects. Sensitive groups may experience more serious effects.', actions: ['Avoid prolonged outdoor exertion', 'Wear N95 mask outdoors', 'Use air purifier indoors'] }
  if (aqi <= 300) return { message: 'Health alert: everyone may experience serious health effects.', actions: ['Avoid all outdoor exertion', 'Wear N95 mask if must go out', 'Keep windows and doors closed'] }
  return { message: 'Health emergency. The entire population is affected.', actions: ['Stay indoors', 'Seal windows and doors', 'Run air purifier on max'] }
}

interface City {
  rank: number
  city: string
  country: string
  flag: string
  aqi: number
}

interface CityRankingProps {
  cities: City[]
  loading?: boolean
}

function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#00e400'
  if (aqi <= 100) return '#ffff00'
  if (aqi <= 150) return '#ff7e00'
  if (aqi <= 200) return '#ff0000'
  if (aqi <= 300) return '#8f3f97'
  return '#7e0023'
}

export default function CityRanking({ cities, loading }: CityRankingProps) {
  if (loading) {
    return <div className="flex justify-center py-8"><div className="loading-spinner" /></div>
  }

  return (
    <div className="space-y-2" role="list" aria-label="City AQI rankings">
      <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-on-surface-variant">
        <span className="w-8">#</span>
        <span className="flex-1">MAJOR CITY</span>
        <span className="text-right">US AQI+</span>
      </div>
      {cities.map((city) => (
        <div key={city.rank} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-outline-variant" role="listitem">
          <span className="w-8 font-semibold text-on-surface">{city.rank}</span>
          <div className="flex items-center gap-3 flex-1">
            <span className="text-xl" aria-hidden="true">{city.flag}</span>
            <div>
              <p className="font-semibold text-on-surface text-sm">{city.city}</p>
              <p className="text-xs text-on-surface-variant">{city.country}</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg text-white font-bold text-sm" style={{ background: aqiColor(city.aqi) }}>
            {city.aqi}
          </span>
        </div>
      ))}
    </div>
  )
}

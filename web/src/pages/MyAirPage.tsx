import { useEffect, useState } from 'react'
import AqiMap, { Zone } from '../components/AqiMap'
import AdvisoryPanel from '../components/AdvisoryPanel'
import ForecastChart from '../components/ForecastChart'
import { useGeolocation } from '../hooks/useGeolocation'
import {
  fetchAqiByCoords,
  fetchForecast,
  fetchAdvisory,
  fetchTip,
  AqiReading,
  ForecastPoint,
  Advisory,
  RioTip,
} from '../services/api'
import { aqiColour, aqiCategory, aqiAdvice } from '../utils/aqi'

export default function MyAirPage() {
  const { lat, lng, locationName, loading: geoLoading } = useGeolocation()
  const [current, setCurrent] = useState<AqiReading | null>(null)
  const [forecast, setForecast] = useState<ForecastPoint[]>([])
  const [advisory, setAdvisory] = useState<Advisory | null>(null)
  const [tip, setTip] = useState<RioTip | null>(null)
  const [profile, setProfile] = useState('citizen')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (geoLoading) return
    setLoading(true)
    setError(null)

    fetchAqiByCoords(lat, lng)
      .then((data) => {
        setCurrent(data)
        return fetchForecast(lat, lng)
      })
      .then((data) => setForecast(data))
      .catch(() => setError('Could not load AQI data for your location'))
      .finally(() => setLoading(false))
  }, [lat, lng, geoLoading])

  useEffect(() => {
    if (!current) return
    fetchForecast(current.lat, current.lng).then(setForecast)
  }, [current?.lat, current?.lng])

  useEffect(() => {
    fetchAdvisory(profile).then(setAdvisory).catch(() => {})
  }, [profile])

  useEffect(() => {
    if (!current) return
    fetchTip(profile, current.aqi).then(setTip).catch(() => {})
  }, [current?.aqi, profile])

  const mapZones: Zone[] = current
    ? [{ name: current.name, lat: current.lat, lng: current.lng, aqi: current.aqi }]
    : []

  const now = new Date()

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-[10px] text-tertiary uppercase tracking-wider mb-0.5 font-semibold">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}{' '}
            &middot; {geoLoading ? '...' : locationName}
          </p>
          <h2 className="text-xl sm:text-2xl text-on-surface font-bold leading-tight">
            Your air, at a glance.
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Know what's ahead before you step outside.
          </p>
        </div>
      </div>

      {(loading || geoLoading) && (
        <div className="flex items-center justify-center h-40">
          <div className="loading-spinner" />
        </div>
      )}

      {error && (
        <div className="p-3 bg-error-container border border-error rounded-lg text-on-error-container text-xs flex items-start gap-2">
          <span className="material-symbols-outlined text-error text-sm mt-0.5">warning</span>
          <div>
            <h4 className="font-semibold text-on-error-container text-xs">Data Unavailable</h4>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Hazard Banner */}
      {!loading && current && current.aqi > 150 && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-xl text-xs flex items-start gap-2.5">
          <span className="material-symbols-outlined text-error text-base mt-0.5">warning</span>
          <div className="flex-1">
            <h4 className="font-bold text-on-surface text-xs">
              Hazard: Air quality is {aqiCategory(current.aqi)}
            </h4>
            <p className="text-on-surface-variant mt-0.5">
              Limit outdoor activity. Wear an N95 mask if you must go outside.
            </p>
          </div>
          <span
            className="inline-block px-2 py-0.5 rounded-full text-white text-[10px] font-bold shrink-0"
            style={{ background: aqiColour(current.aqi) }}
          >
            AQI {Math.round(current.aqi)}
          </span>
        </div>
      )}

      {/* Should I Go Outside? */}
      {!loading && current && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${aqiColour(current.aqi)}20` }}
            >
              <span className="material-symbols-outlined text-lg" style={{ color: aqiColour(current.aqi) }}>
                {current.aqi <= 50 ? 'check_circle' : current.aqi <= 100 ? 'info' : current.aqi <= 150 ? 'schedule' : 'block'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-on-surface">
                {current.aqi <= 50
                  ? 'Yes, enjoy the outdoors!'
                  : current.aqi <= 100
                    ? 'Okay for most people'
                    : current.aqi <= 150
                      ? 'Consider staying in'
                      : 'Stay indoors if possible'}
              </h3>
              <p className="text-[11px] text-on-surface-variant mt-0.5 leading-relaxed">
                {aqiAdvice(current.aqi).message}
              </p>
            </div>
            <span
              className="text-2xl font-bold shrink-0"
              style={{ color: aqiColour(current.aqi) }}
            >
              {Math.round(current.aqi)}
            </span>
          </div>
        </div>
      )}

      {/* Rio Proactive Tip */}
      {!loading && tip && (
        <div className="bg-primary-container/10 border border-primary-container/30 rounded-xl p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
            <img src="/ghost-logo.png" alt="Rio" className="w-5 h-5 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-primary uppercase tracking-wider font-bold mb-0.5">Rio says</p>
            <p className="text-xs text-on-surface leading-relaxed">{tip.tip}</p>
          </div>
        </div>
      )}

      {!loading && current && (
        <>
          {/* Top Row: Weather + AQI Dial */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
            {/* Weather Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-ambient flex flex-col sm:flex-row">
              <div className="flex-1 p-4 bg-primary-container/5 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -right-2 -top-2 opacity-[0.07]">
                  <span className="material-symbols-outlined text-[80px]">sunny</span>
                </div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-marker" />
                    <span className="text-[9px] text-primary uppercase tracking-widest font-bold">
                      {aqiCategory(current.aqi)}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl text-on-surface font-semibold leading-snug mb-1.5">
                    A little care goes a long way.
                  </h3>
                  <p className="text-[11px] sm:text-xs text-on-surface-variant leading-relaxed max-w-md">
                    The air is mostly comfortable today. If you're sensitive to pollution, keep your
                    outdoor plans light around 4pm.
                  </p>
                  <a
                    href="/exposure"
                    className="inline-flex items-center gap-1 mt-2.5 text-primary text-xs font-semibold hover:underline"
                  >
                    View your exposure{' '}
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </a>
                </div>
              </div>
              <div className="w-full sm:w-44 lg:w-48 p-4 bg-surface-container-lowest flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-3 sm:gap-2 border-t sm:border-t-0 sm:border-l border-outline-variant/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-2xl">partly_cloudy_day</span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant">Feels like</p>
                    <p className="text-sm font-semibold text-on-surface">
                      {current.temperature ? `${Math.round(current.temperature + 2)}°C` : '--°C'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 text-[10px] text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">humidity_percentage</span>
                    {current.humidity ? `${Math.round(current.humidity)}%` : '--%'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">air</span>
                    {current.wind_speed ? `${Math.round(current.wind_speed)}` : '--'} km/h
                  </span>
                </div>
              </div>
            </div>

            {/* AQI Dial Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient flex flex-col items-center justify-center relative">
              <div className="absolute top-3 right-3 flex items-center gap-1 text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-marker" />
                <span className="text-[9px] font-bold">Live</span>
              </div>
              <p className="text-[9px] text-tertiary uppercase tracking-wider mb-3 w-full text-left font-semibold">
                Your Current Score
              </p>
              <div className="relative w-32 h-32 lg:w-36 lg:h-36 rounded-full flex items-center justify-center mb-3">
                <div className="absolute inset-0 rounded-full border-[10px] border-surface-variant" />
                <div
                  className="absolute inset-0 rounded-full border-[10px] border-transparent"
                  style={{
                    borderTopColor: aqiColour(current.aqi),
                    borderRightColor: aqiColour(current.aqi),
                    transform: 'rotate(45deg)',
                  }}
                />
                <div className="text-center z-10">
                  <div className="text-3xl lg:text-4xl text-on-surface leading-none font-bold">
                    {current.aqi}
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-0.5">Average AQI</div>
                </div>
              </div>
              <div className="w-full flex items-center justify-between pt-2.5 border-t border-outline-variant/30">
                <span className="text-[9px] text-tertiary">
                  Updated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
                <span className="text-[9px] text-primary font-semibold flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">trending_up</span> 12% better
                </span>
              </div>
            </div>
          </div>

          {/* Second Row: Forecast + Exposure Snapshot */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
            {/* Forecast Chart */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[9px] text-tertiary uppercase tracking-wider mb-0.5 font-semibold">
                    The Next 24 Hours
                  </p>
                  <h3 className="text-xs text-on-surface font-semibold">Plan around the air</h3>
                </div>
                <div className="flex bg-surface-container-low rounded-full p-0.5 border border-outline-variant/30">
                  <button className="px-2.5 py-1 rounded-full bg-surface-container-lowest shadow-sm text-[10px] font-medium text-on-surface">
                    All areas
                  </button>
                  <button className="px-2.5 py-1 rounded-full text-[10px] text-on-surface-variant hover:text-primary transition-colors">
                    Home
                  </button>
                  <button className="px-2.5 py-1 rounded-full text-[10px] text-on-surface-variant hover:text-primary transition-colors">
                    Work
                  </button>
                </div>
              </div>
              <ForecastChart data={forecast} zone={current.name} />
            </div>

            {/* Exposure Snapshot */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[9px] text-tertiary uppercase tracking-wider font-semibold">
                    Exposure Budget
                  </p>
                  <span className="material-symbols-outlined text-tertiary text-sm">file_copy</span>
                </div>
                <h3 className="text-xs text-on-surface font-semibold mb-1">
                  40% of today's safe limit reached
                </h3>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  Based on your activity and local sensors, you have moderate exposure remaining.
                </p>
              </div>
              <div className="mt-3">
                <div className="w-full bg-surface-variant rounded-full h-1.5 mb-2.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '40%' }} />
                </div>
                <a
                  className="text-primary text-[10px] font-semibold flex items-center gap-0.5 hover:underline"
                  href="/exposure"
                >
                  View Full Tracker{' '}
                  <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>

          {/* Map Preview */}
          <AqiMap
            zones={mapZones}
            center={[current.lat, current.lng]}
            height="28vh"
          />

          {/* Advisory */}
          <AdvisoryPanel advisory={advisory} profile={profile} onProfileChange={setProfile} />
        </>
      )}
    </div>
  )
}

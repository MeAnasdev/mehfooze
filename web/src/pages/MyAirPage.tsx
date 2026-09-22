import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AqiMap, { Zone } from '../components/AqiMap'
import ForecastChart from '../components/ForecastChart'
import AqiSlideshow from '../components/AqiSlideshow'
import WeatherFeatureCard from '../components/WeatherFeatureCard'
import { useAqi } from '../contexts/AqiContext'
import { aqiColour, aqiCategory, aqiAdvice } from '../utils/aqi'
import {
  API_BASE, fetchAttribution, SourceAttribution,
  fetchFlood, FloodOverview,
  fetchCurrentFromBackend, AqiReading,
} from '../services/api'

interface ExposureSummary {
  averageAqi: number
  peakAqi: number
  totalHours: number
}

function freshness(iso?: string): { label: string; stale: boolean } {
  if (!iso) return { label: 'just now', stale: false }
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return { label: 'just now', stale: false }
  if (mins < 60) return { label: `${mins} min ago`, stale: mins > 15 }
  return { label: `${Math.round(mins / 60)}h ago`, stale: true }
}

function whatToDo(aqi: number): { title: string; icon: string } {
  if (aqi <= 50)  return { title: 'Great day to be outside', icon: 'sentiment_very_satisfied' }
  if (aqi <= 100) return { title: 'Fine for most people', icon: 'sentiment_satisfied' }
  if (aqi <= 150) return { title: 'Sensitive groups take care', icon: 'sentiment_neutral' }
  if (aqi <= 200) return { title: 'Limit time outdoors', icon: 'masks' }
  if (aqi <= 300) return { title: 'Stay indoors if you can', icon: 'home' }
  return { title: 'Avoid going outside', icon: 'dangerous' }
}

export default function MyAirPage() {
  const navigate = useNavigate()
  const { current, forecast, tip, loading, error, locationName } = useAqi()
  const [exposure, setExposure] = useState<ExposureSummary | null>(null)
  const [attribution, setAttribution] = useState<SourceAttribution | null>(null)
  const [flood, setFlood] = useState<FloodOverview | null>(null)
  const [allZones, setAllZones] = useState<AqiReading[]>([])

  useEffect(() => {
    if (!current?.stationId) return
    fetch(`${API_BASE}/api/exposure/${current.stationId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setExposure({ averageAqi: d.averageAqi ?? 0, peakAqi: d.peakAqi ?? 0, totalHours: d.totalHours ?? 0 }))
      .catch(() => setExposure(null))
    fetchAttribution(current.stationId).then(setAttribution).catch(() => setAttribution(null))
  }, [current?.stationId])

  useEffect(() => { fetchFlood().then(setFlood).catch(() => setFlood(null)) }, [])
  useEffect(() => { fetchCurrentFromBackend().then(setAllZones).catch(() => setAllZones([])) }, [])

  const now = new Date()
  const aqi = current?.aqi ?? 0
  const colour = aqiColour(aqi)
  const category = aqiCategory(aqi)
  const action = whatToDo(aqi)
  const mapZones: Zone[] = current ? [{ name: current.name, lat: current.lat, lng: current.lng, aqi: current.aqi }] : []
  const exposurePct = exposure ? Math.min(Math.round((exposure.averageAqi / 50) * 100), 200) : 0

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div>
        <p className="text-[10px] text-tertiary uppercase tracking-wider mb-0.5 font-semibold">
          {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {locationName || 'Lahore'}
        </p>
        <h2 className="text-xl sm:text-2xl text-on-surface font-bold leading-tight">Your air, at a glance.</h2>
      </div>

      {loading && <div className="flex items-center justify-center h-40"><div className="loading-spinner" /></div>}

      {error && (
        <div className="p-3 bg-error-container border border-error rounded-lg text-on-error-container text-xs flex items-start gap-2">
          <span className="material-symbols-outlined text-error text-sm mt-0.5">warning</span>
          <div><h4 className="font-semibold text-xs">Data Unavailable</h4><p className="mt-0.5">{error}</p></div>
        </div>
      )}

      {!loading && current && (
        <>
          {/* ── HERO: big AQI + what to do ─────────────────────────── */}
          <div className="rounded-2xl overflow-hidden shadow-ambient border border-outline-variant">
            <div className="p-5 flex items-center gap-4" style={{ background: `linear-gradient(135deg, ${colour}22, ${colour}08)` }}>
              <div className="relative w-24 h-24 shrink-0 rounded-full flex items-center justify-center" style={{ background: `${colour}18` }}>
                <div className="text-center">
                  <div className="text-3xl font-bold leading-none" style={{ color: colour }}>{Math.round(aqi)}</div>
                  <div className="text-[8px] text-on-surface-variant mt-0.5 uppercase tracking-wide">AQI</div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <span className="inline-block px-2 py-0.5 rounded-full text-white text-[10px] font-bold mb-1" style={{ background: colour }}>
                  {category}
                </span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl" style={{ color: colour }}>{action.icon}</span>
                  <h3 className="text-base font-bold text-on-surface leading-tight">{action.title}</h3>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">{aqiAdvice(aqi).message}</p>
              </div>
            </div>
            {/* freshness + source strip */}
            <div className="px-4 py-2 bg-surface-container-lowest flex items-center justify-between text-[9px] border-t border-outline-variant/50">
              <span className={freshness(current.updatedAt).stale ? 'text-error font-semibold' : 'text-tertiary'}>
                {freshness(current.updatedAt).stale ? '⚠ ' : ''}Updated {freshness(current.updatedAt).label}
              </span>
              <span className="text-outline truncate max-w-[60%]" title={current.source}>{current.source}</span>
            </div>
          </div>

          {/* ── Featured weather card ──────────────────────────────── */}
          <WeatherFeatureCard reading={current} locationName={locationName} />

          {/* ── Rain / variance context banners ────────────────────── */}
          {current.raining && (
            <div className="p-2.5 bg-secondary/10 border border-secondary/30 rounded-xl text-[11px] flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">rainy</span>
              <span className="text-on-surface-variant"><b className="text-on-surface">Rain is clearing the air.</b> This reading reflects current, improving conditions.</span>
            </div>
          )}

          {/* ── Quick stat tiles ───────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-tertiary text-sm">masks</span>
                <span className="text-[9px] text-tertiary uppercase tracking-wider font-semibold">PM2.5</span>
              </div>
              <div className="text-lg font-bold text-on-surface">{Math.round(current.pm25)} <span className="text-[9px] text-on-surface-variant font-normal">µg/m³</span></div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-amber-500 text-sm">device_thermostat</span>
                <span className="text-[9px] text-tertiary uppercase tracking-wider font-semibold">Temp</span>
              </div>
              <div className="text-lg font-bold text-on-surface">{Math.round(current.temperature ?? 0)}°<span className="text-[9px] text-on-surface-variant font-normal">C</span></div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-secondary text-sm">air</span>
                <span className="text-[9px] text-tertiary uppercase tracking-wider font-semibold">Wind</span>
              </div>
              <div className="text-lg font-bold text-on-surface">{Math.round(current.wind_speed ?? 0)} <span className="text-[9px] text-on-surface-variant font-normal">km/h</span></div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-primary text-sm">water_drop</span>
                <span className="text-[9px] text-tertiary uppercase tracking-wider font-semibold">Humidity</span>
              </div>
              <div className="text-lg font-bold text-on-surface">{Math.round(current.humidity ?? 0)}<span className="text-[9px] text-on-surface-variant font-normal">%</span></div>
            </div>
          </div>

          {/* ── AQI slideshow across zones ─────────────────────────── */}
          {allZones.length > 0 && <AqiSlideshow zones={allZones} />}

          {/* ── Rio tip ─────────────────────────────────────────────── */}
          {tip && (
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

          {/* ── Likely source (attribution) ─────────────────────────── */}
          {attribution && attribution.attributed && attribution.source && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-tertiary/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-tertiary text-lg">factory</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10px] text-tertiary uppercase tracking-wider font-bold">Likely Source</p>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${attribution.confidence === 'likely' ? 'bg-amber-100 text-amber-700' : 'bg-tertiary/15 text-tertiary'}`}>
                    {attribution.confidence === 'likely' ? 'Likely' : 'Possible'}
                  </span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">{attribution.message}</p>
                <p className="text-[9px] text-outline mt-1">Source data: {attribution.attributionSource}</p>
              </div>
            </div>
          )}

          {/* ── Report CTA ──────────────────────────────────────────── */}
          <button onClick={() => navigate('/report')} className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-primary text-on-primary shadow-ambient hover:opacity-95 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">report</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-sm font-bold leading-tight">See pollution? Report it.</h4>
              <p className="text-[11px] opacity-90 leading-tight">Turn what you see into evidence the authorities can act on.</p>
            </div>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>

          {/* ── Forecast + Exposure ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient">
              <div className="mb-3">
                <p className="text-[9px] text-tertiary uppercase tracking-wider mb-0.5 font-semibold">The Next 24 Hours</p>
                <h3 className="text-xs text-on-surface font-semibold">Plan around the air</h3>
              </div>
              <ForecastChart data={forecast} zone={current.name} />
            </div>

            <button onClick={() => navigate('/exposure')} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient flex flex-col justify-between text-left hover:border-primary transition-colors">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[9px] text-tertiary uppercase tracking-wider font-semibold">Today's Exposure</p>
                  <span className="material-symbols-outlined text-tertiary text-sm">monitoring</span>
                </div>
                <div className="text-2xl font-bold text-on-surface mb-1">{exposure ? `${exposurePct}%` : '—'}</div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  {exposure ? `of WHO daily limit · avg AQI ${Math.round(exposure.averageAqi)} over ${exposure.totalHours}h` : 'Loading your zone exposure…'}
                </p>
              </div>
              <div className="mt-3">
                <div className="w-full bg-surface-variant rounded-full h-1.5 mb-2">
                  <div className="bg-primary h-1.5 rounded-full transition-all duration-700" style={{ width: `${exposure ? Math.min(exposurePct, 100) : 0}%` }} />
                </div>
                <span className="text-primary text-[10px] font-semibold flex items-center gap-0.5">
                  View full tracker <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </span>
              </div>
            </button>
          </div>

          {/* ── Live map ────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-tertiary uppercase tracking-wider font-semibold">Live City Map</p>
              <button onClick={() => navigate('/map')} className="text-primary text-[10px] font-semibold flex items-center gap-0.5">
                Full map <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
              </button>
            </div>
            <AqiMap zones={mapZones} center={[current.lat, current.lng]} height="26vh" />
          </div>

          {/* ── Flood snapshot ──────────────────────────────────────── */}
          {flood && (
            <button onClick={() => navigate('/flood')} className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient text-left hover:border-secondary transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">water</span>
                  <h3 className="text-sm font-bold text-on-surface">River & Flood Status</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${flood.anyFloodRisk ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
                  {flood.anyFloodRisk ? 'Elevated' : 'Normal'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {flood.rivers.map((r) => (
                  <span key={r.id} className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container/50 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.status.color }} />
                    <span className="font-medium text-on-surface">{r.name}</span>
                    <span className="text-on-surface-variant">{r.status.label}</span>
                  </span>
                ))}
              </div>
            </button>
          )}

          {/* ── Quick links ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Safe Habits', icon: 'health_and_safety', to: '/habits' },
              { label: 'City Map', icon: 'map', to: '/map' },
              { label: 'My Reports', icon: 'assignment', to: '/my-reports' },
              { label: 'Profile', icon: 'person', to: '/profile' },
            ].map((q) => (
              <button key={q.to} onClick={() => navigate(q.to)} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 flex flex-col items-center gap-1.5 hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-primary text-xl">{q.icon}</span>
                <span className="text-[11px] font-medium text-on-surface">{q.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

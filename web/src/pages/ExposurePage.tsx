import { useState, useMemo, useEffect } from 'react'
import { API_BASE } from '../services/api'

interface HourData {
  hour: number
  aqi: number
  pm25: number
  pm10: number
  o3: number
  no2: number
  location: 'home' | 'work' | 'outdoor'
}

interface PollutantInfo {
  key: string
  label: string
  unit: string
  whoLimit: number
  color: string
}

const pollutants: PollutantInfo[] = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', whoLimit: 15, color: 'bg-primary' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³', whoLimit: 45, color: 'bg-inverse-primary' },
  { key: 'o3', label: 'O₃', unit: 'µg/m³', whoLimit: 100, color: 'bg-tertiary' },
  { key: 'no2', label: 'NO₂', unit: 'µg/m³', whoLimit: 25, color: 'bg-error' },
]

function generateMockData(): HourData[] {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    aqi: Math.round(40 + Math.sin(i / 3.8) * 50 + Math.random() * 30),
    pm25: +(8 + Math.sin(i / 3.8) * 10 + Math.random() * 5).toFixed(1),
    pm10: +(15 + Math.sin(i / 4) * 15 + Math.random() * 8).toFixed(1),
    o3: +(30 + Math.sin(i / 5) * 25 + Math.random() * 10).toFixed(1),
    no2: +(10 + Math.sin(i / 3) * 8 + Math.random() * 4).toFixed(1),
    location: i >= 9 && i <= 17 ? 'work' : i >= 6 && i <= 20 ? 'outdoor' : 'home',
  }))
}

const locationTypes = [
  { id: 'home' as const, label: 'Home', icon: 'home' },
  { id: 'work' as const, label: 'Work', icon: 'work' },
  { id: 'outdoor' as const, label: 'Outdoor', icon: 'park' },
  { id: 'other' as const, label: 'Other...', icon: 'place' },
]

export default function ExposurePage() {
  const [activeLocation, setActiveLocation] = useState<'home' | 'work' | 'outdoor' | 'other'>('home')
  const [data, setData] = useState<HourData[]>([])

  useEffect(() => {
    fetch(`${API_BASE}/api/exposure/gulberg`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => {
        const mapped: HourData[] = (res.hours ?? []).map((h: { hour: number; aqi: number; pm25?: number; pm10?: number; o3?: number; no2?: number }) => ({
          hour: h.hour,
          aqi: h.aqi,
          pm25: h.pm25 ?? 0,
          pm10: h.pm10 ?? 0,
          o3: h.o3 ?? 0,
          no2: h.no2 ?? 0,
          location:
            h.hour >= 9 && h.hour <= 17
              ? 'work'
              : h.hour >= 6 && h.hour <= 20
                ? 'outdoor'
                : 'home',
        }))
        setData(mapped.length > 0 ? mapped : generateMockData())
      })
      .catch(() => setData(generateMockData()))
  }, [])

  const filtered = useMemo(
    () => (activeLocation === 'other' ? data : data.filter((d) => d.location === activeLocation)),
    [activeLocation, data]
  )

  const avgAqi = useMemo(() => {
    if (!filtered.length) return 0
    return Math.round(filtered.reduce((s, d) => s + d.aqi, 0) / filtered.length)
  }, [filtered])

  const pollutantAverages = useMemo(() => {
    if (!filtered.length) return { pm25: 0, pm10: 0, o3: 0, no2: 0 }
    const sum = filtered.reduce(
      (acc, d) => ({
        pm25: acc.pm25 + d.pm25,
        pm10: acc.pm10 + d.pm10,
        o3: acc.o3 + d.o3,
        no2: acc.no2 + d.no2,
      }),
      { pm25: 0, pm10: 0, o3: 0, no2: 0 }
    )
    const n = filtered.length
    return {
      pm25: +(sum.pm25 / n).toFixed(1),
      pm10: +(sum.pm10 / n).toFixed(1),
      o3: +(sum.o3 / n).toFixed(1),
      no2: +(sum.no2 / n).toFixed(1),
    }
  }, [filtered])

  const safeLimitPercent = Math.min(Math.round((avgAqi / 150) * 100), 100)

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="mb-2">
        <div className="text-[9px] sm:text-[10px] text-outline font-bold uppercase tracking-widest mb-0.5">
          Exposure Tracking &bull; Today
        </div>
        <h2 className="text-lg sm:text-xl text-on-background font-bold">
          Understand your intake.
        </h2>
        <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 max-w-2xl">
          Monitor your cumulative exposure to airborne pollutants throughout the day based on your
          locations.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Main Exposure Score */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant p-4 sm:p-6 shadow-ambient flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4 sm:mb-6">
            <div>
              <h3 className="text-sm sm:text-base text-on-background font-semibold mb-1">
                Today's Exposure
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Compared to WHO 24h guidelines
              </p>
            </div>
            <div className="bg-primary-container/20 text-primary px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs flex items-center gap-1 font-medium">
              <span className="material-symbols-outlined text-[12px] sm:text-[14px]">check_circle</span>{' '}
              On Track
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8 py-3 sm:py-4">
            {/* Dial */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 flex-shrink-0">
              <div className="absolute inset-0 dial-gradient" />
              <div className="absolute inset-2 sm:inset-3 bg-surface-container-lowest rounded-full flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl lg:text-4xl text-on-background font-bold">
                  {safeLimitPercent}
                  <span className="text-base sm:text-lg text-outline">%</span>
                </span>
                <span className="text-[10px] sm:text-xs text-on-surface-variant mt-0.5">
                  of safe limit
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-1 w-full space-y-2.5 sm:space-y-3">
              {pollutants.map((p) => {
                const avg = pollutantAverages[p.key as keyof typeof pollutantAverages]
                const pct = Math.min(Math.round((avg / p.whoLimit) * 100), 100)
                return (
                  <div key={p.key}>
                    <div className="flex justify-between text-[10px] sm:text-xs mb-1">
                      <span className="text-on-surface-variant">{p.label}</span>
                      <span className="font-bold text-on-background">
                        {avg} {p.unit}{' '}
                        <span className="text-outline font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-high rounded-full h-1.5 sm:h-2">
                      <div
                        className={`${p.color} h-1.5 sm:h-2 rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              <div className="bg-surface-container p-3 sm:p-4 rounded-lg flex items-start gap-2 sm:gap-3 mt-3 sm:mt-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                  <img src="/ghost-logo.png" alt="Rio" className="w-4 h-4 sm:w-5 sm:h-5 object-contain" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-on-background mb-0.5">
                    Rio says
                  </p>
                  <p className="text-[11px] sm:text-xs sm:text-sm text-on-surface-variant">
                    You're doing great today. Staying indoors during the 2PM spike really kept your
                    exposure low.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Logger */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant p-4 sm:p-6 shadow-ambient flex flex-col">
          <h3 className="text-sm sm:text-base text-on-background font-semibold mb-3 sm:mb-4">
            Current Location
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant mb-4 sm:mb-6">
            Log your location to improve exposure estimates.
          </p>
          <div className="flex flex-col gap-2 sm:gap-3 flex-1">
            {locationTypes.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setActiveLocation(loc.id)}
                className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border transition-colors text-sm ${
                  activeLocation === loc.id
                    ? 'border-2 border-primary bg-primary-container/10 text-primary'
                    : 'border border-outline-variant bg-surface hover:bg-surface-container-high text-on-surface-variant'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-lg ${
                    activeLocation === loc.id ? 'fill' : ''
                  }`}
                >
                  {loc.icon}
                </span>
                <span className={`font-medium ${activeLocation === loc.id ? 'font-bold' : ''}`}>
                  {loc.label}
                </span>
                {activeLocation === loc.id && (
                  <span className="w-2.5 h-2.5 bg-primary rounded-full ml-auto animate-pulse-marker" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Zone Breakdown */}
        <div className="md:col-span-4 bg-surface-container-lowest rounded-xl border border-outline-variant p-4 sm:p-6 shadow-ambient">
          <h3 className="text-sm sm:text-base text-on-background font-semibold mb-3 sm:mb-4">
            Exposure by Zone
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-base">home</span>
                <span className="text-xs sm:text-sm">Home (12h)</span>
              </div>
              <span className="font-bold text-on-background text-sm">40%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-base">work</span>
                <span className="text-xs sm:text-sm">Work (8h)</span>
              </div>
              <span className="font-bold text-on-background text-sm">35%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-base">park</span>
                <span className="text-xs sm:text-sm">Outdoor (1h)</span>
              </div>
              <span className="font-bold text-error text-sm">25%</span>
            </div>
          </div>
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-outline-variant">
            <div className="h-3 sm:h-4 w-full flex rounded-full overflow-hidden">
              <div className="bg-primary" style={{ width: '40%' }} />
              <div className="bg-secondary-container" style={{ width: '35%' }} />
              <div className="bg-error" style={{ width: '25%' }} />
            </div>
          </div>
        </div>

        {/* 7-Day Trend */}
        <div className="md:col-span-8 bg-surface-container-lowest rounded-xl border border-outline-variant p-4 sm:p-6 shadow-ambient flex flex-col">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-sm sm:text-base text-on-background font-semibold">7-Day Trend</h3>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs">
              <span className="flex items-center gap-1 text-on-surface-variant">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" /> You
              </span>
              <span className="flex items-center gap-1 text-outline ml-1 sm:ml-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-outline border-dashed" />{' '}
                WHO
              </span>
            </div>
          </div>
          {/* Bar Chart */}
          <div className="flex-1 relative min-h-[120px] sm:min-h-[160px] flex items-end justify-between px-1 sm:px-2 pb-5 sm:pb-6 border-b border-outline-variant/30">
            <div className="absolute top-1/4 left-0 w-full border-t border-dashed border-outline-variant/60 z-0" />
            {[
              { day: 'Mon', height: '60%', color: 'bg-primary' },
              { day: 'Tue', height: '45%', color: 'bg-primary' },
              { day: 'Wed', height: '85%', color: 'bg-error-container' },
              { day: 'Thu', height: '50%', color: 'bg-primary' },
              { day: 'Fri', height: '40%', color: 'bg-primary' },
              { day: 'Sat', height: '30%', color: 'bg-primary' },
              { day: 'Today', height: '55%', color: 'bg-primary', bold: true },
            ].map((d, i) => (
              <div
                key={i}
                className="flex flex-col items-center z-10 gap-1.5 sm:gap-2 h-full justify-end"
                style={{ height: d.height }}
              >
                <div
                  className={`w-5 sm:w-6 lg:w-8 ${d.color} rounded-t-sm w-full h-full opacity-80 hover:opacity-100 transition-opacity`}
                />
                <span
                  className={`text-[9px] sm:text-[10px] sm:text-xs ${
                    d.bold ? 'text-primary font-bold' : 'text-on-surface-variant'
                  } absolute -bottom-4 sm:-bottom-5`}
                >
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center py-3 sm:py-4 text-outline text-[10px] sm:text-xs">
        <span className="material-symbols-outlined text-[12px] align-middle mr-1">info</span>{' '}
        Estimated from your saved zones and reported time &mdash; not a medical-grade measurement.
      </div>
    </div>
  )
}

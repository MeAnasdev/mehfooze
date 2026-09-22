import { useRef } from 'react'
import { AqiReading } from '../services/api'
import { aqiColour, aqiCategory } from '../utils/aqi'

/**
 * Horizontal scrollable AQI slideshow — one card per Lahore zone.
 * Styled after the PMD "Latest Weather Information" row, but AQI-focused:
 * each card shows the zone, a weather-style icon, AQI value, category,
 * and PM2.5 + temperature sub-stats.
 */

function weatherIcon(temp: number, humidity: number, raining: boolean): { icon: string; color: string; label: string } {
  if (raining) return { icon: 'rainy', color: '#0054cd', label: 'Rain' }
  if (humidity > 80) return { icon: 'foggy', color: '#6c7a70', label: 'Foggy' }
  if (temp >= 38) return { icon: 'sunny', color: '#ff7e00', label: 'Sunny & Hot' }
  if (temp >= 30) return { icon: 'partly_cloudy_day', color: '#ffb300', label: 'Warm' }
  if (temp <= 15) return { icon: 'ac_unit', color: '#0054cd', label: 'Cool' }
  return { icon: 'partly_cloudy_day', color: '#ffb300', label: 'Partly Cloudy' }
}

export default function AqiSlideshow({ zones }: { zones: AqiReading[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' })
  }

  if (!zones.length) return null

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 sm:p-4 shadow-ambient">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-secondary text-base">travel_explore</span>
          <h3 className="text-xs sm:text-sm font-semibold text-on-surface uppercase tracking-wide">
            Latest AQI Across Lahore
          </h3>
        </div>
        <div className="hidden sm:flex gap-1">
          <button onClick={() => scroll('left')} className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_left</span>
          </button>
          <button onClick={() => scroll('right')} className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">chevron_right</span>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto pb-1 snap-x scrollbar-thin" style={{ scrollbarWidth: 'thin' }}>
        {zones.map((z) => {
          const colour = aqiColour(z.aqi)
          const wx = weatherIcon(z.temperature ?? 0, z.humidity ?? 0, z.raining ?? false)
          return (
            <div
              key={z.stationId}
              className="snap-start shrink-0 w-[150px] rounded-xl border border-outline-variant/60 p-3 flex flex-col items-center text-center"
              style={{ background: `linear-gradient(160deg, ${colour}14, transparent)` }}
            >
              <p className="text-[10px] font-bold text-on-surface uppercase tracking-wide truncate w-full">{z.name}</p>
              <span className="material-symbols-outlined text-3xl my-1" style={{ color: colour }}>{wx.icon}</span>
              <div className="text-2xl font-bold leading-none" style={{ color: colour }}>{Math.round(z.aqi)}</div>
              <p className="text-[9px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: colour }}>
                {aqiCategory(z.aqi)}
              </p>
              <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-outline-variant/40">
                <div className="text-left">
                  <p className="text-[10px] font-bold text-on-surface">{Math.round(z.pm25)}</p>
                  <p className="text-[8px] text-on-surface-variant uppercase">PM2.5</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-on-surface">{Math.round(z.temperature ?? 0)}°</p>
                  <p className="text-[8px] text-on-surface-variant uppercase">Temp</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

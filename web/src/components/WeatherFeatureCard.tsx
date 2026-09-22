import { AqiReading } from '../services/api'

/**
 * Featured weather card — dark hero styled after the PMD weather panel.
 * Shows the user's location, current temperature + condition, and a
 * Max/Min · Rain · Humidity · Wind stat grid.
 */

function condition(temp: number, humidity: number, raining: boolean): { icon: string; label: string; color: string } {
  if (raining) return { icon: 'rainy', label: 'Rainy', color: '#7cc4ff' }
  if (humidity > 80) return { icon: 'foggy', label: 'Foggy', color: '#b9c4bd' }
  if (temp >= 38) return { icon: 'sunny', label: 'Sunny & Hot', color: '#ffd166' }
  if (temp >= 30) return { icon: 'partly_cloudy_day', label: 'Warm', color: '#ffd166' }
  if (temp <= 15) return { icon: 'ac_unit', label: 'Cool', color: '#7cc4ff' }
  return { icon: 'partly_cloudy_day', label: 'Partly Cloudy', color: '#ffd166' }
}

export default function WeatherFeatureCard({ reading, locationName }: { reading: AqiReading; locationName: string }) {
  const temp = reading.temperature ?? 0
  const humidity = reading.humidity ?? 0
  const wind = reading.wind_speed ?? 0
  const raining = reading.raining ?? false
  const precip = reading.precipitation ?? 0
  const cond = condition(temp, humidity, raining)

  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <div className="rounded-2xl bg-inverse-surface text-inverse-on-surface p-5 relative overflow-hidden shadow-ambient">
      {/* subtle glow */}
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-20 blur-2xl" style={{ background: cond.color }} />

      <div className="relative z-10">
        {/* Location */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10">
            <span className="material-symbols-outlined text-sm text-secondary-fixed">location_on</span>
            <span className="text-sm font-semibold">{locationName || 'Lahore'}</span>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 opacity-80">Punjab</span>
        </div>

        {/* Temp + condition */}
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-5xl" style={{ color: cond.color }}>{cond.icon}</span>
          <div>
            <div className="flex items-start">
              <span className="text-4xl font-bold leading-none">{temp.toFixed(1)}</span>
              <span className="text-sm mt-1">°C</span>
            </div>
            <p className="text-xs opacity-80 mt-1">{cond.label}</p>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-px bg-white/10 rounded-lg overflow-hidden">
          <div className="bg-inverse-surface p-2.5">
            <div className="flex items-center gap-1 text-[9px] opacity-60 uppercase tracking-wide mb-0.5">
              <span className="material-symbols-outlined text-[12px]">device_thermostat</span> Max / Min
            </div>
            <p className="text-xs font-semibold">{Math.round(temp + 2)}° / {Math.round(temp - 6)}°</p>
          </div>
          <div className="bg-inverse-surface p-2.5">
            <div className="flex items-center gap-1 text-[9px] opacity-60 uppercase tracking-wide mb-0.5">
              <span className="material-symbols-outlined text-[12px]">rainy</span> Rain Today
            </div>
            <p className="text-xs font-semibold">{precip.toFixed(1)} mm</p>
          </div>
          <div className="bg-inverse-surface p-2.5">
            <div className="flex items-center gap-1 text-[9px] opacity-60 uppercase tracking-wide mb-0.5">
              <span className="material-symbols-outlined text-[12px]">water_drop</span> Humidity
            </div>
            <p className="text-xs font-semibold">{Math.round(humidity)}%</p>
          </div>
          <div className="bg-inverse-surface p-2.5">
            <div className="flex items-center gap-1 text-[9px] opacity-60 uppercase tracking-wide mb-0.5">
              <span className="material-symbols-outlined text-[12px]">air</span> Wind
            </div>
            <p className="text-xs font-semibold">{wind > 0 ? `${Math.round(wind)} km/h` : '—'}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 text-[9px] opacity-50">
          <span>LIVE · {now} PKT</span>
          <span>{(locationName || 'Lahore').toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

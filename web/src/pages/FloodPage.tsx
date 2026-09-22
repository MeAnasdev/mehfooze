import { useState, useEffect } from 'react'
import { fetchFlood, FloodOverview } from '../services/api'

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  return `${Math.round(mins / 60)}h ago`
}

export default function FloodPage() {
  const [data, setData] = useState<FloodOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFlood().then(setData).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="rounded-2xl bg-inverse-surface text-inverse-on-surface p-5 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 opacity-10">
          <span className="material-symbols-outlined text-[120px]">water</span>
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/20 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <span className="text-[9px] uppercase tracking-widest font-bold text-secondary-fixed">Live River Monitoring</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">Flood Monitoring</h1>
          <p className="text-xs opacity-80 mt-1 max-w-md">
            Real-time river flows for Punjab's major rivers, from the GloFAS flood model.
          </p>
          {data && (
            <p className="text-[10px] opacity-60 mt-2">Updated {timeAgo(data.updatedAt)}</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="loading-spinner" /></div>
      ) : data ? (
        <>
          {/* Overall status banner */}
          <div className={`rounded-xl p-3.5 flex items-center gap-3 ${
            data.anyFloodRisk ? 'bg-error/10 border border-error/30' : 'bg-primary/10 border border-primary/30'
          }`}>
            <span className={`material-symbols-outlined text-2xl ${data.anyFloodRisk ? 'text-error' : 'text-primary'}`}>
              {data.anyFloodRisk ? 'warning' : 'check_circle'}
            </span>
            <div>
              <h3 className="text-sm font-bold text-on-surface">
                {data.anyFloodRisk ? 'Elevated river flow detected' : 'All rivers within normal range'}
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                {data.anyFloodRisk
                  ? 'One or more rivers show elevated discharge. Monitor official bulletins.'
                  : 'No significant flood risk from monitored rivers right now.'}
              </p>
            </div>
          </div>

          {/* River status chips */}
          <div>
            <p className="text-[10px] text-tertiary uppercase tracking-wider font-semibold mb-2">Rivers Now</p>
            <div className="flex flex-wrap gap-2">
              {data.rivers.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-surface-container-lowest border border-outline-variant"
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.status.color }} />
                  <span className="text-xs font-semibold text-on-surface">{r.name}</span>
                  <span className="text-[10px] text-on-surface-variant">{r.urdu}</span>
                  <span className="text-[9px] uppercase tracking-wide font-bold" style={{ color: r.status.color }}>
                    {r.status.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* River discharge cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.rivers.map((r) => (
              <div key={r.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">{r.name} River</h3>
                    <p className="text-[10px] text-on-surface-variant">{r.urdu}</p>
                  </div>
                  <span className="text-lg">🌊</span>
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-2xl font-bold text-on-surface">
                    {r.discharge != null ? r.discharge.toLocaleString() : '—'}
                  </span>
                  <span className="text-[10px] text-on-surface-variant mb-1">m³/s</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                    style={{ background: r.status.color }}
                  >
                    {r.status.label}
                  </span>
                  <span className="text-[9px] text-on-surface-variant">
                    24h: {r.status24h.label}
                  </span>
                </div>
                {/* Mini 7-day bar chart */}
                {r.series.length > 0 && (
                  <div className="flex items-end gap-0.5 h-8 mt-2">
                    {r.series.map((s, i) => {
                      const max = Math.max(...r.series.map((x) => x.discharge), 1)
                      const h = Math.max((s.discharge / max) * 100, 6)
                      return (
                        <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: r.status.color, opacity: 0.4 + (i / r.series.length) * 0.6 }} title={`${s.date}: ${s.discharge} m³/s`} />
                      )
                    })}
                  </div>
                )}
                <p className="text-[9px] text-outline mt-1">7-day peak: {r.peak7d != null ? `${r.peak7d.toLocaleString()} m³/s` : '—'}</p>
              </div>
            ))}
          </div>

          {/* Attribution */}
          <div className="bg-surface-container/40 rounded-xl p-3 text-[10px] text-on-surface-variant leading-relaxed">
            <span className="font-semibold text-on-surface">{data.source.note}</span>
            <br />
            Official flood bulletins:{' '}
            <a href={data.source.url} target="_blank" rel="noopener noreferrer" className="text-secondary font-semibold hover:underline">
              {data.source.authority}
            </a>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-on-surface-variant text-sm">
          <span className="material-symbols-outlined text-4xl text-outline block mb-2">water_drop</span>
          Flood data unavailable right now. Please try again shortly.
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { fetchPriorityZones, PriorityZone } from '../../services/api'

export default function GovPriority() {
  const [zones, setZones] = useState<PriorityZone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPriorityZones().then(setZones).finally(() => setLoading(false))
  }, [])

  const maxScore = zones.length ? Math.max(...zones.map((z) => z.priorityScore)) : 1

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-on-surface">Intervention Priority</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Where limited enforcement resources matter most — high AQI weighted by population density.
        </p>
      </div>

      <div className="bg-primary-container/15 border border-primary/20 text-on-surface rounded-xl p-3 text-[11px] flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-base">functions</span>
        <span>Priority score = AQI × log₂(population + 1) — the more people breathing worse air, the higher the priority.</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="loading-spinner" /></div>
      ) : (
        <div className="space-y-2">
          {zones.map((z) => (
            <div key={z.zoneId} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3 shadow-ambient">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  z.rank === 1 ? 'bg-error text-white' : z.rank <= 2 ? 'bg-amber-500 text-white' : 'bg-surface-container-high text-on-surface'
                }`}>
                  {z.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-on-surface truncate">{z.name}</h3>
                    <span className="text-xs font-bold text-on-surface shrink-0">{z.priorityScore.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-bold" style={{ background: z.aqiColour }}>
                      AQI {Math.round(z.aqi)}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      {z.population.toLocaleString()} people (est.)
                    </span>
                  </div>
                  {/* Score bar */}
                  <div className="w-full bg-surface-variant rounded-full h-1.5 mt-2">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max((z.priorityScore / maxScore) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-outline leading-relaxed">
        AQI: real-time Open-Meteo CAMS. Population: WorldPop-informed estimates (labelled as estimates).
      </p>
    </div>
  )
}

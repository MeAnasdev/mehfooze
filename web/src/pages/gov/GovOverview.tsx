import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchReportStats,
  fetchPriorityZones,
  fetchCurrentFromBackend,
  ReportStats,
  PriorityZone,
  AqiReading,
} from '../../services/api'

export default function GovOverview() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [priority, setPriority] = useState<PriorityZone[]>([])
  const [sensors, setSensors] = useState<AqiReading[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([fetchReportStats(), fetchPriorityZones(), fetchCurrentFromBackend()])
      .then(([sRes, pRes, cRes]) => {
        if (sRes.status === 'fulfilled') setStats(sRes.value)
        if (pRes.status === 'fulfilled') setPriority(pRes.value)
        if (cRes.status === 'fulfilled') setSensors(cRes.value)
        setLoading(false)
      })
  }, [])

  const cityAvgAqi = sensors.length
    ? Math.round(sensors.reduce((s, r) => s + r.aqi, 0) / sensors.length)
    : 0
  const pendingReports = (stats?.byStatus?.submitted ?? 0) + (stats?.byStatus?.under_review ?? 0)
  const resolvedReports = stats?.byStatus?.resolved ?? 0
  const topZone = priority[0]

  const cards = [
    { label: 'City Avg AQI', value: cityAvgAqi || '—', icon: 'air', tone: 'primary', to: '/gov/zones' },
    { label: 'Total Reports (30d)', value: stats?.total ?? 0, icon: 'inbox', tone: 'secondary', to: '/gov/reports' },
    { label: 'Pending Action', value: pendingReports, icon: 'pending_actions', tone: 'amber', to: '/gov/reports' },
    { label: 'Resolved', value: resolvedReports, icon: 'task_alt', tone: 'primary', to: '/gov/reports' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-on-surface">Overview</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Lahore environmental status and the accountability pipeline at a glance.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="loading-spinner" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {cards.map((c) => (
              <button
                key={c.label}
                onClick={() => navigate(c.to)}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-left shadow-ambient hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-tertiary uppercase tracking-wider font-semibold">{c.label}</span>
                  <span className={`material-symbols-outlined text-base ${
                    c.tone === 'amber' ? 'text-amber-500' : c.tone === 'secondary' ? 'text-secondary' : 'text-primary'
                  }`}>{c.icon}</span>
                </div>
                <div className="text-2xl font-bold text-on-surface">{c.value}</div>
              </button>
            ))}
          </div>

          {/* Top priority zone highlight */}
          {topZone && (
            <div className="bg-white border border-error/30 rounded-xl p-4 shadow-ambient">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-white">priority_high</span>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-error">Highest Priority Zone</p>
                  <h3 className="text-base font-bold text-on-surface">{topZone.name}</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    AQI {Math.round(topZone.aqi)} · {topZone.population.toLocaleString()} people affected · score {topZone.priorityScore.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/gov/priority')}
                  className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold shrink-0"
                >
                  View
                </button>
              </div>
            </div>
          )}

          {/* Reports by type */}
          {stats && Object.keys(stats.byType).length > 0 && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient">
              <h3 className="text-sm font-semibold text-on-surface mb-3">Reports by Source Type (30 days)</h3>
              <div className="space-y-2">
                {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                  const pct = stats.total ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="capitalize text-on-surface-variant">{type.replace('_', ' ')}</span>
                        <span className="font-semibold text-on-surface">{count}</span>
                      </div>
                      <div className="w-full bg-surface-variant rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Accountability pipeline explainer */}
          <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-4">
            <p className="text-[10px] text-primary uppercase tracking-wider font-semibold mb-2">The Accountability Loop</p>
            <div className="flex items-center justify-between text-[11px] text-on-surface-variant flex-wrap gap-1">
              {['Citizen', 'Evidence', 'Government', 'Action', 'Verification'].map((step, i, arr) => (
                <span key={step} className="flex items-center gap-1">
                  <span className="font-semibold text-on-surface">{step}</span>
                  {i < arr.length - 1 && <span className="material-symbols-outlined text-sm text-primary">arrow_forward</span>}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

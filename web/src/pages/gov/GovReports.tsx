import { useState, useEffect } from 'react'
import {
  fetchAllReports,
  updateReportStatus,
  fetchCaseTrend,
  PollutionReport,
  CaseTrend,
} from '../../services/api'

const TYPE_META: Record<string, { label: string; icon: string }> = {
  waste_burning:     { label: 'Waste Burning',     icon: 'local_fire_department' },
  industrial_smoke:  { label: 'Industrial Smoke',  icon: 'factory' },
  construction_dust: { label: 'Construction Dust', icon: 'construction' },
  dirty_vehicle:     { label: 'Dirty Vehicle',     icon: 'directions_bus' },
  other:             { label: 'Other',             icon: 'more_horiz' },
}

const STATUS_FILTERS = ['all', 'submitted', 'under_review', 'verified', 'routed', 'resolved', 'dismissed']

const AUTHORITIES = [
  'EPA Punjab',
  'District Administration Lahore',
  'Lahore Waste Management Company',
  'Traffic Police Lahore',
  'Environment Protection Department',
]

function statusBadge(status: string): string {
  switch (status) {
    case 'resolved':    return 'bg-primary/15 text-primary'
    case 'routed':      return 'bg-secondary/15 text-secondary'
    case 'verified':    return 'bg-secondary/15 text-secondary'
    case 'under_review':return 'bg-amber-100 text-amber-700'
    case 'dismissed':   return 'bg-error/10 text-error'
    default:            return 'bg-tertiary/15 text-tertiary'
  }
}

export default function GovReports() {
  const [reports, setReports] = useState<PollutionReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<PollutionReport | null>(null)
  const [trend, setTrend] = useState<CaseTrend | null>(null)
  const [routeTo, setRouteTo] = useState(AUTHORITIES[0])
  const [resolution, setResolution] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    fetchAllReports(filter === 'all' ? undefined : filter)
      .then(setReports)
      .finally(() => setLoading(false))
  }

  useEffect(load, [filter])

  const openCase = async (r: PollutionReport) => {
    setSelected(r)
    setTrend(null)
    setResolution(r.resolutionNote ?? '')
    setRouteTo(r.routedTo ?? AUTHORITIES[0])
    const t = await fetchCaseTrend(r.id)
    setTrend(t)
  }

  const applyStatus = async (status: string) => {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await updateReportStatus(
        selected.id,
        status,
        status === 'routed' ? routeTo : undefined,
        status === 'resolved' ? resolution : undefined,
      )
      setSelected(updated)
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-on-surface">Report Queue</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Citizen-submitted evidence, corroborated and ready for action. Citizen → Evidence → Action → Verification.
        </p>
      </div>

      {/* Status filters */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === s ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
        {/* Queue list */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center h-40"><div className="loading-spinner" /></div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-4xl text-outline block mb-2">inbox</span>
              No reports in this category yet.
            </div>
          ) : (
            reports.map((r) => {
              const t = TYPE_META[r.type] ?? TYPE_META.other
              return (
                <button
                  key={r.id}
                  onClick={() => openCase(r)}
                  className={`w-full text-left bg-surface-container-lowest border rounded-xl p-3 flex items-center gap-3 transition-colors ${
                    selected?.id === r.id ? 'border-primary' : 'border-outline-variant hover:bg-surface-container-high'
                  }`}
                >
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-on-surface-variant">{t.icon}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-on-surface truncate">{t.label}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize shrink-0 ${statusBadge(r.status)}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant truncate">
                      {r.nearestZone ?? '—'} · {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      {r.sensorCorroborated && ' · ✓ corroborated'}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Case detail panel */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 h-fit sticky top-4">
          {!selected ? (
            <div className="text-center py-12 text-on-surface-variant text-sm">
              <span className="material-symbols-outlined text-4xl text-outline block mb-2">assignment</span>
              Select a report to review and act.
            </div>
          ) : (
            <div className="space-y-3">
              {selected.photoUrl && (
                <img src={selected.photoUrl} alt="Evidence" className="w-full h-40 object-cover rounded-lg" />
              )}
              <div>
                <p className="text-[10px] text-tertiary uppercase tracking-wider font-semibold">Case {selected.id}</p>
                <h3 className="text-sm font-bold text-on-surface">{(TYPE_META[selected.type] ?? TYPE_META.other).label}</h3>
              </div>

              {selected.note && (
                <p className="text-xs text-on-surface-variant bg-surface-container/50 rounded-lg p-2">"{selected.note}"</p>
              )}

              <div className="text-xs text-on-surface-variant space-y-1">
                <p><span className="font-semibold text-on-surface">Zone:</span> {selected.nearestZone ?? '—'}</p>
                <p><span className="font-semibold text-on-surface">Nearest AQI:</span> {selected.nearestAqi != null ? Math.round(selected.nearestAqi) : '—'}</p>
                <p><span className="font-semibold text-on-surface">Location:</span> {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</p>
                {selected.likelySource && (
                  <p><span className="font-semibold text-on-surface">Likely source:</span> {selected.likelySource}</p>
                )}
              </div>

              {selected.corroborationNote && (
                <div className="text-[11px] text-on-surface-variant bg-primary/5 rounded-lg p-2 leading-relaxed">
                  {selected.corroborationNote}
                </div>
              )}

              {/* Before/After verification (2.E) */}
              {trend && (trend.beforeAvg != null || trend.afterAvg != null) && (
                <div className="border border-outline-variant rounded-lg p-2.5">
                  <p className="text-[10px] text-tertiary uppercase tracking-wider font-semibold mb-1.5">
                    Zone AQI: Before vs After
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-center">
                      <div className="text-lg font-bold text-on-surface">{trend.beforeAvg ?? '—'}</div>
                      <div className="text-[9px] text-on-surface-variant">Before</div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {trend.improved ? 'trending_down' : 'trending_flat'}
                    </span>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${trend.improved ? 'text-primary' : 'text-on-surface'}`}>
                        {trend.afterAvg ?? '—'}
                      </div>
                      <div className="text-[9px] text-on-surface-variant">After</div>
                    </div>
                  </div>
                  {trend.improved && (
                    <p className="text-[10px] text-primary text-center mt-1 font-medium">
                      ✓ Air quality improved after this case
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 border-t border-outline-variant/40 space-y-2">
                <p className="text-[10px] text-tertiary uppercase tracking-wider font-semibold">Take Action</p>

                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => applyStatus('under_review')} disabled={saving}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-[11px] font-semibold disabled:opacity-50">
                    Mark Reviewing
                  </button>
                  <button onClick={() => applyStatus('verified')} disabled={saving}
                    className="px-2.5 py-1.5 rounded-lg bg-secondary/15 text-secondary text-[11px] font-semibold disabled:opacity-50">
                    Verify
                  </button>
                  <button onClick={() => applyStatus('dismissed')} disabled={saving}
                    className="px-2.5 py-1.5 rounded-lg bg-error/10 text-error text-[11px] font-semibold disabled:opacity-50">
                    Dismiss
                  </button>
                </div>

                {/* Route */}
                <div className="flex gap-1.5">
                  <select
                    value={routeTo}
                    onChange={(e) => setRouteTo(e.target.value)}
                    className="flex-1 text-[11px] px-2 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface outline-none"
                  >
                    {AUTHORITIES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <button onClick={() => applyStatus('routed')} disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-[11px] font-semibold disabled:opacity-50">
                    Route
                  </button>
                </div>

                {/* Resolve */}
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={2}
                  placeholder="Resolution note (action taken)…"
                  className="w-full text-[11px] px-2 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface outline-none resize-none"
                />
                <button onClick={() => applyStatus('resolved')} disabled={saving}
                  className="w-full py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold disabled:opacity-50">
                  Mark Resolved
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

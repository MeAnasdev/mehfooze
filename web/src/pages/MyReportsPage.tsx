import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchMyReports, PollutionReport } from '../services/api'

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  waste_burning:     { label: 'Waste Burning',     icon: 'local_fire_department' },
  industrial_smoke:  { label: 'Industrial Smoke',  icon: 'factory' },
  construction_dust: { label: 'Construction Dust', icon: 'construction' },
  dirty_vehicle:     { label: 'Dirty Vehicle',     icon: 'directions_bus' },
  other:             { label: 'Other',             icon: 'more_horiz' },
}

// Status pipeline shown to the citizen
const STATUS_STEPS = ['submitted', 'under_review', 'verified', 'routed', 'resolved']

function statusColor(status: string): string {
  switch (status) {
    case 'resolved':  return 'text-primary bg-primary/10'
    case 'routed':    return 'text-secondary bg-secondary/10'
    case 'verified':  return 'text-secondary bg-secondary/10'
    case 'dismissed': return 'text-error bg-error/10'
    default:          return 'text-tertiary bg-tertiary/10'
  }
}

function statusIndex(status: string): number {
  const i = STATUS_STEPS.indexOf(status)
  return i === -1 ? 0 : i
}

export default function MyReportsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<PollutionReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchMyReports(user.uid)
      .then(setReports)
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-tertiary uppercase tracking-wider mb-0.5 font-semibold">My Reports</p>
          <h2 className="text-xl font-bold text-on-surface leading-tight">Track your impact</h2>
        </div>
        <button
          onClick={() => navigate('/report')}
          className="px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">add</span> New
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-40"><div className="loading-spinner" /></div>
      )}

      {!loading && reports.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-outline mb-2">assignment</span>
          <p className="text-sm text-on-surface-variant">You haven't reported anything yet.</p>
          <button
            onClick={() => navigate('/report')}
            className="mt-3 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold"
          >
            Report Pollution
          </button>
        </div>
      )}

      {!loading && reports.map((r) => {
        const t = TYPE_LABELS[r.type] ?? TYPE_LABELS.other
        const activeStep = statusIndex(r.status)
        const dismissed = r.status === 'dismissed'
        return (
          <div key={r.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              {r.photoUrl ? (
                <img src={r.photoUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant">{t.icon}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-on-surface">{t.label}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${statusColor(r.status)}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant mt-0.5">
                  {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  {r.nearestZone && ` · ${r.nearestZone}`}
                </p>
                {r.corroborationNote && (
                  <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">{r.corroborationNote}</p>
                )}
              </div>
            </div>

            {/* Status pipeline */}
            {!dismissed && (
              <div className="flex items-center gap-1">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full h-1 rounded-full ${i <= activeStep ? 'bg-primary' : 'bg-surface-variant'}`} />
                    <span className={`text-[8px] capitalize ${i <= activeStep ? 'text-primary font-semibold' : 'text-outline'}`}>
                      {step.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {r.routedTo && (
              <p className="text-[10px] text-on-surface-variant">
                <span className="font-semibold">Routed to:</span> {r.routedTo}
              </p>
            )}
            {r.resolutionNote && (
              <p className="text-[10px] text-primary bg-primary/5 rounded-lg p-2">
                <span className="font-semibold">Outcome:</span> {r.resolutionNote}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

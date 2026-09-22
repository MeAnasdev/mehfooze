import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useGeolocation } from '../hooks/useGeolocation'
import { submitReport, PollutionReport, ReportType } from '../services/api'
import { uploadReportPhoto } from '../services/reportUpload'

const REPORT_TYPES: { id: ReportType; label: string; icon: string; desc: string }[] = [
  { id: 'waste_burning',     label: 'Waste Burning',     icon: 'local_fire_department', desc: 'Open burning of trash or waste' },
  { id: 'industrial_smoke',  label: 'Industrial Smoke',  icon: 'factory',               desc: 'Smoke from a factory or plant' },
  { id: 'construction_dust', label: 'Construction Dust', icon: 'construction',          desc: 'Dust from a building site' },
  { id: 'dirty_vehicle',     label: 'Dirty Vehicle',     icon: 'directions_bus',        desc: 'Heavy smoke from a vehicle' },
  { id: 'other',             label: 'Other',             icon: 'more_horiz',            desc: 'Another pollution source' },
]

export default function ReportPage() {
  const { user } = useAuth()
  const { lat, lng, locationName } = useGeolocation()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [type, setType] = useState<ReportType | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PollutionReport | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!type) { setError('Please select a pollution type.'); return }
    if (!user) { setError('You must be signed in to report.'); return }
    setError(null)
    setSubmitting(true)

    try {
      let photoUrl: string | null = null
      if (photoFile) {
        photoUrl = await uploadReportPhoto(photoFile, user.uid)
      }

      const report = await submitReport({
        userId: user.uid,
        type,
        lat,
        lng,
        photoUrl,
        note: note.trim() || null,
      })
      setResult(report)
    } catch {
      setError('Could not submit your report. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success / corroboration result screen ─────────────────────────────
  if (result) {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="bg-primary-container/10 border border-primary/30 rounded-2xl p-5 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-primary text-3xl">task_alt</span>
          </div>
          <h2 className="text-lg font-bold text-on-surface">Report Submitted</h2>
          <p className="text-xs text-on-surface-variant mt-1">
            Thank you. Your evidence has been recorded and will be reviewed.
          </p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-tertiary uppercase tracking-wider font-semibold">Case ID</span>
            <span className="text-xs font-mono text-on-surface">{result.id}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-tertiary uppercase tracking-wider font-semibold">Status</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[11px] font-semibold capitalize">
              {result.status.replace('_', ' ')}
            </span>
          </div>

          <div className="pt-2 border-t border-outline-variant/40">
            <p className="text-[10px] text-tertiary uppercase tracking-wider font-semibold mb-1">Corroboration</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {result.corroborationNote}
            </p>
            {result.sensorCorroborated && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                <span className="material-symbols-outlined text-[12px]">verified</span>
                Sensor-corroborated
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/my-reports')}
            className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold"
          >
            Track My Reports
          </button>
          <button
            onClick={() => { setResult(null); setType(null); setPhotoFile(null); setPhotoPreview(null); setNote('') }}
            className="flex-1 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold"
          >
            Report Another
          </button>
        </div>
      </div>
    )
  }

  // ── Report form ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div>
        <p className="text-[10px] text-tertiary uppercase tracking-wider mb-0.5 font-semibold">
          Report Pollution
        </p>
        <h2 className="text-xl font-bold text-on-surface leading-tight">See it. Report it.</h2>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Your report becomes verifiable evidence routed to the right authority.
        </p>
      </div>

      {/* Type picker */}
      <div>
        <label className="text-[10px] text-tertiary uppercase tracking-wider font-semibold">What are you seeing?</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {REPORT_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-colors ${
                type === t.id
                  ? 'border-primary bg-primary-container/10'
                  : 'border-outline-variant hover:bg-surface-container-high'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${type === t.id ? 'text-primary' : 'text-on-surface-variant'}`}>
                {t.icon}
              </span>
              <span className="text-xs font-semibold text-on-surface">{t.label}</span>
              <span className="text-[10px] text-on-surface-variant leading-tight">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Photo */}
      <div>
        <label className="text-[10px] text-tertiary uppercase tracking-wider font-semibold">Add photo evidence (optional)</label>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
        {photoPreview ? (
          <div className="relative mt-2 rounded-xl overflow-hidden border border-outline-variant">
            <img src={photoPreview} alt="Evidence" className="w-full h-44 object-cover" />
            <button
              onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 w-full py-6 rounded-xl border-2 border-dashed border-outline-variant flex flex-col items-center gap-1 text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">add_a_photo</span>
            <span className="text-xs font-medium">Take or choose a photo</span>
          </button>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="text-[10px] text-tertiary uppercase tracking-wider font-semibold">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={280}
          placeholder="Anything else the authority should know?"
          className="mt-2 w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary resize-none"
        />
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container-high/50 border border-outline-variant/50">
        <span className="material-symbols-outlined text-primary text-base">location_on</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-on-surface">{locationName || 'Your current location'}</p>
          <p className="text-[10px] text-on-surface-variant">{lat.toFixed(4)}, {lng.toFixed(4)} · auto-tagged</p>
        </div>
      </div>

      {error && (
        <div className="p-2.5 bg-error-container/50 border border-error/30 rounded-lg text-[11px] text-on-error-container flex items-center gap-2">
          <span className="material-symbols-outlined text-error text-sm">error</span>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || !type}
        className="w-full py-3 rounded-xl bg-primary text-on-primary font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
            Submitting…
          </>
        ) : (
          <><span className="material-symbols-outlined text-base">send</span> Submit Report</>
        )}
      </button>

      <p className="text-[10px] text-outline text-center leading-relaxed">
        Reports are cross-checked against nearby sensors and documented industrial
        areas (source: EPA Punjab / Urban Unit 2025). We show what the evidence
        supports — never more.
      </p>
    </div>
  )
}

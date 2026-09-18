import type { Advisory } from '../services/api'

const PROFILES = [
  { id: 'citizen', label: 'Citizen', icon: 'person' },
  { id: 'parent', label: 'Parent', icon: 'child_care' },
  { id: 'patient', label: 'Patient', icon: 'pulmonology' },
  { id: 'commuter', label: 'Commuter', icon: 'directions_car' },
]

interface AdvisoryPanelProps {
  advisory: Advisory | null
  profile: string
  onProfileChange: (p: string) => void
}

export default function AdvisoryPanel({ advisory, profile, onProfileChange }: AdvisoryPanelProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 sm:p-6 shadow-ambient">
      <h2 className="text-sm sm:text-base font-semibold text-on-surface mb-3 sm:mb-4">Health Advisory</h2>

      <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
        {PROFILES.map((p) => (
          <button
            key={p.id}
            onClick={() => onProfileChange(p.id)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 ${
              profile === p.id
                ? 'bg-primary-container/20 text-primary border border-primary'
                : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[14px] sm:text-[16px]">{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      {advisory ? (
        <div className="space-y-3">
          <span
            className="inline-block px-3 py-1 rounded-full text-white text-xs font-bold"
            style={{ background: advisory.aqiColour || '#00e400' }}
          >
            AQI {advisory.aqi} &middot; {advisory.aqiCategory}
          </span>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">{advisory.message}</p>
          {advisory.actions.length > 0 && (
            <ul className="space-y-2">
              {advisory.actions.map((a, i) => (
                <li key={i} className="text-xs sm:text-sm text-on-surface-variant flex items-start gap-2">
                  <span className="material-symbols-outlined text-primary text-[14px] sm:text-[16px] mt-0.5">check_circle</span>
                  {a}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-xs sm:text-sm text-on-surface-variant">Loading advisory...</p>
      )}
    </div>
  )
}

import type { Advisory } from '../types/api'

interface AdvisoryPanelProps {
  advisory: Advisory | null
  profile: string
  onProfileChange: (p: string) => void
}

const PROFILES = [
  { id: 'citizen', label: 'Citizen' },
  { id: 'parent', label: 'Parent / Child' },
  { id: 'patient', label: 'Respiratory Patient' },
  { id: 'worker', label: 'Outdoor Worker' },
]

/**
 * Displays role-specific plain-language advisory for the current forecast.
 */
export default function AdvisoryPanel({
  advisory,
  profile,
  onProfileChange,
}: AdvisoryPanelProps) {
  return (
    <section className="advisory-panel">
      <h2 className="advisory-panel__title">Advisory</h2>

      {/* Profile toggles */}
      <div className="profile-tabs" role="tablist">
        {PROFILES.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={profile === p.id}
            className={`profile-tab ${profile === p.id ? 'profile-tab--active' : ''}`}
            onClick={() => onProfileChange(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Advisory message */}
      <div className="advisory-body" aria-live="polite">
        {advisory ? (
          <>
            <p className="advisory-message">{advisory.message}</p>
            {advisory.actions.length > 0 && (
              <ul className="advisory-actions">
                {advisory.actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="advisory-loading">Loading advisory…</p>
        )}
      </div>
    </section>
  )
}

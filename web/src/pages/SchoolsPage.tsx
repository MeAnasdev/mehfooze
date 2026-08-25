import { useEffect, useState } from 'react'
import { fetchAdvisory } from '../services/api'
import type { Advisory } from '../types/api'

/**
 * Mehfooze Schools — simple once-per-morning go / no-go signal
 * for outdoor activities at schools and institutions.
 */
export default function SchoolsPage() {
  const [advisory, setAdvisory] = useState<Advisory | null>(null)

  useEffect(() => {
    fetchAdvisory('school').then(setAdvisory).catch(console.error)
  }, [])

  const isGo = advisory && !advisory.message.toLowerCase().includes('no-go')

  return (
    <div className="page page--schools">
      <h1 className="page-title">Schools Signal</h1>
      <p className="page-desc">
        Today's outdoor activity recommendation for schools and institutions.
      </p>

      {advisory ? (
        <div className={`go-signal go-signal--${isGo ? 'go' : 'nogo'}`} role="status">
          <span className="go-signal__icon">{isGo ? '✅' : '🚫'}</span>
          <span className="go-signal__label">{isGo ? 'GO' : 'NO-GO'}</span>
          <p className="go-signal__detail">{advisory.message}</p>
          {advisory.actions.length > 0 && (
            <ul className="go-signal__actions">
              {advisory.actions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          )}
        </div>
      ) : (
        <p>Loading today's signal…</p>
      )}
    </div>
  )
}

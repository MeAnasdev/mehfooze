import { useState } from 'react'
import { fetchRouteOverlay } from '../services/api'
import type { RouteSegment } from '../types/api'

/**
 * Mehfooze Travel — route AQI colour strip + flood-risk flags.
 * User enters origin and destination; the backend maps route segments
 * to nearest forecast zones and returns a safety checklist.
 */
export default function TravelPage() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [segments, setSegments] = useState<RouteSegment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!origin.trim() || !destination.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await fetchRouteOverlay(origin, destination)
      setSegments(result)
    } catch {
      setError('Could not load route data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page--travel">
      <h1 className="page-title">Travel Mode</h1>
      <p className="page-desc">
        Enter your route to see AQI along the way and flood-risk warnings.
        All estimates are based on the nearest monitoring station.
      </p>

      <form className="route-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="From (e.g. Johar Town, Lahore)"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          required
          aria-label="Starting location"
        />
        <input
          type="text"
          placeholder="To (e.g. Liberty Market, Lahore)"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
          aria-label="Destination"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading…' : 'Check Route'}
        </button>
      </form>

      {error && <p className="error-message" role="alert">{error}</p>}

      {segments.length > 0 && (
        <div className="route-results">
          {segments.map((seg) => (
            <div key={seg.segmentId} className="segment-card">
              <span
                className="aqi-badge"
                style={{ background: seg.aqiEstimate > 150 ? '#ef4444' : seg.aqiEstimate > 100 ? '#f97316' : '#22c55e' }}
              >
                AQI ~{seg.aqiEstimate}
              </span>
              {seg.floodRisk && (
                <span className="flood-badge" role="img" aria-label="Flood risk">
                  ⚠ Flood risk
                </span>
              )}
              <ul className="segment-checklist">
                {seg.checklist.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

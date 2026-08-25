import { useEffect, useState } from 'react'
import AqiMap from '../components/AqiMap'
import AdvisoryPanel from '../components/AdvisoryPanel'
import ForecastChart from '../components/ForecastChart'
import { fetchCurrentAqi, fetchForecast, fetchAdvisory } from '../services/api'
import type { ZoneReading, ForecastPoint, Advisory } from '../types/api'

/**
 * Mehfooze Home — default citizen advisory view.
 * Shows the live AQI map, 24h forecast chart, and a role-specific advisory.
 */
export default function HomePage() {
  const [zones, setZones] = useState<ZoneReading[]>([])
  const [forecast, setForecast] = useState<ForecastPoint[]>([])
  const [advisory, setAdvisory] = useState<Advisory | null>(null)
  const [profile, setProfile] = useState('citizen')
  const [selectedZone, setSelectedZone] = useState('gulberg')

  useEffect(() => {
    fetchCurrentAqi().then(setZones).catch(console.error)
  }, [])

  useEffect(() => {
    fetchForecast(selectedZone).then(setForecast).catch(console.error)
  }, [selectedZone])

  useEffect(() => {
    fetchAdvisory(profile).then(setAdvisory).catch(console.error)
  }, [profile])

  return (
    <div className="page page--home">
      <h1 className="page-title">
        Lahore Air Quality
        <span className="page-subtitle"> · live + 72h forecast</span>
      </h1>

      <AqiMap zones={zones} />

      <div className="two-col">
        <ForecastChart data={forecast} zone={selectedZone} />
        <AdvisoryPanel
          advisory={advisory}
          profile={profile}
          onProfileChange={setProfile}
        />
      </div>
    </div>
  )
}

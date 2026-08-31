import { useState, useEffect } from 'react'
import { API_BASE } from '../services/api'

interface Poi {
  name: string
  lat: number
  lng: number
  type: string
  distance: number
}

interface PoisListProps {
  lat: number
  lng: number
  onPoiClick?: (poi: Poi) => void
}

export default function PoisList({ lat, lng, onPoiClick }: PoisListProps) {
  const [pois, setPois] = useState<Poi[]>([])
  const [filter, setFilter] = useState<'fuel' | 'parking'>('fuel')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/api/pois?lat=${lat}&lng=${lng}&type=${filter}&radius=3000`)
      .then((r) => r.json())
      .then(setPois)
      .catch(() => setPois([]))
      .finally(() => setLoading(false))
  }, [lat, lng, filter])

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['fuel', 'parking'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === t
                ? 'bg-primary-container/20 text-primary border border-primary'
                : 'bg-surface border border-outline-variant text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[14px] align-middle mr-1">
              {t === 'fuel' ? 'local_gas_station' : 'local_parking'}
            </span>
            {t === 'fuel' ? 'Fuel' : 'Parking'}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-4"><div className="loading-spinner" /></div>}

      {!loading && pois.length === 0 && (
        <p className="text-sm text-on-surface-variant text-center py-4">No {filter} stations found nearby</p>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {pois.map((poi, i) => (
          <button
            key={i}
            onClick={() => onPoiClick?.(poi)}
            className="w-full flex items-center justify-between p-3 bg-surface rounded-xl border border-outline-variant text-left hover:bg-surface-container-high transition-colors"
          >
            <div>
              <p className="font-medium text-on-surface text-sm">{poi.name}</p>
              <p className="text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[14px] align-middle mr-1">
                  {poi.type === 'fuel' ? 'local_gas_station' : 'local_parking'}
                </span>
                {poi.type}
              </p>
            </div>
            <span className="text-xs text-on-surface-variant font-medium">{poi.distance}m</span>
          </button>
        ))}
      </div>
    </div>
  )
}

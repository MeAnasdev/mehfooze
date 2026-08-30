import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet'
import NavigationPanel from '../components/NavigationPanel'
import { useGpsTracker } from '../hooks/useGpsTracker'
import L from 'leaflet'

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY

interface NavPageProps {
  coordinates: [number, number][]
  steps: { instruction: string; distance: number; duration: number }[]
  totalDistance: number
  totalDuration: number
}

const userIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#0EA5E9;border:3px solid white;box-shadow:0 0 8px rgba(14,165,233,0.6)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export default function NavigationPage({ coordinates, steps, totalDistance, totalDuration }: NavPageProps) {
  const navigate = useNavigate()
  const { positions, current } = useGpsTracker(true)
  const [stepIdx] = useState(0)

  const center = useMemo(
    () => (current ? [current.lat, current.lng] as [number, number] : coordinates[0] ?? [31.5204, 74.3587] as [number, number]),
    [current, coordinates]
  )

  const remaining = useMemo(() => {
    const done = positions.length
    const avgDur = totalDuration / Math.max(coordinates.length, 1)
    return {
      distance: totalDistance * (1 - done / Math.max(coordinates.length, 1)),
      duration: avgDur * (1 - done / Math.max(coordinates.length, 1)),
    }
  }, [positions, totalDistance, totalDuration, coordinates])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={center} zoom={14} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={`https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`}
          />
          {coordinates.length > 0 && (
            <Polyline positions={coordinates} pathOptions={{ color: '#0EA5E9', weight: 4 }} />
          )}
          {current && <Marker position={[current.lat, current.lng]} icon={userIcon} />}
        </MapContainer>

        {/* End button */}
        <button
          onClick={() => navigate('/map')}
          className="absolute top-4 left-4 z-[1000] bg-red-500 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-lg"
        >
          End Navigation
        </button>
      </div>

      {/* Bottom panel */}
      <NavigationPanel
        steps={steps}
        currentStep={stepIdx}
        remainingDistance={remaining.distance}
        remainingDuration={remaining.duration}
      />
    </div>
  )
}

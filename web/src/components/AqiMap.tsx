import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

export interface Zone {
  name: string
  lat: number
  lng: number
  aqi: number
}

interface AqiMapProps {
  zones: Zone[]
  center?: [number, number]
  zoom?: number
  showOverlay?: boolean
  height?: string
  onZoneClick?: (zone: Zone) => void
}

function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#00e400'
  if (aqi <= 100) return '#ffff00'
  if (aqi <= 150) return '#ff7e00'
  if (aqi <= 200) return '#ff0000'
  if (aqi <= 300) return '#8f3f97'
  return '#7e0023'
}

export default function AqiMap({
  zones,
  center = [31.5204, 74.3587],
  zoom = 11,
  showOverlay = true,
  height = '40vh',
  onZoneClick,
}: AqiMapProps) {
  return (
    <div
      className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-ambient"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={false}
        key={`${center[0]}-${center[1]}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showOverlay && (
          <TileLayer
            url="https://tiles.aqicn.org/tiles/usepa-aqi/{z}/{x}/{y}.png?token=__TOKEN_PLACEHOLDER__"
            opacity={0.4}
          />
        )}

        {zones.map((zone) => (
          <CircleMarker
            key={zone.name}
            center={[zone.lat, zone.lng]}
            radius={12}
            pathOptions={{
              color: aqiColor(zone.aqi),
              fillColor: aqiColor(zone.aqi),
              fillOpacity: 0.7,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onZoneClick?.(zone),
            }}
          >
            <Popup>
              <div className="text-center p-1">
                <strong className="block text-sm">{zone.name}</strong>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-white text-xs font-bold mt-1"
                  style={{ background: aqiColor(zone.aqi) }}
                >
                  AQI {zone.aqi}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}

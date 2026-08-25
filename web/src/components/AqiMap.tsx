import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { ZoneReading } from '../types/api'

interface AqiMapProps {
  zones: ZoneReading[]
}

/** Maps AQI value → hex colour following EPA colour scale */
function aqiColour(aqi: number): string {
  if (aqi <= 50) return '#22c55e'
  if (aqi <= 100) return '#eab308'
  if (aqi <= 150) return '#f97316'
  if (aqi <= 200) return '#ef4444'
  if (aqi <= 300) return '#a855f7'
  return '#7f1d1d'
}

const LAHORE_CENTRE: [number, number] = [31.5204, 74.3587]

/**
 * Leaflet map showing live AQI colour-coded by zone/station.
 * All readings are labelled as estimated from the nearest station.
 */
export default function AqiMap({ zones }: AqiMapProps) {
  return (
    <MapContainer
      center={LAHORE_CENTRE}
      zoom={11}
      className="map-container"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {zones.map((zone) => (
        <CircleMarker
          key={zone.stationId}
          center={[zone.lat, zone.lng]}
          radius={28}
          pathOptions={{
            color: aqiColour(zone.aqi),
            fillColor: aqiColour(zone.aqi),
            fillOpacity: 0.55,
          }}
        >
          <Popup>
            <strong>{zone.name}</strong><br />
            AQI: {zone.aqi}<br />
            <em style={{ fontSize: '0.75rem' }}>Estimated from nearest station</em>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  fetchAllReports,
  fetchCurrentFromBackend,
  fetchSatellite,
  PollutionReport,
  AqiReading,
  SatelliteOverlay,
} from '../../services/api'

// Documented industrial areas — mirror of backend app/data/industrial_zones.py
// Source: EPA Punjab / The Urban Unit 2025 Environmental Mapping of Industries.
const INDUSTRIAL_ZONES = [
  { name: 'Quaid-e-Azam Industrial Estate (Kot Lakhpat)', lat: 31.4659, lng: 74.3372 },
  { name: 'Sundar Industrial Estate (Raiwind Road)',      lat: 31.2811, lng: 74.1788 },
  { name: 'Shahdara Industrial Belt (Band Road)',         lat: 31.6356, lng: 74.3117 },
  { name: 'Kahna / Ferozepur Road Industrial Belt',       lat: 31.3900, lng: 74.3800 },
  { name: 'Multan Road Industrial Corridor',              lat: 31.4550, lng: 74.2600 },
]

const REPORT_ICON: Record<string, string> = {
  waste_burning: '🔥',
  industrial_smoke: '🏭',
  construction_dust: '🏗️',
  dirty_vehicle: '🚛',
  other: '📍',
}

function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#00e400'
  if (aqi <= 100) return '#ffff00'
  if (aqi <= 150) return '#ff7e00'
  if (aqi <= 200) return '#ff0000'
  if (aqi <= 300) return '#8f3f97'
  return '#7e0023'
}

const industrialIcon = L.divIcon({
  className: '',
  html: '<div style="font-size:20px;line-height:1">🏭</div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function reportDivIcon(type: string) {
  return L.divIcon({
    className: '',
    html: `<div style="font-size:18px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4))">${REPORT_ICON[type] ?? '📍'}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export default function GovMap() {
  const [reports, setReports] = useState<PollutionReport[]>([])
  const [sensors, setSensors] = useState<AqiReading[]>([])
  const [satellite, setSatellite] = useState<SatelliteOverlay | null>(null)
  const [showSatellite, setShowSatellite] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([fetchAllReports(), fetchCurrentFromBackend(), fetchSatellite()]).then(([rRes, sRes, satRes]) => {
      if (rRes.status === 'fulfilled') setReports(rRes.value)
      if (sRes.status === 'fulfilled') setSensors(sRes.value)
      if (satRes.status === 'fulfilled') setSatellite(satRes.value)
      setLoading(false)
    })
  }, [])

  const satAvailable = satellite?.available ?? false
  // Normalise NO2 for circle sizing (values are ~1e-4 mol/m²)
  const no2Values = (satellite?.zones ?? []).map((z) => z.no2 ?? 0).filter((v) => v > 0)
  const maxNo2 = no2Values.length ? Math.max(...no2Values) : 1

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Pollution Hotspot Map</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Citizen reports, live sensors, and documented industrial areas — overlaid to reveal clusters.
          </p>
        </div>
        {satAvailable && (
          <button
            onClick={() => setShowSatellite((s) => !s)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showSatellite ? 'bg-secondary text-on-secondary' : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-base">satellite_alt</span>
            Satellite NO₂
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="loading-spinner" /></div>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-ambient">
          <div style={{ height: '60vh' }}>
            <MapContainer center={[31.5204, 74.3587]} zoom={11} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Sentinel-5P satellite NO2 overlay (regional, translucent) */}
              {showSatellite && satellite?.zones.map((z) => (
                z.no2 != null && z.no2 > 0 ? (
                  <CircleMarker
                    key={`sat-${z.zoneId}`}
                    center={[z.lat, z.lng]}
                    radius={30 + (z.no2 / maxNo2) * 25}
                    pathOptions={{ color: '#8f3f97', fillColor: '#8f3f97', fillOpacity: 0.15, weight: 1, dashArray: '4' }}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong className="text-xs">{z.name}</strong><br />
                        <span className="text-[11px]">Satellite NO₂: {z.no2?.toExponential(2)} {z.unit}</span><br />
                        <span className="text-[9px] text-gray-500">Sentinel-5P · 7-day mean · regional</span>
                      </div>
                    </Popup>
                  </CircleMarker>
                ) : null
              ))}

              {/* Live sensor zones */}
              {sensors.map((s) => (
                <CircleMarker
                  key={`sensor-${s.stationId}`}
                  center={[s.lat, s.lng]}
                  radius={16}
                  pathOptions={{ color: aqiColor(s.aqi), fillColor: aqiColor(s.aqi), fillOpacity: 0.35, weight: 2 }}
                >
                  <Popup>
                    <div className="text-center">
                      <strong className="text-xs">{s.name}</strong><br />
                      <span className="text-[11px]">AQI {Math.round(s.aqi)} · PM2.5 {Math.round(s.pm25)}</span>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Documented industrial areas */}
              {INDUSTRIAL_ZONES.map((z) => (
                <Marker key={`ind-${z.name}`} position={[z.lat, z.lng]} icon={industrialIcon}>
                  <Popup>
                    <div className="text-center">
                      <strong className="text-xs">{z.name}</strong><br />
                      <span className="text-[10px]">Documented industrial area<br />(EPA Punjab / Urban Unit 2025)</span>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Citizen reports */}
              {reports.map((r) => (
                <Marker key={`rep-${r.id}`} position={[r.lat, r.lng]} icon={reportDivIcon(r.type)}>
                  <Popup>
                    <div>
                      <strong className="text-xs capitalize">{r.type.replace('_', ' ')}</strong><br />
                      <span className="text-[10px]">Status: {r.status.replace('_', ' ')}</span><br />
                      {r.sensorCorroborated && <span className="text-[10px] text-green-700">✓ corroborated</span>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Legend */}
          <div className="p-3 border-t border-outline-variant flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-on-surface-variant">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary/40 border border-primary" /> Live sensor zone</span>
            <span className="flex items-center gap-1">🏭 Documented industrial area</span>
            <span className="flex items-center gap-1">🔥 Waste burning</span>
            <span className="flex items-center gap-1">🏗️ Construction</span>
            <span className="flex items-center gap-1">🚛 Vehicle</span>
            {showSatellite && (
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#8f3f97]/30 border border-dashed border-[#8f3f97]" /> Satellite NO₂ (regional)</span>
            )}
          </div>

          {/* Honest satellite disclaimer */}
          {showSatellite && satellite?.meta && (
            <div className="px-3 pb-3 text-[10px] text-outline leading-relaxed border-t border-outline-variant pt-2">
              <span className="font-semibold">{satellite.meta.source}.</span> {satellite.meta.note}{' '}
              Resolution {satellite.meta.resolution}, updated {satellite.meta.cadence}.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

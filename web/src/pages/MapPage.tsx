import { useState, useEffect, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useGeolocation } from '../hooks/useGeolocation'
import { fetchAqiByCoords, geocode, fetchLahoreAqi } from '../services/api'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_KEY

const userIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#006c46;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#00e400'
  if (aqi <= 100) return '#ffff00'
  if (aqi <= 150) return '#ff7e00'
  if (aqi <= 200) return '#ff0000'
  if (aqi <= 300) return '#8f3f97'
  return '#7e0023'
}

function aqiLabel(aqi: number): string {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Sensitive'
  if (aqi <= 200) return 'Unhealthy'
  return 'Hazardous'
}

interface ZoneData {
  name: string
  lat: number
  lng: number
  aqi: number
  pm25: number
  pm10: number
  o3: number
  no2: number
}

type PollutantKey = 'aqi' | 'pm25' | 'pm10' | 'o3' | 'no2'

const pollutantConfig: Record<PollutantKey, { label: string; getColor: (v: number) => string }> = {
  aqi: { label: 'AQI', getColor: aqiColor },
  pm25: { label: 'PM2.5', getColor: (v) => v <= 12 ? '#00e400' : v <= 35 ? '#ffff00' : v <= 55 ? '#ff7e00' : '#ff0000' },
  pm10: { label: 'PM10', getColor: (v) => v <= 54 ? '#00e400' : v <= 154 ? '#ffff00' : v <= 254 ? '#ff7e00' : '#ff0000' },
  o3: { label: 'O₃', getColor: (v) => v <= 100 ? '#00e400' : v <= 160 ? '#ffff00' : v <= 240 ? '#ff7e00' : '#ff0000' },
  no2: { label: 'NO₂', getColor: (v) => v <= 100 ? '#00e400' : v <= 200 ? '#ffff00' : v <= 400 ? '#ff7e00' : '#ff0000' },
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

function RecenterButton({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  return (
    <button
      onClick={() => map.setView([lat, lng], 12)}
      className="absolute bottom-4 right-4 z-[1000] bg-surface-container-lowest rounded-lg shadow-md px-3 py-1.5 text-[11px] font-medium hover:bg-surface-container-high border border-outline-variant flex items-center gap-1"
    >
      <span className="material-symbols-outlined text-[14px]">my_location</span>
      My Location
    </button>
  )
}

export default function MapPage() {
  const { lat, lng, loading: geoLoading } = useGeolocation()
  const [zones, setZones] = useState<ZoneData[]>([])
  const [selected, setSelected] = useState<ZoneData | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([lat, lng])
  const [activePollutant, setActivePollutant] = useState<PollutantKey>('aqi')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ lat: number; lng: number; name: string }[]>([])
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    if (geoLoading) return
    setMapCenter([lat, lng])

    // Fetch user location + all Lahore zones
    Promise.allSettled([
      fetchAqiByCoords(lat, lng),
      fetchLahoreAqi(),
    ]).then(([userResult, zonesResult]) => {
      const allZones: ZoneData[] = []

      if (zonesResult.status === 'fulfilled') {
        zonesResult.value.forEach((z) => {
          allZones.push({
            name: z.name,
            lat: z.lat,
            lng: z.lng,
            aqi: z.aqi,
            pm25: z.pm25,
            pm10: z.pm10,
            o3: z.o3,
            no2: z.no2,
          })
        })
      }

      if (userResult.status === 'fulfilled') {
        const u = userResult.value
        const exists = allZones.some((z) => Math.abs(z.lat - u.lat) < 0.01 && Math.abs(z.lng - u.lng) < 0.01)
        if (!exists) {
          allZones.unshift({
            name: u.name,
            lat: u.lat,
            lng: u.lng,
            aqi: u.aqi,
            pm25: u.pm25,
            pm10: u.pm10,
            o3: u.o3,
            no2: u.no2,
          })
        }
      }

      setZones(allZones)
      if (allZones.length > 0 && !selected) setSelected(allZones[0])
    }).catch(() => {})
  }, [lat, lng, geoLoading])

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q)
    if (q.length < 3) { setSearchResults([]); return }
    try {
      const results = await geocode(q)
      setSearchResults(results)
      setShowSearch(true)
    } catch {
      setSearchResults([])
    }
  }, [])

  const selectSearchResult = (r: { lat: number; lng: number; name: string }) => {
    setMapCenter([r.lat, r.lng])
    setSearchQuery(r.name.split(',')[0])
    setSearchResults([])
    setShowSearch(false)

    // Fetch AQI for the selected location
    fetchAqiByCoords(r.lat, r.lng).then((data) => {
      const newZone: ZoneData = {
        name: data.name,
        lat: data.lat,
        lng: data.lng,
        aqi: data.aqi,
        pm25: data.pm25,
        pm10: data.pm10,
        o3: data.o3,
        no2: data.no2,
      }
      setZones((prev) => {
        const exists = prev.some((z) => Math.abs(z.lat - newZone.lat) < 0.01 && Math.abs(z.lng - newZone.lng) < 0.01)
        return exists ? prev : [newZone, ...prev]
      })
      setSelected(newZone)
    }).catch(() => {})
  }

  const getValue = (z: ZoneData, key: PollutantKey): number => {
    if (key === 'aqi') return z.aqi
    return z[key] ?? 0
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3rem)] -m-3 sm:-m-4 lg:-mx-5 lg:-my-4">
      {/* Search Bar + Layer Toggle */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col sm:flex-row gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <div className="bg-surface-container-lowest/95 backdrop-blur-sm rounded-lg shadow-sm border border-outline-variant/50 flex items-center px-3 py-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant mr-2">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              placeholder="Search location..."
              className="flex-1 bg-transparent text-xs text-on-surface outline-none placeholder:text-on-surface-variant/60"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]) }} className="ml-1">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">close</span>
              </button>
            )}
          </div>
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant overflow-hidden">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onMouseDown={() => selectSearchResult(r)}
                  className="w-full text-left px-3 py-2 text-xs text-on-surface hover:bg-surface-container-high flex items-center gap-2 border-b border-outline-variant/30 last:border-0"
                >
                  <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                  <span className="truncate">{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pollutant Layer Toggle */}
        <div className="bg-surface-container-lowest/95 backdrop-blur-sm rounded-lg shadow-sm border border-outline-variant/50 p-1 flex gap-0.5">
          {(Object.keys(pollutantConfig) as PollutantKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setActivePollutant(key)}
              className={`px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                activePollutant === key
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {pollutantConfig[key].label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer center={mapCenter} zoom={12} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={`https://maps.geoapify.com/v1/tile/carto/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`}
          />

          <MapController center={mapCenter} />
          <Marker position={[lat, lng]} icon={userIcon} />

          {zones.map((z) => {
            const val = getValue(z, activePollutant)
            const color = pollutantConfig[activePollutant].getColor(val)
            return (
              <CircleMarker
                key={`${z.name}-${z.lat}`}
                center={[z.lat, z.lng]}
                radius={12}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: 0.7,
                  weight: 2,
                }}
                eventHandlers={{ click: () => setSelected(z) }}
              >
                <Popup>
                  <div className="text-center p-1 min-w-[100px]">
                    <strong className="block text-xs">{z.name}</strong>
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-white text-[11px] font-bold mt-1"
                      style={{ background: color }}
                    >
                      {pollutantConfig[activePollutant].label} {val.toFixed(1)}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

          <RecenterButton lat={lat} lng={lng} />
        </MapContainer>

        {/* AQI Legend */}
        <div className="absolute bottom-4 left-3 z-[1000] bg-surface-container-lowest/90 backdrop-blur-sm rounded-lg shadow-sm border border-outline-variant/50 p-2">
          <div className="text-[9px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
            {pollutantConfig[activePollutant].label}
          </div>
          <div className="space-y-1">
            {[
              { label: 'Good', color: '#00e400' },
              { label: 'Moderate', color: '#ffff00' },
              { label: 'Sensitive', color: '#ff7e00' },
              { label: 'Unhealthy', color: '#ff0000' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                <span className="text-[9px] text-on-surface-variant">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected zone info bar */}
      {selected && (
        <div className="px-4 py-2.5 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: pollutantConfig[activePollutant].getColor(getValue(selected, activePollutant)) }}
            />
            <div>
              <h3 className="text-xs font-semibold text-on-surface">{selected.name}</h3>
              <p className="text-[10px] text-on-surface-variant">
                PM2.5: {selected.pm25} · PM10: {selected.pm10} · O₃: {selected.o3} · NO₂: {selected.no2}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className="inline-block px-2 py-0.5 rounded-full text-white text-xs font-bold"
              style={{ background: pollutantConfig[activePollutant].getColor(getValue(selected, activePollutant)) }}
            >
              {getValue(selected, activePollutant).toFixed(1)}
            </span>
            <p className="text-[9px] text-on-surface-variant mt-0.5">
              {activePollutant === 'aqi' ? aqiLabel(selected.aqi) : pollutantConfig[activePollutant].label}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

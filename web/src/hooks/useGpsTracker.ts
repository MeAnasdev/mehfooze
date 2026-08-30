import { useState, useEffect, useRef } from 'react'

interface Position {
  lat: number
  lng: number
  time: number
}

export function useGpsTracker(enabled: boolean) {
  const [positions, setPositions] = useState<Position[]>([])
  const [current, setCurrent] = useState<Position | null>(null)
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p: Position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          time: Date.now(),
        }
        setCurrent(p)
        setPositions((prev) => [...prev, p])
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    )

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [enabled])

  const reset = () => setPositions([])

  return { positions, current, reset }
}

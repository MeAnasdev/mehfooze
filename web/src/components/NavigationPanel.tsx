interface Step {
  instruction: string
  distance: number
  duration: number
}

interface NavigationPanelProps {
  steps: Step[]
  currentStep: number
  remainingDistance: number
  remainingDuration: number
  aqiAlert?: { aqi: number; message: string } | null
}

function formatDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`
}

function formatDur(s: number): string {
  const m = Math.round(s / 60)
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`
}

function aqiColor(aqi: number): string {
  if (aqi <= 50) return '#00e400'
  if (aqi <= 100) return '#ffff00'
  if (aqi <= 150) return '#ff7e00'
  if (aqi <= 200) return '#ff0000'
  if (aqi <= 300) return '#8f3f97'
  return '#7e0023'
}

function aqiCategory(aqi: number): string {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'USG'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

export default function NavigationPanel({
  steps,
  currentStep,
  remainingDistance,
  remainingDuration,
  aqiAlert,
}: NavigationPanelProps) {
  const step = steps[currentStep]

  return (
    <div className="bg-surface-container-lowest border-t border-outline-variant p-4 space-y-3">
      {/* AQI Alert */}
      {aqiAlert && (
        <div
          className="p-3 rounded-xl text-white text-sm font-medium"
          style={{ background: aqiColor(aqiAlert.aqi) }}
        >
          AQI Alert: {aqiAlert.aqi} {aqiCategory(aqiAlert.aqi)} &mdash; {aqiAlert.message}
        </div>
      )}

      {/* Current instruction */}
      {step && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-lg">
            <span className="material-symbols-outlined">arrow_forward</span>
          </div>
          <div>
            <p className="font-semibold text-on-surface text-sm capitalize">{step.instruction.replace(/_/g, ' ')}</p>
            <p className="text-xs text-on-surface-variant">{formatDist(step.distance)}</p>
          </div>
        </div>
      )}

      {/* Remaining */}
      <div className="flex justify-between text-xs text-on-surface-variant">
        <span>{formatDist(remainingDistance)} left</span>
        <span>{formatDur(remainingDuration)} remaining</span>
      </div>
    </div>
  )
}

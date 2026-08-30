import { useMemo } from 'react'
import { aqiColour } from '../utils/aqi'

interface HourData {
  hour: number
  aqi: number
}

interface ExposureDialProps {
  data: HourData[]
  currentHour?: number
  size?: number
}

export default function ExposureDial({ data, currentHour, size = 256 }: ExposureDialProps) {
  const hour = currentHour ?? new Date().getHours()
  const avg = useMemo(() => data.length ? Math.round(data.reduce((s, d) => s + d.aqi, 0) / data.length) : 0, [data])

  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size }}>
      {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => {
        const angle = (h / 24) * 360 - 90
        const rad = (angle * Math.PI) / 180
        const x = 100 + 85 * Math.cos(rad)
        const y = 100 + 85 * Math.sin(rad)
        return (
          <text key={h} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-on-surface-variant font-timestamp">
            {h}
          </text>
        )
      })}

      {data.map((d, i) => {
        const angle = (d.hour / 24) * 360 - 90
        const nextAngle = ((d.hour + 1) / 24) * 360 - 90
        const rad1 = (angle * Math.PI) / 180
        const rad2 = (nextAngle * Math.PI) / 180
        const innerR = 50, outerR = 75
        const x1 = 100 + innerR * Math.cos(rad1), y1 = 100 + innerR * Math.sin(rad1)
        const x2 = 100 + outerR * Math.cos(rad1), y2 = 100 + outerR * Math.sin(rad1)
        const x3 = 100 + outerR * Math.cos(rad2), y3 = 100 + outerR * Math.sin(rad2)
        const x4 = 100 + innerR * Math.cos(rad2), y4 = 100 + innerR * Math.sin(rad2)
        const isCurrent = d.hour === hour
        return (
          <path
            key={i}
            d={`M${x1},${y1} L${x2},${y2} A${outerR},${outerR} 0 0,1 ${x3},${y3} L${x4},${y4} A${innerR},${innerR} 0 0,0 ${x1},${y1}`}
            fill={aqiColour(d.aqi)}
            opacity={isCurrent ? 1 : 0.7}
            stroke={isCurrent ? '#161d19' : 'white'}
            strokeWidth={isCurrent ? 2 : 1}
          />
        )
      })}

      <circle cx="100" cy="100" r="40" fill="white" />
      <text x="100" y="95" textAnchor="middle" className="text-lg font-bold fill-on-surface">{avg}</text>
      <text x="100" y="110" textAnchor="middle" className="text-[10px] fill-on-surface-variant font-label-sm">Avg AQI</text>
    </svg>
  )
}

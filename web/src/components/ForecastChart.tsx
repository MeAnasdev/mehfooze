import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import type { ForecastPoint } from '../services/api'

interface ForecastChartProps {
  data: ForecastPoint[]
  zone?: string
}

export default function ForecastChart({ data }: ForecastChartProps) {
  if (!data.length) return null

  const chartData = data.slice(0, 12).map((d, i) => ({
    hour: i === 0 ? 'Now' : `+${d.hour}h`,
    aqi: Math.round(d.aqi),
    isHigh: d.aqi > 100,
  }))

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <XAxis dataKey="hour" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 300]} fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(v: number) => [`AQI ${v}`, 'Forecast']}
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #bccabf',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <ReferenceLine y={50} stroke="#00e400" strokeDasharray="4 4" />
          <ReferenceLine y={100} stroke="#ffff00" strokeDasharray="4 4" />
          <ReferenceLine y={150} stroke="#ff7e00" strokeDasharray="4 4" />
          <Bar dataKey="aqi" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.isHigh ? '#ffdad6' : '#00b074'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="font-timestamp text-timestamp text-on-surface-variant mt-2 italic">Forecast estimated from nearest monitoring station</p>
    </div>
  )
}

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { ForecastPoint } from '../types/api'

interface ForecastChartProps {
  data: ForecastPoint[]
  zone: string
}

/**
 * 24–72 hour AQI forecast chart for a given zone.
 * Reference lines mark EPA category thresholds.
 */
export default function ForecastChart({ data, zone }: ForecastChartProps) {
  return (
    <section className="forecast-chart">
      <h2 className="forecast-chart__title">24–72h Forecast · {zone}</h2>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} />
          <YAxis domain={[0, 300]} />
          <Tooltip
            formatter={(value: number) => [`AQI ${value}`, 'Forecast']}
            labelFormatter={(label) => `+${label} hours`}
          />
          {/* EPA threshold lines */}
          <ReferenceLine y={50} stroke="#22c55e" strokeDasharray="4 2" label="Good" />
          <ReferenceLine y={100} stroke="#eab308" strokeDasharray="4 2" label="Moderate" />
          <ReferenceLine y={150} stroke="#f97316" strokeDasharray="4 2" label="Unhealthy SG" />
          <Line
            type="monotone"
            dataKey="aqi"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="chart-disclaimer">Forecast estimated from nearest monitoring station.</p>
    </section>
  )
}

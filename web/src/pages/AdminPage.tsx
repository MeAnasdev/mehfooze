import { useState, useEffect } from 'react'

interface SystemStats {
  totalZones: number
  totalReadings: number
  latestReadingTime: string | null
  totalTokens: number
  totalAlerts: number
  recentAlerts: number
  dataSources: { name: string; status: string; type: string }[]
}

interface DataHealth {
  zone: string
  lastFetch: string | null
  readingCount: number
  status: string
}

interface ContentItem {
  id: string
  title: string
  category: string
  body: string
  active: boolean
}

type Tab = 'overview' | 'data' | 'content'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [health, setHealth] = useState<DataHealth[]>([])
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      fetch('/api/admin/stats').then((r) => r.json()),
      fetch('/api/admin/health').then((r) => r.json()),
      fetch('/api/admin/content').then((r) => r.json()),
    ]).then(([statsRes, healthRes, contentRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value)
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value)
      if (contentRes.status === 'fulfilled') setContent(contentRes.value)
      setLoading(false)
    })
  }, [])

  const statusColor = (s: string) =>
    s === 'healthy' ? 'text-green-600 bg-green-50' :
    s === 'stale' ? 'text-amber-600 bg-amber-50' :
    'text-red-600 bg-red-50'

  return (
    <div className="space-y-3">
      <div className="mb-2">
        <div className="text-[9px] text-outline font-bold uppercase tracking-widest mb-0.5">Admin Dashboard</div>
        <h2 className="text-lg text-on-background font-bold">System Overview</h2>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-container-low rounded-full p-0.5 border border-outline-variant/30 w-fit">
        {([['overview', 'Overview'], ['data', 'Data Health'], ['content', 'Content']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
              tab === key ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Overview Tab */}
      {!loading && tab === 'overview' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
            <p className="text-[9px] text-tertiary uppercase tracking-wider font-semibold mb-2">Zones</p>
            <p className="text-2xl font-bold text-on-surface">{stats.totalZones}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Monitored areas</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
            <p className="text-[9px] text-tertiary uppercase tracking-wider font-semibold mb-2">Readings</p>
            <p className="text-2xl font-bold text-on-surface">{stats.totalReadings.toLocaleString()}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">
              Last: {stats.latestReadingTime ? new Date(stats.latestReadingTime).toLocaleString() : 'Never'}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
            <p className="text-[9px] text-tertiary uppercase tracking-wider font-semibold mb-2">Alerts</p>
            <p className="text-2xl font-bold text-on-surface">{stats.recentAlerts}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">Last 24 hours</p>
          </div>
          <div className="md:col-span-3 bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
            <p className="text-[9px] text-tertiary uppercase tracking-wider font-semibold mb-3">Data Sources</p>
            <div className="space-y-2">
              {stats.dataSources.map((ds) => (
                <div key={ds.name} className="flex items-center justify-between p-2.5 bg-surface-container-low rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">database</span>
                    <span className="text-xs font-medium text-on-surface">{ds.name}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(ds.status)}`}>
                    {ds.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Health Tab */}
      {!loading && tab === 'data' && (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <div className="p-4 border-b border-outline-variant/50">
            <h3 className="text-sm font-semibold text-on-surface">Zone Data Health</h3>
          </div>
          <div className="divide-y divide-outline-variant/30">
            {health.map((z) => (
              <div key={z.zone} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-on-surface">{z.zone}</p>
                  <p className="text-[10px] text-on-surface-variant">
                    {z.readingCount} readings · Last: {z.lastFetch ? new Date(z.lastFetch).toLocaleString() : 'None'}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(z.status)}`}>
                  {z.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Tab */}
      {!loading && tab === 'content' && (
        <div className="space-y-3">
          {content.map((item) => (
            <div key={item.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-on-surface">{item.title}</h4>
                  <p className="text-[10px] text-primary mt-0.5">{item.category}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  item.active ? 'text-green-600 bg-green-50' : 'text-outline bg-surface-container'
                }`}>
                  {item.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2 line-clamp-2">{item.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

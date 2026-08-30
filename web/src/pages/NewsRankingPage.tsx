import { useEffect, useState } from 'react'
import CityRanking from '../components/CityRanking'
import NewsFeed from '../components/NewsFeed'
import { CityRanking as CityRankingType } from '../services/api'

const tabs = ['Ranking', 'News', 'Resources'] as const

const resources = [
  { title: 'US EPA AQI Guidelines', desc: 'Official breakpoints for air quality categories' },
  { title: 'WHO Air Quality Guidelines', desc: 'Global standards for PM2.5, PM10, and other pollutants' },
  { title: 'Protective Measures', desc: 'How to reduce exposure during high AQI days' },
]

export default function NewsRankingPage() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Ranking')
  const [rankings, setRankings] = useState<CityRankingType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rankings')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setRankings)
      .catch(() => {
        import('../services/api').then(({ fetchGlobalRankings }) =>
          fetchGlobalRankings().then(setRankings).catch(() => {})
        )
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-section-margin">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">News &amp; Ranking</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary-container/20 text-primary border border-primary'
                : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
        <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
        LIVE {new Date().getHours()}:00-{new Date().getHours() + 1}:00, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>

      {activeTab === 'Ranking' && <CityRanking cities={rankings} loading={loading} />}
      {activeTab === 'News' && <NewsFeed />}
      {activeTab === 'Resources' && (
        <div className="space-y-3">
          {resources.map((r, i) => (
            <div key={i} className="p-4 bg-surface rounded-2xl border border-outline-variant">
              <p className="font-semibold text-on-surface text-sm mb-1">{r.title}</p>
              <p className="text-xs text-on-surface-variant">{r.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useAqi } from '../contexts/AqiContext'
import { aqiColour, aqiCategory } from '../utils/aqi'
import { API_BASE } from '../services/api'

const CHECKLIST_KEY = 'mehfooze_checklist'

interface KbArticle {
  id: string
  title: string
  category: string
  body: string
  active: boolean
}

// Fallback articles shown when /api/admin/content is unreachable
const DEFAULT_KB_ARTICLES: KbArticle[] = [
  { id: '1', title: 'Understanding PM2.5 and Your Lungs', category: 'air_quality', body: 'PM2.5 refers to fine particles smaller than 2.5 micrometers that can penetrate deep into the lungs and bloodstream, causing respiratory and cardiovascular health effects.', active: true },
  { id: '2', title: 'How to Wear an N95 Mask Correctly', category: 'health_tips', body: 'Ensure a tight seal around your nose and mouth. Conduct a seal check before each use. Replace when damp or after 8 hours of use in polluted environments.', active: true },
  { id: '3', title: 'Air Purifier Selection Guide', category: 'health_tips', body: 'Choose a HEPA-filter purifier sized for your room (CADR rating). Place it in the room where you spend the most time. Replace filters every 6–12 months.', active: true },
]

const tabs = ['Daily Commute', 'Outdoor Exercise', 'Home & Sleep'] as const

function getChecklists(aqi: number, profile: string) {
  const isHigh = aqi > 150
  const isModerate = aqi > 100

  return {
    'Daily Commute': [
      {
        id: 'c1',
        title: 'Wear an N95 Mask',
        description: isHigh
          ? 'Essential — PM2.5 levels are high. Protect your lungs during transit.'
          : 'Recommended if AQI is above 100 for extended outdoor exposure.',
        icon: 'masks',
      },
      {
        id: 'c2',
        title: 'Keep Vehicle Windows Closed',
        description: 'Set AC to recirculate to avoid drawing in exhaust fumes.',
        icon: 'directions_car',
      },
      {
        id: 'c3',
        title: isModerate ? 'Delay Return Trip if Possible' : 'Plan Shortest Route',
        description: isModerate
          ? 'Pollution is expected to clear up later. Plan accordingly.'
          : 'Air quality is acceptable. Take your usual route.',
        icon: 'schedule',
      },
    ],
    'Outdoor Exercise': [
      {
        id: 'e1',
        title: isHigh ? 'Avoid Outdoor Exercise' : 'Limit Intensity',
        description: isHigh
          ? 'AQI is above 150. Move your workout indoors or reschedule.'
          : 'Keep outdoor exercise light. Monitor how you feel.',
        icon: 'directions_run',
      },
      {
        id: 'e2',
        title: 'Check Air Quality Before Leaving',
        description: 'Use Mehfooze to check real-time AQI at your exercise location.',
        icon: 'air',
      },
      {
        id: 'e3',
        title: 'Wear a Mask During Warm-up',
        description: profile === 'patient'
          ? 'As a respiratory patient, always mask up during outdoor warm-ups.'
          : 'Optional but recommended during warm-up near traffic.',
        icon: 'masks',
      },
    ],
    'Home & Sleep': [
      {
        id: 'h1',
        title: 'Close Windows & Doors',
        description: isHigh
          ? 'Keep all windows sealed. Run air purifier on maximum.'
          : 'Close windows if outdoor AQI exceeds 100.',
        icon: 'door_sliding',
      },
      {
        id: 'h2',
        title: 'Run Air Purifier',
        description: 'Set to auto mode. Clean air improves sleep quality significantly.',
        icon: 'air_purifier_genie',
      },
      {
        id: 'h3',
        title: 'Monitor Indoor Air Quality',
        description: profile === 'parent'
          ? 'Children are more vulnerable. Ensure their room air purifier is running.'
          : profile === 'patient'
            ? 'As a respiratory patient, indoor air quality directly affects your symptoms. Keep purifier running.'
            : 'Good indoor air quality helps you recover from daily exposure.',
        icon: 'monitor_heart',
      },
    ],
  }
}

function getHealthTips(aqi: number, locationName: string) {
  const tips: string[] = []
  if (aqi <= 50) {
    tips.push('Air quality is excellent. Great day for outdoor activities!')
    tips.push('Open windows to ventilate your home naturally.')
  } else if (aqi <= 100) {
    tips.push('Air quality is moderate. Sensitive groups should limit prolonged outdoor exertion.')
    tips.push('Consider using a mask if you have respiratory conditions.')
  } else if (aqi <= 150) {
    tips.push('Sensitive groups may experience health effects. Reduce outdoor activities.')
    tips.push('Keep windows closed and use air purifiers indoors.')
    tips.push('Wear N95 masks when going outside.')
  } else {
    tips.push('Health alert: avoid all outdoor activities if possible.')
    tips.push('Seal all windows and run air purifier on maximum.')
    tips.push('Wear N95 mask even for short outdoor trips.')
  }
  tips.push(`Current location: ${locationName || 'Lahore'} — data from Open-Meteo CAMS.`)
  return tips
}

export default function SafeHabitsPage() {
  const { current, profile, locationName } = useAqi()
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Daily Commute')
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [history, setHistory] = useState<Record<string, string[]>>({})
  const [kbArticles, setKbArticles] = useState<KbArticle[]>([])

  // Fetch knowledge base articles from admin content endpoint
  useEffect(() => {
    fetch(`${API_BASE}/api/admin/content`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((items: KbArticle[]) => {
        const active = items.filter((a) => a.active)
        setKbArticles(active.length > 0 ? active : DEFAULT_KB_ARTICLES)
      })
      .catch(() => setKbArticles(DEFAULT_KB_ARTICLES))
  }, [])

  const aqi = current?.aqi ?? 120
  const checklists = getChecklists(aqi, profile)
  const healthTips = getHealthTips(aqi, locationName)
  const currentChecklist = checklists[activeTab] || []

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        setCheckedItems(data.checked || {})
        setHistory(data.history || {})
      }
    } catch {}
  }, [])

  const persist = (checked: Record<string, boolean>, hist: Record<string, string[]>) => {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify({ checked, history: hist }))
  }

  const toggleCheck = (id: string) => {
    const newChecked = { ...checkedItems, [id]: !checkedItems[id] }
    setCheckedItems(newChecked)

    if (newChecked[id]) {
      const today = new Date().toISOString().split('T')[0]
      const newHistory = { ...history }
      if (!newHistory[id]) newHistory[id] = []
      if (!newHistory[id].includes(today)) {
        newHistory[id] = [...newHistory[id], today]
      }
      setHistory(newHistory)
      persist(newChecked, newHistory)
    } else {
      persist(newChecked, history)
    }
  }

  const getStreak = (id: string): number => {
    const dates = history[id] || []
    if (dates.length === 0) return 0
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      if (dates.includes(dateStr)) streak++
      else break
    }
    return streak
  }

  const completedCount = currentChecklist.filter((item) => checkedItems[item.id]).length
  const totalCount = currentChecklist.length

  return (
    <div className="space-y-3">
      <div className="mb-2 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1">
        <div>
          <div className="text-[9px] sm:text-[10px] text-outline uppercase tracking-wider mb-0.5 font-semibold">
            Personalized For You &bull; {
              profile === 'patient' ? 'Patient' :
              profile === 'parent' ? 'Parent' :
              profile === 'commuter' ? 'Commuter' :
              profile === 'student' ? 'Student' : 'Citizen'
            } Profile
          </div>
          <h2 className="text-lg sm:text-xl text-on-surface font-bold">
            Safe Habits & Advisory
          </h2>
          <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 max-w-2xl">
            Actionable guidance to minimize your exposure based on today's air quality.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-4">
          {/* Rio Advisory with real AQI */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-outline-variant/50 shadow-ambient relative overflow-hidden flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
            <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
              <span className="material-symbols-outlined text-[120px] sm:text-[200px]">shield</span>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 shrink-0 bg-surface-container rounded-full flex items-center justify-center p-3 sm:p-4 relative">
              <img
                src="/ghost-logo.png"
                alt="Rio"
                className="w-full h-full object-contain z-10"
              />
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse opacity-20" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 mb-1 sm:mb-2 justify-center sm:justify-start">
                <span className="material-symbols-outlined text-primary text-xs sm:text-sm">
                  robot_2
                </span>
                <span className="text-[10px] sm:text-xs text-primary font-bold">
                  Rio's Advisory
                </span>
              </div>
              <h3 className="text-sm sm:text-base mb-1 sm:mb-2 text-on-surface font-semibold">
                {aqi <= 50
                  ? '"Great day for outdoor activities!"'
                  : aqi <= 100
                    ? '"Air quality is acceptable today."'
                    : aqi <= 150
                      ? '"Take precautions during your commute."'
                      : '"Stay indoors if possible today."'}
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Air quality is currently{' '}
                <strong style={{ color: aqiColour(aqi) }}>
                  {aqiCategory(aqi)} (AQI {Math.round(aqi)})
                </strong>{' '}
                in your area. As a {
                  profile === 'patient' ? 'respiratory patient' :
                  profile === 'parent' ? 'parent' :
                  profile === 'commuter' ? 'daily commuter' :
                  profile === 'student' ? 'student' : 'citizen'
                }, you should{' '}
                {aqi <= 50
                  ? 'enjoy the fresh air!'
                  : aqi <= 100
                    ? 'take normal precautions.'
                    : 'take extra precautions during your transit.'}
              </p>
            </div>
          </div>

          {/* Activity Tabs & Checklist */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-outline-variant/50 shadow-ambient">
            <div className="flex space-x-1 sm:space-x-2 border-b border-outline-variant/30 mb-4 sm:mb-6 pb-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap font-medium ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-on-surface-variant hover:text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h4 className="text-sm sm:text-base text-on-surface font-semibold">
                Your {activeTab === 'Home & Sleep' ? 'Home' : activeTab.replace(' & ', ' & ')} Checklist
              </h4>
              <span className="text-[10px] sm:text-xs text-primary font-bold bg-primary-container/20 px-2 py-0.5 rounded-full">
                {completedCount}/{totalCount} done
              </span>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {currentChecklist.map((item) => {
                const streak = getStreak(item.id)
                return (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:xl hover:bg-surface-container-lowest border border-outline-variant/20 transition-colors cursor-pointer group"
                  >
                    <div className="mt-0.5">
                      <input
                        type="checkbox"
                        checked={checkedItems[item.id] || false}
                        onChange={() => toggleCheck(item.id)}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded border-outline text-primary focus:ring-primary checked:bg-primary"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm sm:text-base text-on-surface group-hover:text-primary transition-colors font-medium">
                        {item.title}
                      </div>
                      <div className="text-xs text-on-surface-variant mt-0.5 sm:mt-1">
                        {item.description}
                      </div>
                      {streak > 0 && (
                        <div className="text-[10px] text-primary font-semibold mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">local_fire_department</span>
                          {streak} day streak
                        </div>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-outline-variant text-lg shrink-0">
                      {item.icon}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Health Tips based on AQI + Weather */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-outline-variant/50 shadow-ambient">
            <h4 className="text-sm sm:text-base text-on-surface font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">tips_and_updates</span>
              Health Tips for Today
            </h4>
            <div className="space-y-2">
              {healthTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary text-sm mt-0.5">check_circle</span>
                  <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-4">
          {/* Health Profile */}
          <div className="bg-surface-container-low rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-outline-variant/30">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h4 className="text-sm sm:text-base text-on-surface font-semibold">Health Profile</h4>
              <a href="/profile" className="text-primary hover:text-primary-fixed-dim">
                <span className="material-symbols-outlined text-sm">edit</span>
              </a>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <span className="px-2 sm:px-3 py-1 bg-white border border-outline-variant rounded-full text-[10px] sm:text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">
                  {profile === 'parent' ? 'child_care' :
                   profile === 'patient' ? 'pulmonology' :
                   profile === 'commuter' ? 'directions_car' :
                   profile === 'student' ? 'school' : 'person'}
                </span>{' '}
                {profile === 'citizen' ? 'Citizen' :
                 profile === 'parent' ? 'Parent' :
                 profile === 'patient' ? 'Patient' :
                 profile === 'commuter' ? 'Commuter' :
                 profile === 'student' ? 'Student' : 'Citizen'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant border-t border-outline-variant/30 pt-3 sm:pt-4">
              Your advisories are currently tuned based on your selected profile and today's air quality (AQI {Math.round(aqi)}).
            </p>
          </div>

          {/* Activity Summary */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-outline-variant/50 shadow-ambient">
            <h4 className="text-sm sm:text-base text-on-surface font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">bar_chart</span>
              Your Progress
            </h4>
            <div className="space-y-3">
              {tabs.map((tab) => {
                const items = checklists[tab]
                const done = items.filter((item) => checkedItems[item.id]).length
                const pct = Math.round((done / items.length) * 100)
                return (
                  <div key={tab}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] sm:text-xs text-on-surface-variant">{tab}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-primary">{pct}%</span>
                    </div>
                    <div className="w-full bg-surface-variant rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Knowledge Base */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-outline-variant/50 shadow-ambient flex-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h4 className="text-sm sm:text-base text-on-surface font-semibold">Knowledge Base</h4>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              {kbArticles.slice(0, 3).map((article) => (
                <button
                  key={article.id}
                  className="group flex gap-3 sm:gap-4 items-start text-left w-full"
                  onClick={() => {
                    // Open article body in a simple alert until article detail page exists
                    alert(`${article.title}\n\n${article.body}`)
                  }}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">article</span>
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2 font-medium">
                      {article.title}
                    </h5>
                    <span className="text-[10px] sm:text-xs text-outline mt-0.5 sm:mt-1 block capitalize">
                      {article.category.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              ))}
              {kbArticles.length === 0 && (
                <p className="text-xs text-on-surface-variant">No articles available. Check back soon.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

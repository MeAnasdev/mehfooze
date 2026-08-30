import { useState } from 'react'

const tabs = ['Daily Commute', 'Outdoor Exercise', 'Home & Sleep'] as const

const commuteChecklist = [
  {
    id: 1,
    title: 'Wear an N95 Mask',
    description: 'Essential for your bus route down Main St where PM2.5 is peaking.',
    icon: 'masks',
    checked: true,
  },
  {
    id: 2,
    title: 'Keep Vehicle Windows Closed',
    description: 'Set AC to recirculate to avoid drawing in exhaust fumes.',
    icon: 'directions_car',
    checked: false,
  },
  {
    id: 3,
    title: 'Delay Return Trip if Possible',
    description: 'Pollution is expected to clear up slightly after 7:30 PM.',
    icon: 'schedule',
    checked: false,
  },
]

const knowledgeBase = [
  { title: 'Understanding PM2.5 and Your Lungs', readTime: '3 min read', type: 'article' },
  { title: 'How to optimize your indoor air purifier', readTime: '5 min read', type: 'article' },
  { title: 'Video: Proper N95 Mask Fitting', readTime: '1:45 \u2022 Tutorial', type: 'video' },
]

export default function SafeHabitsPage() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Daily Commute')
  const [checklist, setChecklist] = useState(commuteChecklist)

  const toggleCheck = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    )
  }

  return (
    <div className="space-y-3">
      {/* Page Header */}
      <div className="mb-2 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1">
        <div>
          <div className="text-[9px] sm:text-[10px] text-outline uppercase tracking-wider mb-0.5 font-semibold">
            Personalized For You &bull; Commuter Profile
          </div>
          <h2 className="text-lg sm:text-xl text-on-surface font-bold">
            Safe Habits & Advisory
          </h2>
          <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5 max-w-2xl">
            Actionable guidance to minimize your exposure based on today's air quality.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Daily Plan & Context */}
        <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-4">
          {/* Rio's Contextual Advisory Bento */}
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
                "Today is a good day for indoor activities."
              </h3>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Air quality is currently{' '}
                <strong className="text-error">Poor (AQI 154)</strong> in your area. As a daily
                commuter, you should take extra precautions during your evening transit.
              </p>
            </div>
          </div>

          {/* Activity Tabs & Daily Checklist */}
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
            <h4 className="text-sm sm:text-base text-on-surface mb-3 sm:mb-4 font-semibold">
              Your Commute Checklist
            </h4>
            <div className="space-y-2 sm:space-y-3">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:xl hover:bg-surface-container-lowest border border-outline-variant/20 transition-colors cursor-pointer group"
                >
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      checked={item.checked}
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
                  </div>
                  <span className="material-symbols-outlined text-outline-variant text-lg shrink-0">
                    {item.icon}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Profile & Education */}
        <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-4">
          {/* Health Profile Summary */}
          <div className="bg-surface-container-low rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-outline-variant/30">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h4 className="text-sm sm:text-base text-on-surface font-semibold">Health Profile</h4>
              <button className="text-primary hover:text-primary-fixed-dim">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <span className="px-2 sm:px-3 py-1 bg-white border border-outline-variant rounded-full text-[10px] sm:text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">directions_bus</span>{' '}
                Commuter
              </span>
              <span className="px-2 sm:px-3 py-1 bg-white border border-outline-variant rounded-full text-[10px] sm:text-xs text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">pulmonology</span>{' '}
                Mild Asthma
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant border-t border-outline-variant/30 pt-3 sm:pt-4">
              Your advisories are currently tuned to be more sensitive due to indicated respiratory
              conditions.
            </p>
          </div>

          {/* Educational Library Bento */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-outline-variant/50 shadow-ambient flex-1">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h4 className="text-sm sm:text-base text-on-surface font-semibold">Knowledge Base</h4>
              <a className="text-xs sm:text-sm text-primary hover:underline font-medium" href="#">
                View All
              </a>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              {knowledgeBase.map((item, i) => (
                <a key={i} className="group flex gap-3 sm:gap-4 items-center" href="#">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container flex items-center justify-center">
                    {item.type === 'video' ? (
                      <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">
                        play_circle
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">
                        article
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs sm:text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2 font-medium">
                      {item.title}
                    </h5>
                    <span className="text-[10px] sm:text-xs text-outline mt-0.5 sm:mt-1 block">
                      {item.readTime}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

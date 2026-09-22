import { Outlet, NavLink, useLocation } from 'react-router-dom'

/**
 * Government Dashboard shell — a separate, professional surface for officials
 * (EPA Punjab, district administration). Light, clean theme with soft green
 * accents — same Mehfooze brand, but bright and pleasant. No Rio.
 */

const govNav = [
  { path: '/gov', label: 'Overview', icon: 'dashboard' },
  { path: '/gov/zones', label: 'Zone Accountability', icon: 'table_rows' },
  { path: '/gov/reports', label: 'Report Queue', icon: 'inbox' },
  { path: '/gov/map', label: 'Hotspot Map', icon: 'map' },
  { path: '/gov/priority', label: 'Priority', icon: 'target' },
]

function GovSidebar() {
  const location = useLocation()
  return (
    <aside className="w-56 h-screen sticky left-0 top-0 bg-white border-r border-outline-variant flex flex-col py-4 px-2.5 shrink-0 hidden md:flex">
      <div className="mb-5 px-2.5 flex items-center gap-2.5">
        <img src="/ghost-logo.png" alt="Mehfooze" className="w-8 h-8" />
        <div>
          <h1 className="text-sm font-bold text-primary leading-tight">Mehfooze</h1>
          <p className="text-[9px] text-on-surface-variant leading-tight">Government Console</p>
        </div>
      </div>

      <div className="px-2.5 mb-1.5 text-[9px] uppercase tracking-wider font-semibold text-tertiary">
        Environmental Intelligence
      </div>

      <nav className="flex-1 space-y-0.5">
        {govNav.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/gov' && location.pathname.startsWith(item.path))
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/gov'}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-[13px] ${
                isActive
                  ? 'bg-primary-container/25 text-primary font-bold border-l-[3px] border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto px-2.5">
        <NavLink to="/" className="flex items-center gap-2 text-[11px] text-on-surface-variant hover:text-primary py-1.5">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Citizen App</span>
        </NavLink>
        <p className="text-[9px] text-outline mt-2 leading-relaxed">
          Data: EPA Punjab / Urban Unit 2025 · Open-Meteo · Citizen reports
        </p>
      </div>
    </aside>
  )
}

function GovMobileNav() {
  const location = useLocation()
  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-outline-variant flex items-center justify-around h-14 z-50">
      {govNav.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== '/gov' && location.pathname.startsWith(item.path))
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/gov'}
            className={`flex flex-col items-center gap-0.5 p-1.5 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className="text-[8px] font-medium leading-tight">{item.label.split(' ')[0]}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function GovLayout() {
  return (
    <div className="flex h-screen overflow-hidden font-body-md text-body-md antialiased bg-surface">
      <GovSidebar />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-surface-container-lowest">
        <header className="hidden md:flex items-center justify-between px-6 h-12 bg-white/80 backdrop-blur-md border-b border-outline-variant sticky top-0 z-40 shrink-0">
          <h2 className="text-sm font-semibold text-on-surface">Government Environmental Console</h2>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-primary-container/20 text-primary font-medium">Lahore Division</span>
        </header>
        <div className="p-4 lg:p-6 max-w-[1200px] mx-auto w-full flex-1 pb-20 md:pb-6">
          <Outlet />
        </div>
      </main>
      <GovMobileNav />
    </div>
  )
}

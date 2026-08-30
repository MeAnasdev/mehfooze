import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from './ThemeToggle'
import DownloadBanner from './DownloadBanner'
import { requestNotificationPermission } from '../services/notifications'

const navItems = [
  { path: '/', label: 'Overview', icon: 'home' },
  { path: '/exposure', label: 'Exposure', icon: 'timeline' },
  { path: '/map', label: 'City map', icon: 'map' },
  { path: '/habits', label: 'Safe habits', icon: 'health_and_safety' },
  { path: '/profile', label: 'Profile', icon: 'person' },
]

function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-52 xl:w-56 h-screen sticky left-0 top-0 bg-surface border-r border-outline-variant flex flex-col py-4 px-2.5 shrink-0 hidden md:flex">
      <div className="mb-5 px-2.5 flex items-center gap-2.5">
        <img src="/ghost-logo.png" alt="Mehfooze" className="w-8 h-8" />
        <div>
          <h1 className="text-sm font-bold text-primary leading-tight">Mehfooze</h1>
          <p className="text-[9px] text-on-surface-variant leading-tight">Stay safe. Stay ahead.</p>
        </div>
      </div>

      <div className="px-2.5 mb-1.5 text-[9px] text-tertiary uppercase tracking-wider font-semibold">
        Your Safety Companion
      </div>

      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path === '/' && location.pathname === '')
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-[13px] ${
                isActive
                  ? 'text-primary bg-primary-container/10 font-bold border-l-[3px] border-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span
                className={`material-symbols-outlined text-lg ${isActive ? 'fill' : ''}`}
                style={isActive ? { fontVariationSettings: '"FILL" 1' } : undefined}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto space-y-1.5">
        <a
          className="flex items-center gap-2.5 px-2.5 py-1.5 text-on-surface-variant hover:text-primary transition-colors text-[11px]"
          href="#"
        >
          <span className="material-symbols-outlined text-base">settings</span>
          <span>Settings</span>
        </a>
        <a
          className="flex items-center gap-2.5 px-2.5 py-1.5 text-on-surface-variant hover:text-primary transition-colors text-[11px]"
          href="#"
        >
          <span className="material-symbols-outlined text-base">help</span>
          <span>Help</span>
        </a>
      </div>
    </aside>
  )
}

function TopBar({ locationName }: { locationName: string }) {
  const { user } = useAuth()
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle')

  const handleNotifClick = async () => {
    if (notifStatus === 'granted') return
    const token = await requestNotificationPermission()
    setNotifStatus(token ? 'granted' : 'denied')
  }

  return (
    <header className="hidden md:flex items-center justify-between px-5 h-11 w-full bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant/50 shrink-0">
      <div />
      <div className="flex items-center gap-2.5">
        {/* Location Selector */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant/60 hover:bg-surface-container-high transition-colors text-xs text-on-surface">
          <span className="material-symbols-outlined text-sm text-primary">location_on</span>
          <span className="font-medium">{locationName || 'Lahore'}</span>
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">expand_more</span>
        </button>
        <ThemeToggle />
        <button
          onClick={handleNotifClick}
          className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container relative"
          title={notifStatus === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
        >
          <span className="material-symbols-outlined text-lg">
            {notifStatus === 'granted' ? 'notifications' : 'notifications_active'}
          </span>
          {notifStatus !== 'granted' && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-error rounded-full" />
          )}
        </button>
        {user?.photoURL ? (
          <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" />
        ) : (
          <button className="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-[10px]">
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </button>
        )}
      </div>
    </header>
  )
}

function MobileBottomNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-surface/80 backdrop-blur-md border-t border-outline-variant flex items-center justify-around h-13 z-50 pb-safe">
      {navItems.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path === '/' && location.pathname === '')
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={`flex flex-col items-center gap-0.5 p-1.5 ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${isActive ? 'fill' : ''}`}
              style={isActive ? { fontVariationSettings: '"FILL" 1' } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-[9px] font-medium leading-tight">
              {item.label.split(' ').pop()}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden font-body-md text-body-md antialiased bg-surface">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-surface-container-lowest">
        <TopBar locationName="" />
        <div className="p-3 sm:p-4 lg:px-5 lg:py-4 max-w-[1100px] mx-auto w-full flex-1 pb-16 md:pb-4">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
      <DownloadBanner />
    </div>
  )
}

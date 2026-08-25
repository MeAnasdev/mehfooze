import { Outlet, NavLink } from 'react-router-dom'

/**
 * Shell layout wrapping all pages.
 * Provides the top nav with mode switcher (Home / Travel / Schools).
 */
export default function Layout() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? 'nav-link--active' : ''}`

  return (
    <div className="app-shell">
      <header className="header">
        <span className="header__logo">مہفوظ Mehfooze</span>
        <nav className="header__nav">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/travel" className={navClass}>Travel</NavLink>
          <NavLink to="/schools" className={navClass}>Schools</NavLink>
        </nav>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>Data labelled "estimated from nearest station" · Mehfooze 2026</p>
      </footer>
    </div>
  )
}

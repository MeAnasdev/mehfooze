import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import TravelPage from './pages/TravelPage'
import SchoolsPage from './pages/SchoolsPage'
import NotFoundPage from './pages/NotFoundPage'

/**
 * Root application component.
 * Routes:
 *   /         → Mehfooze Home  (default citizen advisory view)
 *   /travel   → Mehfooze Travel (route AQI + flood-risk)
 *   /schools  → Mehfooze Schools (go / no-go signal)
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="travel" element={<TravelPage />} />
          <Route path="schools" element={<SchoolsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

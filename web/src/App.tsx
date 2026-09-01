import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AqiProvider } from './contexts/AqiContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import Onboarding from './components/Onboarding'
import LoginPage from './pages/LoginPage'
import MyAirPage from './pages/MyAirPage'
import MapPage from './pages/MapPage'
import ExposurePage from './pages/ExposurePage'
import SafeHabitsPage from './pages/SafeHabitsPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import DownloadPage from './pages/DownloadPage'
import ApkPage from './pages/ApkPage'
import NotFoundPage from './pages/NotFoundPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="loading-spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="loading-spinner" /></div>
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/download" element={<DownloadPage />} />
      <Route path="/apk" element={<ApkPage />} />
      <Route path="/" element={<ProtectedRoute><AqiProvider><Layout /></AqiProvider></ProtectedRoute>}>
        <Route index element={<MyAirPage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="exposure" element={<ExposurePage />} />
        <Route path="habits" element={<SafeHabitsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    const onboardingDone = localStorage.getItem('onboarding_completed')
    if (onboardingDone) {
      setShowOnboarding(false)
      setAppReady(true)
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
    const onboardingDone = localStorage.getItem('onboarding_completed')
    if (!onboardingDone) {
      setShowOnboarding(true)
    } else {
      setAppReady(true)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    setAppReady(true)
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  if (!appReady) {
    return null
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App

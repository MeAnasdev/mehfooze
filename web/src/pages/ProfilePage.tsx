import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

const profileTypes = [
  { id: 'citizen', label: 'Citizen', icon: 'person' },
  { id: 'commuter', label: 'Commuter', icon: 'pedal_bike' },
  { id: 'parent', label: 'Parent', icon: 'child_care' },
  { id: 'patient', label: 'Patient', icon: 'pulmonology' },
  { id: 'student', label: 'Student', icon: 'school' },
]

const PROFILE_KEY = 'mehfooze_profile'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const [selectedProfile, setSelectedProfile] = useState('citizen')
  const [alertThreshold, setAlertThreshold] = useState(100)
  const [rioPopups, setRioPopups] = useState(true)
  const [displayUnits, setDisplayUnits] = useState('us-aqi')
  const [showSignIn, setShowSignIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const { signIn, signUp, signInWithGoogle } = useAuth()

  const [fullName, setFullName] = useState('')
  const [savedLocations, setSavedLocations] = useState([
    { name: 'Home', address: 'Lahore, Gulberg III', icon: 'home' },
    { name: 'Work', address: 'Lahore, Model Town', icon: 'work' },
  ])

  useEffect(() => {
    if (user) {
      setFullName(user.displayName || '')
    }
  }, [user])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.profile) setSelectedProfile(data.profile)
        if (data.alertThreshold) setAlertThreshold(data.alertThreshold)
        if (data.fullName) setFullName(data.fullName)
      }
    } catch {}
  }, [])

  const saveProfile = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      profile: selectedProfile,
      alertThreshold,
      fullName,
    }))
  }

  const handleAuth = async () => {
    try {
      if (isSignUp) await signUp(email, password)
      else await signIn(email, password)
      setShowSignIn(false)
    } catch (err) {
      console.error(err)
    }
  }

  const removeLocation = (index: number) => {
    setSavedLocations((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <header className="mb-2">
        <h1 className="text-lg sm:text-xl text-on-surface mb-0.5 font-bold">
          Your Profile & Preferences
        </h1>
        <p className="text-[11px] sm:text-xs text-on-surface-variant max-w-2xl">
          Manage your personal details, saved locations, and tailor how Rio assists you in your
          daily environment.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        <div className="lg:col-span-7 flex flex-col gap-3 sm:gap-4">
          {user ? (
            <section className="glass-card p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full" />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container text-base sm:text-lg lg:text-xl font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-on-surface text-sm sm:text-base truncate">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs sm:text-sm text-on-surface-variant truncate">{user.email}</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="glass-card p-4 sm:p-6">
              {showSignIn ? (
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 sm:p-3 border border-outline-variant rounded-lg text-sm bg-surface text-on-surface"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 sm:p-3 border border-outline-variant rounded-lg text-sm bg-surface text-on-surface"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAuth}
                      className="flex-1 py-2.5 sm:py-3 bg-primary text-on-primary rounded-full font-semibold text-sm"
                    >
                      {isSignUp ? 'Sign Up' : 'Sign In'}
                    </button>
                    <button
                      onClick={() => setShowSignIn(false)}
                      className="px-3 sm:px-4 py-2.5 sm:py-3 border border-outline-variant rounded-full text-xs sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs text-primary"
                  >
                    {isSignUp
                      ? 'Already have an account? Sign In'
                      : "Don't have an account? Sign Up"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowSignIn(true)}
                    className="w-full py-2.5 sm:py-3 bg-primary text-on-primary rounded-full font-semibold text-sm"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={signInWithGoogle}
                    className="w-full py-2.5 sm:py-3 bg-surface border border-outline-variant rounded-full font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    Continue with Google
                  </button>
                </div>
              )}
            </section>
          )}

          <section className="glass-card p-4 sm:p-6">
            <h2 className="text-sm sm:text-base mb-4 sm:mb-6 flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-primary">badge</span>
              Personal Details
            </h2>
            <form className="space-y-4 sm:space-y-5" onSubmit={(e) => { e.preventDefault(); saveProfile() }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] sm:text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-medium">
                    Full Name
                  </label>
                  <input
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 sm:px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-medium">
                    Email Address
                  </label>
                  <input
                    className="w-full bg-surface border border-outline-variant rounded-lg px-3 sm:px-4 py-2 text-sm text-on-surface focus:ring-2 focus:ring-primary focus:border-primary transition-shadow"
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    placeholder="Your email"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] sm:text-xs text-on-surface-variant mb-2 uppercase tracking-wider font-medium">
                  Profile Type (Helps tailor advice)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {profileTypes.map((p) => (
                    <label key={p.id} className="cursor-pointer">
                      <input
                        className="peer sr-only"
                        name="profile_type"
                        type="radio"
                        checked={selectedProfile === p.id}
                        onChange={() => setSelectedProfile(p.id)}
                      />
                      <div className="px-2 sm:px-3 py-2 text-center rounded-lg border border-outline-variant peer-checked:bg-primary-container/20 peer-checked:border-primary peer-checked:text-primary transition-all text-xs sm:text-sm font-medium flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-[14px] sm:text-[16px]">
                          {p.icon}
                        </span>{' '}
                        {p.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-3 sm:pt-4 flex justify-end">
                <button
                  className="bg-primary text-on-primary px-5 sm:px-6 py-2 rounded-full font-medium hover:bg-primary-container transition-colors shadow-sm text-sm"
                  type="submit"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </section>

          <section className="glass-card p-4 sm:p-6">
            <h2 className="text-sm sm:text-base mb-4 sm:mb-6 flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-primary">tune</span>
              Preferences & Alerts
            </h2>
            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                  <label className="text-sm font-medium">AQI Alert Threshold</label>
                  <span className="text-[10px] sm:text-xs text-primary font-bold bg-primary-container/20 px-2 py-0.5 rounded">
                    {alertThreshold} AQI
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant mb-2 sm:mb-3">
                  Notify me when air quality goes above this level.
                </p>
                <input
                  className="w-full accent-primary h-1.5 sm:h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer"
                  max="300"
                  min="50"
                  type="range"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                />
                <div className="flex justify-between text-[10px] sm:text-xs text-on-surface-variant mt-1.5 sm:mt-2 px-0.5">
                  <span>50 (Moderate)</span>
                  <span>150 (Unhealthy)</span>
                  <span>300 (Hazardous)</span>
                </div>
              </div>
              <hr className="border-outline-variant" />
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Rio Pop-ups</div>
                    <div className="text-xs sm:text-sm text-on-surface-variant">
                      Allow Rio to show contextual tips on the canvas.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      className="sr-only peer"
                      type="checkbox"
                      checked={rioPopups}
                      onChange={() => setRioPopups(!rioPopups)}
                    />
                    <div className="w-9 sm:w-11 h-5 sm:h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Display Units</div>
                    <div className="text-xs sm:text-sm text-on-surface-variant">
                      Toggle between AQI score and raw concentration.
                    </div>
                  </div>
                  <select
                    className="bg-surface border border-outline-variant text-xs sm:text-sm rounded-lg focus:ring-primary focus:border-primary p-1.5 sm:p-2 shrink-0"
                    value={displayUnits}
                    onChange={(e) => setDisplayUnits(e.target.value)}
                  >
                    <option value="us-aqi">US AQI</option>
                    <option value="concentration">Concentration</option>
                  </select>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4">
          <section className="glass-card p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-sm sm:text-base flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-primary">pin_drop</span>
                Saved Locations
              </h2>
              <button className="text-primary hover:text-primary-container transition-colors p-1 rounded-full hover:bg-surface-container">
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {savedLocations.map((loc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg border border-outline-variant bg-surface hover:border-primary transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div
                      className={`p-1.5 sm:p-2 rounded-full shrink-0 ${
                        i === 0
                          ? 'bg-primary-container/20 text-primary'
                          : 'bg-surface-variant text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base sm:text-lg">{loc.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-xs sm:text-sm text-on-surface truncate">
                        {loc.name}
                      </div>
                      <div className="text-[10px] sm:text-xs text-on-surface-variant truncate">
                        {loc.address}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <button className="text-on-surface-variant group-hover:text-primary p-1">
                      <span className="material-symbols-outlined text-base sm:text-lg">edit</span>
                    </button>
                    <button
                      onClick={() => removeLocation(i)}
                      className="text-on-surface-variant group-hover:text-error p-1"
                    >
                      <span className="material-symbols-outlined text-base sm:text-lg">delete</span>
                    </button>
                  </div>
                </div>
              ))}
              <button className="flex items-center justify-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-outline-variant bg-surface border-dashed hover:border-primary transition-colors cursor-pointer text-center w-full">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">add</span>
                <span className="text-xs sm:text-sm font-medium text-on-surface-variant">
                  Add Location
                </span>
              </button>
            </div>
          </section>

          <section className="glass-card p-4 sm:p-6">
            <h2 className="text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined text-primary">shield</span>
              Privacy & Data
            </h2>
            <div className="space-y-2 sm:space-y-3">
              <button className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-lg border border-outline-variant bg-surface hover:border-primary transition-colors text-sm">
                <span className="font-medium text-on-surface">Export My Data</span>
                <span className="material-symbols-outlined text-on-surface-variant text-base sm:text-lg">
                  download
                </span>
              </button>
              <button className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-lg border border-outline-variant bg-surface hover:border-error transition-colors text-sm">
                <span className="font-medium text-error">Delete Account</span>
                <span className="material-symbols-outlined text-error text-base sm:text-lg">
                  delete
                </span>
              </button>
            </div>
          </section>

          {user && (
            <button
              onClick={signOut}
              className="w-full py-2.5 sm:py-3 text-error border border-error/30 rounded-xl font-semibold hover:bg-error-container/20 transition-colors text-sm"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signUp, signInWithGoogle, user } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  if (user) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignUp) await signUp(email, password)
      else await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      if (msg.includes('auth/email-already-in-use')) setError('Email already in use. Try signing in.')
      else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found'))
        setError('Invalid email or password.')
      else if (msg.includes('auth/weak-password')) setError('Password must be at least 6 characters.')
      else if (msg.includes('auth/invalid-email')) setError('Please enter a valid email address.')
      else setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      navigate('/', { replace: true })
    } catch {
      setError('Google sign-in was cancelled or failed.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/ghost-logo.png" alt="Mehfooze" className="w-14 h-14 mb-3" />
          <h1 className="text-xl font-bold text-primary">Mehfooze</h1>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Stay safe. Stay ahead.</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient">
          <h2 className="text-base font-semibold text-on-surface mb-1">
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h2>
          <p className="text-[11px] text-on-surface-variant mb-5">
            {isSignUp
              ? 'Sign up to start tracking your air quality.'
              : 'Sign in to access your dashboard.'}
          </p>

          {/* Error */}
          {error && (
            <div className="mb-4 p-2.5 bg-error-container border border-error rounded-lg text-on-error-container text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-error text-sm mt-0.5">warning</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary focus:border-primary transition-shadow outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-outline-variant" />
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-outline-variant" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-2.5 bg-surface border border-outline-variant rounded-full text-sm font-medium flex items-center justify-center gap-2.5 hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Toggle */}
        <p className="text-center text-[11px] text-on-surface-variant mt-4">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
            className="text-primary font-semibold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        {/* Download App Banner */}
        <div className="mt-6 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary text-lg">phone_android</span>
            <p className="text-xs font-semibold text-on-surface">Get the Mehfooze App</p>
          </div>
          <p className="text-[10px] text-on-surface-variant mb-3">
            Download on your phone for the full experience
          </p>
          <button
            onClick={() => navigate('/download')}
            className="text-primary text-[11px] font-semibold hover:underline flex items-center justify-center gap-1 mx-auto"
          >
            View QR Code
            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  )
}

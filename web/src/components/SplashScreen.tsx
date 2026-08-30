import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'logo' | 'text' | 'fade'>('logo')

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('text'), 400)
    const timer2 = setTimeout(() => setPhase('fade'), 1800)
    const timer3 = setTimeout(() => onComplete(), 2400)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-6">
        <img
          src="/ghost-logo.png"
          alt="Mehfooze"
          className={`w-32 h-32 object-contain transition-all duration-500 ${
            phase === 'logo' ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
          } ${phase === 'fade' ? 'opacity-0 scale-95' : ''}`}
        />

        <div className={`text-center transition-all duration-500 ${
          phase === 'logo' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        } ${phase === 'fade' ? 'opacity-0' : ''}`}>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            مہفوظ
          </h1>
          <p className="text-lg font-semibold text-primary mt-1">
            Mehfooze
          </p>
          <p className="text-sm text-on-surface-variant mt-2">
            Stay Safe, Stay Ahead
          </p>
        </div>
      </div>
    </div>
  )
}

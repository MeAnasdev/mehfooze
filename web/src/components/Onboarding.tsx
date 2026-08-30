import { useState } from 'react'
import RioModel from './RioModel'

interface OnboardingProps {
  onComplete: () => void
}

const slides = [
  {
    id: 1,
    title: "Hey! I'm Rio",
    subtitle: "Your safety companion",
    description: "I'll guide you through Mehfooze and keep you safe every step of the way.",
    show3D: true,
  },
  {
    id: 2,
    title: "Real-time Air Quality",
    subtitle: "Know before you go",
    description: "Get live AQI readings for every area in Lahore. See forecast trends 24-72 hours ahead.",
    show3D: false,
    icon: (
      <div className="w-32 h-8 rounded-full bg-gradient-to-r from-[#00e400] via-[#ffff00] via-[#ff7e00] to-[#ff0000]" />
    ),
  },
  {
    id: 3,
    title: "Travel Safely",
    subtitle: "Routes with AQI insight",
    description: "Plan your route with AQI overlay for each segment. Get flood warnings and safety tips.",
    show3D: false,
    icon: (
      <span className="material-symbols-outlined text-primary text-[96px]">map</span>
    ),
  },
]

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isExiting, setIsExiting] = useState(false)

  const slide = slides[currentSlide]
  const isLast = currentSlide === slides.length - 1

  const handleNext = () => {
    if (isLast) {
      setIsExiting(true)
      setTimeout(() => {
        localStorage.setItem('onboarding_completed', 'true')
        onComplete()
      }, 300)
    } else {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  const handleSkip = () => {
    setIsExiting(true)
    setTimeout(() => {
      localStorage.setItem('onboarding_completed', 'true')
      onComplete()
    }, 300)
  }

  return (
    <div className={`fixed inset-0 z-40 bg-surface flex flex-col transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* Skip button */}
      {!isLast && (
        <button
          onClick={handleSkip}
          className="absolute top-12 right-6 text-sm font-medium text-on-surface-variant hover:text-on-surface z-10"
        >
          Skip
        </button>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {/* 3D Model or Icon */}
        <div className="w-64 h-64 flex items-center justify-center">
          {slide.show3D ? (
            <RioModel className="w-full h-full" />
          ) : slide.icon ? (
            <div className="animate-float">{slide.icon}</div>
          ) : null}
        </div>

        {/* Text */}
        <div className="text-center max-w-sm">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">
            {slide.subtitle}
          </p>
          <h2 className="text-2xl font-bold text-on-surface mb-3">
            {slide.title}
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom section */}
      <div className="pb-12 px-6 flex flex-col items-center gap-6">
        {/* Dots indicator */}
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-outline-variant'
              }`}
            />
          ))}
        </div>

        {/* Next/Get Started button */}
        <button
          onClick={handleNext}
          className="w-full max-w-xs py-4 bg-primary hover:bg-primary-container text-on-primary font-semibold rounded-2xl transition-colors duration-200 text-lg"
        >
          {isLast ? 'Get Started' : 'Next'}
        </button>

        {!isLast && (
          <button
            onClick={handleSkip}
            className="text-sm text-on-surface-variant hover:text-on-surface"
          >
            I already have an account
          </button>
        )}
      </div>
    </div>
  )
}

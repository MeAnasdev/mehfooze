import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <img
        src="/ghost-logo.png"
        alt="Rio"
        className="w-32 h-32 mb-6 animate-float opacity-80"
      />
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Lost?</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
        Looks like Rio wandered off the map.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-primary hover:bg-primary-container text-on-primary font-semibold rounded-2xl transition-colors"
      >
        Back to My Home
      </Link>
    </div>
  )
}

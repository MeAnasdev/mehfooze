import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="page page--404" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1>404 — Page not found</h1>
      <p style={{ marginTop: '1rem' }}>
        <Link to="/">← Back to Mehfooze Home</Link>
      </p>
    </div>
  )
}

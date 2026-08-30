import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const DISMISS_KEY = 'download_banner_dismissed'

export default function DownloadBanner() {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (!dismissed) setVisible(true)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-primary text-on-primary px-4 py-3 flex items-center gap-3 shadow-lg">
        <span className="material-symbols-outlined text-xl">phone_android</span>
        <button
          onClick={() => navigate('/download')}
          className="flex-1 text-left"
        >
          <p className="text-xs font-semibold">Get the Mehfooze App</p>
          <p className="text-[10px] opacity-80">Scan QR code to download on your phone</p>
        </button>
        <button
          onClick={dismiss}
          className="p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  )
}

import { QRCodeSVG } from 'qrcode.react'

const APK_URL = window.location.origin + '/apk'

export default function DownloadPage() {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mehfooze - Air Quality App',
          text: 'Download Mehfooze to track air quality in Lahore',
          url: APK_URL,
        })
      } catch {}
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src="/ghost-logo.png" alt="Mehfooze" className="w-14 h-14 mb-3" />
          <h1 className="text-xl font-bold text-primary">Mehfooze</h1>
          <p className="text-[11px] text-on-surface-variant mt-0.5">Stay safe. Stay ahead.</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
          <h2 className="text-base font-semibold text-on-surface mb-1">Download the App</h2>
          <p className="text-[11px] text-on-surface-variant mb-6">
            Scan this QR code with your phone camera to download Mehfooze.
          </p>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30">
              <QRCodeSVG
                value={APK_URL}
                size={200}
                level="H"
                includeMargin={false}
                fgColor="#006c46"
                bgColor="#ffffff"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-left">
              <div className="w-7 h-7 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-sm text-primary">qr_code_scanner</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Open your phone's camera and point it at the QR code
              </p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-7 h-7 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-sm text-primary">link</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Tap the link that appears to open the download page
              </p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="w-7 h-7 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-sm text-primary">install_mobile</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Install the APK and start tracking air quality
              </p>
            </div>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="w-full py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            Share Download Link
          </button>
        </div>

        {/* Back to login */}
        <p className="text-center text-[11px] text-on-surface-variant mt-4">
          <button
            onClick={() => window.history.back()}
            className="text-primary font-semibold hover:underline"
          >
            Go back
          </button>
        </p>
      </div>
    </div>
  )
}

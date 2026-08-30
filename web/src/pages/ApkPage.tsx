import { QRCodeSVG } from 'qrcode.react'

const APK_DOWNLOAD_URL = '# apk-download-link' // Replace with actual APK URL when deployed

export default function ApkPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src="/ghost-logo.png" alt="Mehfooze" className="w-16 h-16 mb-3" />
          <h1 className="text-2xl font-bold text-primary">Mehfooze</h1>
          <p className="text-xs text-on-surface-variant mt-1">AI-Powered Air Quality Companion</p>
        </div>

        {/* Features */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient mb-4">
          <h2 className="text-sm font-semibold text-on-surface mb-4">What you get</h2>
          <div className="space-y-3 text-left">
            {[
              { icon: 'air', title: 'Real-time AQI', desc: 'Live air quality data for Lahore' },
              { icon: 'notifications_active', title: 'Hazard Alerts', desc: 'Get notified when air is unsafe' },
              { icon: 'route', title: 'Route Planning', desc: 'Find the cleanest path to your destination' },
              { icon: 'health_and_safety', title: 'Health Advisory', desc: 'Personalized tips from Rio' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sm text-primary">{f.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface">{f.title}</p>
                  <p className="text-[10px] text-on-surface-variant">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download Button */}
        <a
          href={APK_DOWNLOAD_URL}
          className="block w-full py-3 bg-primary text-on-primary rounded-full text-sm font-semibold hover:opacity-90 transition-opacity mb-3"
        >
          Download APK
        </a>

        {/* QR Code for sharing */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient">
          <p className="text-[10px] text-on-surface-variant mb-3">Share with friends</p>
          <div className="flex justify-center">
            <div className="bg-white p-3 rounded-lg">
              <QRCodeSVG
                value={typeof window !== 'undefined' ? window.location.origin + '/apk' : ''}
                size={120}
                level="M"
                fgColor="#006c46"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[10px] text-outline mt-6">
          Mehfooze v1.0 &middot; Made for Lahore
        </p>
      </div>
    </div>
  )
}

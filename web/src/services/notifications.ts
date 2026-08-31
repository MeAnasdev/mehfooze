/**
 * Push notification service using Firebase Cloud Messaging.
 * Wraps the existing FCM messaging object from firebase.ts.
 */

import { getToken, onMessage } from 'firebase/messaging'
import { messaging } from './firebase'
import { API_BASE } from './api'

export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    })

    if (token) {
      await fetch(`${API_BASE}/api/notifications/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          userId: 'current-user',
          profile: 'citizen',
          platform: 'web',
        }),
      }).catch(() => {})
    }

    return token
  } catch {
    return null
  }
}

export function onForegroundMessage(
  callback: (payload: { title?: string; body?: string }) => void
): (() => void) | null {
  if (!messaging) return null

  const unsubscribe = onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
    })
  })

  return unsubscribe
}

export async function checkAlerts(): Promise<
  { id: string; zone: string; severity: string; aqi: number; message: string; createdAt: string }[]
> {
  try {
    const res = await fetch(`${API_BASE}/api/notifications/alerts`)
    if (!res.ok) return []
    const data = await res.json()
    return data.alerts ?? []
  } catch {
    return []
  }
}

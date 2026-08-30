/**
 * Push notification service for React Native (Expo).
 * Uses expo-notifications for local and remote push notifications.
 */

import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('hazard-alerts', {
      name: 'Hazard Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ff0000',
    })
  }

  const token = await Notifications.getExpoPushTokenAsync()
  return token.data
}

export async function registerTokenWithBackend(token: string, userId: string, profile: string = 'citizen'): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        userId,
        profile,
        platform: Platform.OS,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(callback)
  return () => subscription.remove()
}

export function addResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback)
  return () => subscription.remove()
}

export async function checkAlerts(): Promise<
  { id: string; zone: string; severity: string; aqi: number; message: string }[]
> {
  try {
    const res = await fetch(`${API_BASE}/notifications/alerts`)
    if (!res.ok) return []
    const data = await res.json()
    return data.alerts ?? []
  } catch {
    return []
  }
}

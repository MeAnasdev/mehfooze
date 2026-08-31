import React, { useEffect } from 'react';
import AppNavigator from './navigation/AppNavigator';
import { registerForPushNotifications, addNotificationListener } from './services/notifications';

export default function App() {
  useEffect(() => {
    // Initialize push notifications
    registerForPushNotifications().catch(() => {});

    // Listen for foreground notifications
    const unsubscribe = addNotificationListener((notification) => {
      // Notification received while app is in foreground
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return <AppNavigator />;
}

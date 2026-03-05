import { useState, useCallback } from 'react'
import { api } from '@/services/api'

export type NotificationType = 'new_listing' | 'viewing_request' | 'viewing_confirmation' | 'viewing_feedback_request'
export type NotificationChannel = 'email' | 'sms' | 'push'
export type NotificationDirection = 'to_user' | 'on_behalf_of_user'

export interface AppNotification {
  userId: string
  notificationId: string
  type: NotificationType
  channel: NotificationChannel
  direction?: NotificationDirection
  recipientAddress: string
  subject: string
  body?: string
  sentAt: string
  status: 'sent' | 'failed'
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get<{ notifications: AppNotification[] }>('/notifications')
      setNotifications(data.notifications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { notifications, isLoading, error, refetch: fetch }
}

'use server'

import { requireAuth } from '@/lib/auth/server'
import { getNotificationsForUser, getUnreadNotificationCount, markAsRead as markNotificationAsRead } from '@/lib/notifications'

export async function getMyNotifications() {
  const payload = await requireAuth()
  const userId = payload.id as string
  const [notifications, unreadCount] = await Promise.all([
    getNotificationsForUser(userId, 20),
    getUnreadNotificationCount(userId),
  ])

  return {
    unreadCount,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.titre,
      message: notification.message,
      read: notification.lu,
      createdAt: notification.createdAt,
      link: notification.lien,
    })),
  }
}

export async function markAsRead(notificationId: string) {
  const payload = await requireAuth()
  await markNotificationAsRead(payload.id as string, notificationId)
}

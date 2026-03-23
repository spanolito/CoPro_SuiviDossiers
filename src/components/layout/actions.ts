'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/server'

export async function getMyNotifications() {
  const payload = await requireAuth()

  return await prisma.notification.findMany({
    where: { userId: payload.id as string },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
}

export async function markAsRead(notificationId: string) {
  const payload = await requireAuth()

  // On utilise updateMany pour pouvoir filtrer par userId et garantir l'ownership
  await prisma.notification.updateMany({
    where: { 
      id: notificationId,
      userId: payload.id as string
    },
    data: { lu: true, luAt: new Date() }
  })
}

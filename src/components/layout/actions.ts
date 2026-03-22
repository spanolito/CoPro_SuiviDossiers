'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export async function getMyNotifications() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return []

  const payload = await verifyToken(token)
  if (!payload?.id) return []

  return await prisma.notification.findMany({
    where: { userId: payload.id as string },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
}

export async function markAsRead(notificationId: string) {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { lu: true, luAt: new Date() }
  })
}

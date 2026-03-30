import prisma from '@/lib/prisma'
import { TypeNotification } from '@prisma/client'

type CreateNotificationInput = {
  userId: string
  title: string
  message: string
  type?: TypeNotification
  link?: string | null
}

type BroadcastInput = {
  userIds: string[]
  title: string
  message: string
  type?: TypeNotification
  link?: string | null
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? 'LOG_SYSTEME',
      titre: input.title,
      message: input.message,
      lien: input.link ?? null,
    },
  })
}

export async function createNotifications(input: BroadcastInput) {
  const userIds = Array.from(new Set(input.userIds.filter(Boolean)))
  if (userIds.length === 0) return { count: 0 }

  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: input.type ?? 'LOG_SYSTEME',
      titre: input.title,
      message: input.message,
      lien: input.link ?? null,
    })),
  })
}

export async function getNotificationsForUser(userId: string, take = 20) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take,
  })
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      lu: false,
    },
  })
}

export async function markAsRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      lu: true,
      luAt: new Date(),
    },
  })
}

export async function notifyAdmins(title: string, message: string, type: TypeNotification, link?: string | null) {
  const admins = await prisma.utilisateur.findMany({
    where: { role: 'PRESIDENT_CS', status: 'ACTIVE' },
    select: { id: true },
  })

  return createNotifications({
    userIds: admins.map((admin) => admin.id),
    title,
    message,
    type,
    link,
  })
}

export async function notifyCoproprietaires(title: string, message: string, type: TypeNotification, link?: string | null) {
  const users = await prisma.utilisateur.findMany({
    where: {
      role: { in: ['COPROPRIETAIRE_LECTURE', 'MEMBRE_CS'] },
      status: 'ACTIVE',
    },
    select: { id: true },
  })

  return createNotifications({
    userIds: users.map((user) => user.id),
    title,
    message,
    type,
    link,
  })
}

export async function notifyAll(title: string, message: string, type: TypeNotification, link?: string | null) {
  const users = await prisma.utilisateur.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  })

  return createNotifications({
    userIds: users.map((user) => user.id),
    title,
    message,
    type,
    link,
  })
}

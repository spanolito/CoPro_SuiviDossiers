import prisma from '@/lib/prisma'
import { TypeNotification } from '@prisma/client'

export async function notifyAdmins(titre: string, message: string, type: TypeNotification) {
  const admins = await prisma.utilisateur.findMany({
    where: { role: 'PRESIDENT_CS', status: 'ACTIVE' }
  })

  if (admins.length === 0) return

  await prisma.notification.createMany({
    data: admins.map(admin => ({
      userId: admin.id,
      type,
      titre,
      message,
    }))
  })
}

export async function notifyCoproprietaires(titre: string, message: string, type: TypeNotification) {
  const copros = await prisma.utilisateur.findMany({
    where: { role: { in: ['COPROPRIETAIRE_LECTURE', 'MEMBRE_CS'] }, status: 'ACTIVE' }
  })

  if (copros.length === 0) return

  await prisma.notification.createMany({
    data: copros.map(copro => ({
      userId: copro.id,
      type,
      titre,
      message,
    }))
  })
}

export async function notifyAll(titre: string, message: string, type: TypeNotification) {
  const users = await prisma.utilisateur.findMany({
    where: { status: 'ACTIVE' }
  })

  if (users.length === 0) return

  await prisma.notification.createMany({
    data: users.map(user => ({
      userId: user.id,
      type,
      titre,
      message,
    }))
  })
}

'use server'

import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { notifyAdmins } from '@/lib/notifications'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

const ALLOWED_STATUSES = ['PENDING', 'ACTIVE', 'DISABLED'] as const
const ALLOWED_ROLES = ['PRESIDENT_CS', 'MEMBRE_CS', 'COPROPRIETAIRE_LECTURE'] as const

type Status = (typeof ALLOWED_STATUSES)[number]
type Role = (typeof ALLOWED_ROLES)[number]

type UpdateUserPayload = {
  userId: string
  name?: string
  email?: string
  role?: string
  status?: string
}

type UpdateUserResult = { success?: true; error?: string }

async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null
  if (payload?.role !== 'Admin') {
    throw new Error('Unauthorized')
  }
  return payload
}

export async function updateUserDetails(payload: UpdateUserPayload): Promise<UpdateUserResult> {
  const admin = await checkAdmin()

  const user = await prisma.utilisateur.findUnique({
    where: { id: payload.userId },
  })

  if (!user) {
    return { error: 'Utilisateur introuvable.' }
  }

  const updates: Prisma.UtilisateurUncheckedUpdateInput = {}

  if (payload.name !== undefined) {
    const trimmedName = payload.name.trim()
    if (!trimmedName) return { error: 'Le nom est requis.' }
    updates.nomAffiche = trimmedName
  }

  let resolvedRole: string = user.role
  if (payload.role !== undefined) {
    if (!ALLOWED_ROLES.includes(payload.role as Role)) {
      return { error: 'Rôle invalide.' }
    }
    updates.role = payload.role as Role
    resolvedRole = payload.role
  }

  let resolvedStatus: string = user.status
  if (payload.status !== undefined) {
    const normalizedStatus = payload.status.trim().toUpperCase()
    if (!ALLOWED_STATUSES.includes(normalizedStatus as Status)) {
      return { error: 'Statut invalide.' }
    }
    updates.status = normalizedStatus as Status
    resolvedStatus = normalizedStatus
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'Aucune modification détectée.' }
  }

  // Protect last admin
  const wasActiveAdmin = user.role === 'PRESIDENT_CS' && user.status === 'ACTIVE'
  const willBeActiveAdmin = resolvedRole === 'PRESIDENT_CS' && resolvedStatus === 'ACTIVE'

  if (wasActiveAdmin && !willBeActiveAdmin) {
    const activeAdminCount = await prisma.utilisateur.count({
      where: { role: 'PRESIDENT_CS', status: 'ACTIVE' }
    })
    if (activeAdminCount <= 1) {
      return { error: 'Vous ne pouvez pas retirer le dernier Président actif.' }
    }
  }

  try {
    await prisma.utilisateur.update({
      where: { id: payload.userId },
      data: updates
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        userId: admin.id as string,
        action: 'USER_UPDATE',
        description: `Modification de l'utilisateur ${payload.userId} (${Object.keys(updates).join(', ')})`,
      }
    })

    // Notify admin in system
    await notifyAdmins(
      `Modification Utilisateur`,
      `L'utilisateur ${payload.userId} a été modifié par ${admin.id}.`,
      'LOG_SYSTEME' as any
    )

    // Trigger Email Notification
    const { sendEmail } = await import('@/lib/services/email')
    
    const roleChanged = user.role !== resolvedRole
    const statusChanged = user.status !== resolvedStatus

    if (roleChanged || statusChanged) {
      let changeDesc = ''
      if (roleChanged) changeDesc += `- Rôle : de ${user.role} à ${resolvedRole}\n`
      if (statusChanged) changeDesc += `- Statut : de ${user.status} à ${resolvedStatus}\n`

      // 1. Notify the user concerned
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Mise à jour de votre compte - CoPro Suivi',
          body: `Bonjour ${user.nomAffiche},\n\nVotre compte a été mis à jour par un administrateur.\n\nModifications :\n${changeDesc}\nDate: ${new Date().toLocaleString('fr-FR')}`
        })
      }

      // 2. Notify Admins
      const adminsList = await prisma.utilisateur.findMany({
        where: { role: 'PRESIDENT_CS', status: 'ACTIVE' }
      })

      for (const singleAdmin of adminsList) {
        if (singleAdmin.id !== payload.userId) { // Don't notify the user about their own role change if they are admin
          await sendEmail({
            to: singleAdmin.email,
            subject: 'Notification Admin : Modification utilisateur',
            body: `L'utilisateur ${user.nomAffiche} (${user.email || 'Pas d\'email'}) a été modifié par ${admin.nomAffiche}.\n\nModifications :\n${changeDesc}`
          })
        }
      }
    }

  } catch (error) {

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'Cet email est déjà utilisé.' }
    }
    console.error(error)
    return { error: "Impossible de mettre à jour l'utilisateur pour le moment." }
  }

  revalidatePath('/users')
  return { success: true }
}

export async function deleteUser(userId: string): Promise<UpdateUserResult> {
  const admin = await checkAdmin()
  if (userId === admin.id) return { error: "Vous ne pouvez pas vous supprimer vous-même." }

  try {
    await prisma.utilisateur.delete({ where: { id: userId } })
    
    // Log action
    await prisma.auditLog.create({
      data: {
        userId: admin.id as string,
        action: 'USER_DELETE',
        description: `Suppression de l'utilisateur ${userId}`,
      }
    })

    await notifyAdmins(
      `Suppression Utilisateur`,
      `L'utilisateur ${userId} a été supprimé par ${admin.id}.`,
      'LOG_SYSTEME' as any
    )
  } catch (error: any) {
    if (error?.code === 'P2003') { 
      return { error: "Cet utilisateur est lié à des dossiers ou des activités. Veuillez le 'Désactiver' à la place." }
    }
    return { error: "Impossible de supprimer l'utilisateur actuellement." }
  }

  revalidatePath('/users')
  return { success: true }
}

'use server'

import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { notifyAdmins } from '@/lib/notifications'
import { requirePermission } from '@/lib/auth/server'
import bcrypt from 'bcryptjs'
import { logActivity } from '@/lib/activity-log'


export async function adminResetPassword(targetUserId: string, temporaryPassword: string) {
  const admin = await requirePermission('user.admin')

  if (!temporaryPassword || temporaryPassword.length < 6) {
    return { error: 'Le mot de passe temporaire doit contenir au moins 6 caractères.' }
  }

  const target = await prisma.utilisateur.findUnique({ where: { id: targetUserId } })
  if (!target) return { error: 'Utilisateur introuvable.' }

  const newHash = await bcrypt.hash(temporaryPassword, 10)
  await prisma.utilisateur.update({
    where: { id: targetUserId },
    data: { passwordHash: newHash }
  })

  // Log action
  await logActivity({
    userId: admin.id as string,
    action: 'PASSWORD_RESET',
    entity: 'USER',
    entityId: targetUserId,
    metadata: { reason: 'Admin reset' }
  })

  // Notify admin
  await notifyAdmins(
    `Réinitialisation MDP`,
    `Le mot de passe de l'utilisateur ${targetUserId} a été réinitialisé par ${admin.id}.`,
    'LOG_SYSTEME' as any
  )

  return { success: true }
}

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

// Centralized checkAdmin removed

export async function updateUserDetails(payload: UpdateUserPayload): Promise<UpdateUserResult> {
  const admin = await requirePermission('user.admin')

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
    await logActivity({
      userId: admin.id as string,
      action: 'USER_UPDATE',
      entity: 'USER',
      entityId: payload.userId,
      metadata: { fields: Object.keys(updates) }
    })

    // Notify admin in system
    await notifyAdmins(
      `Modification Utilisateur`,
      `L'utilisateur ${payload.userId} a été modifié par ${admin.id}.`,
      'LOG_SYSTEME' as any
    )

    // Trigger Email Notification
    const { notifyUserRoleChange } = await import('@/lib/utils/notifications')
    
    const roleChanged = user.role !== resolvedRole
    const statusChanged = user.status !== resolvedStatus

    if (roleChanged || statusChanged) {
      await notifyUserRoleChange(
        { nomAffiche: user.nomAffiche, email: user.email },
        {
          ...(roleChanged && { role: { old: user.role, new: resolvedRole } }),
          ...(statusChanged && { status: { old: user.status, new: resolvedStatus } })
        }
      )
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
  const admin = await requirePermission('user.admin')
  if (userId === admin.id) return { error: "Vous ne pouvez pas vous supprimer vous-même." }

  try {
    await prisma.utilisateur.delete({ where: { id: userId } })
    
    // Log action
    await logActivity({
      userId: admin.id as string,
      action: 'USER_DELETE',
      entity: 'USER',
      entityId: userId,
      metadata: { success: true }
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

'use server'

import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

const ADMIN_ROLE_NAME = 'Admin'
const ALLOWED_STATUSES = ['PENDING', 'ACTIVE', 'DISABLED'] as const

type Status = (typeof ALLOWED_STATUSES)[number]

type UpdateUserPayload = {
  userId: string
  name?: string
  email?: string
  roleId?: string
  status?: string
}

type UpdateUserResult = { success: true } | { error: string }

async function checkAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null
  if (payload?.role !== ADMIN_ROLE_NAME) {
    throw new Error('Unauthorized')
  }
  return payload
}

async function getAdminRoleId() {
  const adminRole = await prisma.role.findUnique({
    where: { name: ADMIN_ROLE_NAME }
  })

  if (!adminRole) {
    throw new Error('Le rôle Admin est manquant.')
  }

  return adminRole.id
}

export async function updateUserDetails(payload: UpdateUserPayload): Promise<UpdateUserResult> {
  const admin = await checkAdmin()
  const adminRoleId = await getAdminRoleId()

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { role: true }
  })

  if (!user) {
    return { error: 'Utilisateur introuvable.' }
  }

  const updates: Prisma.UserUpdateInput = {}

  if (payload.name !== undefined) {
    const trimmedName = payload.name.trim()
    if (!trimmedName) {
      return { error: 'Le nom est requis.' }
    }
    updates.name = trimmedName
  }

  if (payload.email !== undefined) {
    const trimmedEmail = payload.email.trim()
    if (!trimmedEmail) {
      return { error: 'L\\'email est requis.' }
    }
    updates.email = trimmedEmail
  }

  let resolvedRoleId = user.roleId
  if (payload.roleId !== undefined) {
    const role = await prisma.role.findUnique({ where: { id: payload.roleId } })
    if (!role) {
      return { error: 'Rôle invalide.' }
    }
    updates.roleId = role.id
    resolvedRoleId = role.id
  }

  let resolvedStatus: string = user.status
  if (payload.status !== undefined) {
    const normalizedStatus = payload.status.trim().toUpperCase()
    if (!ALLOWED_STATUSES.includes(normalizedStatus as Status)) {
      return { error: 'Statut invalide.' }
    }
    updates.status = normalizedStatus
    resolvedStatus = normalizedStatus
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'Aucune modification détectée.' }
  }

  const wasActiveAdmin = user.roleId === adminRoleId && user.status === 'ACTIVE'
  const willBeActiveAdmin = resolvedRoleId === adminRoleId && resolvedStatus === 'ACTIVE'

  if (wasActiveAdmin && !willBeActiveAdmin) {
    const activeAdminCount = await prisma.user.count({
      where: {
        roleId: adminRoleId,
        status: 'ACTIVE'
      }
    })

    if (activeAdminCount <= 1) {
      return { error: 'Vous ne pouvez pas retirer le dernier administrateur actif.' }
    }
  }

  try {
    await prisma.user.update({
      where: { id: payload.userId },
      data: updates
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { error: 'Cet email est déjà utilisé.' }
    }
    console.error(error)
    return { error: 'Impossible de mettre à jour l\\'utilisateur pour le moment.' }
  }

  revalidatePath('/users')
  return { success: true }
}

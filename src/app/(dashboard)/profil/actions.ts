'use server'

import prisma from '@/lib/prisma'
import { notifyAdmins } from '@/lib/notifications'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

type Result = { success?: true; error?: string }

async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) throw new Error('Non authentifié')
  const payload = await verifyToken(token)
  if (!payload?.id) throw new Error('Token invalide')
  return payload
}

export async function changeMyPassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<Result> {
  const payload = await getAuthUser()

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Tous les champs sont requis.' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Le nouveau mot de passe et la confirmation ne correspondent pas.' }
  }

  if (newPassword.length < 6) {
    return { error: 'Le mot de passe doit contenir au moins 6 caractères.' }
  }

  if (newPassword === currentPassword) {
    return { error: 'Le nouveau mot de passe doit être différent de l\'actuel.' }
  }

  const user = await prisma.utilisateur.findUnique({ where: { id: payload.id as string } })
  if (!user) return { error: 'Utilisateur introuvable.' }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) {
    return { error: 'Le mot de passe actuel est incorrect.' }
  }

  const newHash = await bcrypt.hash(newPassword, 10)
  await prisma.utilisateur.update({
    where: { id: user.id },
    data: { passwordHash: newHash }
  })

  return { success: true }
}

export async function changeMyEmail(currentPassword: string, newEmail: string): Promise<Result> {
  const payload = await getAuthUser()

  if (!currentPassword || !newEmail) {
    return { error: 'Tous les champs sont requis.' }
  }

  const trimmedEmail = newEmail.trim()
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    return { error: 'Veuillez saisir un email valide.' }
  }

  const user = await prisma.utilisateur.findUnique({ where: { id: payload.id as string } })
  if (!user) return { error: 'Utilisateur introuvable.' }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) {
    return { error: 'Le mot de passe actuel est incorrect.' }
  }

  if (trimmedEmail === user.email) {
    return { error: 'Le nouvel email doit être différent de l\'actuel.' }
  }

  try {
    await prisma.utilisateur.update({
      where: { id: user.id },
      data: { email: trimmedEmail }
    })
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'Cet email est déjà utilisé par un autre utilisateur.' }
    }
    return { error: 'Erreur lors de la mise à jour de l\'email.' }
  }
}

export async function adminResetPassword(targetUserId: string, temporaryPassword: string): Promise<Result> {
  const payload = await getAuthUser()

  if (payload.role !== 'admin') {
    return { error: 'Seul le Président du CS peut réinitialiser les mots de passe.' }
  }

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
  await prisma.auditLog.create({
    data: {
      userId: payload.id as string,
      action: 'PASSWORD_RESET',
      description: `Réinitialisation du mot de passe de l'utilisateur ${targetUserId}`,
    }
  })

  // Notify admin
  await notifyAdmins(
    `Réinitialisation MDP`,
    `Le mot de passe de l'utilisateur ${targetUserId} a été réinitialisé par ${payload.id}.`,
    'LOG_SYSTEME' as any
  )

  return { success: true }
}

export async function getMyProfile() {
  const payload = await getAuthUser()
  const user = await prisma.utilisateur.findUnique({
    where: { id: payload.id as string },
    select: { id: true, nomAffiche: true, email: true, role: true, createdAt: true, lastLoginAt: true }
  })
  return user
}

'use server'

import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { Permission, requirePermission } from '@/lib/security/rbac'
import bcrypt from 'bcryptjs'

async function getSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return null
  return await verifyToken(token)
}

// 1. Général Settings
export async function saveGeneralSettings(data: {
  timezone: string
  dateFormat: string
  timeFormat: string
  density: string
}) {
  const payload = await getSessionUser()
  try {
    requirePermission(payload as any, Permission.SETTINGS_UPDATE_SELF)
    await prisma.utilisateur.update({
      where: { id: payload!.id as string },
      data: {
        timezone: data.timezone,
        dateFormat: data.dateFormat,
        timeFormat: data.timeFormat,
        density: data.density,
      }
    })
    return { success: true, message: 'Paramètres généraux enregistrés.' }
  } catch (e: any) {
    return { error: e.message || 'Erreur lors de la sauvegarde.' }
  }
}

// 2. Mon Compte Settings
export async function saveAccountSettings(data: { nomAffiche: string, email: string }) {
  const payload = await getSessionUser()
  try {
    requirePermission(payload as any, Permission.SETTINGS_UPDATE_SELF)
    
    // Check email uniqueness
    const existing = await prisma.utilisateur.findFirst({
      where: { 
        email: data.email,
        NOT: { id: payload!.id as string }
      }
    })
    if (existing) throw new Error('Cette adresse e-mail est déjà utilisée.')

    await prisma.utilisateur.update({
      where: { id: payload!.id as string },
      data: { 
        nomAffiche: data.nomAffiche,
        email: data.email
      }
    })
    return { success: true, message: 'Informations du compte mises à jour.' }
  } catch (e: any) {
    return { error: e.message || 'Erreur.' }
  }
}

// 2b. Change Password
export async function changePassword(data: { current: string, newPass: string }) {
  const payload = await getSessionUser()
  try {
    requirePermission(payload as any, Permission.SETTINGS_UPDATE_SELF)
    const user = await prisma.utilisateur.findUnique({ where: { id: payload!.id as string } })
    if (!user) throw new Error('Utilisateur non trouvé.')

    const isValid = await bcrypt.compare(data.current, user.passwordHash)
    if (!isValid) throw new Error('Mot de passe actuel incorrect.')

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(data.newPass, salt)

    await prisma.utilisateur.update({
      where: { id: user.id },
      data: { passwordHash }
    })

    return { success: true, message: 'Mot de passe modifié avec succès.' }
  } catch (e: any) {
    return { error: e.message || 'Erreur.' }
  }
}

// 3. Notifications Settings
export async function saveNotificationSettings(data: {
  notifDossier: boolean
  notifStatut: boolean
  notifCommentaire: boolean
  notifValidation: boolean
  notifFrequency: string
}) {
  const payload = await getSessionUser()
  try {
    requirePermission(payload as any, Permission.SETTINGS_UPDATE_SELF)
    await prisma.utilisateur.update({
      where: { id: payload!.id as string },
      data: {
        notifDossier: data.notifDossier,
        notifStatut: data.notifStatut,
        notifCommentaire: data.notifCommentaire,
        notifValidation: data.notifValidation,
        notifFrequency: data.notifFrequency,
      }
    })
    return { success: true, message: 'Préférences de notifications enregistrées.' }
  } catch (e: any) {
    return { error: e.message || 'Erreur.' }
  }
}

// 4. Application Settings (Admin only)
export async function saveApplicationSettings(data: {
  logoUrl?: string
  officialEmail?: string
  globalNotifs: boolean
  validationRequiredBeforeClose: boolean
}) {
  const payload = await getSessionUser()
  try {
    requirePermission(payload as any, Permission.SETTINGS_UPDATE_APP)
    const copro = await prisma.copropriete.findFirst()
    if (!copro) throw new Error('Copropriété non trouvée.')

    await prisma.copropriete.update({
      where: { id: copro.id },
      data: {
        logoUrl: data.logoUrl,
        officialEmail: data.officialEmail,
        globalNotifs: data.globalNotifs,
        validationRequiredBeforeClose: data.validationRequiredBeforeClose,
      }
    })
    return { success: true, message: 'Paramètres de l\'application sauvegardés.' }
  } catch (e: any) {
    return { error: e.message || 'Erreur.' }
  }
}

// 5. Workflow Settings (Admin only)
export async function saveWorkflowSettings(data: {
  allowBlockedStatus: boolean
  allowEditAfterValidation: boolean
  defaultValidationDelay: number
  defaultReminderDelay: number
}) {
  const payload = await getSessionUser()
  try {
    requirePermission(payload as any, Permission.WORKFLOW_UPDATE)
    const copro = await prisma.copropriete.findFirst()
    if (!copro) throw new Error('Copropriété non trouvée.')

    await prisma.copropriete.update({
      where: { id: copro.id },
      data: {
        allowBlockedStatus: data.allowBlockedStatus,
        allowEditAfterValidation: data.allowEditAfterValidation,
        defaultValidationDelay: data.defaultValidationDelay,
        defaultReminderDelay: data.defaultReminderDelay,
      }
    })
    return { success: true, message: 'Configuration du workflow sauvegardée.' }
  } catch (e: any) {
    return { error: e.message || 'Erreur.' }
  }
}

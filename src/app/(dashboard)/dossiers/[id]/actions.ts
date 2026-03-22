'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export enum StatutDossier {
  ENREGISTRE = 'ENREGISTRE',
  AFFECTE = 'AFFECTE',
  EN_COURS = 'EN_COURS',
  A_VALIDER = 'A_VALIDER',
  CLOTURE = 'CLOTURE',
  BLOQUE = 'BLOQUE',
  ARCHIVE = 'ARCHIVE'
}

async function getAdminUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) throw new Error('Non authentifié')
  
  const payload = await verifyToken(token)
  if (payload?.role !== 'Admin') {
    throw new Error('Action non autorisée - Administrateur requis')
  }
  return payload
}

export async function archiveDossier(id: string, archive: boolean) {
  const admin = await getAdminUser()
  
  await prisma.dossier.update({
    where: { id },
    data: {
      archived: archive,
      archivedAt: archive ? new Date() : null,
      archivedById: archive ? (admin.id as string) : null
    }
  })

  await prisma.activityLog.create({
    data: {
      action: archive ? 'ARCHIVED_DOSSIER' : 'UNARCHIVED_DOSSIER',
      targetType: 'Dossier',
      targetId: id,
      userId: admin.id as string
    }
  })

  // Create a real notification
  const dossier = await prisma.dossier.findUnique({ where: { id }, select: { responsableCSId: true, title: true }})
  if (dossier?.responsableCSId && dossier.responsableCSId !== admin.id) {
    await prisma.notification.create({
      data: {
        title: archive ? 'Dossier archivé' : 'Dossier désarchivé',
        message: `Le dossier "${dossier.title}" a été ${archive ? 'archivé' : 'désarchivé'} par l'administrateur.`,
        userId: dossier.responsableCSId
      }
    })
  }

  revalidatePath(`/dossiers/${id}`)
  revalidatePath('/dossiers')
}

export async function deleteDossiers(id: string) {
  const admin = await getAdminUser()
  
  await prisma.dossier.delete({ where: { id } })

  await prisma.activityLog.create({
    data: {
      action: 'DELETED_DOSSIER_HARD',
      targetType: 'System_Audit',
      targetId: id,
      userId: admin.id as string
    }
  })

  redirect('/dossiers')
}

export async function updateDossierStatus(id: string, newStatus: string) {
  const validStatuses = Object.values(StatutDossier) as string[]
  if (!validStatuses.includes(newStatus)) {
    throw new Error('Statut invalide.')
  }

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) throw new Error('Non authentifié')
  const payload = await verifyToken(token)

  if (payload?.role === 'Read-only') {
    throw new Error('Action non autorisée')
  }

  const dossier = await prisma.dossier.findUnique({ where: { id } })
  if (!dossier) throw new Error("Dossier introuvable.")

  // Business Rule: only admin can CLOTURE
  if (newStatus === StatutDossier.CLOTURE) {
    if (payload?.role !== 'Admin') {
      throw new Error('Seul un administrateur peut clôturer ce dossier.')
    }
    if (dossier.statut !== StatutDossier.A_VALIDER) {
      throw new Error('Impossible de clôturer: le dossier doit être "À valider".')
    }
  }

  if (newStatus === StatutDossier.A_VALIDER) {
    if (!dossier.finalDecision) {
      throw new Error('Une décision finale est requise avant de passer "À valider". Vous devez finaliser le dossier.')
    }
  }
  
  if (newStatus === StatutDossier.AFFECTE || newStatus === StatutDossier.EN_COURS) {
    if (!dossier.responsableCSId) {
      throw new Error("L'avancement du dossier est bloqué : vous devez définir un Responsable CS.")
    }
  }

  await prisma.dossier.update({
    where: { id },
    data: { statut: newStatus }
  })

  await prisma.activityLog.create({
    data: {
      action: `STATUS_UPDATED_${newStatus}`,
      targetType: 'Dossier',
      targetId: id,
      userId: payload?.id as string
    }
  })

  revalidatePath(`/dossiers/${id}`)
}

export async function finalizeDossier(id: string, decision: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) throw new Error('Non authentifié')
  const payload = await verifyToken(token)

  if (payload?.role === 'Read-only') throw new Error('Non autorisé')

  await prisma.dossier.update({
    where: { id },
    data: {
      statut: StatutDossier.A_VALIDER,
      finalDecision: decision,
      finalizedAt: new Date(),
      finalizedById: payload?.id as string
    }
  })

  await prisma.activityLog.create({
    data: {
      action: 'DOSSIER_FINALIZED',
      targetType: 'Dossier',
      targetId: id,
      userId: payload?.id as string
    }
  })

  revalidatePath(`/dossiers/${id}`)
}

export async function closeDossier(id: string) {
  const admin = await getAdminUser() // Enforces Admin role

  const dossier = await prisma.dossier.findUnique({ where: { id } })
  if (!dossier) throw new Error("Dossier introuvable.")
  if (dossier.statut !== StatutDossier.A_VALIDER) {
    throw new Error('Impossible de clôturer : le dossier n\'est pas À VALIDER.')
  }

  await prisma.dossier.update({
    where: { id },
    data: {
      statut: StatutDossier.CLOTURE,
      closedAt: new Date(),
      closedById: admin.id as string
    }
  })

  await prisma.activityLog.create({
    data: {
      action: 'DOSSIER_CLOSED',
      targetType: 'Dossier',
      targetId: id,
      userId: admin.id as string
    }
  })

  revalidatePath(`/dossiers/${id}`)
}

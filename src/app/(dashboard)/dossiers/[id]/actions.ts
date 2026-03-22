'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

// Re-export enum values for client use
export const StatutDossier = {
  ENREGISTRE: 'ENREGISTRE',
  AFFECTE: 'AFFECTE',
  EN_COURS: 'EN_COURS',
  A_VALIDER: 'A_VALIDER',
  CLOTURE: 'CLOTURE',
  BLOQUE: 'BLOQUE',
  ARCHIVE: 'ARCHIVE',
} as const

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  ENREGISTRE: ['AFFECTE', 'BLOQUE'],
  AFFECTE: ['EN_COURS', 'BLOQUE', 'ENREGISTRE'],
  EN_COURS: ['A_VALIDER', 'BLOQUE', 'AFFECTE'],
  A_VALIDER: ['CLOTURE', 'EN_COURS', 'BLOQUE'],
  CLOTURE: ['ARCHIVE'],
  BLOQUE: ['ENREGISTRE', 'AFFECTE', 'EN_COURS'],
  ARCHIVE: [],
}

async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) throw new Error('Non authentifié')
  const payload = await verifyToken(token)
  if (!payload) throw new Error('Token invalide')
  return payload
}

export async function updateDossierStatus(dossierId: string, newStatus: string) {
  const payload = await getCurrentUser()
  const isAdmin = payload.role === 'Admin'

  const dossier = await prisma.dossier.findUnique({ where: { id: dossierId } })
  if (!dossier) throw new Error('Dossier introuvable')

  const allowed = ALLOWED_TRANSITIONS[dossier.statut] || []
  if (!allowed.includes(newStatus)) {
    throw new Error(`Transition de "${dossier.statut}" vers "${newStatus}" non autorisée.`)
  }

  if (newStatus === 'CLOTURE' && !isAdmin) {
    throw new Error('Seul le Président du CS peut clôturer un dossier.')
  }

  if ((newStatus === 'AFFECTE' || newStatus === 'EN_COURS') && !dossier.responsableCSId) {
    throw new Error("L'avancement du dossier est bloqué : vous devez définir un Responsable CS.")
  }

  const updateData: any = { statut: newStatus, dateDerniereAction: new Date() }
  if (newStatus === 'CLOTURE') {
    updateData.closedAt = new Date()
    updateData.clotureParUserId = payload.id as string
  }

  await prisma.dossier.update({ where: { id: dossierId }, data: updateData })

  await prisma.dossierActivite.create({
    data: {
      dossierId,
      userId: payload.id as string,
      typeAction: 'STATUT_CHANGE',
      resume: `Statut changé vers ${newStatus}`,
    }
  })

  revalidatePath(`/dossiers/${dossierId}`)
}

export async function archiveDossier(dossierId: string) {
  const payload = await getCurrentUser()

  await prisma.dossier.update({
    where: { id: dossierId },
    data: {
      archived: true,
      archivedAt: new Date(),
      archivedById: payload.id as string,
      statut: 'ARCHIVE',
    }
  })

  await prisma.dossierActivite.create({
    data: {
      dossierId,
      userId: payload.id as string,
      typeAction: 'DOSSIER_ARCHIVE',
      resume: 'Dossier archivé',
    }
  })

  revalidatePath(`/dossiers/${dossierId}`)
}

export async function finalizeDossier(dossierId: string, finalDecision: string) {
  const payload = await getCurrentUser()

  await prisma.dossier.update({
    where: { id: dossierId },
    data: {
      statut: 'A_VALIDER',
      finalDecision,
      finaliseAt: new Date(),
      validateurFinalId: payload.id as string,
      dateDerniereAction: new Date(),
    }
  })

  await prisma.dossierActivite.create({
    data: {
      dossierId,
      userId: payload.id as string,
      typeAction: 'DOSSIER_FINALISE',
      resume: `Dossier finalisé : ${finalDecision}`,
    }
  })

  revalidatePath(`/dossiers/${dossierId}`)
}

export async function deleteDossier(dossierId: string) {
  const payload = await getCurrentUser()
  if (payload.role !== 'Admin') throw new Error('Seul le Président peut supprimer un dossier.')

  await prisma.dossier.delete({ where: { id: dossierId } })
}

'use server'

import prisma from '@/lib/prisma'
import { notifyAll } from '@/lib/notifications'
import { revalidatePath } from 'next/cache'
import { requirePermission, requireAuth } from '@/lib/auth/server'

import { StatutDossier, ALLOWED_TRANSITIONS } from '@/lib/dossier-constants'

export async function updateDossierStatus(dossierId: string, newStatus: string) {
  const payload = await requirePermission('dossier.advance')

  const dossier = await prisma.dossier.findUnique({ where: { id: dossierId } })
  if (!dossier) throw new Error('Dossier introuvable')

  const allowed = ALLOWED_TRANSITIONS[dossier.statut] || []
  if (!allowed.includes(newStatus)) {
    throw new Error(`Transition de "${dossier.statut}" vers "${newStatus}" non autorisée.`)
  }

  if (newStatus === 'CLOTURE') {
    await requirePermission('dossier.close')
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

  // Notify users
  if (newStatus === 'EN_COURS') {
    await notifyAll(
      `Dossier en cours : ${dossier.titre}`,
      `Le dossier "${dossier.titre}" est désormais en cours de traitement.`,
      'DOSSIER_EN_COURS' as any
    )
  } else if (newStatus === 'CLOTURE') {
    await notifyAll(
      `Dossier résolu : ${dossier.titre}`,
      `Le dossier "${dossier.titre}" a été clôturé.`,
      'DOSSIER_RESOLU' as any
    )
  }

  revalidatePath(`/dossiers/${dossierId}`)
}

export async function archiveDossier(dossierId: string) {
  const payload = await requirePermission('dossier.update')

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
  const payload = await requirePermission('dossier.validate')

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
  const payload = await requirePermission('dossier.delete')

  await prisma.dossier.delete({ where: { id: dossierId } })
}

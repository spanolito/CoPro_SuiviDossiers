'use server'

import prisma from '@/lib/prisma'
import type { StatutDossier } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/auth/server'
import { ALLOWED_TRANSITIONS, getStatusLabel, normalizeDossierStatus } from '@/lib/dossier-constants'
import { notifyDossierStakeholders, recordDossierEvent } from '@/lib/dossier-tracking'

async function getDossierOrThrow(dossierId: string) {
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
  })

  if (!dossier) {
    throw new Error('Dossier introuvable')
  }

  return dossier
}

export async function updateDossierStatus(dossierId: string, newStatus: string) {
  const payload = await requirePermission('dossier.advance')
  const dossier = await getDossierOrThrow(dossierId)

  const currentStatus = normalizeDossierStatus(dossier.statut)
  const targetStatus = normalizeDossierStatus(newStatus)
  const allowed = ALLOWED_TRANSITIONS[dossier.statut] || ALLOWED_TRANSITIONS[currentStatus] || []

  if (!allowed.includes(newStatus) && !allowed.includes(targetStatus)) {
    throw new Error(`Transition de "${getStatusLabel(dossier.statut)}" vers "${getStatusLabel(targetStatus)}" non autorisée.`)
  }

  if (targetStatus === 'CLOSED') {
    await requirePermission('dossier.close')
  }

  if (targetStatus === 'IN_PROGRESS' && !dossier.assignedToId && !dossier.responsableCSId) {
    throw new Error("L'avancement du dossier est bloqué : vous devez définir une assignation.")
  }

  const updateData: Record<string, unknown> = {
    statut: targetStatus as StatutDossier,
    dateDerniereAction: new Date(),
  }

  if (targetStatus === 'CLOSED') {
    updateData.closedAt = new Date()
    updateData.clotureParUserId = payload.id as string
  }

  const updatedDossier = await prisma.dossier.update({
    where: { id: dossierId },
    data: updateData,
  })

  await recordDossierEvent({
    dossierId,
    userId: payload.id as string,
    typeAction: 'STATUT_CHANGE',
    resume: `Statut changé vers ${getStatusLabel(targetStatus)}`,
    action: 'DOSSIER_STATUS_CHANGED',
    metadata: {
      oldStatus: dossier.statut,
      newStatus: targetStatus,
    },
    updateLastAction: false,
  })

  await notifyDossierStakeholders({
    dossier: updatedDossier,
    title: `Statut mis à jour: ${updatedDossier.reference}`,
    message: `Le dossier ${updatedDossier.reference} est maintenant ${getStatusLabel(targetStatus).toLowerCase()}.`,
    type: 'DOSSIER_STATUS_CHANGED',
    link: `/dossiers/${dossierId}`,
  })

  revalidatePath(`/dossiers/${dossierId}`)
  revalidatePath('/dossiers')
  revalidatePath('/')
}

export async function archiveDossier(dossierId: string) {
  const payload = await requirePermission('dossier.update')
  const dossier = await getDossierOrThrow(dossierId)

  await prisma.dossier.update({
    where: { id: dossierId },
    data: {
      archived: true,
      archivedAt: new Date(),
      archivedById: payload.id as string,
      statut: 'ARCHIVE',
      dateDerniereAction: new Date(),
    },
  })

  await recordDossierEvent({
    dossierId,
    userId: payload.id as string,
    typeAction: 'DOSSIER_ARCHIVE',
    resume: 'Dossier archivé',
    action: 'DOSSIER_ARCHIVED',
    metadata: {
      previousStatus: dossier.statut,
    },
    updateLastAction: false,
  })

  revalidatePath(`/dossiers/${dossierId}`)
  revalidatePath('/dossiers')
}

export async function finalizeDossier(dossierId: string, finalDecision: string) {
  const payload = await requirePermission('dossier.advance')
  const dossier = await getDossierOrThrow(dossierId)

  const updatedDossier = await prisma.dossier.update({
    where: { id: dossierId },
    data: {
      statut: 'RESOLVED',
      finalDecision,
      finaliseAt: new Date(),
      validateurFinalId: payload.id as string,
      dateDerniereAction: new Date(),
    },
  })

  await recordDossierEvent({
    dossierId,
    userId: payload.id as string,
    typeAction: 'DOSSIER_FINALISE',
    resume: 'Dossier marqué comme résolu',
    action: 'DOSSIER_RESOLVED',
    metadata: {
      oldStatus: dossier.statut,
      newStatus: 'RESOLVED',
      finalDecision,
    },
    updateLastAction: false,
  })

  await notifyDossierStakeholders({
    dossier: updatedDossier,
    title: `Dossier résolu: ${updatedDossier.reference}`,
    message: `Le dossier ${updatedDossier.reference} attend maintenant la clôture finale.`,
    type: 'DOSSIER_STATUS_CHANGED',
    link: `/dossiers/${dossierId}`,
  })

  revalidatePath(`/dossiers/${dossierId}`)
  revalidatePath('/dossiers')
  revalidatePath('/')
}

export async function deleteDossier(dossierId: string) {
  await requirePermission('dossier.delete')
  await prisma.dossier.delete({ where: { id: dossierId } })
  revalidatePath('/dossiers')
  revalidatePath('/')
}

export async function updateStepDate(dossierId: string, etapeId: string, newDateStr: string, reason: string | null) {
  const payload = await requirePermission('dossier.step.update')

  const etape = await prisma.dossierEtape.findUnique({
    where: { id: etapeId },
    include: {
      dossier: true,
    },
  })

  if (!etape) {
    throw new Error('Étape introuvable')
  }

  const oldDate = etape.stepDate
  const newDate = new Date(newDateStr)
  const cleanReason = reason?.trim() || null

  if (Number.isNaN(newDate.getTime())) {
    throw new Error('Date de correction invalide')
  }

  await prisma.$transaction([
    prisma.dossierEtapeHistory.create({
      data: {
        etapeId,
        oldDate,
        newDate,
        reason: cleanReason,
        changedById: payload.id as string,
      },
    }),
    prisma.dossierEtape.update({
      where: { id: etapeId },
      data: {
        stepDate: newDate,
        correctedAt: new Date(),
        correctionReason: cleanReason,
        correctedById: payload.id as string,
      },
    }),
    prisma.dossier.update({
      where: { id: dossierId },
      data: { dateDerniereAction: new Date() },
    }),
  ])

  await recordDossierEvent({
    dossierId,
    userId: payload.id as string,
    typeAction: 'ETAPE_MODIFIEE',
    resume: `Date de l'étape "${etape.titre}" corrigée`,
    action: 'STEP_DATE_CORRECTED',
    metadata: {
      stepId: etapeId,
      stepTitle: etape.titre,
      oldDate: oldDate.toISOString(),
      newDate: newDate.toISOString(),
      reason: cleanReason,
    },
    updateLastAction: false,
  })

  await notifyDossierStakeholders({
    dossier: etape.dossier,
    title: `Étape corrigée: ${etape.dossier.reference}`,
    message: `La date de l'étape "${etape.titre}" a été corrigée.`,
    type: 'ETAPE_UPDATED',
    link: `/dossiers/${dossierId}`,
  })

  revalidatePath(`/dossiers/${dossierId}`)
  revalidatePath('/dossiers')
  revalidatePath('/')
}

export const updateEtapeDate = updateStepDate

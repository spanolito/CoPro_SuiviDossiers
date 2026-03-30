import prisma from '@/lib/prisma'
import { createNotifications } from '@/lib/notifications'
import type { Prisma, TypeNotification, TypeActionDossier } from '@prisma/client'

type DossierStakeholders = {
  createurUserId?: string | null
  responsableCSId?: string | null
  assignedToId?: string | null
}

type RecordDossierEventInput = {
  dossierId: string
  userId?: string | null
  typeAction: TypeActionDossier
  resume: string
  action: string
  metadata?: Prisma.InputJsonValue
  updateLastAction?: boolean
}

type NotifyDossierInput = {
  dossier: DossierStakeholders
  title: string
  message: string
  type: TypeNotification
  link?: string | null
  extraUserIds?: Array<string | null | undefined>
}

export function getDossierStakeholderIds(
  dossier: DossierStakeholders,
  extraUserIds: Array<string | null | undefined> = []
) {
  return Array.from(
    new Set(
      [
        dossier.createurUserId,
        dossier.responsableCSId,
        dossier.assignedToId,
        ...extraUserIds,
      ].filter(Boolean)
    )
  ) as string[]
}

export async function recordDossierEvent(input: RecordDossierEventInput) {
  // 1. Mandatory dossier activity record (specific to this dossier)
  try {
    await prisma.dossierActivite.create({
      data: {
        dossierId: input.dossierId,
        userId: input.userId ?? null,
        typeAction: input.typeAction,
        resume: input.resume,
      },
    })
  } catch (error) {
    console.error('Failed to create dossier activity record:', error)
  }

  // 2. Global system activity log (resilient, must not block)
  try {
    const { logActivity } = await import('@/lib/activity-log')
    await logActivity({
      userId: input.userId ?? null,
      action: input.action,
      entity: 'DOSSIER',
      entityId: input.dossierId,
      metadata: input.metadata,
    })
  } catch (error) {
    console.warn('System activity log failed (non-blocking):', error)
  }

  // 3. Update last action timestamp on dossier
  if (input.updateLastAction !== false) {
    try {
      await prisma.dossier.update({
        where: { id: input.dossierId },
        data: { dateDerniereAction: new Date() },
      })
    } catch (error) {
      console.error('Failed to update dossier last action timestamp:', error)
    }
  }
}

export async function notifyDossierStakeholders(input: NotifyDossierInput) {
  return createNotifications({
    userIds: getDossierStakeholderIds(input.dossier, input.extraUserIds),
    title: input.title,
    message: input.message,
    type: input.type,
    link: input.link ?? null,
  })
}

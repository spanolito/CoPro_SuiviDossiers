import prisma from '@/lib/prisma'
import { logActivity } from '@/lib/activity-log'
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
  const operations: Array<Promise<unknown>> = [
    prisma.dossierActivite.create({
      data: {
        dossierId: input.dossierId,
        userId: input.userId ?? null,
        typeAction: input.typeAction,
        resume: input.resume,
      },
    }),
    logActivity({
      userId: input.userId ?? null,
      action: input.action,
      entity: 'DOSSIER',
      entityId: input.dossierId,
      metadata: input.metadata,
    }),
  ]

  if (input.updateLastAction !== false) {
    operations.push(
      prisma.dossier.update({
        where: { id: input.dossierId },
        data: { dateDerniereAction: new Date() },
      })
    )
  }

  await Promise.all(operations)
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

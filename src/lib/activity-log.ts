import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

type LogActivityInput = {
  userId?: string | null
  action: string
  entity: string
  entityId?: string | null
  metadata?: Prisma.InputJsonValue
}

export async function logActivity(input: LogActivityInput) {
  return prisma.activityLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      metadata: input.metadata,
    },
  })
}

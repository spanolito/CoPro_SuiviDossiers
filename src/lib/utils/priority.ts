import { normalizeDossierPriority, normalizeDossierStatus } from '@/lib/dossier-constants'

type DossierPriorityLike = {
  dateEcheance?: Date | string | null
  updatedAt?: Date | string | null
  statut?: string | null
  priorite?: string | null
  assignedToId?: string | null
  responsableActionId?: string | null
  responsableCSId?: string | null
}

export function isOverdue(dossier: DossierPriorityLike): boolean {
  if (!dossier.dateEcheance) return false
  const dueDate = new Date(dossier.dateEcheance)
  const today = new Date()
  return dueDate < today
}

export function isNearDeadline(dossier: DossierPriorityLike, daysTotal = 7): boolean {
  if (!dossier.dateEcheance) return false
  const dueDate = new Date(dossier.dateEcheance)
  const today = new Date()
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= daysTotal
}

export function isInactive(dossier: DossierPriorityLike, daysInactive = 7): boolean {
  if (!dossier.updatedAt) return false
  const lastUpdate = new Date(dossier.updatedAt)
  const today = new Date()
  const diffTime = today.getTime() - lastUpdate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays >= daysInactive
}

export function computePriority(dossier: DossierPriorityLike): 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'FAIBLE' {
  const status = normalizeDossierStatus(dossier.statut)
  const priority = normalizeDossierPriority(dossier.priorite)
  const overdue = isOverdue(dossier)
  const blocked = status === 'WAITING'
  const actionRequired = status === 'RESOLVED' || status === 'OPEN'
  const nearDeadline = isNearDeadline(dossier)

  if (overdue || blocked || (priority === 'URGENT' && nearDeadline)) {
    return 'CRITIQUE'
  }

  if (nearDeadline || actionRequired || priority === 'HIGH') {
    return 'HAUTE'
  }

  if (status === 'IN_PROGRESS' || priority === 'MEDIUM') {
    return 'NORMALE'
  }

  return 'FAIBLE'
}

export function getAlerts(dossier: DossierPriorityLike): string[] {
  const alerts: string[] = []
  
  if (isOverdue(dossier)) {
    alerts.push('Overdue')
  }
  
  if (normalizeDossierStatus(dossier.statut) === 'WAITING') {
    alerts.push('Blocked')
  }
  
  if (!dossier.assignedToId && !dossier.responsableActionId && !dossier.responsableCSId) {
    alerts.push('Unassigned')
  }

  if (isInactive(dossier)) {
    alerts.push('Inactive')
  }

  return alerts
}

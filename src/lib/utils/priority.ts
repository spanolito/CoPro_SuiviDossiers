export function isOverdue(dossier: any): boolean {
  if (!dossier.dateEcheance) return false
  const dueDate = new Date(dossier.dateEcheance)
  const today = new Date()
  return dueDate < today
}

export function isNearDeadline(dossier: any, daysTotal = 7): boolean {
  if (!dossier.dateEcheance) return false
  const dueDate = new Date(dossier.dateEcheance)
  const today = new Date()
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= daysTotal
}

export function isInactive(dossier: any, daysInactive = 7): boolean {
  if (!dossier.updatedAt) return false
  const lastUpdate = new Date(dossier.updatedAt)
  const today = new Date()
  const diffTime = today.getTime() - lastUpdate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays >= daysInactive
}

export function computePriority(dossier: any): 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'FAIBLE' {
  const overdue = isOverdue(dossier)
  const blocked = dossier.statut === 'BLOQUE'
  const actionRequired = dossier.statut === 'A_VALIDER' || dossier.statut === 'ENREGISTRE'
  const nearDeadline = isNearDeadline(dossier)

  if (overdue || blocked || (dossier.priorite === 'CRITIQUE' && nearDeadline)) {
    return 'CRITIQUE'
  }

  if (nearDeadline || actionRequired || dossier.priorite === 'HAUTE') {
    return 'HAUTE'
  }

  if (dossier.statut === 'EN_COURS' || dossier.priorite === 'MOYENNE') {
    return 'NORMALE'
  }

  return 'FAIBLE'
}

export function getAlerts(dossier: any): string[] {
  const alerts: string[] = []
  
  if (isOverdue(dossier)) {
    alerts.push('Overdue')
  }
  
  if (dossier.statut === 'BLOQUE') {
    alerts.push('Blocked')
  }
  
  if (!dossier.responsableActionId && !dossier.responsableCSId) {
    alerts.push('Unassigned')
  }

  if (isInactive(dossier)) {
    alerts.push('Inactive')
  }

  return alerts
}

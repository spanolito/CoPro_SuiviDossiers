export const StatutDossier = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING: 'WAITING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  ARCHIVE: 'ARCHIVE',
  ENREGISTRE: 'ENREGISTRE',
  AFFECTE: 'AFFECTE',
  EN_COURS: 'EN_COURS',
  A_VALIDER: 'A_VALIDER',
  CLOTURE: 'CLOTURE',
  BLOQUE: 'BLOQUE',
} as const

export const PrioriteDossier = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
  BASSE: 'BASSE',
  MOYENNE: 'MOYENNE',
  HAUTE: 'HAUTE',
  CRITIQUE: 'CRITIQUE',
} as const

export const STATUS_ALIASES: Record<string, string[]> = {
  OPEN: ['OPEN', 'ENREGISTRE', 'AFFECTE'],
  IN_PROGRESS: ['IN_PROGRESS', 'EN_COURS'],
  WAITING: ['WAITING', 'BLOQUE'],
  RESOLVED: ['RESOLVED', 'A_VALIDER'],
  CLOSED: ['CLOSED', 'CLOTURE'],
  ARCHIVE: ['ARCHIVE'],
}

export const PRIORITY_ALIASES: Record<string, string[]> = {
  LOW: ['LOW', 'BASSE'],
  MEDIUM: ['MEDIUM', 'MOYENNE'],
  HIGH: ['HIGH', 'HAUTE'],
  URGENT: ['URGENT', 'CRITIQUE'],
}

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['IN_PROGRESS', 'WAITING', 'RESOLVED'],
  IN_PROGRESS: ['WAITING', 'RESOLVED', 'OPEN'],
  WAITING: ['OPEN', 'IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['IN_PROGRESS', 'WAITING', 'CLOSED'],
  CLOSED: ['ARCHIVE'],
  ARCHIVE: [],
  ENREGISTRE: ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED'],
  AFFECTE: ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED'],
  EN_COURS: ['IN_PROGRESS', 'WAITING', 'RESOLVED'],
  A_VALIDER: ['RESOLVED', 'IN_PROGRESS', 'WAITING', 'CLOSED'],
  CLOTURE: ['CLOSED', 'ARCHIVE'],
  BLOQUE: ['OPEN', 'IN_PROGRESS', 'WAITING'],
}

export const STATUT_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  WAITING: 'En attente',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
  ARCHIVE: 'Archivé',
  ENREGISTRE: 'Ouvert',
  AFFECTE: 'Assigné',
  EN_COURS: 'En cours',
  A_VALIDER: 'Résolu',
  CLOTURE: 'Fermé',
  BLOQUE: 'En attente',
}

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgente',
  BASSE: 'Faible',
  MOYENNE: 'Moyenne',
  HAUTE: 'Haute',
  CRITIQUE: 'Urgente',
}

export function normalizeDossierStatus(status: string | null | undefined) {
  if (!status) return 'OPEN'

  if (STATUS_ALIASES.OPEN.includes(status)) return 'OPEN'
  if (STATUS_ALIASES.IN_PROGRESS.includes(status)) return 'IN_PROGRESS'
  if (STATUS_ALIASES.WAITING.includes(status)) return 'WAITING'
  if (STATUS_ALIASES.RESOLVED.includes(status)) return 'RESOLVED'
  if (STATUS_ALIASES.CLOSED.includes(status)) return 'CLOSED'
  if (STATUS_ALIASES.ARCHIVE.includes(status)) return 'ARCHIVE'

  return status
}

export function normalizeDossierPriority(priority: string | null | undefined) {
  if (!priority) return 'MEDIUM'

  if (PRIORITY_ALIASES.LOW.includes(priority)) return 'LOW'
  if (PRIORITY_ALIASES.MEDIUM.includes(priority)) return 'MEDIUM'
  if (PRIORITY_ALIASES.HIGH.includes(priority)) return 'HIGH'
  if (PRIORITY_ALIASES.URGENT.includes(priority)) return 'URGENT'

  return priority
}

export function getStatusLabel(status: string | null | undefined) {
  return STATUT_LABELS[status || ''] || status || 'Inconnu'
}

export function getPriorityLabel(priority: string | null | undefined) {
  return PRIORITY_LABELS[priority || ''] || priority || 'Inconnue'
}

export function getStatusValues(status: string | null | undefined) {
  return STATUS_ALIASES[normalizeDossierStatus(status)] || (status ? [status] : [])
}

export function getPriorityValues(priority: string | null | undefined) {
  return PRIORITY_ALIASES[normalizeDossierPriority(priority)] || (priority ? [priority] : [])
}

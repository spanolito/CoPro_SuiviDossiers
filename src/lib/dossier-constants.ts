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

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  ENREGISTRE: ['AFFECTE', 'BLOQUE'],
  AFFECTE: ['EN_COURS', 'BLOQUE', 'ENREGISTRE'],
  EN_COURS: ['A_VALIDER', 'BLOQUE', 'AFFECTE'],
  A_VALIDER: ['CLOTURE', 'EN_COURS', 'BLOQUE'],
  CLOTURE: ['ARCHIVE'],
  BLOQUE: ['ENREGISTRE', 'AFFECTE', 'EN_COURS'],
  ARCHIVE: [],
}

export const STATUT_LABELS: Record<string, string> = {
  ENREGISTRE: 'Enregistré',
  AFFECTE: 'Affecté',
  EN_COURS: 'En Cours',
  A_VALIDER: 'À Valider',
  CLOTURE: 'Clôturé',
  BLOQUE: 'Bloqué',
  ARCHIVE: 'Archivé',
}

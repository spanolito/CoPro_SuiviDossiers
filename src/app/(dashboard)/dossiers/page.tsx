import prisma from '@/lib/prisma'
import type { Dossier, Prisma, PrioriteDossier, StatutDossier } from '@prisma/client'
import styles from './dossiers.module.css'
import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'
import DossierFilters from '@/components/dossiers/DossierFilters'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { hasPermission } from '@/lib/auth/rbac'
import { getPriorityLabel, getPriorityValues, getStatusLabel, getStatusValues, normalizeDossierPriority, normalizeDossierStatus } from '@/lib/dossier-constants'

export default async function DossiersListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; archived_status?: string }>
}) {
  const { q, status, priority, archived_status } = await searchParams
  const activeFilter = archived_status || 'active'

  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null
  const canCreate = hasPermission(payload?.role as string, 'dossier.create')

  const whereClause: Prisma.DossierWhereInput = {}
  if (q) {
    whereClause.OR = [
      { titre: { contains: q, mode: 'insensitive' } },
      { reference: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (status) {
    const statusValues = status.split(',').flatMap((value) => getStatusValues(value)) as StatutDossier[]
    whereClause.statut = { in: statusValues }
  }
  if (priority) {
    whereClause.priorite = { in: getPriorityValues(priority) as PrioriteDossier[] }
  }

  if (activeFilter === 'archived') {
    whereClause.archived = true
  } else if (activeFilter === 'all') {
    // Show all
  } else {
    whereClause.archived = false
  }

  const dossiers = await prisma.dossier.findMany({
    where: whereClause,
    include: { responsableCS: true, assigneA: true, prestatairePrincipal: true, syndicImplique: true, responsableAction: true },
    orderBy: { updatedAt: 'desc' }
  })

  const getPriorityBadgeClass = (p: string) => {
    switch (normalizeDossierPriority(p)) {
      case 'URGENT': return 'badge-urgent'
      case 'HIGH': return 'badge-high'
      case 'MEDIUM': return 'badge-normal'
      default: return 'badge-low'
    }
  }

  const getStatusBadgeClass = (statut: string) => {
    switch (normalizeDossierStatus(statut)) {
      case 'OPEN': return 'badge-neutral'
      case 'IN_PROGRESS': return 'badge-primary'
      case 'WAITING': return 'badge-warning'
      case 'RESOLVED': return 'badge-info'
      case 'CLOSED': return 'badge-success'
      case 'ARCHIVE': return 'badge-neutral'
      default: return 'badge-neutral'
    }
  }

  const getTypeDossierLabel = (t: string) => {
    const labels: Record<string, string> = {
      SINISTRE: 'Sinistre', TECHNIQUE: 'Technique', CHAUFFAGE: 'Chauffage',
      SECURITE: 'Sécurité', TRAVAUX: 'Travaux', ESPACES_VERTS: 'Espaces verts',
      JURIDIQUE: 'Juridique', FINANCIER: 'Financier', AG: 'AG', AUTRE: 'Autre',
    }
    return labels[t] || t
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Répertoire des dossiers</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: '4px' }}>Gérez et suivez todos los dossiers de la copropriété</p>
        </div>
        {canCreate && (
          <Link href="/dossiers/new" className="btn btn-primary" style={{ padding: '10px 18px', boxShadow: 'var(--shadow-sm)' }}>
            <Plus size={18} />
            Nouveau Dossier
          </Link>
        )}
      </div>

      <DossierFilters 
        currentQ={q || ''} 
        currentStatus={status || ''} 
        currentPriority={priority || ''} 
        currentArchived={activeFilter} 
      />

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Titre</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Priorité</th>
              <th>Assigné à</th>
              <th style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dossiers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>Aucun dossier trouvé</div>
                    <p style={{ fontSize: '14px' }}>Essayez d&apos;ajuster vos filtres de recherche.</p>
                  </div>
                </td>
              </tr>
            ) : dossiers.map((d: Dossier & { assigneA: { nomAffiche: string } | null; responsableCS: { nomAffiche: string } | null; prestatairePrincipal: { nom: string } | null; syndicImplique: { nom: string } | null; responsableAction: { nom: string } | null }) => (
              <tr key={d.id} style={{ cursor: 'pointer' }}>
                <td data-label="Réf.">
                  <Link href={`/dossiers/${d.id}`} className={styles.linkCell} style={{ fontWeight: 600 }}>
                    {d.reference}
                  </Link>
                </td>
                <td data-label="Titre">
                  <Link href={`/dossiers/${d.id}`} className={`${styles.linkCell} ${styles.linkCellColumn}`}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.titre}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {d.prestatairePrincipal?.nom || d.syndicImplique?.nom || d.responsableAction?.nom || 'Non spécifié'}
                    </span>
                  </Link>
                </td>
                <td data-label="Type">
                  <Link href={`/dossiers/${d.id}`} className={styles.linkCell} style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {getTypeDossierLabel(d.typeDossier)}
                  </Link>
                </td>
                <td data-label="Statut">
                  <Link href={`/dossiers/${d.id}`} className={`${styles.linkCell} ${styles.linkCellGap}`}>
                    <span className={`badge ${getStatusBadgeClass(d.statut)}`}>
                      {getStatusLabel(d.statut)}
                    </span>
                    {d.archived && <span className="badge badge-neutral" style={{ opacity: 0.8 }}>Archivé</span>}
                  </Link>
                </td>
                <td data-label="Priorité">
                  <Link href={`/dossiers/${d.id}`} className={styles.linkCell}>
                    <span className={`badge ${getPriorityBadgeClass(d.priorite)}`}>
                      {getPriorityLabel(d.priorite)}
                    </span>
                  </Link>
                </td>
                <td data-label="Responsable">
                  <Link href={`/dossiers/${d.id}`} className={styles.linkCell}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {d.assigneA?.nomAffiche || d.responsableCS?.nomAffiche || '-'}
                    </div>
                  </Link>
                </td>
                <td data-label="Actions" className={styles.actionsCell}>
                  <Link href={`/dossiers/${d.id}`} className={`${styles.linkCell} ${styles.linkCellEnd}`}>
                    <span className={`btn btn-outline ${styles.actionBtn}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Voir <ArrowRight size={14} />
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

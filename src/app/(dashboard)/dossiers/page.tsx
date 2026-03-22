import prisma from '@/lib/prisma'
import styles from './dossiers.module.css'
import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'
import DossierFilters from '@/components/dossiers/DossierFilters'

export default async function DossiersListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string; archived_status?: string }>
}) {
  const { q, status, priority, archived_status } = await searchParams
  const activeFilter = archived_status || 'active'

  const whereClause: any = {}
  if (q) {
    whereClause.OR = [
      { titre: { contains: q, mode: 'insensitive' } },
      { reference: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (status) whereClause.statut = status
  if (priority) whereClause.priorite = priority

  if (activeFilter === 'archived') {
    whereClause.archived = true
  } else if (activeFilter === 'all') {
    // Show all
  } else {
    whereClause.archived = false
  }

  const dossiers = await prisma.dossier.findMany({
    where: whereClause,
    include: { responsableCS: true, prestatairePrincipal: true, syndicImplique: true, responsableAction: true },
    orderBy: { updatedAt: 'desc' }
  })

  const getPriorityLabel = (p: string) => {
    const labels: Record<string, string> = { CRITIQUE: 'Critique', HAUTE: 'Haute', MOYENNE: 'Moyenne', BASSE: 'Basse' }
    return labels[p] || p
  }

  const getPriorityBadgeClass = (p: string) => {
    switch(p) {
      case 'CRITIQUE': return 'badge-urgent'
      case 'HAUTE': return 'badge-high'
      case 'MOYENNE': return 'badge-normal'
      default: return 'badge-low'
    }
  }

  const getStatusLabel = (statut: string) => {
    const labels: Record<string, string> = {
      ENREGISTRE: 'Enregistré', AFFECTE: 'Affecté', EN_COURS: 'En Cours',
      A_VALIDER: 'À Valider', CLOTURE: 'Clôturé', BLOQUE: 'Bloqué', ARCHIVE: 'Archivé'
    }
    return labels[statut] || statut
  }

  const getStatusBadgeClass = (statut: string) => {
    switch(statut) {
      case 'ENREGISTRE': return 'badge-neutral'
      case 'AFFECTE': return 'badge-info'
      case 'EN_COURS': return 'badge-primary'
      case 'A_VALIDER': return 'badge-warning'
      case 'CLOTURE': return 'badge-success'
      case 'BLOQUE': return 'badge-bloque'
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
        <Link href="/dossiers/new" className="btn btn-primary" style={{ padding: '10px 18px', boxShadow: 'var(--shadow-sm)' }}>
          <Plus size={18} />
          Nouveau Dossier
        </Link>
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
              <th>Responsable CS</th>
              <th style={{ textAlign: 'right', paddingRight: '16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dossiers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: '16px', fontWeight: 600 }}>Aucun dossier trouvé</div>
                    <p style={{ fontSize: '14px' }}>Essayez d'ajuster vos filtres de recherche.</p>
                  </div>
                </td>
              </tr>
            ) : dossiers.map((d: any) => (
              <tr key={d.id} style={{ cursor: 'pointer' }}>
                <td>
                  <Link href={`/dossiers/${d.id}`} style={{ display: 'flex', alignItems: 'center', padding: '16px', color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none', height: '100%' }}>
                    {d.reference}
                  </Link>
                </td>
                <td>
                  <Link href={`/dossiers/${d.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '16px', textDecoration: 'none', height: '100%' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.titre}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {d.prestatairePrincipal?.nom || d.syndicImplique?.nom || d.responsableAction?.nom || 'Non spécifié'}
                    </span>
                  </Link>
                </td>
                <td>
                  <Link href={`/dossiers/${d.id}`} style={{ display: 'flex', alignItems: 'center', padding: '16px', textDecoration: 'none', height: '100%' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{getTypeDossierLabel(d.typeDossier)}</span>
                  </Link>
                </td>
                <td>
                  <Link href={`/dossiers/${d.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '16px', textDecoration: 'none', height: '100%' }}>
                    <span className={`badge ${getStatusBadgeClass(d.statut)}`}>
                      {getStatusLabel(d.statut)}
                    </span>
                    {d.archived && <span className="badge badge-neutral" style={{ opacity: 0.8 }}>Archivé</span>}
                  </Link>
                </td>
                <td>
                  <Link href={`/dossiers/${d.id}`} style={{ display: 'flex', alignItems: 'center', padding: '16px', textDecoration: 'none', height: '100%' }}>
                    <span className={`badge ${getPriorityBadgeClass(d.priorite)}`}>
                      {getPriorityLabel(d.priorite)}
                    </span>
                  </Link>
                </td>
                <td>
                  <Link href={`/dossiers/${d.id}`} style={{ display: 'flex', alignItems: 'center', padding: '16px', textDecoration: 'none', height: '100%' }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{d.responsableCS?.nomAffiche || '-'}</div>
                  </Link>
                </td>
                <td>
                  <Link href={`/dossiers/${d.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '16px', textDecoration: 'none', height: '100%' }}>
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

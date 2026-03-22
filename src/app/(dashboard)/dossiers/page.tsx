import prisma from '@/lib/prisma'
import styles from './dossiers.module.css'
import Link from 'next/link'
import { Plus } from 'lucide-react'

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
      { titre: { contains: q } },
      { reference: { contains: q } },
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

  const getPriorityBadgeClass = (p: string) => {
    switch(p) {
      case 'CRITIQUE': return 'badge-urgent'
      case 'HAUTE': return 'badge-high'
      case 'MOYENNE': return 'badge-normal'
      default: return 'badge-low'
    }
  }

  const getStatusLabel = (statut: string) => {
    switch(statut) {
      case 'ENREGISTRE': return 'Enregistré'
      case 'AFFECTE': return 'Affecté'
      case 'EN_COURS': return 'En Cours'
      case 'A_VALIDER': return 'À Valider'
      case 'CLOTURE': return 'Clôturé'
      case 'BLOQUE': return 'Bloqué'
      case 'ARCHIVE': return 'Archivé'
      default: return statut
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
          <h2>Répertoire des dossiers</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gérez et suivez tous les dossiers de la copropriété</p>
        </div>
        <Link href="/dossiers/new" className="btn btn-primary">
          <Plus size={18} />
          Nouveau Dossier
        </Link>
      </div>

      <form className={styles.filtersForm} method="GET">
        <div className={styles.filterGroup}>
          <label htmlFor="q">Recherche</label>
          <input type="text" id="q" name="q" className="form-control" defaultValue={q} placeholder="Ref ou Titre..." />
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="status">Statut</label>
          <select id="status" name="status" className="form-control" defaultValue={status}>
            <option value="">Tous les statuts</option>
            <option value="ENREGISTRE">Enregistré</option>
            <option value="AFFECTE">Affecté</option>
            <option value="EN_COURS">En Cours</option>
            <option value="A_VALIDER">À Valider</option>
            <option value="CLOTURE">Clôturé</option>
            <option value="BLOQUE">Bloqué</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="priority">Priorité</label>
          <select id="priority" name="priority" className="form-control" defaultValue={priority}>
            <option value="">Toutes les priorités</option>
            <option value="CRITIQUE">Critique</option>
            <option value="HAUTE">Haute</option>
            <option value="MOYENNE">Moyenne</option>
            <option value="BASSE">Basse</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="archived_status">Affichage</label>
          <select id="archived_status" name="archived_status" className="form-control" defaultValue={activeFilter}>
            <option value="active">Actifs uniquement</option>
            <option value="archived">Archivés uniquement</option>
            <option value="all">Tous</option>
          </select>
        </div>
        <button type="submit" className="btn btn-outline" style={{ height: '40px' }}>Filtrer</button>
      </form>

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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dossiers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  Aucun dossier trouvé.
                </td>
              </tr>
            ) : dossiers.map((d: any) => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.reference}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{d.titre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {d.prestatairePrincipal?.nom || d.syndicImplique?.nom || d.responsableAction?.nom || ''}
                  </div>
                </td>
                <td>{getTypeDossierLabel(d.typeDossier)}</td>
                <td>
                  <span className="badge" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                    {getStatusLabel(d.statut)}
                  </span>
                  {d.archived && <span className="badge" style={{ background: 'var(--warning)', color: 'black', marginLeft: 4 }}>Archivé</span>}
                </td>
                <td>
                  <span className={`badge ${getPriorityBadgeClass(d.priorite)}`}>
                    {d.priorite}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: 13 }}>{d.responsableCS?.nomAffiche || '-'}</div>
                </td>
                <td>
                  <Link href={`/dossiers/${d.id}`} className={`btn btn-outline ${styles.actionBtn}`}>
                    Voir
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

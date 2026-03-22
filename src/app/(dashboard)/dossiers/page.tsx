import prisma from '@/lib/prisma'
import styles from './dossiers.module.css'
import Link from 'next/link'
import { Plus } from 'lucide-react'

// Must pass searchParams to page in Next 15 / App router via async prop
export default async function DossiersListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; priority?: string }>
}) {
  const { q, status, priority } = await searchParams

  const whereClause: any = {}
  if (q) {
    whereClause.OR = [
      { title: { contains: q } },
      { reference: { contains: q } },
    ]
  }
  if (status) whereClause.statut = status
  if (priority) whereClause.priorite = priority

  const dossiers = await prisma.dossier.findMany({
    where: whereClause,
    include: { category: true, assignee: true },
    orderBy: { updatedAt: 'desc' }
  })

  // Format Helper
  const getPriorityBadgeClass = (priority: string) => {
    switch(priority) {
      case 'urgente': return 'badge-urgent'
      case 'haute': return 'badge-high'
      case 'moyenne': return 'badge-normal'
      default: return 'badge-low'
    }
  }

  const getStatusLabel = (statut: string) => {
    switch(statut) {
      case 'nouveau': return 'Nouveau'
      case 'en_analyse': return 'En Analyse'
      case 'en_attente_devis': return 'Attente Devis'
      case 'en_attente_syndic': return 'Attente Syndic'
      case 'en_cours': return 'En Cours'
      case 'urgent_intervention': return 'Intervention Urgente'
      case 'en_suivi': return 'En Suivi'
      case 'bloque': return 'Bloqué'
      case 'resolu': return 'Résolu'
      case 'cloture': return 'Clôturé'
      default: return statut
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2>Répertoire des dossiers</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gérez et suivez tous les incidents de la copropriété</p>
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
            <option value="nouveau">Nouveau</option>
            <option value="en_analyse">En Analyse</option>
            <option value="en_attente_devis">Attente Devis</option>
            <option value="en_cours">En Cours</option>
            <option value="resolu">Résolu</option>
            <option value="cloture">Clôturé</option>
            <option value="bloque">Bloqué</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="priority">Priorité</label>
          <select id="priority" name="priority" className="form-control" defaultValue={priority}>
            <option value="">Toutes les priorités</option>
            <option value="urgente">Urgente</option>
            <option value="haute">Haute</option>
            <option value="moyenne">Moyenne</option>
            <option value="basse">Basse</option>
          </select>
        </div>
        <button type="submit" className="btn btn-outline" style={{ height: '40px' }}>Filtrer</button>
      </form>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Titre</th>
              <th>Catégorie</th>
              <th>Statut</th>
              <th>Priorité</th>
              <th>Responsable</th>
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
            ) : dossiers.map((d) => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.reference}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{d.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.building} {d.lotZone ? `- ${d.lotZone}` : ''}</div>
                </td>
                <td>{d.category.name}</td>
                <td>
                  <span className={`badge`} style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                    {getStatusLabel(d.statut)}
                  </span>
                </td>
                <td>
                  <span className={`badge ${getPriorityBadgeClass(d.priorite)}`}>
                    {d.priorite}
                  </span>
                </td>
                <td>{d.assignee?.name || '-'}</td>
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

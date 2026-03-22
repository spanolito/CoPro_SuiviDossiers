import prisma from '@/lib/prisma'
import styles from './dashboard.module.css'
import Link from 'next/link'
import { MoreVertical } from 'lucide-react'

// Helper to get initials
const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

export default async function DashboardPage() {
  const dossiers = await prisma.dossier.findMany({
    include: {
      category: true,
      assignee: true,
    },
    orderBy: { updatedAt: 'desc' }
  })

  // Group dossiers into columns
  const pendingStatuses = ['nouveau', 'en_analyse', 'en_attente_devis', 'en_attente_syndic']
  const assignedStatuses = ['en_cours', 'urgent_intervention', 'en_suivi']
  const completedStatuses = ['resolu', 'cloture']
  const canceledStatuses = ['bloque']

  const columns = [
    { title: 'À Traiter (Pending)', items: dossiers.filter(d => pendingStatuses.includes(d.statut)) },
    { title: 'En Cours (Assigned)', items: dossiers.filter(d => assignedStatuses.includes(d.statut)) },
    { title: 'Terminés (Completed)', items: dossiers.filter(d => completedStatuses.includes(d.statut)) },
    { title: 'Bloqués/Annulés (Canceled)', items: dossiers.filter(d => canceledStatuses.includes(d.statut)) },
  ]

  const getPriorityBadgeClass = (priority: string) => {
    switch(priority) {
      case 'urgente': return 'badge-urgent'
      case 'haute': return 'badge-high'
      case 'moyenne': return 'badge-normal'
      default: return 'badge-low'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch(priority) {
      case 'urgente': return 'Urgent'
      case 'haute': return 'High'
      case 'moyenne': return 'Normal'
      default: return 'Low'
    }
  }

  return (
    <div className={styles.boardContainer}>
      {columns.map((col) => (
        <div key={col.title} className={styles.column}>
          <div className={styles.columnHeader}>
            {col.title}
            <span style={{ background: 'var(--border-color)', padding: '2px 8px', borderRadius: '12px' }}>
              {col.items.length}
            </span>
          </div>
          
          {col.items.map((dossier) => (
             <Link href={`/dossiers/${dossier.id}`} key={dossier.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.cardCategory}>
                      <MoreVertical size={14} />
                      <span className={styles.cardRef}>{dossier.reference}</span>
                    </div>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {dossier.category.name}
                    </span>
                  </div>
                  <span className={`badge ${getPriorityBadgeClass(dossier.priorite)}`}>
                    {getPriorityLabel(dossier.priorite)}
                  </span>
                </div>

                <div className={styles.cardLocation}>
                  <span>Location</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)'}}>
                    {dossier.building} {dossier.lotZone ? `- ${dossier.lotZone}` : ''}
                  </span>
                </div>

                <div className={styles.cardTitle}>{dossier.title}</div>
                <div className={styles.cardDescription}>{dossier.description}</div>

                {dossier.assignee && (
                  <div className={styles.cardFooter}>
                    <div className={styles.avatar} style={{ width: 28, height: 28, fontSize: 11 }}>
                      {getInitials(dossier.assignee.name)}
                    </div>
                    <div className={styles.assigneeInfo}>
                      <span className={styles.assigneeLabel}>Assigned to</span>
                      <span className={styles.assigneeName}>{dossier.assignee.name}</span>
                    </div>
                  </div>
                )}
             </Link>
          ))}
        </div>
      ))}
    </div>
  )
}

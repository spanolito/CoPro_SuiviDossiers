import prisma from '@/lib/prisma'
import styles from './dashboard.module.css'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, CircleDot, Clock, LayoutGrid, PauseCircle, Users, Calendar } from 'lucide-react'
import ClickableRow from '@/components/ui/ClickableRow'
import { computePriority, isOverdue, getAlerts } from '@/lib/utils/priority'
import AlertsCard from '@/components/dashboard/AlertsCard'
import { FileText } from 'lucide-react'
import type { StaticImageData } from 'next/image'


const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

const getPriorityLabel = (p: string) => {
  const labels: Record<string, string> = { CRITIQUE: 'Critique', HAUTE: 'Haute', MOYENNE: 'Moyenne', BASSE: 'Basse' }
  return labels[p] || p
}

const getStatusLabel = (s: string) => {
  const labels: Record<string, string> = {
    ENREGISTRE: 'Enregistré', AFFECTE: 'Affecté', EN_COURS: 'En Cours',
    A_VALIDER: 'À Valider', CLOTURE: 'Clôturé', BLOQUE: 'Bloqué'
  }
  return labels[s] || s
}

const EmptyState = ({ message }: { message: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', color: 'var(--text-secondary)', gap: '8px' }}>
    <CircleDot size={24} style={{ opacity: 0.4 }} />
    <span style={{ fontSize: '13px', fontStyle: 'italic' }}>{message}</span>
  </div>
)

export default async function DashboardPage() {
  const [dossiers, users, intervenants, activityLogs] = await Promise.all([
    prisma.dossier.findMany({
      include: { responsableCS: true, prestatairePrincipal: true, syndicImplique: true },
      where: { archived: false }
    }),
    prisma.utilisateur.findMany({
      where: { role: { in: ['PRESIDENT_CS', 'MEMBRE_CS'] } },
      include: { dossiersResponsableCS: true }
    }),
    prisma.intervenant.findMany({
      where: { actif: true },
      include: { dossiersPrestataire: true, dossiersSyndic: true, dossiersAction: true }
    }),
    prisma.dossierActivite.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { auteur: true }
    })
  ])

  // alerts
  const alerts: any[] = []
  dossiers.forEach((d: any) => {
    const items = getAlerts(d)
    items.forEach((type: string) => {
      alerts.push({
        id: d.id,
        titre: d.titre,
        reference: d.reference,
        type: type.toUpperCase() as any
      })
    })
  })

  const countUrgent = dossiers.filter((d: any) => computePriority(d) === 'CRITIQUE' && d.statut !== 'CLOTURE').length
  const countEnAttente = dossiers.filter((d: any) => d.statut === 'ENREGISTRE' || d.statut === 'AFFECTE').length
  const countEnCours = dossiers.filter((d: any) => d.statut === 'EN_COURS' || d.statut === 'A_VALIDER').length
  const countBlocked = dossiers.filter((d: any) => d.statut === 'BLOQUE').length
  const countClosed = dossiers.filter((d: any) => d.statut === 'CLOTURE').length

  const prioritizedDossiers = dossiers
    .map((d: any) => ({ ...d, computedPriority: computePriority(d) }))
    .filter((d: any) => d.computedPriority !== 'FAIBLE' && d.statut !== 'CLOTURE')
    .sort((a: any, b: any) => {
      const priorityOrder: Record<'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'FAIBLE', number> = { CRITIQUE: 0, HAUTE: 1, NORMALE: 2, FAIBLE: 3 }
      const orderA = priorityOrder[a.computedPriority as keyof typeof priorityOrder]
      const orderB = priorityOrder[b.computedPriority as keyof typeof priorityOrder]

      if (orderA !== orderB) {
        return orderA - orderB
      }
      if (a.dateEcheance && b.dateEcheance) {
        return new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime()
      }
      return 0
    })
    .slice(0, 7);


  const getReasonBadge = (d: any) => {
    if (d.statut === 'BLOQUE') return <span className="badge badge-bloque">Bloqué</span>
    if (d.computedPriority === 'CRITIQUE') return <span className="badge badge-urgent">Critique</span>
    if (d.statut === 'A_VALIDER') return <span className="badge badge-warning">À Valider</span>
    if (!d.responsableCSId) return <span className="badge badge-neutral">Non assigné</span>
    return null
  }


  const staffBreakdown = users.map((u: any) => ({
    name: u.nomAffiche,
    count: u.dossiersResponsableCS.filter((d: any) => d.statut !== 'CLOTURE' && !d.archived).length
  })).sort((a: any, b: any) => b.count - a.count)

  const intervenantsBreakdown = intervenants.map((i: any) => ({
    name: i.nom,
    count: [...i.dossiersPrestataire, ...i.dossiersSyndic, ...i.dossiersAction].filter((d: any) => d.statut !== 'CLOTURE' && !d.archived).length
  })).sort((a: any, b: any) => b.count - a.count).filter((x: any) => x.count > 0)

  const formatTime = (date: Date) => {
    const min = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000)
    if (min < 60) return `${min}m`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h`
    return new Date(date).toLocaleDateString('fr-FR')
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 1. Vue Rapide / Metrics */}
      <div className={styles.metricsRow}>
        <Link href="/dossiers?priority=CRITIQUE" className={styles.metricCard} style={{ borderTopColor: 'var(--urgent-text)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className={styles.metricTitle}>Urgents</span>
            <AlertCircle size={18} color="var(--urgent-text)" />
          </div>
          <span className={styles.metricValue} style={{ color: 'var(--urgent-text)' }}>{countUrgent}</span>
        </Link>
        <Link href="/dossiers?status=ENREGISTRE,AFFECTE" className={styles.metricCard} style={{ borderTopColor: 'var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className={styles.metricTitle}>En attente</span>
            <Clock size={18} color="var(--warning)" />
          </div>
          <span className={styles.metricValue}>{countEnAttente}</span>
        </Link>
        <Link href="/dossiers?status=EN_COURS,A_VALIDER" className={styles.metricCard} style={{ borderTopColor: 'var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className={styles.metricTitle}>En cours</span>
            <Clock size={18} color="var(--primary)" />
          </div>
          <span className={styles.metricValue}>{countEnCours}</span>
        </Link>
        <Link href="/dossiers?status=BLOQUE" className={styles.metricCard} style={{ borderTopColor: 'var(--bloque-text)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className={styles.metricTitle}>Bloqués</span>
            <PauseCircle size={18} color="var(--bloque-text)" />
          </div>
          <span className={styles.metricValue} style={{ color: 'var(--bloque-text)' }}>{countBlocked}</span>
        </Link>
        <Link href="/dossiers?status=CLOTURE" className={styles.metricCard} style={{ borderTopColor: 'var(--success)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className={styles.metricTitle}>Clôturés</span>
            <CheckCircle2 size={18} color="var(--success)" />
          </div>
          <span className={styles.metricValue}>{countClosed}</span>
        </Link>
      </div>

      <div className={styles.dashboardGrid}>
        {/* Central Widgets Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 1.5 alerts widget */}
          <AlertsCard alerts={alerts.slice(0, 5)} />

          {/* 2. Actions prioritaires widget */}
          <div className={styles.widget}>

            <div className={styles.widgetTitle} style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={18} color="var(--danger)" /> Actions prioritaires
              </div>
              <span className="badge badge-danger" style={{ fontSize: 11 }}>{prioritizedDossiers.length} items</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className={styles.widgetTable}>
                <thead>
                  <tr>
                    <th>Dossier</th>
                    <th>Priorité</th>
                    <th>Statut</th>
                    <th>Responsable</th>
                    <th>Échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {prioritizedDossiers.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 0 }}><EmptyState message="Aucune action prioritized requise." /></td></tr>
                  ) : prioritizedDossiers.map((d: any) => (
                    <ClickableRow key={d.id} href={`/dossiers/${d.id}`}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.titre}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.reference}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${d.computedPriority === 'CRITIQUE' ? 'badge-urgent' : d.computedPriority === 'HAUTE' ? 'badge-high' : 'badge-normal'}`}>
                          {getPriorityLabel(d.computedPriority)}
                        </span>
                        {isOverdue(d) && <span className="badge badge-danger" style={{ marginLeft: 6, fontSize: 10 }}>En Retard</span>}
                      </td>
                      <td>
                        <span className="badge badge-neutral" style={{ opacity: 0.85 }}>{getStatusLabel(d.statut)}</span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '140px' }}>
                          {d.responsableCS?.nomAffiche || '-'}
                        </span>
                      </td>
                      <td>
                        {d.dateEcheance ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--danger-text)', fontSize: 12 }}>
                            <Calendar size={14} />
                            {new Date(d.dateEcheance).toLocaleDateString('fr-FR')}
                          </div>
                        ) : <span style={{ color: 'var(--text-secondary)' }}>-</span>}
                      </td>
                    </ClickableRow>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Actions récentes widget (Movido aquí) */}
          <div className={styles.widget}>
            <div className={styles.widgetTitle}><AlertCircle size={18} color="var(--primary)" /> Actions récentes</div>
            <div className={styles.timelineStream}>
              {activityLogs.length === 0 ? (
                <EmptyState message="Aucune activité récente." />
              ) : activityLogs.map((log: any) => (
                <div key={log.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} style={{
                    backgroundColor: log.resume?.includes('détecté') || log.resume?.includes('cree') ? 'var(--info)' :
                      log.resume?.includes('bloqué') ? 'var(--danger-text)' : 'var(--primary)'
                  }}></div>
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineText}>{log.resume}</span>
                    <span className={styles.timelineTime}>{log.auteur?.nomAffiche} · {formatTime(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 3. Répartition Responsables CS */}
          <div className={styles.widget}>
            <div className={styles.widgetTitle}><Users size={18} color="var(--primary)" /> Suivi CS</div>
            <div className={styles.assigneeList}>
              {staffBreakdown.length === 0 ? (
                <EmptyState message="Aucun membre actif." />
              ) : staffBreakdown.map((staff: any, index: number) => (
                <div key={index} className={styles.assigneeItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className={styles.avatar}>{getInitials(staff.name)}</div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{staff.name}</span>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: 12 }}>{staff.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.widget}>
            <div className={styles.widgetTitle}><Users size={18} color="var(--primary)" /> Intervenants Actifs</div>
            <div className={styles.assigneeList}>
              {intervenantsBreakdown.length === 0 ? (
                <EmptyState message="Aucun intervenant administratif." />
              ) : intervenantsBreakdown.map((intv: any, index: number) => (
                <div key={index} className={styles.assigneeItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className={styles.avatar} style={{ background: 'var(--success-bg)', color: 'var(--success-text)' }}>{getInitials(intv.name)}</div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{intv.name}</span>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: 12 }}>{intv.count}</span>
                </div>
              ))}
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}

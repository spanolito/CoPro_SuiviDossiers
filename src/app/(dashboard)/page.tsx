import prisma from '@/lib/prisma'
import styles from './dashboard.module.css'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, CircleDot, Clock, LayoutGrid, PauseCircle, Users } from 'lucide-react'

const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

export default async function DashboardPage() {
  const dossiers = await prisma.dossier.findMany({
    include: { responsableCS: true, prestatairePrincipal: true, syndicImplique: true }
  })

  // Metrics
  const countNew = dossiers.filter((d: any) => d.statut === 'ENREGISTRE').length
  const countAssigned = dossiers.filter((d: any) => d.statut === 'AFFECTE' || d.statut === 'EN_COURS').length
  const countToValidate = dossiers.filter((d: any) => d.statut === 'A_VALIDER').length
  const countClosed = dossiers.filter((d: any) => d.statut === 'CLOTURE').length
  const countBlocked = dossiers.filter((d: any) => d.statut === 'BLOQUE').length

  // Todo Items Lists
  const unassigned = dossiers.filter((d: any) => !d.responsableCSId && d.statut !== 'CLOTURE' && d.statut !== 'BLOQUE' && !d.archived)
  const blocked = dossiers.filter((d: any) => d.statut === 'BLOQUE')
  const toValidate = dossiers.filter((d: any) => d.statut === 'A_VALIDER')

  // Assignee Breakdown
  const users = await prisma.utilisateur.findMany({
    where: { role: { in: ['PRESIDENT_CS', 'MEMBRE_CS'] } },
    include: { dossiersResponsableCS: true }
  })
  const staffBreakdown = users.map((u: any) => ({
    name: u.nomAffiche,
    count: u.dossiersResponsableCS.filter((d: any) => d.statut !== 'CLOTURE' && !d.archived).length
  })).sort((a: any, b: any) => b.count - a.count)

  const intervenants = await prisma.intervenant.findMany({
    where: { actif: true },
    include: { dossiersPrestataire: true, dossiersSyndic: true, dossiersAction: true }
  })
  const intervenantsBreakdown = intervenants.map((i: any) => ({
    name: i.nom,
    count: [...i.dossiersPrestataire, ...i.dossiersAction].filter((d: any) => d.statut !== 'CLOTURE' && !d.archived).length
  })).sort((a: any, b: any) => b.count - a.count).filter((x: any) => x.count > 0)

  // Recent Streams
  const activityLogs = await prisma.dossierActivite.findMany({
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: { auteur: true }
  })

  const formatTime = (date: Date) => {
    const min = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000)
    if (min < 60) return `il y a ${min} m`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `il y a ${hr} h`
    return new Date(date).toLocaleDateString('fr-FR')
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 1. Vue Rapide / Metrics */}
      <div className={styles.metricsRow}>
        <Link href="/dossiers?status=ENREGISTRE" className={styles.metricCard}>
          <CircleDot size={20} color="var(--info)" />
          <span className={styles.metricValue}>{countNew}</span>
          <span className={styles.metricTitle}>Enregistrés</span>
        </Link>
        <Link href="/dossiers?status=EN_COURS" className={styles.metricCard}>
          <Clock size={20} color="var(--primary)" />
          <span className={styles.metricValue}>{countAssigned}</span>
          <span className={styles.metricTitle}>En Cours</span>
        </Link>
        <Link href="/dossiers?status=A_VALIDER" className={styles.metricCard}>
          <AlertCircle size={20} color="var(--warning)" />
          <span className={styles.metricValue}>{countToValidate}</span>
          <span className={styles.metricTitle}>À Valider</span>
        </Link>
        <Link href="/dossiers?status=CLOTURE" className={styles.metricCard}>
          <CheckCircle2 size={20} color="var(--success)" />
          <span className={styles.metricValue}>{countClosed}</span>
          <span className={styles.metricTitle}>Clôturés</span>
        </Link>
        <Link href="/dossiers?status=BLOQUE" className={styles.metricCard}>
          <PauseCircle size={20} color="var(--danger)" />
          <span className={styles.metricValue}>{countBlocked}</span>
          <span className={styles.metricTitle}>Bloqués</span>
        </Link>
      </div>

      <div className={styles.dashboardGrid}>
        {/* Central Widgets Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 2. Actions à faire widget */}
          <div className={styles.widget}>
            <div className={styles.widgetTitle}><AlertCircle size={18} color="var(--primary)" /> Actions à faire</div>
            <div className={styles.todoList}>
              {unassigned.length > 0 && unassigned.map((d: any) => (
                <Link href={`/dossiers/${d.id}`} key={d.id} className={styles.todoItem}>
                  <div className={styles.todoMain}>
                    <span className={styles.todoTitle}>{d.titre}</span>
                    <span className={styles.todoSub}>Non affecté – {d.typeDossier} ({d.reference})</span>
                  </div>
                  <span className="badge" style={{ background: '#FFF4E6', color: '#FD7E14', fontSize: 11 }}>À affecter</span>
                </Link>
              ))}
              {toValidate.length > 0 && toValidate.map((d: any) => (
                <Link href={`/dossiers/${d.id}`} key={d.id} className={styles.todoItem}>
                  <div className={styles.todoMain}>
                    <span className={styles.todoTitle}>{d.titre}</span>
                    <span className={styles.todoSub}>Attente approbation Président ({d.reference})</span>
                  </div>
                  <span className="badge" style={{ background: '#E6FCF5', color: '#099268', fontSize: 11 }}>À clôturer</span>
                </Link>
              ))}
              {blocked.length > 0 && blocked.map((d: any) => (
                <Link href={`/dossiers/${d.id}`} key={d.id} className={styles.todoItem}>
                  <div className={styles.todoMain}>
                    <span className={styles.todoTitle}>{d.titre}</span>
                    <span className={styles.todoSub}>Dossier bloqué ({d.reference})</span>
                  </div>
                  <span className="badge" style={{ background: '#FFF5F5', color: '#FA5252', fontSize: 11 }}>Bloqué</span>
                </Link>
              ))}
              {unassigned.length === 0 && toValidate.length === 0 && blocked.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>Aucune action urgente requise.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Widgets Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* 3. Répartition Responsables CS */}
          <div className={styles.widget}>
            <div className={styles.widgetTitle}><Users size={18} color="var(--primary)" /> Suivi CS</div>
            <div className={styles.assigneeList}>
              {staffBreakdown.map((staff: any, index: number) => (
                <div key={index} className={styles.assigneeItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className={styles.avatar}>{getInitials(staff.name)}</div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{staff.name}</span>
                  </div>
                  <span className="badge" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', fontSize: 12 }}>{staff.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.widget}>
            <div className={styles.widgetTitle}><Users size={18} color="var(--primary)" /> Intervenants Actifs</div>
            <div className={styles.assigneeList}>
              {intervenantsBreakdown.map((intv: any, index: number) => (
                <div key={index} className={styles.assigneeItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className={styles.avatar} style={{ background: '#e9fac8', color: '#5c940d' }}>{getInitials(intv.name)}</div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{intv.name}</span>
                  </div>
                  <span className="badge" style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', fontSize: 12 }}>{intv.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Derniers Mouvements */}
          <div className={styles.widget}>
            <div className={styles.widgetTitle}><LayoutGrid size={18} color="var(--primary)" /> Actions récentes</div>
            <div className={styles.timelineStream}>
              {activityLogs.map((log: any) => (
                <div key={log.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineText}>{log.resume}</span>
                    <span className={styles.timelineTime}>{log.auteur?.nomAffiche} – {formatTime(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

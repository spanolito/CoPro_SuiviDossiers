import React from 'react'
import Link from 'next/link'
import { AlertCircle, AlertTriangle, Clock, UserX } from 'lucide-react'
import styles from '@/app/(dashboard)/dashboard.module.css'

interface AlertItem {
  id: string
  titre: string
  reference: string
  type: 'RETARD' | 'BLOQUE' | 'NON_ASSIGNE' | 'INACTIF'
}

interface AlertsCardProps {
  alerts: AlertItem[]
}

export default function AlertsCard({ alerts }: AlertsCardProps) {
  if (alerts.length === 0) return null

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'RETARD': return <Clock size={16} color="var(--danger)" />
      case 'BLOQUE': return <AlertTriangle size={16} color="var(--bloque-text)" />
      case 'NON_ASSIGNE': return <UserX size={16} color="var(--warning)" />
      case 'INACTIF': return <AlertCircle size={16} color="var(--text-secondary)" />
      default: return <AlertCircle size={16} />
    }
  }

  const getAlertLabel = (type: string) => {
    switch (type) {
      case 'RETARD': return 'En Retard'
      case 'BLOQUE': return 'Bloqué'
      case 'NON_ASSIGNE': return 'Non Assigné'
      case 'INACTIF': return 'Inactif'
      default: return 'Alerte'
    }
  }

  return (
    <div className={styles.widget}>
      <div className={styles.widgetTitle} style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={18} color="var(--urgent-text)" /> Alertes Opérationnelles
        </div>
        <span className="badge badge-danger" style={{ fontSize: 11 }}>{alerts.length} items</span>
      </div>
      <div className={styles.timelineStream} style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {alerts.map((alert) => (
          <Link href={`/dossiers/${alert.id}`} key={alert.id} className={styles.timelineItem} style={{ textDecoration: 'none', color: 'inherit', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flexShrink: 0 }}>{getAlertIcon(alert.type)}</div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{alert.titre}</span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{alert.reference}</span>
            </div>
            <span className={`badge`} style={{ 
              fontSize: 10,
              backgroundColor: alert.type === 'RETARD' ? 'var(--danger-bg)' : alert.type === 'BLOQUE' ? 'var(--bloque-bg)' : alert.type === 'NON_ASSIGNE' ? 'var(--warning-bg)' : 'var(--neutral-bg)',
              color: alert.type === 'RETARD' ? 'var(--danger-text)' : alert.type === 'BLOQUE' ? 'var(--bloque-text)' : alert.type === 'NON_ASSIGNE' ? 'var(--warning-text)' : 'var(--text-secondary)'
            }}>
              {getAlertLabel(alert.type)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

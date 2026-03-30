'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { getMyNotifications, markAsRead } from './actions'
import styles from './notification.module.css'

type Notif = { id: string; titre: string; message: string; lu: boolean; createdAt: Date }

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    getMyNotifications().then(data => {
      if (Array.isArray(data)) {
        setNotifications(data)
      }
    })
  }, [])

  const unreadCount = notifications.filter(n => !n.lu).length

  const handleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const target = notifications.find(n => n.id === id)
    if (!target || target.lu) return

    await markAsRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n))
  }

  return (
    <div className={styles.container}>
      <div onClick={() => setIsOpen(!isOpen)} className={styles.bell}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge}></span>
        )}
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span>Notifications ({unreadCount})</span>
            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
              <X size={20} />
            </button>
          </div>
          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.empty}>Aucune notification.</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`${styles.item} ${!n.lu ? styles.itemUnread : ''}`}
                  style={{ cursor: n.lu ? 'default' : 'pointer' }}
                  onClick={(e) => handleRead(n.id, e)}
                >
                  <div className={styles.itemHeader} style={{ fontWeight: n.lu ? 500 : 700 }}>
                    <span>{n.titre}</span>
                    {!n.lu && <Check size={14} color="var(--primary)" style={{ flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>
                    {new Date(n.createdAt).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

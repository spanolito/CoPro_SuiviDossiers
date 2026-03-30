'use client'

import { useEffect, useState } from 'react'
import { Bell, Check, CheckCheck, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getMyNotifications, markAsRead } from './actions'
import styles from './notification.module.css'

type Notif = {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: Date | string
  link?: string | null
}

export default function NotificationBell() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notif[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    getMyNotifications().then((data) => {
      if (!data) return
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    })
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const handleRead = async (notification: Notif) => {
    if (notification.read) {
      if (notification.link) {
        router.push(notification.link)
      }
      return
    }

    await markAsRead(notification.id)

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      )
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    if (notification.link) {
      router.push(notification.link)
    }
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={styles.bell}
        aria-label="Ouvrir les notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div
            className={styles.panel}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            <div className={styles.header}>
              <div>
                <div className={styles.title}>Notifications</div>
                <div className={styles.subtitle}>{unreadCount} non lue(s)</div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={styles.closeBtn}
                aria-label="Fermer les notifications"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.list}>
              {notifications.length === 0 ? (
                <div className={styles.empty}>Aucune notification.</div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    className={`${styles.item} ${!notification.read ? styles.itemUnread : ''}`}
                    onClick={() => handleRead(notification)}
                  >
                    <div className={styles.itemHeader}>
                      <span>{notification.title}</span>
                      {notification.read ? (
                        <CheckCheck size={14} className={styles.readIcon} />
                      ) : (
                        <Check size={14} className={styles.unreadIcon} />
                      )}
                    </div>
                    <div className={styles.message}>{notification.message}</div>
                    <div className={styles.timestamp}>
                      {new Date(notification.createdAt).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

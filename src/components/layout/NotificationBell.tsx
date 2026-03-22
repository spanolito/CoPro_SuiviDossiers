'use client'

import { useState, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { getMyNotifications, markAsRead } from './actions'

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
    <div style={{ position: 'relative', cursor: 'pointer', color: 'var(--text-secondary)' }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ position: 'relative' }}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, background: 'var(--danger)', borderRadius: '50%' }}></span>
        )}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 30, right: -10, width: 320, background: 'var(--panel-bg)',
          border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Notifications ({unreadCount})</span>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-secondary)' }}>&times;</button>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>Aucune notification.</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{
                  padding: 12, borderBottom: '1px solid var(--border-color)',
                  background: n.lu ? 'transparent' : 'rgba(var(--primary), 0.05)',
                  cursor: n.lu ? 'default' : 'pointer'
                }} onClick={(e) => handleRead(n.id, e)}>
                  <div style={{ fontSize: 13, fontWeight: n.lu ? 500 : 700, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
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

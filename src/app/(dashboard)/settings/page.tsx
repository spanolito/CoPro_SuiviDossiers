import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { Settings, ShieldAlert } from 'lucide-react'

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? await verifyToken(token) : null

  if (payload?.role !== 'admin') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh',
        color: 'var(--text-secondary)',
        gap: '16px'
      }}>
        <Settings size={64} color="var(--primary)" style={{ opacity: 0.8 }} />
        <h2 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Page en construction</h2>
        <p style={{ fontSize: '14px' }}>Cette page sera disponible prochainement.</p>
      </div>
    )
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: { utilisateur: { select: { nomAffiche: true, email: true } } },
    take: 50 // Limit to 50 for now
  })

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
          <ShieldAlert size={24} color="var(--primary)" />
          Journal de Bord (Logbook)
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Suivi des actions et connexions des utilisateurs.</p>
      </div>

      <div style={{ background: 'var(--panel-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Date</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Utilisateur</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Action</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {new Date(log.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-primary)' }}>
                  {log.utilisateur?.nomAffiche || 'Système'}
                  {log.utilisateur?.email && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{log.utilisateur.email}</div>}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                  <span className="badge" style={{ 
                    background: log.action === 'LOGIN' ? '#E6FCF5' : log.action === 'PASSWORD_RESET' ? '#FFF4E6' : '#E6F4FA',
                    color: log.action === 'LOGIN' ? '#099268' : log.action === 'PASSWORD_RESET' ? '#FD7E14' : '#0F766E',
                    fontSize: '11px',
                    padding: '2px 8px'
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {log.description}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Aucun journal trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

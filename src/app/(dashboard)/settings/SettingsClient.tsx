'use client'

import { useState } from 'react'
import { Permission, hasPermission } from '@/lib/security/rbac'
import LogbookAdmin from '@/components/logbook/LogbookAdmin'
import { Settings, User, Bell, AppWindow, GitBranch, ShieldAlert } from 'lucide-react'

// Tab Definitions linked to Permissions
const ALL_TABS = [
  { id: 'general', label: 'Général', icon: Settings, permission: Permission.SETTINGS_READ_SELF },
  { id: 'compte', label: 'Mon compte', icon: User, permission: Permission.SETTINGS_READ_SELF },
  { id: 'notifications', label: 'Notifications', icon: Bell, permission: Permission.SETTINGS_READ_SELF },
  { id: 'application', label: 'Application', icon: AppWindow, permission: Permission.SETTINGS_READ_APP },
  { id: 'workflow', label: 'Workflow', icon: GitBranch, permission: Permission.WORKFLOW_READ },
  { id: 'logbook', label: 'Journal de Bord', icon: ShieldAlert, permission: Permission.LOGBOOK_READ },
]

export default function SettingsClient({ user }: { user: any }) {
  const visibleTabs = ALL_TABS.filter(tab => hasPermission(user, tab.permission))
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || 'general')

  const canEditApp = hasPermission(user, Permission.SETTINGS_UPDATE_APP)

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <div className="card"><h3>Général</h3><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Configuration générale de votre espace.</p></div>
      case 'compte':
        return <div className="card"><h3>Mon compte</h3><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gérez vos informations personnelles et identifiants.</p></div>
      case 'notifications':
        return <div className="card"><h3>Notifications</h3><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Préférences de réception des alertes email et système.</p></div>
      case 'application':
        return (
          <div className="card">
            <h3>Configuration Application</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Paramètres système de la copropriété.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Nom de la Copropriété</label>
              <input type="text" value="L'Ambassadeur" disabled={!canEditApp} className="form-control" />
              {!canEditApp && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Lecture seule</span>}
            </div>
          </div>
        )
      case 'workflow':
        return <div className="card"><h3>Workflow</h3><p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gestion des états et transitions des dossiers.</p></div>
      case 'logbook':
        return <LogbookAdmin />
      default:
        return null
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Préférences</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Gérez vos accès et les configurations de l'espace.</p>
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Navigation Tabs (Sidebar Layout style inside page) */}
        <div style={{ width: 220, background: 'var(--panel-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          {visibleTabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 16px',
                  background: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content area */}
        <div style={{ flex: 1 }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

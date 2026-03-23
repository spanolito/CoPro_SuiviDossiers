'use client'

import { useState } from 'react'
import { Permission, hasPermission } from '@/lib/security/rbac'
import LogbookAdmin from '@/components/logbook/LogbookAdmin'
import { Settings, User, Bell, AppWindow, GitBranch, ShieldAlert, Key } from 'lucide-react'
import { 
  saveGeneralSettings, 
  saveAccountSettings, 
  changePassword,
  saveNotificationSettings, 
  saveApplicationSettings, 
  saveWorkflowSettings 
} from './actions'

const ALL_TABS = [
  { id: 'general', label: 'Général', icon: Settings, permission: Permission.SETTINGS_READ_SELF },
  { id: 'compte', label: 'Mon compte', icon: User, permission: Permission.SETTINGS_READ_SELF },
  { id: 'notifications', label: 'Notifications', icon: Bell, permission: Permission.SETTINGS_READ_SELF },
  { id: 'workflow', label: 'Workflow', icon: GitBranch, permission: Permission.WORKFLOW_READ },
  { id: 'application', label: 'Application', icon: AppWindow, permission: Permission.SETTINGS_UPDATE_APP }, // Restricted to Admin
  { id: 'logbook', label: 'Journal de Bord', icon: ShieldAlert, permission: Permission.LOGBOOK_READ }, // Restricted to Admin
]

export default function SettingsClient({ user, copro }: { user: any, copro: any }) {
  const visibleTabs = ALL_TABS.filter(tab => hasPermission(user, tab.permission))
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || 'general')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const canEditApp = hasPermission(user, Permission.SETTINGS_UPDATE_APP)
  const canEditWorkflow = hasPermission(user, Permission.WORKFLOW_UPDATE)

  // 1. Général States
  const [general, setGeneral] = useState({
    timezone: user.timezone || 'Europe/Paris',
    dateFormat: user.dateFormat || 'JJ/MM/AAAA',
    timeFormat: user.timeFormat || '24h',
    density: user.density || 'Confortable'
  })

  // 2. Mon Compte States
  const [account, setAccount] = useState({ nomAffiche: user.nomAffiche || '', email: user.email || '' })
  const [pass, setPass] = useState({ current: '', newPass: '', confirm: '' })
  const [showPassModal, setShowPassModal] = useState(false)

  // 3. Notifications States
  const [notifs, setNotifs] = useState({
    notifDossier: user.notifDossier ?? true,
    notifStatut: user.notifStatut ?? true,
    notifCommentaire: user.notifCommentaire ?? true,
    notifValidation: user.notifValidation ?? true,
    notifFrequency: user.notifFrequency || 'Instantané'
  })

  // 4. Application States
  const [app, setApp] = useState({
    logoUrl: copro?.logoUrl || '',
    officialEmail: copro?.officialEmail || '',
    globalNotifs: copro?.globalNotifs ?? true,
    validationRequiredBeforeClose: copro?.validationRequiredBeforeClose ?? false
  })

  // 5. Workflow States
  const [wf, setWf] = useState({
    allowBlockedStatus: copro?.allowBlockedStatus ?? true,
    allowEditAfterValidation: copro?.allowEditAfterValidation ?? false,
    defaultValidationDelay: copro?.defaultValidationDelay || 7,
    defaultReminderDelay: copro?.defaultReminderDelay || 3
  })

  const triggerFeedback = (res: { success?: boolean, error?: string, message?: string }) => {
    if (res.success) {
      setFeedback({ type: 'success', message: res.message || 'Sauvegardé avec succès.' })
    } else {
      setFeedback({ type: 'error', message: res.error || 'Erreur lors de la sauvegarde.' })
    }
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleSaveGeneral = async () => {
    setLoading(true)
    const res = await saveGeneralSettings(general)
    triggerFeedback(res)
    setLoading(false)
  }

  const handleSaveAccount = async () => {
    setLoading(true)
    const res = await saveAccountSettings(account)
    triggerFeedback(res)
    setLoading(false)
  }

  const handleChangePassword = async () => {
    if (pass.newPass !== pass.confirm) {
      triggerFeedback({ error: 'Les nouveaux mots de passe ne correspondent pas.' })
      return
    }
    setLoading(true)
    const res = await changePassword({ current: pass.current, newPass: pass.newPass })
    triggerFeedback(res)
    if (res.success) {
      setShowPassModal(false)
      setPass({ current: '', newPass: '', confirm: '' })
    }
    setLoading(false)
  }

  const handleSaveNotifs = async () => {
    setLoading(true)
    const res = await saveNotificationSettings(notifs)
    triggerFeedback(res)
    setLoading(false)
  }

  const handleSaveApp = async () => {
    setLoading(true)
    const res = await saveApplicationSettings(app)
    triggerFeedback(res)
    setLoading(false)
  }

  const handleSaveWorkflow = async () => {
    setLoading(true)
    const res = await saveWorkflowSettings(wf)
    triggerFeedback(res)
    setLoading(false)
  }

  const renderTabContent = () => {
    const cardStyle = { background: 'var(--panel-bg)', padding: 24, borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }
    const formGroupStyle = { marginBottom: 16, display: 'flex', flexDirection: 'column' as 'column', gap: 6 }
    const labelStyle = { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }

    switch (activeTab) {
      case 'general':
        return (
          <div style={cardStyle}>
            <h3>Général</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>Gérez vos paramètres d'affichage fondamentaux.</p>
            <div style={{ maxWidth: 400 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Fuseau horaire</label>
                <select value={general.timezone} onChange={e => setGeneral({ ...general, timezone: e.target.value })} className="form-control">
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Format de date</label>
                <select value={general.dateFormat} onChange={e => setGeneral({ ...general, dateFormat: e.target.value })} className="form-control">
                  <option value="JJ/MM/AAAA">JJ/MM/AAAA</option>
                  <option value="AAAA-MM-JJ">AAAA-MM-JJ</option>
                </select>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Format de l’heure</label>
                <select value={general.timeFormat} onChange={e => setGeneral({ ...general, timeFormat: e.target.value })} className="form-control">
                  <option value="24h">24h</option>
                  <option value="12h">12h</option>
                </select>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Densité d’affichage</label>
                <select value={general.density} onChange={e => setGeneral({ ...general, density: e.target.value })} className="form-control">
                  <option value="Compact">Compact</option>
                  <option value="Confortable">Confortable</option>
                </select>
              </div>
              <button disabled={loading} onClick={handleSaveGeneral} className="btn btn-primary" style={{ marginTop: 8 }}>
                {loading ? 'Sauvegarde...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )
      case 'compte':
        return (
          <div style={cardStyle}>
            <h3>Mon compte</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>Informations publiques et identifiants.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 18 }}>
                {account.nomAffiche?.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="badge badge-normal" style={{ fontSize: 11 }}>{user.role}</span>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{user.email}</p>
              </div>
            </div>
            <div style={{ maxWidth: 400 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Nom complet</label>
                <input type="text" value={account.nomAffiche} onChange={e => setAccount({ ...account, nomAffiche: e.target.value })} className="form-control" />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Adresse e-mail</label>
                <input type="email" value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })} className="form-control" />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button disabled={loading} onClick={handleSaveAccount} className="btn btn-primary">Enregistrer</button>
                <button onClick={() => setShowPassModal(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Key size={14} /> Modifier le mot de passe
                </button>
              </div>
            </div>

            {showPassModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                <div style={{ background: 'var(--panel-bg)', padding: 24, borderRadius: 'var(--radius-md)', width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <h4 style={{ marginBottom: 16 }}>Changer le mot de passe</h4>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Mot de passe actuel</label>
                    <input type="password" value={pass.current} onChange={e => setPass({ ...pass, current: e.target.value })} className="form-control" />
                  </div>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Nouveau mot de passe</label>
                    <input type="password" value={pass.newPass} onChange={e => setPass({ ...pass, newPass: e.target.value })} className="form-control" />
                  </div>
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Confirmer le mot de passe</label>
                    <input type="password" value={pass.confirm} onChange={e => setPass({ ...pass, confirm: e.target.value })} className="form-control" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                    <button onClick={() => setShowPassModal(false)} className="btn btn-outline">Annuler</button>
                    <button disabled={loading} onClick={handleChangePassword} className="btn btn-primary">Confirmer</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      case 'notifications':
        return (
          <div style={cardStyle}>
            <h3>Notifications</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 4 }}>Préférences des alertes e-mail.</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, fontStyle: 'italic' }}>
              Ces paramètres contrôlent l’envoi des notifications par e-mail.
            </p>
            <div style={{ maxWidth: 450 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                  <input type="checkbox" checked={notifs.notifDossier} onChange={e => setNotifs({ ...notifs, notifDossier: e.target.checked })} />
                  Création d'un nouveau dossier
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                  <input type="checkbox" checked={notifs.notifStatut} onChange={e => setNotifs({ ...notifs, notifStatut: e.target.checked })} />
                  Changement de statut
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                  <input type="checkbox" checked={notifs.notifCommentaire} onChange={e => setNotifs({ ...notifs, notifCommentaire: e.target.checked })} />
                  Nouveau commentaire
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                  <input type="checkbox" checked={notifs.notifValidation} onChange={e => setNotifs({ ...notifs, notifValidation: e.target.checked })} />
                  Demande de validation
                </label>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Fréquence des envois</label>
                <select value={notifs.notifFrequency} onChange={e => setNotifs({ ...notifs, notifFrequency: e.target.value })} className="form-control">
                  <option value="Instantané">Instantané</option>
                  <option value="Digest quotidien">Digest quotidien</option>
                </select>
              </div>
              <button disabled={loading} onClick={handleSaveNotifs} className="btn btn-primary" style={{ marginTop: 8 }}>Enregistrer</button>
            </div>
          </div>
        )
      case 'application':
        return (
          <div style={cardStyle}>
            <h3>Application</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>Paramètres globaux de la copropriété.</p>
            <div style={{ maxWidth: 450 }}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>E-mail officiel d'envoi</label>
                <input type="email" value={app.officialEmail} onChange={e => setApp({ ...app, officialEmail: e.target.value })} disabled={!canEditApp} className="form-control" />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>URL Logo</label>
                <input type="text" value={app.logoUrl} onChange={e => setApp({ ...app, logoUrl: e.target.value })} disabled={!canEditApp} className="form-control" placeholder="https://..." />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                  <input type="checkbox" checked={app.globalNotifs} onChange={e => setApp({ ...app, globalNotifs: e.target.checked })} disabled={!canEditApp} />
                  Notifications globales activées
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                  <input type="checkbox" checked={app.validationRequiredBeforeClose} onChange={e => setApp({ ...app, validationRequiredBeforeClose: e.target.checked })} disabled={!canEditApp} />
                  Validation obligatoire avant clôture
                </label>
              </div>
              {canEditApp ? (
                <button disabled={loading} onClick={handleSaveApp} className="btn btn-primary">Enregistrer</button>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Lecture seule</span>
              )}
            </div>
          </div>
        )
      case 'workflow':
        return (
          <div style={cardStyle}>
            <h3>Workflow</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>Règles et délais de transition.</p>
            <div style={{ maxWidth: 450 }}>
              <div style={{ marginBottom: 20 }}>
                <h5 style={{ marginBottom: 8, fontSize: 13 }}>Statuts utilisables :</h5>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['Enregistré', 'Affecté', 'En cours', 'À valider', 'Clôturé', 'Bloqué'].map(s => <span key={s} className="badge badge-normal">{s}</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                  <input type="checkbox" checked={wf.allowBlockedStatus} onChange={e => setWf({ ...wf, allowBlockedStatus: e.target.checked })} disabled={!canEditWorkflow} />
                  Autoriser le passage au statut Bloqué
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14 }}>
                  <input type="checkbox" checked={wf.allowEditAfterValidation} onChange={e => setWf({ ...wf, allowEditAfterValidation: e.target.checked })} disabled={!canEditWorkflow} />
                  Autoriser la modification après validation
                </label>
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Délai de validation par défaut (jours)</label>
                <input type="number" value={wf.defaultValidationDelay} onChange={e => setWf({ ...wf, defaultValidationDelay: parseInt(e.target.value) })} disabled={!canEditWorkflow} className="form-control" />
              </div>
              <div style={formGroupStyle}>
                <label style={labelStyle}>Délai de relance automatique (jours)</label>
                <input type="number" value={wf.defaultReminderDelay} onChange={e => setWf({ ...wf, defaultReminderDelay: parseInt(e.target.value) })} disabled={!canEditWorkflow} className="form-control" />
              </div>
              {canEditWorkflow ? (
                <button disabled={loading} onClick={handleSaveWorkflow} className="btn btn-primary">Enregistrer</button>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Lecture seule</span>
              )}
            </div>
          </div>
        )
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

      {feedback && (
        <div style={{ padding: '10px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16, background: feedback.type === 'success' ? '#e6fcf5' : '#fff5f5', color: feedback.type === 'success' ? '#099268' : '#e03131', border: `1px solid ${feedback.type === 'success' ? '#c3fae8' : '#ffe3e3'}`, fontSize: 13 }}>
          {feedback.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ width: 220, background: 'var(--panel-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          {visibleTabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', gap: 12, width: '100%', padding: '12px 16px',
                  background: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                  border: 'none', borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  textAlign: 'left', fontSize: 14, fontWeight: isActive ? 600 : 500, cursor: 'pointer'
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1 }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

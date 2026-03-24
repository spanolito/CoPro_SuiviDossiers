'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, ExternalLink, RefreshCw } from 'lucide-react'
import { createPrestataire, updatePrestataire, deletePrestataire, syncPrestataires } from './actions'
import styles from './prestataires.module.css'

type Prestataire = {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  adresse: string | null
  contactPrincipal: string | null
  contactRole: string | null
  siteWeb: string | null
  notes: string | null
  actif: boolean
}

export default function PrestatairesClient({ 
  initialData, 
  canEdit 
}: { 
  initialData: any[], 
  canEdit: boolean 
}) {
  const [items, setItems] = useState<any[]>(initialData)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [editItem, setEditItem] = useState<Prestataire | null>(null)
  
  const [formValues, setFormValues] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    contactPrincipal: '',
    contactRole: '',
    siteWeb: '',
    notes: '',
    actif: true
  })

  const resetForm = () => {
    setFormValues({
      nom: '', email: '', telephone: '', adresse: '', contactPrincipal: '', contactRole: '', siteWeb: '', notes: '', actif: true
    })
    setEditItem(null)
  }

  const handleCreate = () => {
    resetForm()
    setShowModal(true)
  }

  const handleSync = async () => {
    if (!confirm('Voulez-vous importer les prestataires par défaut ?')) return
    setSyncing(true)
    try {
      const res = await syncPrestataires()
      alert(res.message || 'Synchronisation réussie')
      const { getPrestataires } = await import('./actions')
      const updated = await getPrestataires()
      setItems(updated)
    } catch (err: any) {
      alert(err.message || 'Erreur de synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  const handleEdit = (p: Prestataire) => {
    setEditItem(p)
    setFormValues({
      nom: p.nom,
      email: p.email || '',
      telephone: p.telephone || '',
      adresse: p.adresse || '',
      contactPrincipal: p.contactPrincipal || '',
      contactRole: p.contactRole || '',
      siteWeb: p.siteWeb || '',
      notes: p.notes || '',
      actif: p.actif
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { actif, ...payload } = formValues
    try {
      if (editItem) {
        await updatePrestataire(editItem.id, formValues)
      } else {
        await createPrestataire(payload)
      }
      const { getPrestataires } = await import('./actions')
      const updated = await getPrestataires()
      setItems(updated)
      setShowModal(false)
      resetForm()
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l’enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce prestataire ?')) return
    try {
      const res = await deletePrestataire(id)
      if (res?.error) {
        alert(res.error)
      } else {
        setItems(items.filter(i => i.id !== id))
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression')
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Prestataires</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Consultez et gérez la liste des fournisseurs et prestataires.</p>
        </div>
        {canEdit && (
          <div className={styles.headerActions}>
            <button 
              onClick={handleSync} 
              className="btn btn-outline" 
              style={{ display: 'flex', alignItems: 'center', gap: 8 }} 
              disabled={syncing}
            >
              <RefreshCw size={16} /> {syncing ? 'Mise à jour...' : 'Synchroniser'}
            </button>
            <button onClick={handleCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> Ajouter un prestataire
            </button>
          </div>
        )}
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Contact</th>
              <th>Téléphone</th>
              <th>E-mail</th>
              <th>Statut</th>
              {canEdit && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td data-label="Nom">
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.nom}</div>
                  {item.siteWeb && (
                    <a href={item.siteWeb.startsWith('http') ? item.siteWeb : `https://${item.siteWeb}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <ExternalLink size={12} /> {item.siteWeb}
                    </a>
                  )}
                </td>
                <td data-label="Contact">
                  <div>{item.contactPrincipal || '-'}</div>
                  {item.contactRole && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.contactRole}</div>}
                </td>
                <td data-label="Téléphone">{item.telephone || '-'}</td>
                <td data-label="E-mail">{item.email || '-'}</td>
                <td data-label="Statut">
                  <span className={`badge ${item.actif ? 'badge-success' : 'badge-normal'}`}>
                    {item.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                {canEdit && (
                  <td data-label="Actions" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEdit(item)} className="btn btn-outline" style={{ padding: '4px 8px', fontSize: 12 }}>
                        <Edit size={14} /> Modifier
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="btn btn-outline btn-outline-danger" style={{ padding: '4px 8px', fontSize: 12 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 6 : 5} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                  Aucun prestataire enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--panel-bg)', padding: 24, borderRadius: 'var(--radius-lg)', width: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ marginBottom: 16 }}>{editItem ? 'Modifier' : 'Ajouter'} un prestataire</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Nom de la société / Professionnel *</label>
                <input type="text" value={formValues.nom} onChange={e => setFormValues({ ...formValues, nom: e.target.value })} className="form-control" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input type="text" value={formValues.telephone} onChange={e => setFormValues({ ...formValues, telephone: e.target.value })} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Adresse E-mail</label>
                  <input type="email" value={formValues.email} onChange={e => setFormValues({ ...formValues, email: e.target.value })} className="form-control" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Nom du Contact</label>
                  <input type="text" value={formValues.contactPrincipal} onChange={e => setFormValues({ ...formValues, contactPrincipal: e.target.value })} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Rôle du Contact</label>
                  <input type="text" value={formValues.contactRole} onChange={e => setFormValues({ ...formValues, contactRole: e.target.value })} className="form-control" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Adresse Complète</label>
                <input type="text" value={formValues.adresse} onChange={e => setFormValues({ ...formValues, adresse: e.target.value })} className="form-control" />
              </div>

              <div className="form-group">
                <label className="form-label">Site Web</label>
                <input type="text" value={formValues.siteWeb} onChange={e => setFormValues({ ...formValues, siteWeb: e.target.value })} className="form-control" placeholder="https://..." />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea value={formValues.notes} onChange={e => setFormValues({ ...formValues, notes: e.target.value })} className="form-control" rows={3} />
              </div>

              {editItem && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <input type="checkbox" checked={formValues.actif} onChange={e => setFormValues({ ...formValues, actif: e.target.checked })} />
                  Prestataire Actif
                </label>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline" disabled={loading}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

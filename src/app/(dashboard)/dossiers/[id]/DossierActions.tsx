'use client'

import { useState } from 'react'
import { Trash2, Archive, AlertTriangle, RefreshCcw } from 'lucide-react'
import { archiveDossier, deleteDossiers } from './actions'
import styles from './dossier-detail.module.css'

interface DossierActionsProps {
  dossierId: string
  isAdmin: boolean
  isArchived: boolean
  counts: {
    etapes: number
    commentaires: number
    documents: number
  }
}

export default function DossierActions({ dossierId, isAdmin, isArchived, counts }: DossierActionsProps) {
  const [showModal, setShowModal] = useState<'archive' | 'delete' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const hasContent = counts.etapes > 0 || counts.commentaires > 0 || counts.documents > 0

  const handleArchive = async () => {
    setIsSubmitting(true)
    await archiveDossier(dossierId, !isArchived)
    setIsSubmitting(false)
    setShowModal(null)
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    await deleteDossiers(dossierId)
    setIsSubmitting(false)
    setShowModal(null)
  }

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {/* Archive Button */}
      {isAdmin && (
        <button 
          className="btn btn-outline" 
          onClick={() => setShowModal('archive')}
          style={{ borderColor: isArchived ? 'var(--warning)' : 'var(--border-color)', color: isArchived ? 'var(--warning)' : 'var(--text-primary)' }}
        >
          {isArchived ? <RefreshCcw size={16} /> : <Archive size={16} />}
          {isArchived ? 'Désarchiver' : 'Archiver'}
        </button>
      )}

      {/* Delete Button (Admin Only) */}
      {isAdmin && (
        <button 
          className="btn" 
          style={{ background: 'var(--danger)', color: 'white' }} 
          onClick={() => setShowModal('delete')}
        >
          <Trash2 size={16} /> Supprimer définitivement
        </button>
      )}

      {/* Modals Container */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: 500, width: '90%', padding: 24, background: 'var(--panel-bg)', borderRadius: 'var(--radius-lg)' }}>
            
            {showModal === 'archive' && (
              <>
                <h3 style={{ marginBottom: 16 }}>{isArchived ? 'Désarchiver ce dossier' : 'Archiver ce dossier'}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                  {isArchived 
                    ? "Le dossier réapparaîtra dans la liste des dossiers actifs." 
                    : "Le dossier disparaîtra de la liste active mais restera consultable via les filtres. Son historique sera conservé."}
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="btn btn-outline" onClick={() => setShowModal(null)} disabled={isSubmitting}>Annuler</button>
                  <button className="btn btn-primary" onClick={handleArchive} disabled={isSubmitting}>
                    {isSubmitting ? 'Traitement...' : 'Confirmer'}
                  </button>
                </div>
              </>
            )}

            {showModal === 'delete' && (
              <>
                <h3 style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}>
                  <AlertTriangle size={24} /> Suppression Définitive
                </h3>
                
                {hasContent ? (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: 16, borderRadius: 'var(--radius-md)', marginBottom: 20 }}>
                    <p style={{ fontWeight: 600, color: 'var(--danger)', fontSize: 14, marginBottom: 8 }}>
                      ATTENTION : Ce dossier contient :
                    </p>
                    <ul style={{ fontSize: 13, color: 'var(--text-primary)', marginLeft: 20, marginBottom: 12 }}>
                      {counts.etapes > 0 && <li>{counts.etapes}étape(s)</li>}
                      {counts.commentaires > 0 && <li>{counts.commentaires} commentaire(s)</li>}
                      {counts.documents > 0 && <li>{counts.documents} document(s)</li>}
                    </ul>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      La suppression détruira TOUTES ces données définitivement. Nous vous recommandons d'**Archiver** plutôt que de supprimer pour garder l'historique.
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
                    Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible.
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button className="btn btn-outline" onClick={() => setShowModal(null)} disabled={isSubmitting}>Annuler</button>
                  {hasContent && (
                    <button className="btn btn-outline" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }} onClick={handleArchive} disabled={isSubmitting}>
                      Préférer l'Archivage
                    </button>
                  )}
                  <button className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={handleDelete} disabled={isSubmitting}>
                    {isSubmitting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

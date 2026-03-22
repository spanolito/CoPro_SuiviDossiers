'use client'

import { useState } from 'react'
import { Check, Clock, AlertCircle, Play } from 'lucide-react'
import { updateDossierStatus, finalizeDossier } from './actions'
import styles from './dossier-detail.module.css'

interface Props {
  dossierId: string
  currentStatus: string
  isAdmin: boolean
  hasResponsables: boolean
  finalDecision?: string | null
}

export default function DossierStatusControls({ dossierId, currentStatus, isAdmin, hasResponsables, finalDecision }: Props) {
  const [loading, setLoading] = useState(false)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [decisionText, setDecisionText] = useState('')

  const stages = [
    { key: 'ENREGISTRE', label: 'Enregistré' },
    { key: 'AFFECTE', label: 'Affecté' },
    { key: 'EN_COURS', label: 'En Cours' },
    { key: 'A_VALIDER', label: 'À Valider' },
    { key: 'CLOTURE', label: 'Clôturé' }
  ]

  const currentIndex = stages.findIndex(s => s.key === currentStatus)

  const handleAdvance = async () => {
    setLoading(true)
    try {
      if (currentStatus === 'ENREGISTRE') {
         if (!hasResponsables) { alert("Veuillez d'abord affecter un Responsable CS via le bouton Éditer."); }
         else await updateDossierStatus(dossierId, 'AFFECTE')
      } else if (currentStatus === 'AFFECTE') {
        await updateDossierStatus(dossierId, 'EN_COURS')
      } else if (currentStatus === 'EN_COURS') {
        setShowFinalizeModal(true)
      }
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFinalizeSubmit = async () => {
    setLoading(true)
    try {
      await finalizeDossier(dossierId, decisionText)
      setShowFinalizeModal(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    setLoading(true)
    try {
      await updateDossierStatus(dossierId, 'CLOTURE')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className={styles.stepperContainer}>
        <div className={styles.stepper}>
          {stages.map((stage, index) => {
            const isCompleted = index < currentIndex || currentStatus === 'CLOTURE'
            const isActive = index === currentIndex && currentStatus !== 'CLOTURE'

            return (
              <div key={stage.key} className={`${styles.stepItem} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}>
                <div className={styles.stepDot}>
                  {isCompleted ? <Check size={14} /> : (index + 1)}
                </div>
                <span className={styles.stepLabel}>{stage.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {finalDecision && (
         <div className="card" style={{ background: '#FFFDF9', borderColor: '#FADB9F', marginBottom: 24 }}>
           <strong style={{ fontSize: 13, color: '#D48806', display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} /> Décision finale enregistrée :</strong>
           <p style={{ fontSize: 14, marginTop: 6, color: 'var(--text-primary)' }}>{finalDecision}</p>
         </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'flex-end' }}>
        {currentIndex >= 0 && currentIndex < 3 && currentStatus !== 'BLOQUE' && (
          <button className="btn btn-primary" onClick={handleAdvance} disabled={loading}>
            <Play size={16} /> {currentStatus === 'EN_COURS' ? 'Demander Validation' : 'Faire Avancer'}
          </button>
        )}

        {currentStatus === 'A_VALIDER' && isAdmin && (
          <button className="btn" style={{ background: 'var(--success)', color: 'white' }} onClick={handleClose} disabled={loading}>
            <Check size={16} /> Clôturer le dossier
          </button>
        )}

        {currentStatus === 'A_VALIDER' && !isAdmin && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={16} /> En attente de clôture par le Président du CS
          </div>
        )}
      </div>

      {showFinalizeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right:0, bottom:0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="card" style={{ width: 400, background: 'white' }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={18} color="var(--primary)" /> Finalisation du Dossier</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Veuillez enregistrer la décision finale ou conclusion avant de demander la validation au Président du CS.</p>
            <textarea
              className="form-control"
              placeholder="Décision, conclusion, résultats..."
              style={{ width: '100%', minHeight: 100, marginBottom: 16 }}
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              required
            ></textarea>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowFinalizeModal(false)} disabled={loading}>Annuler</button>
              <button className="btn btn-primary" onClick={handleFinalizeSubmit} disabled={loading || !decisionText}>Soumettre</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

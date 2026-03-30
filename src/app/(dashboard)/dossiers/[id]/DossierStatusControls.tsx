'use client'

import { useState } from 'react'
import { Check, Clock, AlertCircle, Play, PauseCircle } from 'lucide-react'
import { finalizeDossier, updateDossierStatus } from './actions'
import styles from './dossier-detail.module.css'
import { normalizeDossierStatus } from '@/lib/dossier-constants'

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

  const status = normalizeDossierStatus(currentStatus)
  const stages = [
    { key: 'OPEN', label: 'Ouvert' },
    { key: 'IN_PROGRESS', label: 'En cours' },
    { key: 'WAITING', label: 'En attente' },
    { key: 'RESOLVED', label: 'Résolu' },
    { key: 'CLOSED', label: 'Fermé' },
  ]

  const currentIndex = stages.findIndex((stage) => stage.key === status)

  const runAction = async (callback: () => Promise<void>) => {
    setLoading(true)
    try {
      await callback()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inattendue'
      alert(message)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    if (!hasResponsables) {
      alert("Veuillez d'abord définir une assignation via le bouton Éditer.")
      return
    }

    await runAction(() => updateDossierStatus(dossierId, 'IN_PROGRESS'))
  }

  const handleFinalizeSubmit = async () => {
    await runAction(async () => {
      await finalizeDossier(dossierId, decisionText)
      setShowFinalizeModal(false)
    })
  }

  return (
    <div>
      <div className={styles.stepperContainer}>
        <div className={styles.stepper}>
          {stages.map((stage, index) => {
            const isCompleted = index < currentIndex || status === 'CLOSED'
            const isActive = index === currentIndex && status !== 'CLOSED'

            return (
              <div key={stage.key} className={`${styles.stepItem} ${isActive ? styles.active : ''} ${isCompleted ? styles.completed : ''}`}>
                <div className={styles.stepDot}>
                  {isCompleted ? <Check size={14} /> : index + 1}
                </div>
                <span className={styles.stepLabel}>{stage.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {finalDecision && (
        <div className="card" style={{ background: '#FFFDF9', borderColor: '#FADB9F', marginBottom: 24 }}>
          <strong style={{ fontSize: 13, color: '#D48806', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} /> Conclusion enregistrée
          </strong>
          <p style={{ fontSize: 14, marginTop: 6, color: 'var(--text-primary)' }}>{finalDecision}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {status === 'OPEN' && (
          <button className="btn btn-primary" onClick={handleStart} disabled={loading}>
            <Play size={16} /> Démarrer le traitement
          </button>
        )}

        {status === 'IN_PROGRESS' && (
          <>
            <button className="btn btn-outline" onClick={() => runAction(() => updateDossierStatus(dossierId, 'WAITING'))} disabled={loading}>
              <PauseCircle size={16} /> Mettre en attente
            </button>
            <button className="btn btn-primary" onClick={() => setShowFinalizeModal(true)} disabled={loading}>
              <Check size={16} /> Marquer comme résolu
            </button>
          </>
        )}

        {status === 'WAITING' && (
          <>
            <button className="btn btn-outline" onClick={() => runAction(() => updateDossierStatus(dossierId, 'IN_PROGRESS'))} disabled={loading}>
              <Play size={16} /> Reprendre
            </button>
            <button className="btn btn-primary" onClick={() => setShowFinalizeModal(true)} disabled={loading}>
              <Check size={16} /> Résoudre
            </button>
          </>
        )}

        {status === 'RESOLVED' && isAdmin && (
          <button className="btn" style={{ background: 'var(--success)', color: 'white' }} onClick={() => runAction(() => updateDossierStatus(dossierId, 'CLOSED'))} disabled={loading}>
            <Check size={16} /> Fermer le dossier
          </button>
        )}

        {status === 'RESOLVED' && !isAdmin && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={16} /> En attente de fermeture par le Président du CS
          </div>
        )}
      </div>

      {showFinalizeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="card" style={{ width: 'min(440px, calc(100vw - 24px))', background: 'white' }}>
            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="var(--primary)" /> Marquer comme résolu
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Enregistrez la conclusion ou la décision finale avant le passage en état résolu.
            </p>
            <textarea
              className="form-control"
              placeholder="Décision, conclusion, résultats..."
              style={{ width: '100%', minHeight: 100, marginBottom: 16 }}
              value={decisionText}
              onChange={(event) => setDecisionText(event.target.value)}
              required
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setShowFinalizeModal(false)} disabled={loading}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleFinalizeSubmit} disabled={loading || !decisionText.trim()}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

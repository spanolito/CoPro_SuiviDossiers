'use client'

import { useState } from 'react'
import { Edit2, X } from 'lucide-react'
import { updateEtapeDate } from './actions'

export default function StepEditModal({ dossierId, etapeId, currentTitle, currentDate, currentReason }: { 
  dossierId: string, 
  etapeId: string, 
  currentTitle: string, 
  currentDate: Date, 
  currentReason?: string | null 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [dateStr, setDateStr] = useState(new Date(currentDate).toISOString().slice(0, 16))
  const [reason, setReason] = useState(currentReason || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleOpen = () => {
    setDateStr(new Date(currentDate).toISOString().slice(0, 16))
    setReason(currentReason || '')
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await updateEtapeDate(dossierId, etapeId, dateStr, reason)
      setIsOpen(false)
    } catch (err: any) {
      setError(err.message || "Erreur lors de la modification")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={handleOpen} 
        className="btn btn-outline" 
        style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
      >
        <Edit2 size={12} /> Corriger
      </button>
    )
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000 }} onClick={() => setIsOpen(false)}></div>
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg-color)', padding: 24, borderRadius: 'var(--radius-lg)', zIndex: 10001, width: '90%', maxWidth: 400, boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Modifier l&apos;étape</h3>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
          Étape : <strong style={{color: 'var(--text-primary)'}}>{currentTitle}</strong>
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Date et Heure</label>
            <input 
              type="datetime-local" 
              className="form-control" 
              value={dateStr} 
              onChange={e => setDateStr(e.target.value)} 
              required 
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Motif de modification (optionnel)</label>
            <input 
              type="text" 
              className="form-control" 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="Ex: Correction erreur de saisie"
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-outline" disabled={loading}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </>
  )
}

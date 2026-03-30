'use client'

import { useState } from 'react'
import { CheckCircle2, Edit2, X } from 'lucide-react'
import { updateStepDate } from './actions'

function toLocalDateParts(value: Date) {
  const date = new Date(value)
  const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString()

  return {
    date: iso.slice(0, 10),
    time: iso.slice(11, 16),
  }
}

export default function StepEditModal({
  dossierId,
  etapeId,
  currentTitle,
  currentDate,
  currentReason,
}: {
  dossierId: string
  etapeId: string
  currentTitle: string
  currentDate: Date
  currentReason?: string | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [dateValue, setDateValue] = useState(toLocalDateParts(currentDate).date)
  const [timeValue, setTimeValue] = useState(toLocalDateParts(currentDate).time)
  const [reason, setReason] = useState(currentReason || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleOpen = () => {
    const parts = toLocalDateParts(currentDate)
    setDateValue(parts.date)
    setTimeValue(parts.time)
    setReason(currentReason || '')
    setError('')
    setSuccess('')
    setIsOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await updateStepDate(dossierId, etapeId, `${dateValue}T${timeValue}`, reason)
      setSuccess('Date corrigée avec succès.')
      window.setTimeout(() => setIsOpen(false), 900)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Erreur lors de la correction")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="btn btn-outline"
        style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <Edit2 size={12} /> Corriger
      </button>
    )
  }

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 10000 }}
        onClick={() => setIsOpen(false)}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--panel-bg)',
          padding: 24,
          borderRadius: 'var(--radius-lg)',
          zIndex: 10001,
          width: 'min(460px, calc(100vw - 24px))',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Corriger l&apos;étape</h3>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
          Étape : <strong style={{ color: 'var(--text-primary)' }}>{currentTitle}</strong>
        </div>

        {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 16 }}>{error}</div>}
        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--success)',
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            <CheckCircle2 size={14} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Date</label>
              <input
                type="date"
                className="form-control"
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Heure</label>
              <input
                type="time"
                className="form-control"
                value={timeValue}
                onChange={(event) => setTimeValue(event.target.value)}
                required
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Motif</label>
            <textarea
              className="form-control"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ex: correction d'une erreur de saisie"
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-outline" disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import styles from './rapports.module.css'
import { FileText, Wand2, Copy, Printer, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function RapportsClient() {
  const [perimetre, setPerimetre] = useState('dossiers_ouverts')
  const [dateDeb, setDateDeb] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setReport('')

    try {
      const res = await fetch('/api/rapports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perimetre, dateDeb, dateFin })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setReport(data.report)

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Rapports d'Activité</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: '4px' }}>Générez des comptes rendus synthétiques selon vos besoins.</p>
        </div>
      </div>

      <form className={styles.formCard} onSubmit={handleGenerate}>
        <div className={styles.formGroup}>
          <label>Périmètre</label>
          <select 
            value={perimetre} 
            onChange={(e) => setPerimetre(e.target.value)}
            className="form-control"
          >
            <option value="dossiers_ouverts">Dossiers Ouverts</option>
            <option value="activite_sur_periode">Activité sur Période</option>
            <option value="mixte">Mixte (Dossiers ouverts + évolution)</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Date Début</label>
          <input 
            type="date" 
            value={dateDeb} 
            onChange={(e) => setDateDeb(e.target.value)} 
            className="form-control" 
            disabled={perimetre === 'dossiers_ouverts'}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Date Fin</label>
          <input 
            type="date" 
            value={dateFin} 
            onChange={(e) => setDateFin(e.target.value)} 
            className="form-control" 
            disabled={perimetre === 'dossiers_ouverts'}
          />
        </div>

        <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
          {loading ? 'Génération...' : <><Wand2 size={16} /> Générer</>}
        </button>
      </form>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div className={styles.reportCard}>
        <div className={styles.reportHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
            <FileText size={18} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>RÉSULTAT</span>
          </div>
          {report && (
            <div className={styles.actions}>
              <button className="btn btn-outline" onClick={handleCopy} style={{ fontSize: '12px', padding: '6px 10px', display: 'flex', gap: '4px' }}>
                {copied ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier</>}
              </button>
              <button className="btn btn-outline" onClick={handlePrint} style={{ fontSize: '12px', padding: '6px 10px', display: 'flex', gap: '4px' }}>
                <Printer size={14} /> Imprimer
              </button>
            </div>
          )}
        </div>

        {!report && !loading && (
          <div className={styles.emptyState}>
            <FileText size={48} style={{ opacity: 0.2 }} />
            <p style={{ fontSize: '14px', fontStyle: 'italic' }}>Aucun rapport généré. Sélectionnez vos critères et cliquez sur Générer.</p>
          </div>
        )}

        {loading && (
          <div className={styles.emptyState}>
            <div style={{ width: 24, height: 24, border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '14px', marginTop: '12px' }}>Génération du rapport en cours...</p>
          </div>
        )}

        {report && (
          <div className={styles.markdownBody}>
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

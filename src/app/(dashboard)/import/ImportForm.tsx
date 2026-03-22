'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './import.module.css'
import { createImportsBulk } from './actions'
import { Trash2, Wand2, Check, ArrowRight, ArrowLeft } from 'lucide-react'

export default function ImportForm() {
  const [step, setStep] = useState(1)
  const [text, setText] = useState('')
  const [proposals, setProposals] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleAnalyze = () => {
    const blocks = text.split(/\n\n+/).map(b => b.trim()).filter(b => b.length > 10)

    const newProposals = blocks.map(block => {
      const lower = block.toLowerCase()

      let statut = 'ENREGISTRE'
      if (lower.includes('attente')) statut = 'AFFECTE'
      else if (lower.includes('devis validé') || lower.includes('en cours')) statut = 'EN_COURS'
      else if (lower.includes('projet abandonné') || lower.includes('clos') || lower.includes('terminé')) statut = 'CLOTURE'

      let priorite = 'MOYENNE'
      if (lower.includes('urgence') || lower.includes('urgent') || lower.includes('fuite')) priorite = 'HAUTE'

      let typeDossier = 'AUTRE'
      if (lower.includes('eau') || lower.includes('fuite') || lower.includes('infiltration')) typeDossier = 'SINISTRE'
      else if (lower.includes('chaudi') || lower.includes('chauff')) typeDossier = 'CHAUFFAGE'
      else if (lower.includes('juridique') || lower.includes('avocat')) typeDossier = 'JURIDIQUE'
      else if (lower.includes('sécurité') || lower.includes('caméra')) typeDossier = 'SECURITE'

      const lines = block.split('\n')
      const title = lines[0].substring(0, 60) + (lines[0].length > 60 ? '...' : '')

      return {
        id: Math.random().toString(),
        titre: title,
        description: block,
        statut,
        priorite,
        typeDossier,
      }
    })

    setProposals(newProposals)
    setStep(2) // Move to step 2 after analysis
  }

  const updateProposal = (id: string, field: string, value: string) => {
    setProposals(proposals.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const removeProposal = (id: string) => {
    const updated = proposals.filter(p => p.id !== id)
    setProposals(updated)
    if (updated.length === 0) {
      setStep(1) // Return if no proposals left
    }
  }

  const handleSubmit = async () => {
    if (proposals.length === 0) return
    setIsSubmitting(true)
    await createImportsBulk(proposals)
    setIsSubmitting(false)
    router.push('/dossiers')
  }

  return (
    <div className={styles.importContainer}>
      {/* Visual Stepper */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', maxWidth: '400px', width: '100%' }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ 
              height: '4px', 
              background: step >= s ? 'var(--primary)' : 'var(--border-color)', 
              borderRadius: '2px',
              transition: 'background 0.3s'
            }} />
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: step >= s ? 'var(--text-primary)' : 'var(--text-secondary)' 
            }}>
              Étape {s}
            </span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className={styles.parseCard} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>1. Saisie du texte source</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Collez votre texte brut ci-dessous. Le système séparera les dossiers par les sauts de ligne doubles (\n\n).
            </p>
          </div>
          
          <textarea
            className="form-control"
            rows={10}
            placeholder={"Exemple:\nFuite d'eau au sous-sol, très urgent.\n\nL'ascenseur est en panne, en attente du réparateur."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ width: '100%', fontFamily: 'monospace', fontSize: '14px', minHeight: '200px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleAnalyze} disabled={text.length < 10} style={{ padding: '10px 20px' }}>
              <Wand2 size={16} /> Analyser le texte
            </button>
          </div>
        </div>
      )}

      {step === 2 && proposals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>2. Révision & Correction</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Vérifiez et ajustez les dossiers détectés par le système avant de continuer.
            </p>
          </div>

          <div>
            {proposals.map((p, index) => (
              <div key={p.id} className={styles.proposalCard} style={{ background: 'var(--panel-bg)', padding: '24px' }}>
                <button className={styles.removeBtn} onClick={() => removeProposal(p.id)} title="Retirer" style={{ top: '24px', right: '24px' }}>
                  <Trash2 size={18} />
                </button>
                <div className={styles.proposalHeader} style={{ marginBottom: '16px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-secondary)' }}>DOSSIER #{index + 1}</span>
                </div>

                <div className={styles.proposalGrid}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Titre</label>
                    <input type="text" className="form-control" value={p.titre} onChange={e => updateProposal(p.id, 'titre', e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Type de dossier</label>
                    <select className="form-control" value={p.typeDossier} onChange={e => updateProposal(p.id, 'typeDossier', e.target.value)}>
                      <option value="SINISTRE">Sinistre</option>
                      <option value="TECHNIQUE">Technique</option>
                      <option value="CHAUFFAGE">Chauffage</option>
                      <option value="SECURITE">Sécurité</option>
                      <option value="TRAVAUX">Travaux</option>
                      <option value="ESPACES_VERTS">Espaces verts</option>
                      <option value="JURIDIQUE">Juridique</option>
                      <option value="FINANCIER">Financier</option>
                      <option value="AG">AG</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Statut estimé</label>
                    <select className="form-control" value={p.statut} onChange={e => updateProposal(p.id, 'statut', e.target.value)}>
                      <option value="ENREGISTRE">Enregistré</option>
                      <option value="AFFECTE">Affecté</option>
                      <option value="EN_COURS">En Cours</option>
                      <option value="A_VALIDER">À Valider</option>
                      <option value="CLOTURE">Clôturé</option>
                      <option value="BLOQUE">Bloqué</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Description</label>
                    <textarea className="form-control" rows={3} value={p.description} onChange={e => updateProposal(p.id, 'description', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>
              <ArrowLeft size={16} /> Retour
            </button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>
              Suivant <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && proposals.length > 0 && (
        <div className={styles.parseCard} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>3. Confirmation</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Résumé des dossiers qui seront créés dans l'application. Verifiez une dernière fois.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>Titre</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, fontSize: '14px' }}>{p.titre}</td>
                    <td style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>{p.typeDossier}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`badge badge-info`} style={{ fontSize: '11px' }}>{p.statut}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>
              <ArrowLeft size={16} /> Retour
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting} style={{ padding: '10px 24px' }}>
              {isSubmitting ? 'Création...' : <><Check size={16} /> Créer les {proposals.length} dossiers</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

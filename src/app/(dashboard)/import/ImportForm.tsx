'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './import.module.css'
import { createImportsBulk } from './actions'
import { Trash2, Wand2, Check } from 'lucide-react'

export default function ImportForm({ categories }: { categories: any[] }) {
  const [text, setText] = useState('')
  const [proposals, setProposals] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleAnalyze = () => {
    // Basic heuristics for splitting: double newlines
    const blocks = text.split(/\n\n+/).map(b => b.trim()).filter(b => b.length > 10)
    
    const newProposals = blocks.map(block => {
      const lower = block.toLowerCase()
      
      // Heuristic: Statut
      let statut = 'ENREGISTRE'
      if (lower.includes('attente')) statut = 'AFFECTE'
      else if (lower.includes('devis validé') || lower.includes('en cours')) statut = 'EN_COURS'
      else if (lower.includes('projet abandonné') || lower.includes('clos') || lower.includes('terminé')) statut = 'CLOTURE'
      
      // Heuristic: Priorité
      let priorite = 'moyenne'
      if (lower.includes('urgence') || lower.includes('urgent') || lower.includes('fuite')) priorite = 'urgente'
      
      // Heuristic: Catégorie
      let categoryId = categories[0]?.id || ''
      if (lower.includes('eau') || lower.includes('fuite') || lower.includes('infiltration')) {
        categoryId = categories.find(c => c.name.toLowerCase().includes('eau'))?.id || categoryId
      } else if (lower.includes('chaudi') || lower.includes('chauff')) {
        categoryId = categories.find(c => c.name.toLowerCase().includes('chauffag'))?.id || categoryId
      } else if (lower.includes('ascenseur')) {
        categoryId = categories.find(c => c.name.toLowerCase().includes('ascenseur'))?.id || categoryId
      }
      
      const lines = block.split('\n')
      const title = lines[0].substring(0, 60) + (lines[0].length > 60 ? '...' : '')
      
      return {
        id: Math.random().toString(),
        title,
        description: block,
        statut,
        priorite,
        categoryId
      }
    })
    
    setProposals(newProposals)
  }

  const updateProposal = (id: string, field: string, value: string) => {
    setProposals(proposals.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const removeProposal = (id: string) => {
    setProposals(proposals.filter(p => p.id !== id))
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
      <div className={styles.parseCard}>
        <h3 style={{ marginBottom: 16 }}>Texte Source (Compte rendu, email...)</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Collez votre texte brut ci-dessous. Le système séparera les dossiers par les sauts de ligne doubles et identifiera automatiquement le niveau d'urgence et le statut selon les mots-clés.
        </p>
        <textarea 
          className="form-control" 
          rows={8} 
          placeholder="Exemple:&#10;Fuite d'eau au 3ème étage, très urgent.&#10;&#10;L'ascenseur est en panne, en attente du réparateur."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: '100%', marginBottom: 16, fontFamily: 'monospace' }}
        />
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={text.length < 10}>
          <Wand2 size={16} /> Analyser le texte
        </button>
      </div>

      {proposals.length > 0 && (
        <div className={styles.parseCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3>{proposals.length} Dossier(s) Détecté(s)</h3>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Création en cours...' : <><Check size={16} /> Tout valider et Créer</>}
            </button>
          </div>

          <div>
            {proposals.map((p, index) => (
              <div key={p.id} className={styles.proposalCard}>
                <button className={styles.removeBtn} onClick={() => removeProposal(p.id)} title="Retirer de l'import">
                  <Trash2 size={16} />
                </button>
                <div className={styles.proposalHeader}>
                  <strong>Dossier #{index + 1}</strong>
                </div>
                
                <div className={styles.proposalGrid}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Titre</label>
                    <input type="text" className="form-control" value={p.title} onChange={e => updateProposal(p.id, 'title', e.target.value)} />
                  </div>
                  
                  <div className="form-group">
                    <label>Catégorie</label>
                    <select className="form-control" value={p.categoryId} onChange={e => updateProposal(p.id, 'categoryId', e.target.value)}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Statut estimé</label>
                    <select className="form-control" value={p.statut} onChange={e => updateProposal(p.id, 'statut', e.target.value)}>
                      <option value="ENREGISTRE">Enregistré</option>
                      <option value="AFFECTE">Affecté</option>
                      <option value="EN_COURS">En Cours</option>
                      <option value="A_VALIDER">À Valider</option>
                      <option value="CLOTURE">Clôturé</option>
                      <option value="BLOQUE">Bloqué</option>
                      <option value="ARCHIVE">Archivé</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priorité estimée</label>
                    <select className="form-control" value={p.priorite} onChange={e => updateProposal(p.id, 'priorite', e.target.value)}>
                      <option value="basse">Basse</option>
                      <option value="moyenne">Moyenne</option>
                      <option value="haute">Haute</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Description complète</label>
                    <textarea className="form-control" rows={3} value={p.description} onChange={e => updateProposal(p.id, 'description', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

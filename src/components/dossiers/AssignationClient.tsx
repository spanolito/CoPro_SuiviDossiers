'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
}

interface Prestataire {
  id: string
  nom: string
  type: string
}

interface Props {
  users: User[]
  prestataires: Prestataire[]
  initialTypeDossier?: string
  initialResponsableCSId?: string
  initialActionValue?: string // Format 'user:id' or 'prestataire:id'
}

const TYPE_DOSSIER_OPTIONS = ['Sécurité', 'Travaux', 'Chauffage', 'Espaces verts', 'Juridique', 'Autre']

const FILTER_MAP: Record<string, string[]> = {
  'Sécurité': ['technique'],
  'Travaux': ['technique'],
  'Chauffage': ['chauffage'],
  'Espaces verts': ['espaces verts', 'technique'],
  'Juridique': ['juridique'],
  'Autre': [] // means all
}

export default function AssignationClient({
  users,
  prestataires,
  initialTypeDossier = 'Autre',
  initialResponsableCSId = '',
  initialActionValue = ''
}: Props) {
  const [typeDossier, setTypeDossier] = useState(initialTypeDossier)
  const [responsableCSId, setResponsableCSId] = useState(initialResponsableCSId)
  const [actionValue, setActionValue] = useState(initialActionValue)

  // Filtered Prestataires Based on Type
  const allowedTypes = FILTER_MAP[typeDossier] || []
  const filteredPrestataires = prestataires.filter(p => {
    if (p.type === 'syndic') return true // always available
    if (allowedTypes.length === 0) return true // 'Autre' shows all
    return allowedTypes.includes(p.type)
  })

  return (
    <>
      <div className="form-group">
        <label htmlFor="typeDossier">Type de dossier *</label>
        <select 
          id="typeDossier" 
          name="typeDossier" 
          className="form-control" 
          required 
          value={typeDossier}
          onChange={e => {
            setTypeDossier(e.target.value)
            setActionValue('') // Reset action actor when type changes
          }}
        >
          {TYPE_DOSSIER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="responsableCSId">Responsable CS *</label>
        <select 
          id="responsableCSId" 
          name="responsableCSId" 
          className="form-control" 
          required 
          value={responsableCSId}
          onChange={e => setResponsableCSId(e.target.value)}
        >
          <option value="">Sélectionner</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="actionValue">Responsable de l'action (Optionnel)</label>
        <select 
          id="actionValue" 
          name="actionValue" 
          className="form-control"
          value={actionValue}
          onChange={e => setActionValue(e.target.value)}
        >
          <option value="">Non assigné</option>
          <optgroup label="--- Membres du Conseil Syndical ---">
            {users.map(u => (
              <option key={`user:${u.id}`} value={`user:${u.id}`}>{u.name}</option>
            ))}
          </optgroup>
          <optgroup label="--- Prestataires ---">
            {filteredPrestataires.map(p => (
              <option key={`prestataire:${p.id}`} value={`prestataire:${p.id}`}>{p.nom} ({p.type})</option>
            ))}
          </optgroup>
        </select>
      </div>
    </>
  )
}

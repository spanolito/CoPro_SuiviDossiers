'use client'

import { useState } from 'react'

interface Props {
  initialTypeLoc?: string
  initialNiveau?: string
  initialLoc?: string
  initialPrecision?: string
}

export default function LocalisationClient({ initialTypeLoc = '', initialNiveau = '', initialLoc = '', initialPrecision = '' }: Props) {
  const [typeLoc, setTypeLoc] = useState(initialTypeLoc)
  const [niveau, setNiveau] = useState(initialNiveau)
  const [localisation, setLocalisation] = useState(initialLoc)

  const getLocOptions = (lvl: string) => {
    if (lvl === 'Rez-de-chaussée') return ['Appartement 01', 'Appartement 02', 'Appartement 03', 'Appartement 04', 'Partie commune']
    if (lvl === '1er étage') return ['Appartement 11', 'Appartement 12', 'Appartement 13', 'Appartement 14', 'Partie commune']
    if (lvl === '2e étage') return ['Appartement 21', 'Appartement 22', 'Appartement 23', 'Appartement 24', 'Partie commune']
    if (lvl === 'Sous-sol') return ['Garages', 'Caves', 'Local technique', 'Autre']
    if (lvl === 'Parties extérieures') return ['Façade Nord', 'Façade Sud', 'Façade Est', 'Façade Ouest', 'Toiture', 'Terrasse', 'Jardin', 'Autre']
    if (lvl === 'Parties communes générales') return ["Cage d'escalier", 'Ascenseur', 'Chaufferie', 'Local poubelles', 'VMC', 'Réseaux communs', 'Autre']
    return []
  }

  const options = getLocOptions(niveau)

  return (
    <>
      <div className="form-group">
        <label htmlFor="typeLocalisation">Type de localisation *</label>
        <select id="typeLocalisation" name="typeLocalisation" className="form-control" required value={typeLoc} onChange={e => setTypeLoc(e.target.value)}>
          <option value="">Sélectionner</option>
          <option value="Appartement privatif">Appartement privatif</option>
          <option value="Partie commune">Partie commune</option>
          <option value="Équipement technique">Équipement technique</option>
          <option value="Extérieur">Extérieur</option>
          <option value="Sous-sol / garage">Sous-sol / garage</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="niveau">Niveau *</label>
        <select id="niveau" name="niveau" className="form-control" required value={niveau} onChange={e => { setNiveau(e.target.value); setLocalisation(''); }}>
          <option value="">Sélectionner</option>
          <option value="Sous-sol">Sous-sol</option>
          <option value="Rez-de-chaussée">Rez-de-chaussée</option>
          <option value="1er étage">1er étage</option>
          <option value="2e étage">2e étage</option>
          <option value="Parties extérieures">Parties extérieures</option>
          <option value="Parties communes générales">Parties communes générales</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="localisation">Localisation principale *</label>
        <select id="localisation" name="localisation" className="form-control" required disabled={!niveau} value={localisation} onChange={e => setLocalisation(e.target.value)}>
          <option value="">Sélectionner</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="precision">Précision (facultatif)</label>
        <input type="text" id="precision" name="precision" className="form-control" placeholder="Détails supplémentaires..." defaultValue={initialPrecision} />
      </div>
    </>
  )
}

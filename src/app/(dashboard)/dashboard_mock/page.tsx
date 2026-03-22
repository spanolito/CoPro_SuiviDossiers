'use client'

import React from 'react'
import { 
  AlertCircle, 
  CheckCircle2, 
  CircleDot, 
  Clock, 
  PauseCircle, 
  Users, 
  Calendar, 
  ArrowRight, 
  ArrowUpRight 
} from 'lucide-react'

// --- MOCK DATA ---
const MOCK_METRICS = [
  { label: 'Urgents', value: 3, icon: CircleDot, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-500' },
  { label: 'En attente', value: 8, icon: AlertCircle, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-500' },
  { label: 'En cours', value: 12, icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-500' },
  { label: 'Bloqués', value: 2, icon: PauseCircle, color: 'text-red-800', bgColor: 'bg-red-100', borderColor: 'border-red-700' },
  { label: 'Clôturés (30 j)', value: 14, icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
]

const MOCK_PRIORITY_DOSSIERS = [
  { id: '1', reference: 'DOS-2026-004', titre: 'Fuite d\'eau Toiture Bâtiment B', prochaineEtape: 'Valider devis plombier', responsable: 'Jean Dupont', dateLimite: '2026-03-24', priorite: 'CRITIQUE', statut: 'BLOQUE' },
  { id: '2', reference: 'DOS-2026-012', titre: 'Remplacement Chaudière Centrale', prochaineEtape: 'Lancer l\'appel d\'offres', responsable: 'Marie Leroy', dateLimite: '2026-03-28', priorite: 'HAUTE', statut: 'EN_COURS' },
  { id: '3', reference: 'DOS-2026-009', titre: 'Panne Ascenseur Escalier A', prochaineEtape: 'Vérifier la réparation OTIS', responsable: 'Pierre Morel', dateLimite: '2026-03-23', priorite: 'CRITIQUE', statut: 'A_VALIDER' },
  { id: '4', reference: 'DOS-2026-015', titre: 'Ravalement de Façade Nord', prochaineEtape: 'Fixer la date de l\'AG', responsable: 'Non assigné', dateLimite: null, priorite: 'MOYENNE', statut: 'ENREGISTRE' },
]

const MOCK_ACTIVITIES = [
  { id: '1', type: 'Commentaire', description: 'Nouveau devis ajouté par l\'entreprise Dupont.', auteur: 'Lucie Bernard', temps: 'Il y a 10 min' },
  { id: '2', type: 'Statut', description: 'Dossier "Chauffage" passé de En Cours à À Valider.', auteur: 'Admin', temps: 'Il y a 45 min' },
  { id: '3', type: 'Création', description: 'Création du dossier "Panne Éclairage Parking".', auteur: 'Sébastien Coq', temps: 'Il y a 2 h' },
]

const MOCK_TEAM = [
  { id: '1', nom: 'Jean Dupont', initiales: 'JD', dossiers: 5, color: 'bg-blue-100 text-blue-800' },
  { id: '2', nom: 'Marie Leroy', initiales: 'ML', dossiers: 3, color: 'bg-purple-100 text-purple-800' },
  { id: '3', nom: 'Pierre Morel', initiales: 'PM', dossiers: 2, color: 'bg-amber-100 text-amber-800' },
]

const MOCK_VENDORS = [
  { id: '1', nom: 'Otis Ascenseurs', dossiers: 3, logo: 'O' },
  { id: '2', nom: 'Dalkia Thermique', dossiers: 4, logo: 'D' },
  { id: '3', nom: 'Suez Eau', dossiers: 1, logo: 'S' },
]

// --- SUBCOMPONENTS ---

function KpiCard({ item }: { item: typeof MOCK_METRICS[0] }) {
  const Icon = item.icon
  return (
    <div className={`p-6 bg-white rounded-xl shadow-sm border-t-4 ${item.borderColor} flex justify-between items-center hover:shadow-md transition-shadow`}>
      <div>
        <p className="text-sm font-medium text-slate-500">{item.label}</p>
        <p className="text-3xl font-bold mt-2 text-slate-800">{item.value}</p>
      </div>
      <div className={`p-3 rounded-full ${item.bgColor}`}>
        <Icon size={24} className={item.color} />
      </div>
    </div>
  )
}

function PriorityActionsCard({ dossiers }: { dossiers: typeof MOCK_PRIORITY_DOSSIERS }) {
  const getBadgeClass = (priorite: string) => {
    if (priorite === 'CRITIQUE') return 'bg-rose-50 text-rose-700 border-rose-200'
    if (priorite === 'HAUTE') return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex-1">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-rose-500" size={20} />
          <h2 className="text-lg font-bold text-slate-800">Actions prioritaires</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">Top {dossiers.length} urgences</span>
      </div>

      {dossiers.length === 0 ? (
        <EmptyState message="Aucune action critique en cours." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-bottom border-slate-100 text-slate-400 text-xs font-semibold">
                <th className="pb-3 pr-4">DOSSIER</th>
                <th className="pb-3 px-4">PROCHAINE ÉTAPE</th>
                <th className="pb-3 px-4">RESPONSABLE</th>
                <th className="pb-3 px-4">ÉCHÉANCE</th>
                <th className="pb-3 pl-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {dossiers.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 pr-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{d.titre}</span>
                      <span className="text-xs text-slate-400 mt-0.5">{d.reference}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{d.prochaineEtape}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeClass(d.priorite)}`}>
                      {d.responsable}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {d.dateLimite ? (
                      <div className="flex items-center gap-1 text-rose-600 font-medium text-xs">
                        <Calendar size={14} />
                        <span>{new Date(d.dateLimite).toLocaleDateString('fr-FR')}</span>
                      </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <button className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                      Voir <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RecentActivityCard({ activities }: { activities: typeof MOCK_ACTIVITIES }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex-1">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="text-blue-500" size={20} />
        <h2 className="text-lg font-bold text-slate-800">Actions récentes</h2>
      </div>

      <div className="space-y-4">
        {activities.map((act) => (
          <div key={act.id} className="flex gap-4 items-start border-l-2 border-slate-100 pl-4 relative before:content-[''] before:w-2 before:h-2 before:bg-blue-500 before:rounded-full before:absolute before:left-[-5px] before:top-1.5">
            <div className="flex-1 flex flex-col">
              <span className="text-sm font-medium text-slate-800">{act.description}</span>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <span className="font-medium text-slate-500">{act.auteur}</span>
                <span>·</span>
                <span>{act.temps}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamLoadCard({ members }: { members: typeof MOCK_TEAM }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="text-indigo-500" size={20} />
        <h2 className="text-lg font-bold text-slate-800">Suivi CS</h2>
      </div>

      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${member.color}`}>
                {member.initiales}
              </div>
              <span className="text-sm font-medium text-slate-700">{member.nom}</span>
            </div>
            <span className="bg-slate-50 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200">
              {member.dossiers} doss.
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ActiveVendorsCard({ vendors }: { vendors: typeof MOCK_VENDORS }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="text-emerald-500" size={20} />
        <h2 className="text-lg font-bold text-slate-800">Intervenants actifs</h2>
      </div>

      <div className="space-y-4">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-100">
                {vendor.logo}
              </div>
              <span className="text-sm font-medium text-slate-700">{vendor.nom}</span>
            </div>
            <span className="bg-slate-50 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200">
              {vendor.dossiers} doss.
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <CircleDot size={40} className="stroke-[1] mb-3 text-slate-300" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// --- MAIN PAGE ---

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Pilotez et suivez l'activité de la copropriété en temps réel.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {MOCK_METRICS.map((metric, index) => (
          <KpiCard key={index} item={metric} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Columns - Tables & Timelines (Total 2 cols width on lg) */}
        <div className="lg:col-span-2 space-y-8 flex flex-col h-full">
          <PriorityActionsCard dossiers={MOCK_PRIORITY_DOSSIERS} />
          <div className="flex-1">
            <RecentActivityCard activities={MOCK_ACTIVITIES} />
          </div>
        </div>

        {/* Right Sidebar - Team Components (1 col width on lg) */}
        <div className="flex flex-col gap-8 h-full">
          <TeamLoadCard members={MOCK_TEAM} />
          <ActiveVendorsCard vendors={MOCK_VENDORS} />
        </div>

      </div>
    </div>
  )
}

import React from 'react'
import prisma from '@/lib/prisma'
import { 
  AlertCircle, 
  CheckCircle2, 
  CircleDot, 
  Clock, 
  PauseCircle, 
  Users, 
  Calendar, 
  ArrowUpRight 
} from 'lucide-react'

// --- SUBCOMPONENTS ---

function KpiCard({ item }: { item: any }) {
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

function PriorityActionsCard({ dossiers }: { dossiers: any[] }) {
  const getBadgeClass = (priorite: string) => {
    if (priorite === 'CRITIQUE') return 'bg-rose-50 text-rose-700 border-rose-200'
    if (priorite === 'HAUTE') return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-slate-50 text-slate-700 border-slate-200'
  }

  const getPriorityLabel = (p: string) => {
    const labels: Record<string, string> = { CRITIQUE: 'Critique', HAUTE: 'Haute', MOYENNE: 'Moyenne', BASSE: 'Basse' }
    return labels[p] || p
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex-1">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-rose-500" size={20} />
          <h2 className="text-lg font-bold text-slate-800">Actions prioritaires</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">{dossiers.length} items</span>
      </div>

      {dossiers.length === 0 ? (
        <EmptyState message="Aucune action critique en cours." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold">
                <th className="pb-3 pr-4">DOSSIER</th>
                <th className="pb-3 px-4">PROCHAINE ÉTAPE</th>
                <th className="pb-3 px-4">RESPONSABLE</th>
                <th className="pb-3 px-4">ÉCHÉANCE</th>
                <th className="pb-3 pl-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {dossiers.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 pr-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{d.titre}</span>
                      <span className="text-xs text-slate-400 mt-0.5">{d.reference}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600">Suivi dossier</td>
                  <td className="py-4 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getBadgeClass(d.priorite)}`}>
                      {d.responsableCS?.nomAffiche || '-'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {d.dateEcheance ? (
                      <div className="flex items-center gap-1 text-rose-600 font-medium text-xs">
                        <Calendar size={14} />
                        <span>{new Date(d.dateEcheance).toLocaleDateString('fr-FR')}</span>
                      </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                  <td className="py-4 pl-4 text-right">
                    <button className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
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

function RecentActivityCard({ activities, formatTime }: { activities: any[], formatTime: any }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex-1">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="text-blue-500" size={20} />
        <h2 className="text-lg font-bold text-slate-800">Actions récentes</h2>
      </div>

      {activities.length === 0 ? (
        <EmptyState message="Aucune activité récente." />
      ) : (
        <div className="space-y-4">
          {activities.map((act) => (
            <div key={act.id} className="flex gap-4 items-start border-l-2 border-slate-100 pl-4 relative before:content-[''] before:w-2 before:h-2 before:bg-blue-500 before:rounded-full before:absolute before:left-[-5px] before:top-1.5">
              <div className="flex-1 flex flex-col">
                <span className="text-sm font-medium text-slate-800">{act.resume}</span>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span className="font-medium text-slate-500">{act.auteur?.nomAffiche || 'Système'}</span>
                  <span>·</span>
                  <span>{formatTime(act.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TeamLoadCard({ members, getInitials }: { members: any[], getInitials: any }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="text-indigo-500" size={20} />
        <h2 className="text-lg font-bold text-slate-800">Suivi CS</h2>
      </div>

      {members.length === 0 ? (
        <EmptyState message="Aucun membre." />
      ) : (
        <div className="space-y-4">
          {members.map((member, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {getInitials(member.name)}
                </div>
                <span className="text-sm font-medium text-slate-700">{member.name}</span>
              </div>
              <span className="bg-slate-50 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200">
                {member.count} doss.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActiveVendorsCard({ vendors, getInitials }: { vendors: any[], getInitials: any }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="text-emerald-500" size={20} />
        <h2 className="text-lg font-bold text-slate-800">Intervenants actifs</h2>
      </div>

      {vendors.length === 0 ? (
        <EmptyState message="Aucun intervenant." />
      ) : (
        <div className="space-y-4">
          {vendors.map((vendor, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-100">
                  {getInitials(vendor.name)}
                </div>
                <span className="text-sm font-medium text-slate-700">{vendor.name}</span>
              </div>
              <span className="bg-slate-50 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200">
                {vendor.count} doss.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
      <CircleDot size={32} className="stroke-[1.5] mb-2 text-slate-300" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// --- MAIN PAGE ---

export default async function DashboardTailwindPage() {
  const [dossiers, users, intervenants, activityLogs] = await Promise.all([
    prisma.dossier.findMany({
      include: { responsableCS: true, prestatairePrincipal: true, syndicImplique: true },
      where: { archived: false }
    }),
    prisma.utilisateur.findMany({
      where: { role: { in: ['PRESIDENT_CS', 'MEMBRE_CS'] } },
      include: { dossiersResponsableCS: true }
    }),
    prisma.intervenant.findMany({
      where: { actif: true },
      include: { dossiersPrestataire: true, dossiersSyndic: true, dossiersAction: true }
    }),
    prisma.dossierActivite.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { auteur: true }
    })
  ])

  // Metrics
  const countUrgent = dossiers.filter((d: any) => d.priorite === 'CRITIQUE' && d.statut !== 'CLOTURE').length
  const countEnAttente = dossiers.filter((d: any) => d.statut === 'ENREGISTRE' || d.statut === 'AFFECTE').length
  const countEnCours = dossiers.filter((d: any) => d.statut === 'EN_COURS' || d.statut === 'A_VALIDER').length
  const countBlocked = dossiers.filter((d: any) => d.statut === 'BLOQUE').length
  const countClosed = dossiers.filter((d: any) => d.statut === 'CLOTURE').length

  const prioritizedDossiers = dossiers
    .filter((d: any) => (d.statut === 'BLOQUE' || d.priorite === 'CRITIQUE') && d.statut !== 'CLOTURE')
    .sort((a: any, b: any) => a.priorite === 'CRITIQUE' ? -1 : 1)
    .slice(0, 5)

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase()

  const staffBreakdown = users.map((u: any) => ({
    name: u.nomAffiche,
    count: u.dossiersResponsableCS.filter((d: any) => d.statut !== 'CLOTURE' && !d.archived).length
  })).sort((a: any, b: any) => b.count - a.count)

  const intervenantsBreakdown = intervenants.map((i: any) => ({
    name: i.nom,
    count: [...i.dossiersPrestataire, ...i.dossiersSyndic, ...i.dossiersAction].filter((d: any) => d.statut !== 'CLOTURE' && !d.archived).length
  })).sort((a: any, b: any) => b.count - a.count).filter((x: any) => x.count > 0)

  const formatTime = (date: Date) => {
    const min = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000)
    if (min < 60) return `${min}m`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h`
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const metrics = [
    { label: 'Urgents', value: countUrgent, icon: CircleDot, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-500' },
    { label: 'En attente', value: countEnAttente, icon: AlertCircle, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-500' },
    { label: 'En cours', value: countEnCours, icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-500' },
    { label: 'Bloqués', value: countBlocked, icon: PauseCircle, color: 'text-red-800', bgColor: 'bg-red-100', borderColor: 'border-red-700' },
    { label: 'Clôturés', value: countClosed, icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord (Tailwind Connecté)</h1>
        <p className="text-sm text-slate-500 mt-1">Pilotez et suivez l'activité de la copropriété en temps réel con datos de Prisma.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {metrics.map((metric, index) => ( <KpiCard key={index} item={metric} /> ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8 flex flex-col h-full">
          <PriorityActionsCard dossiers={prioritizedDossiers} />
          <RecentActivityCard activities={activityLogs} formatTime={formatTime} />
        </div>
        <div className="flex flex-col gap-8 h-full">
          <TeamLoadCard members={staffBreakdown} getInitials={getInitials} />
          <ActiveVendorsCard vendors={intervenantsBreakdown} getInitials={getInitials} />
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

type Zone = {
  id: string
  name: string
  level: string
  progress: number
  status: 'done' | 'in-progress' | 'upcoming' | 'blocked'
  trades: string[]
  workers: number
  issues: number
}

const ZONES: Zone[] = [
  { id: 'Z0', name: 'Infrastructure / Fondations', level: 'R-2', progress: 100, status: 'done', trades: ['GO'], workers: 0, issues: 0 },
  { id: 'Z1', name: 'Rez-de-chaussée', level: 'R0', progress: 95, status: 'done', trades: ['GO', 'PLB', 'ELEC'], workers: 2, issues: 0 },
  { id: 'Z2', name: 'Niveau 1', level: 'R+1', progress: 88, status: 'in-progress', trades: ['GO', 'PLB', 'ELEC'], workers: 5, issues: 0 },
  { id: 'Z3', name: 'Niveau 2', level: 'R+2', progress: 72, status: 'in-progress', trades: ['GO', 'PLB', 'ELEC'], workers: 8, issues: 1 },
  { id: 'Z4', name: 'Niveau 3', level: 'R+3', progress: 55, status: 'in-progress', trades: ['GO', 'PLB'], workers: 10, issues: 1 },
  { id: 'Z5', name: 'Niveau 4', level: 'R+4', progress: 30, status: 'in-progress', trades: ['GO'], workers: 8, issues: 0 },
  { id: 'Z6', name: 'Niveau 5', level: 'R+5', progress: 8, status: 'in-progress', trades: ['GO'], workers: 8, issues: 0 },
  { id: 'Z7', name: 'Niveau 6', level: 'R+6', progress: 0, status: 'upcoming', trades: [], workers: 0, issues: 0 },
  { id: 'Z8', name: 'Niveau 7', level: 'R+7', progress: 0, status: 'upcoming', trades: [], workers: 0, issues: 0 },
  { id: 'Z9', name: 'Toiture / Combles', level: 'R+8', progress: 0, status: 'upcoming', trades: [], workers: 0, issues: 0 },
]

const STATUS_CONFIG = {
  done: { label: 'Terminé', color: 'text-emerald-600', bg: 'bg-emerald-500', icon: CheckCircle },
  'in-progress': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-500', icon: Clock },
  upcoming: { label: 'À venir', color: 'text-slate-400', bg: 'bg-slate-300', icon: Clock },
  blocked: { label: 'Bloqué', color: 'text-red-500', bg: 'bg-red-500', icon: AlertCircle },
}

export default function Site() {
  const [view, setView] = useState<'zones' | 'overview'>('overview')
  const totalWorkers = ZONES.reduce((s, z) => s + z.workers, 0)
  const totalIssues = ZONES.reduce((s, z) => s + z.issues, 0)
  const avgProgress = Math.round(ZONES.reduce((s, z) => s + z.progress, 0) / ZONES.length)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Project / Site</h1>
        <p className="text-slate-500 mt-1">Tour Belvédère · Paris 15e · 8 niveaux + combles</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Avancement global', value: `${avgProgress}%`, sub: '42% avancement réel', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Ouvriers sur site', value: `${totalWorkers}`, sub: 'Aujourd\'hui', color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'Zones actives', value: `${ZONES.filter(z => z.status === 'in-progress').length}`, sub: `sur ${ZONES.length} zones`, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Incidents ouverts', value: `${totalIssues}`, sub: 'Sur le site', color: totalIssues > 0 ? 'text-red-500' : 'text-emerald-600', bg: totalIssues > 0 ? 'bg-red-50' : 'bg-emerald-50', border: totalIssues > 0 ? 'border-red-200' : 'border-emerald-200' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-xl p-5 shadow-sm`}>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-slate-500 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-5 w-fit">
        {(['overview', 'zones'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {v === 'overview' ? 'Vue bâtiment' : 'Détail zones'}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Building visual */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Avancement par niveau</h2>
            <div className="flex gap-4">
              {/* Building silhouette */}
              <div className="flex flex-col-reverse gap-1 w-20 flex-shrink-0">
                {ZONES.slice(1).map(z => {
                  const colors = { done: 'bg-emerald-400', 'in-progress': 'bg-blue-400', upcoming: 'bg-slate-200', blocked: 'bg-red-400' }
                  return (
                    <div
                      key={z.id}
                      className={`h-8 rounded flex items-center justify-center text-white text-xs font-bold ${colors[z.status]}`}
                      title={z.name}
                    >
                      {z.level}
                    </div>
                  )
                })}
              </div>
              {/* Progress bars */}
              <div className="flex-1 flex flex-col-reverse gap-1">
                {ZONES.slice(1).map(z => (
                  <div key={z.id} className="h-8 flex items-center gap-2">
                    <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{
                          width: `${z.progress}%`,
                          backgroundColor: z.status === 'done' ? '#10b981' : z.status === 'in-progress' ? '#3b82f6' : '#e2e8f0'
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-8 text-right">{z.progress}%</span>
                    {z.workers > 0 && <span className="text-xs text-slate-400">{z.workers}👷</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Statut chantier</h2>
            <div className="space-y-3">
              {[
                { label: 'Zones terminées', count: ZONES.filter(z => z.status === 'done').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Zones en travaux', count: ZONES.filter(z => z.status === 'in-progress').length, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Zones à démarrer', count: ZONES.filter(z => z.status === 'upcoming').length, color: 'text-slate-500', bg: 'bg-slate-50' },
                { label: 'Zones bloquées', count: ZONES.filter(z => z.status === 'blocked').length, color: 'text-red-500', bg: 'bg-red-50' },
              ].map(s => (
                <div key={s.label} className={`flex items-center justify-between p-3 rounded-lg ${s.bg}`}>
                  <span className="text-sm text-slate-600">{s.label}</span>
                  <span className={`text-lg font-bold ${s.color}`}>{s.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-sm font-medium text-slate-700 mb-2">Corps d&apos;état actifs aujourd&apos;hui</div>
              <div className="flex flex-wrap gap-2">
                {['Gros oeuvre', 'Plomberie', 'Électricité', 'Direction'].map(t => (
                  <span key={t} className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'zones' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Zone / Niveau</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Avancement</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ouvriers</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Corps actifs</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Incidents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ZONES.map(z => {
                const cfg = STATUS_CONFIG[z.status]
                return (
                  <tr key={z.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-slate-800">{z.name}</div>
                      <div className="text-xs text-slate-400">{z.level}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        z.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                        z.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        z.status === 'blocked' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>{cfg.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${z.progress}%`,
                              backgroundColor: z.status === 'done' ? '#10b981' : z.status === 'in-progress' ? '#3b82f6' : '#e2e8f0'
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-600 font-medium w-8">{z.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600 text-right">{z.workers > 0 ? z.workers : '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {z.trades.map(t => (
                          <span key={t} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {z.issues > 0 ? (
                        <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">{z.issues}</span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

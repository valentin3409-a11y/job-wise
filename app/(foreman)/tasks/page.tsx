'use client'

import { useState } from 'react'
import { Plus, CheckSquare, AlertTriangle, DollarSign, Calendar, Filter } from 'lucide-react'

type Task = {
  id: number
  title: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'todo' | 'in-progress' | 'done' | 'blocked'
  assignee: string
  cost: number | null
  dueDate: string
  phase: string
  linkedRisk?: string
  tags: string[]
}

const TASKS: Task[] = [
  { id: 1, title: 'Trouver sous-traitant plomberie alternatif', priority: 'urgent', status: 'in-progress', assignee: 'Valentin', cost: null, dueDate: '2026-04-24', phase: 'Plomberie', linkedRisk: 'Effectifs plomberie', tags: ['sous-traitant', 'urgent'] },
  { id: 2, title: 'Inspection cage escalier R3 avec bureau de contrôle', priority: 'urgent', status: 'todo', assignee: 'Bureau contrôle', cost: 2_500, dueDate: '2026-04-23', phase: 'Gros oeuvre', linkedRisk: 'Non-conformité R3', tags: ['qualité', 'conformité'] },
  { id: 3, title: 'Commander acier niveaux 5-8', priority: 'high', status: 'todo', assignee: 'Marc D.', cost: 48_000, dueDate: '2026-04-25', phase: 'Gros oeuvre', linkedRisk: 'Livraison acier', tags: ['matériaux', 'approvisionnement'] },
  { id: 4, title: 'Réunion coordination corps d\'état niveaux 3-5', priority: 'high', status: 'todo', assignee: 'Sophie L.', cost: null, dueDate: '2026-04-23', phase: 'Organisation', tags: ['coordination'] },
  { id: 5, title: 'Mise à jour planning après retard plomberie', priority: 'high', status: 'in-progress', assignee: 'Valentin', cost: null, dueDate: '2026-04-22', phase: 'Planning', linkedRisk: 'Retard plomberie', tags: ['planning'] },
  { id: 6, title: 'Pose bâches protection façade ouest (météo)', priority: 'medium', status: 'todo', assignee: 'Chef chantier', cost: 1_200, dueDate: '2026-04-24', phase: 'Site', tags: ['météo', 'protection'] },
  { id: 7, title: 'Revoir composition équipe gros oeuvre niveaux 5-8', priority: 'medium', status: 'todo', assignee: 'Valentin', cost: null, dueDate: '2026-04-28', phase: 'Labour', linkedRisk: 'Surcoût MO', tags: ['RH', 'optimisation'] },
  { id: 8, title: 'Réception béton coulé dalle niveau 4', priority: 'medium', status: 'done', assignee: 'Chef chantier', cost: null, dueDate: '2026-04-20', phase: 'Gros oeuvre', tags: ['contrôle', 'qualité'] },
  { id: 9, title: 'Renégociation contrat fournisseur béton', priority: 'medium', status: 'todo', assignee: 'Valentin', cost: -28_000, dueDate: '2026-04-30', phase: 'Financials', tags: ['économie', 'fournisseur'] },
  { id: 10, title: 'Installation gaines électriques niveau 2', priority: 'low', status: 'in-progress', assignee: 'Équipe élec', cost: 12_000, dueDate: '2026-04-26', phase: 'Électricité', tags: ['travaux'] },
]

const STATUS_CONFIG = {
  'todo': { label: 'À faire', color: 'text-slate-500', bg: 'bg-slate-100' },
  'in-progress': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-100' },
  'done': { label: 'Terminé', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  'blocked': { label: 'Bloqué', color: 'text-red-500', bg: 'bg-red-100' },
}

const PRIORITY_CONFIG = {
  urgent: { label: 'URGENT', color: 'text-red-600', dot: 'bg-red-500' },
  high: { label: 'Élevé', color: 'text-orange-600', dot: 'bg-orange-400' },
  medium: { label: 'Moyen', color: 'text-amber-600', dot: 'bg-amber-400' },
  low: { label: 'Faible', color: 'text-slate-400', dot: 'bg-slate-300' },
}

function fmt(n: number) {
  if (n < 0) return `-${Math.abs(n / 1000).toFixed(0)} K€ économie`
  return n >= 1_000 ? `${(n / 1_000).toFixed(0)} K€` : `${n} €`
}

export default function Tasks() {
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high'>('all')

  const filtered = TASKS.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
    return true
  })

  const todo = TASKS.filter(t => t.status === 'todo').length
  const inProgress = TASKS.filter(t => t.status === 'in-progress').length
  const done = TASKS.filter(t => t.status === 'done').length
  const urgent = TASKS.filter(t => t.priority === 'urgent').length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 mt-1">Tâches connectées au coût, planning et risques</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Nouvelle tâche
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'À faire', value: todo, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
          { label: 'En cours', value: inProgress, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Terminé', value: done, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'Urgents', value: urgent, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['all', 'todo', 'in-progress', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f === 'all' ? 'Tout' : STATUS_CONFIG[f].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(['all', 'urgent', 'high'] as const).map(f => (
            <button
              key={f}
              onClick={() => setPriorityFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${priorityFilter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f === 'all' ? 'Toutes priorités' : f === 'urgent' ? 'Urgents' : 'Élevé+'}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.map(task => {
          const pCfg = PRIORITY_CONFIG[task.priority]
          const sCfg = STATUS_CONFIG[task.status]

          return (
            <div key={task.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.status === 'done'}
                  readOnly
                  className="mt-1 w-4 h-4 accent-amber-500 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <div className={`flex items-center gap-1 flex-shrink-0 ${pCfg.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pCfg.dot}`} />
                      <span className="text-xs font-bold">{pCfg.label}</span>
                    </div>
                    <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sCfg.bg} ${sCfg.color}`}>{sCfg.label}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {task.dueDate}
                    </span>
                    <span className="text-xs text-slate-400">{task.assignee}</span>
                    {task.cost !== null && (
                      <span className={`text-xs flex items-center gap-1 font-medium ${task.cost < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        <DollarSign className="w-3 h-3" />
                        {fmt(task.cost)}
                      </span>
                    )}
                    {task.linkedRisk && (
                      <span className="text-xs flex items-center gap-1 text-red-500">
                        <AlertTriangle className="w-3 h-3" />
                        {task.linkedRisk}
                      </span>
                    )}
                    <span className="text-xs text-slate-300">{task.phase}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

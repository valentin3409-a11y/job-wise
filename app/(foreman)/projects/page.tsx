'use client'

import { useState } from 'react'
import { useProject, ROLE_CONFIG, type Project } from '@/lib/foreman/project-context'
import { Plus, TrendingUp, TrendingDown, MapPin, Calendar, Users, ChevronRight, Building2 } from 'lucide-react'

const STATUS_CONFIG = {
  active:    { label: 'En cours',           color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', dot: 'bg-emerald-400' },
  bid:       { label: 'Appel d\'offres',    color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-300',    dot: 'bg-blue-400' },
  paused:    { label: 'En pause',           color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-300',   dot: 'bg-amber-400' },
  completed: { label: 'Terminé',            color: 'text-slate-600',   bg: 'bg-slate-50',   border: 'border-slate-300',   dot: 'bg-slate-400' },
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K€`
  return `${n} €`
}

const PROJECT_TYPES = ['Résidentiel', 'Commercial', 'Industriel', 'Bureaux', 'Rénovation', 'Infrastructure']

function ProjectCard({ project, onSelect }: { project: Project; onSelect: () => void }) {
  const cfg = STATUS_CONFIG[project.status]
  const spent = project.budget * (project.progress / 100) * 1.07
  const spentPct = Math.round((spent / project.budget) * 100)
  const margin = project.status === 'active' ? 18.4 : project.status === 'bid' ? 22 : 21.2

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer" onClick={onSelect}>
      {/* Color banner */}
      <div className="h-1.5" style={{ backgroundColor: project.color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-slate-900 text-lg leading-tight truncate">{project.name}</div>
            <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{project.location}</span>
            </div>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ml-2 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 flex-wrap">
          <span className="bg-slate-100 px-2 py-0.5 rounded-full">{project.type}</span>
          {project.client && <span className="truncate">Client: {project.client}</span>}
          {project.startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {project.startDate} → {project.endDate}
            </span>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-0.5">Budget</div>
            <div className="text-sm font-bold text-slate-800">{fmt(project.budget)}</div>
          </div>
          <div className="text-center border-x border-slate-100">
            <div className="text-xs text-slate-500 mb-0.5">Avancement</div>
            <div className={`text-sm font-bold ${project.progress > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
              {project.progress}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-0.5">Marge</div>
            <div className={`text-sm font-bold ${margin >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {project.status === 'bid' ? `${margin}%*` : `${margin}%`}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {project.progress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Avancement physique</span>
              <span>{project.progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${project.progress}%`, backgroundColor: project.color }} />
            </div>
          </div>
        )}

        {/* Cost bar (only for active) */}
        {project.status === 'active' && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>Budget consommé</span>
              <span className={spentPct > project.progress ? 'text-amber-600 font-semibold' : 'text-slate-500'}>{spentPct}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${spentPct > project.progress ? 'bg-amber-400' : 'bg-slate-400'}`} style={{ width: `${Math.min(spentPct, 100)}%` }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <button className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${project.status === 'active' ? 'bg-slate-900 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
          {project.status === 'bid' ? 'Préparer l\'offre' : project.status === 'active' ? 'Ouvrir le projet' : 'Voir le projet'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function NewProjectCard({ onAdd }: { onAdd: (p: Omit<Project, 'id'>) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', location: '', client: '', type: 'Résidentiel', budget: '', startDate: '', endDate: '', status: 'active' as const })
  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316', '#06b6d4', '#ec4899']
  const [color, setColor] = useState(colors[0])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onAdd({ ...form, budget: parseInt(form.budget.replace(/\s/g, '')) || 0, progress: 0, color })
    setForm({ name: '', location: '', client: '', type: 'Résidentiel', budget: '', startDate: '', endDate: '', status: 'active' })
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/30 transition-all flex flex-col items-center justify-center gap-3 p-8 min-h-64 group"
      >
        <div className="w-14 h-14 bg-amber-100 group-hover:bg-amber-200 rounded-2xl flex items-center justify-center transition-colors">
          <Plus className="w-7 h-7 text-amber-500" />
        </div>
        <div>
          <div className="text-slate-700 font-semibold text-center">Nouveau projet</div>
          <div className="text-slate-400 text-sm text-center mt-0.5">Ajouter à votre portfolio</div>
        </div>
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-amber-300 shadow-sm overflow-hidden">
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <form onSubmit={handleSubmit} className="p-5 space-y-3">
        <div className="font-semibold text-slate-800 mb-4">Nouveau projet</div>
        <input required placeholder="Nom du projet *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
        <input placeholder="Localisation" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
        <input placeholder="Client / Maître d'ouvrage" value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 bg-white">
            {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof form.status }))}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 bg-white">
            <option value="active">En cours</option>
            <option value="bid">Appel d'offres</option>
            <option value="paused">En pause</option>
          </select>
        </div>
        <input placeholder="Budget (€)" value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
          <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
            className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Couleur :</span>
          {colors.map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full border-2 transition-all"
              style={{ backgroundColor: c, borderColor: color === c ? '#1e293b' : 'transparent' }} />
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
            Créer le projet
          </button>
          <button type="button" onClick={() => setOpen(false)}
            className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm rounded-xl transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Projects() {
  const { projects, addProject, setCurrentProject } = useProject()
  const [filter, setFilter] = useState<'all' | 'active' | 'bid' | 'completed'>('all')

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)
  const totalBudget = projects.filter(p => p.status === 'active').reduce((s, p) => s + p.budget, 0)
  const activeCount = projects.filter(p => p.status === 'active').length
  const bidCount = projects.filter(p => p.status === 'bid').length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mes projets</h1>
        <p className="text-slate-500 mt-1">Portfolio complet — tous vos chantiers en un coup d&apos;œil</p>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Projets actifs', value: activeCount, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          { label: 'En appel d\'offres', value: bidCount, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
          { label: 'Budget total actifs', value: fmt(totalBudget), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
          { label: 'Projets au total', value: projects.length, icon: Building2, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className={`${k.bg} border ${k.border} rounded-xl p-5 shadow-sm`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{k.label}</span>
                <Icon className={`w-4 h-4 ${k.color}`} />
              </div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit">
        {([
          { key: 'all', label: `Tous (${projects.length})` },
          { key: 'active', label: `En cours (${activeCount})` },
          { key: 'bid', label: `Appels d'offres (${bidCount})` },
          { key: 'completed', label: 'Terminés' },
        ] as const).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(p => (
          <ProjectCard key={p.id} project={p} onSelect={() => setCurrentProject(p)} />
        ))}
        <NewProjectCard onAdd={addProject} />
      </div>
    </div>
  )
}

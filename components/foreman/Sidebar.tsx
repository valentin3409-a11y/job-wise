'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Zap, DollarSign, Ruler, HardHat, CalendarDays, Users, AlertTriangle,
  CheckSquare, MessageSquare, Mail, Bell, Brain, BarChart3, FolderOpen,
  Settings, ChevronDown, Menu, X, Building2, Plus, Check, Lock,
} from 'lucide-react'
import { useProject, ROLE_CONFIG, type Project } from '@/lib/foreman/project-context'

const NAV_ITEMS = [
  { href: '/command-center', icon: Zap,           label: 'Command Center', section: 'command-center' },
  { href: '/financials',     icon: DollarSign,    label: 'Financials',     section: 'financials' },
  { href: '/takeoff',        icon: Ruler,         label: 'Takeoff',        section: 'takeoff' },
  { href: '/site',           icon: HardHat,       label: 'Site',           section: 'site' },
  { href: '/planning',       icon: CalendarDays,  label: 'Planning',       section: 'planning' },
  { href: '/labour',         icon: Users,         label: 'Labour',         section: 'labour' },
  { href: '/risks',          icon: AlertTriangle, label: 'Risks',          section: 'risks',    badge: 4 },
  { href: '/tasks',          icon: CheckSquare,   label: 'Tasks',          section: 'tasks' },
  { href: '/chat',           icon: MessageSquare, label: 'Chat',           section: 'chat' },
  { href: '/emails',         icon: Mail,          label: 'Emails',         section: 'emails',   badge: 7 },
  { href: '/alerts',         icon: Bell,          label: 'Alerts',         section: 'alerts',   badge: 3 },
  { href: '/ai-assistant',   icon: Brain,         label: 'AI Assistant',   section: 'ai-assistant' },
  { href: '/reports',        icon: BarChart3,     label: 'Reports',        section: 'reports' },
  { href: '/documents',      icon: FolderOpen,    label: 'Documents',      section: 'documents' },
  { href: '/settings',       icon: Settings,      label: 'Settings',       section: 'settings' },
]

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-400',
  bid: 'bg-blue-400',
  paused: 'bg-amber-400',
  completed: 'bg-slate-400',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'En cours',
  bid: 'En appel d\'offres',
  paused: 'En pause',
  completed: 'Terminé',
}

const PROJECT_TYPES = ['Résidentiel', 'Commercial', 'Industriel', 'Bureaux', 'Rénovation', 'Infrastructure']

function NewProjectForm({ onClose }: { onClose: () => void }) {
  const { addProject } = useProject()
  const [form, setForm] = useState({
    name: '',
    location: '',
    type: 'Résidentiel',
    client: '',
    budget: '',
    startDate: '',
    endDate: '',
  })

  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f97316']
  const [color, setColor] = useState(colors[0])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    addProject({
      name: form.name,
      location: form.location,
      type: form.type,
      client: form.client,
      budget: parseInt(form.budget.replace(/\s/g, '')) || 0,
      progress: 0,
      status: 'active',
      color,
      startDate: form.startDate,
      endDate: form.endDate,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800">
      <div className="text-xs font-semibold text-slate-300 mb-3">Nouveau projet</div>
      <div className="space-y-2.5">
        <input
          required
          placeholder="Nom du projet *"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
        />
        <input
          placeholder="Localisation"
          value={form.location}
          onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
        />
        <input
          placeholder="Client / Maître d'ouvrage"
          value={form.client}
          onChange={e => setForm(p => ({ ...p, client: e.target.value }))}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
        />
        <select
          value={form.type}
          onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
        >
          {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <input
          placeholder="Budget (€)"
          value={form.budget}
          onChange={e => setForm(p => ({ ...p, budget: e.target.value }))}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={form.startDate}
            onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-2 py-2 focus:outline-none focus:border-amber-500"
          />
          <input
            type="date"
            value={form.endDate}
            onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-2 py-2 focus:outline-none focus:border-amber-500"
          />
        </div>
        {/* Color picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Couleur :</span>
          {colors.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-5 h-5 rounded-full border-2 transition-all"
              style={{ backgroundColor: c, borderColor: color === c ? 'white' : 'transparent' }}
            />
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Créer le projet
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  )
}

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { projects, currentProject, setCurrentProject, currentRole, canAccess } = useProject()
  const [projectOpen, setProjectOpen] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)

  const roleCfg = ROLE_CONFIG[currentRole]

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <span className="text-white font-bold text-lg tracking-widest uppercase">Foreman</span>
        </div>
      </div>

      {/* Project selector */}
      <div className="border-b border-slate-800">
        <button
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
          onClick={() => { setProjectOpen(!projectOpen); setShowNewForm(false) }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: currentProject.color }} />
            <div className="min-w-0 text-left">
              <div className="truncate font-medium text-slate-200 text-sm">{currentProject.name}</div>
              <div className="text-xs text-slate-500 truncate">{currentProject.location}</div>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${projectOpen ? 'rotate-180' : ''}`} />
        </button>

        {projectOpen && (
          <div className="bg-slate-800/50">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => { setCurrentProject(p); setProjectOpen(false); onClose?.() }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-700/50 transition-colors text-left"
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500">{STATUS_LABELS[p.status]}</div>
                </div>
                {p.id === currentProject.id && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
              </button>
            ))}
            {!showNewForm && (
              <button
                onClick={() => setShowNewForm(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-amber-400 hover:bg-slate-700/50 transition-colors text-sm font-medium border-t border-slate-700"
              >
                <Plus className="w-4 h-4" />
                Nouveau projet
              </button>
            )}
          </div>
        )}

        {showNewForm && (
          <NewProjectForm onClose={() => { setShowNewForm(false); setProjectOpen(false) }} />
        )}
      </div>

      {/* Role badge */}
      <div className="px-4 py-2 border-b border-slate-800">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleCfg.bg} ${roleCfg.color}`}>
          {roleCfg.label}
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const accessible = canAccess(item.section)

          if (!accessible) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 cursor-not-allowed"
              >
                <Lock className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 relative ${
                isActive
                  ? 'bg-amber-500/15 text-amber-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-amber-400 rounded-r-full" />
              )}
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none ${
                  item.href === '/alerts' || item.href === '/risks'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-slate-700 text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            V
          </div>
          <div className="min-w-0">
            <div className="text-slate-200 text-sm font-medium truncate">Valentin</div>
            <div className="text-slate-500 text-xs">{roleCfg.label}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <aside className="hidden lg:flex flex-col w-56 bg-slate-900 min-h-screen flex-shrink-0 sticky top-0 overflow-y-auto">
        <NavContent />
      </aside>

      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 rounded-lg text-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-56 bg-slate-900 z-50 overflow-y-auto shadow-2xl">
            <NavContent onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

type Phase = {
  id: number
  name: string
  start: string
  end: string
  progress: number
  status: 'done' | 'in-progress' | 'upcoming' | 'delayed'
  critical: boolean
  delay?: number
  trades: string[]
}

const PHASES: Phase[] = [
  { id: 1, name: 'Installation de chantier', start: '2026-01-05', end: '2026-01-14', progress: 100, status: 'done', critical: false, trades: ['Logistique'] },
  { id: 2, name: 'Terrassement & Fondations', start: '2026-01-15', end: '2026-03-10', progress: 100, status: 'done', critical: true, trades: ['Gros oeuvre', 'Géotechnique'] },
  { id: 3, name: 'Gros oeuvre R1–R4', start: '2026-03-11', end: '2026-06-15', progress: 78, status: 'in-progress', critical: true, trades: ['Gros oeuvre', 'Coffrage'] },
  { id: 4, name: 'Plomberie & Sanitaires R1–R4', start: '2026-04-15', end: '2026-07-30', progress: 35, status: 'delayed', critical: true, delay: 18, trades: ['Plomberie'] },
  { id: 5, name: 'Électricité R1–R4', start: '2026-04-20', end: '2026-08-15', progress: 28, status: 'in-progress', critical: false, trades: ['Électricité'] },
  { id: 6, name: 'Gros oeuvre R5–R8', start: '2026-06-16', end: '2026-09-01', progress: 0, status: 'upcoming', critical: true, trades: ['Gros oeuvre', 'Coffrage'] },
  { id: 7, name: 'Plomberie & Élec R5–R8', start: '2026-08-01', end: '2026-10-15', progress: 0, status: 'upcoming', critical: false, trades: ['Plomberie', 'Électricité'] },
  { id: 8, name: 'Menuiseries extérieures', start: '2026-09-01', end: '2026-10-31', progress: 0, status: 'upcoming', critical: false, trades: ['Menuiserie'] },
  { id: 9, name: 'Finitions intérieures', start: '2026-10-01', end: '2026-11-30', progress: 0, status: 'upcoming', critical: false, trades: ['Peinture', 'Carrelage', 'Menuiserie'] },
  { id: 10, name: 'Façade & Ravalement', start: '2026-09-15', end: '2026-11-15', progress: 0, status: 'upcoming', critical: false, trades: ['Façade'] },
  { id: 11, name: 'VRD & Espaces extérieurs', start: '2026-11-01', end: '2026-12-15', progress: 0, status: 'upcoming', critical: false, trades: ['VRD'] },
  { id: 12, name: 'Livraison & Réception', start: '2026-12-16', end: '2026-12-30', progress: 0, status: 'upcoming', critical: true, trades: ['Direction'] },
]

const STATUS_CONFIG = {
  done: { label: 'Terminé', color: 'text-emerald-600', bg: 'bg-emerald-500', icon: CheckCircle },
  'in-progress': { label: 'En cours', color: 'text-blue-600', bg: 'bg-blue-500', icon: Clock },
  upcoming: { label: 'À venir', color: 'text-slate-400', bg: 'bg-slate-300', icon: Clock },
  delayed: { label: 'Retard', color: 'text-red-500', bg: 'bg-red-500', icon: AlertTriangle },
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

const PROJECT_START = '2026-01-05'
const PROJECT_END = '2026-12-30'
const TOTAL_DAYS = daysBetween(PROJECT_START, PROJECT_END)

function getBarStyle(start: string, end: string) {
  const left = (daysBetween(PROJECT_START, start) / TOTAL_DAYS) * 100
  const width = (daysBetween(start, end) / TOTAL_DAYS) * 100
  return { left: `${Math.max(0, left)}%`, width: `${Math.max(0.5, width)}%` }
}

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

export default function Planning() {
  const [showCritical, setShowCritical] = useState(false)
  const phases = showCritical ? PHASES.filter(p => p.critical) : PHASES

  const delayedPhases = PHASES.filter(p => p.status === 'delayed')
  const totalDelay = delayedPhases.reduce((s, p) => Math.max(s, p.delay || 0), 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planning / Schedule</h1>
          <p className="text-slate-500 mt-1">Gantt simplifié · Tour Belvédère · Jan – Déc 2026</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCritical(!showCritical)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${showCritical ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            <AlertTriangle className="w-4 h-4" />
            Chemin critique uniquement
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Avancement global</div>
          <div className="text-2xl font-bold text-blue-600">42%</div>
          <div className="h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '42%' }} />
          </div>
        </div>
        <div className={`border rounded-xl p-4 shadow-sm ${delayedPhases.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <div className="text-xs text-slate-500 mb-1">Retards actifs</div>
          <div className={`text-2xl font-bold ${delayedPhases.length > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{delayedPhases.length}</div>
          <div className="text-xs text-slate-400 mt-1">{delayedPhases.length > 0 ? `Max ${totalDelay} jours` : 'Aucun retard'}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-slate-500 mb-1">Phases en cours</div>
          <div className="text-2xl font-bold text-slate-700">{PHASES.filter(p => p.status === 'in-progress' || p.status === 'delayed').length}</div>
          <div className="text-xs text-slate-400 mt-1">sur {PHASES.length} phases</div>
        </div>
        <div className={`border rounded-xl p-4 shadow-sm ${totalDelay > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className="text-xs text-slate-500 mb-1">Impact délai</div>
          <div className={`text-2xl font-bold ${totalDelay > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{totalDelay > 0 ? `+${totalDelay}j` : 'OK'}</div>
          <div className="text-xs text-slate-400 mt-1">sur livraison finale</div>
        </div>
      </div>

      {/* Gantt chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Month headers */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <div className="w-64 flex-shrink-0 px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phase</div>
          <div className="flex-1 relative">
            <div className="flex">
              {MONTHS.map(m => (
                <div key={m} className="flex-1 text-center text-xs font-medium text-slate-400 py-2.5 border-l border-slate-200">{m}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase rows */}
        <div className="divide-y divide-slate-100">
          {phases.map(phase => {
            const cfg = STATUS_CONFIG[phase.status]
            const Icon = cfg.icon
            const barStyle = getBarStyle(phase.start, phase.end)

            return (
              <div key={phase.id} className="flex items-center hover:bg-slate-50 transition-colors group">
                {/* Phase name */}
                <div className="w-64 flex-shrink-0 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {phase.critical && (
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" title="Chemin critique" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-800 leading-tight">{phase.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                        {phase.delay && (
                          <span className="text-xs text-red-500 font-semibold">+{phase.delay}j retard</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bar area */}
                <div className="flex-1 relative h-12">
                  {/* Grid lines */}
                  {MONTHS.map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-l border-slate-100" style={{ left: `${(i / 12) * 100}%` }} />
                  ))}

                  {/* Today line */}
                  <div className="absolute top-0 bottom-0 w-px bg-red-400/60 z-10" style={{ left: `${(daysBetween(PROJECT_START, '2026-04-22') / TOTAL_DAYS) * 100}%` }} />

                  {/* Phase bar */}
                  <div
                    className="absolute top-3 bottom-3 rounded-md flex items-center px-2 transition-all"
                    style={{
                      ...barStyle,
                      backgroundColor: phase.status === 'done' ? '#10b981' : phase.status === 'delayed' ? '#ef4444' : phase.status === 'in-progress' ? '#3b82f6' : '#cbd5e1',
                    }}
                  >
                    {parseFloat(barStyle.width) > 8 && (
                      <span className="text-xs text-white font-medium truncate">{phase.progress > 0 ? `${phase.progress}%` : ''}</span>
                    )}
                  </div>

                  {/* Progress overlay */}
                  {phase.progress > 0 && phase.progress < 100 && (
                    <div
                      className="absolute top-3 bottom-3 rounded-l-md"
                      style={{
                        ...barStyle,
                        width: `${parseFloat(barStyle.width) * phase.progress / 100}%`,
                        backgroundColor: 'rgba(255,255,255,0.25)',
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-emerald-500 rounded" />Terminé</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-500 rounded" />En cours</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-500 rounded" />Retard</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-slate-300 rounded" />À venir</div>
          <div className="flex items-center gap-1.5"><div className="w-1 h-3 bg-red-400 rounded" />Aujourd&apos;hui</div>
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-red-400 rounded-full" />Chemin critique</div>
        </div>
      </div>
    </div>
  )
}

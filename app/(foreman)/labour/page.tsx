'use client'

import { useState } from 'react'
import {
  Users,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  UserCheck,
} from 'lucide-react'
import { useProject } from '@/lib/foreman/project-context'

// ─── Types ────────────────────────────────────────────────────────────────────

type TeamAlert = 'ok' | 'warn' | 'crit'

type TeamRow = {
  name: string
  trade: string
  staffActual: number
  staffTotal: number
  productivity: number
  costPerSqm: number
  targetCostPerSqm: number
  progressPct: number
  alert: TeamAlert
  alertLabel: string
}

type Worker = {
  name: string
  team: string
  arrivalTime: string
  status: 'present' | 'absent' | 'retard'
}

type AIInsight = {
  id: number
  level: 'crit' | 'warn' | 'info'
  emoji: string
  title: string
  detail: string
  actionLabel: string
}

// ─── Static data ──────────────────────────────────────────────────────────────

const TEAMS: TeamRow[] = [
  {
    name: 'Équipe GO A',
    trade: 'Gros oeuvre',
    staffActual: 8, staffTotal: 8,
    productivity: 94,
    costPerSqm: 118, targetCostPerSqm: 128,
    progressPct: 78,
    alert: 'ok',
    alertLabel: 'OK',
  },
  {
    name: 'Équipe GO B',
    trade: 'Gros oeuvre',
    staffActual: 6, staffTotal: 8,
    productivity: 81,
    costPerSqm: 138, targetCostPerSqm: 128,
    progressPct: 62,
    alert: 'warn',
    alertLabel: '-2 effectifs',
  },
  {
    name: 'Plomberie PLB',
    trade: 'Plomberie',
    staffActual: 2, staffTotal: 4,
    productivity: 52,
    costPerSqm: 198, targetCostPerSqm: 128,
    progressPct: 41,
    alert: 'crit',
    alertLabel: 'CRITIQUE',
  },
  {
    name: 'Électricité',
    trade: 'Électricité',
    staffActual: 4, staffTotal: 4,
    productivity: 96,
    costPerSqm: 112, targetCostPerSqm: 128,
    progressPct: 68,
    alert: 'ok',
    alertLabel: 'OK',
  },
  {
    name: 'Menuiserie',
    trade: 'Menuiserie',
    staffActual: 4, staffTotal: 4,
    productivity: 89,
    costPerSqm: 124, targetCostPerSqm: 128,
    progressPct: 35,
    alert: 'ok',
    alertLabel: 'OK',
  },
]

const AI_INSIGHTS: AIInsight[] = [
  {
    id: 1,
    level: 'crit',
    emoji: '🔴',
    title: 'PLB sous-performance critique — 52% productivité',
    detail: "À ce rythme, plomberie terminée dans 14 semaines au lieu de 8. Surcoût estimé: 127 000 €. Action: renforcer l'équipe immédiatement.",
    actionLabel: 'Créer tâche urgente',
  },
  {
    id: 2,
    level: 'warn',
    emoji: '⚠️',
    title: 'Équipe GO-B en sous-effectif — Impact sur planning',
    detail: '2 personnes manquantes depuis 5 jours. Retard accumulé: 4 jours. Risque de pénalité contractuelle si J+15.',
    actionLabel: 'Affecter ressources',
  },
  {
    id: 3,
    level: 'info',
    emoji: '💡',
    title: 'Opportunité — Équipe électricité très performante',
    detail: '96% de productivité, 12% sous budget. Peut absorber 20% de charge supplémentaire. Envisager affectation sur câblage niveaux 7-9.',
    actionLabel: "Exploiter l'opportunité",
  },
]

const ATTENDANCE: Worker[] = [
  { name: 'Ahmed K.',    team: 'GO A',       arrivalTime: '07:02', status: 'present' },
  { name: 'Jean-Marc P.',team: 'GO A',       arrivalTime: '07:10', status: 'present' },
  { name: 'Samir B.',    team: 'GO B',       arrivalTime: '07:35', status: 'retard'  },
  { name: 'Louis T.',    team: 'GO B',       arrivalTime: '—',     status: 'absent'  },
  { name: 'Karim M.',    team: 'Plomberie',  arrivalTime: '07:05', status: 'present' },
  { name: 'Youssef A.',  team: 'Plomberie',  arrivalTime: '—',     status: 'absent'  },
  { name: 'Théo R.',     team: 'Électricité',arrivalTime: '07:00', status: 'present' },
  { name: 'Nadia S.',    team: 'Menuiserie', arrivalTime: '07:15', status: 'present' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function productivityBarColor(pct: number): string {
  if (pct >= 90) return 'bg-emerald-500'
  if (pct >= 75) return 'bg-amber-400'
  return 'bg-red-500'
}

function productivityTextColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600'
  if (pct >= 75) return 'text-amber-600'
  return 'text-red-600'
}

function alertBadge(alert: TeamAlert, label: string) {
  if (alert === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
        ✅
      </span>
    )
  }
  if (alert === 'warn') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">
        ⚠️ {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 border border-red-200 text-red-700 animate-pulse">
      🔴 {label}
    </span>
  )
}

function statusBadge(status: Worker['status']) {
  if (status === 'present') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">Présent</span>
  }
  if (status === 'absent') {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-700">Absent</span>
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">Retard</span>
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: AIInsight }) {
  const [expanded, setExpanded] = useState(false)

  const borderColor =
    insight.level === 'crit' ? 'border-red-200' :
    insight.level === 'warn' ? 'border-amber-200' : 'border-blue-200'

  const bgColor =
    insight.level === 'crit' ? 'bg-red-50' :
    insight.level === 'warn' ? 'bg-amber-50' : 'bg-blue-50'

  const btnColor =
    insight.level === 'crit' ? 'bg-red-500 hover:bg-red-600' :
    insight.level === 'warn' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} overflow-hidden`}>
      <button
        className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <span className="text-lg leading-none mt-0.5">{insight.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug">{insight.title}</p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        }
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <p className="text-sm text-slate-600 leading-relaxed mb-3">{insight.detail}</p>
          <button className={`${btnColor} text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors`}>
            {insight.actionLabel}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LabourPage() {
  useProject()

  const presentCount = ATTENDANCE.filter(w => w.status === 'present').length
  const absentCount  = ATTENDANCE.filter(w => w.status === 'absent').length
  const retardCount  = ATTENDANCE.filter(w => w.status === 'retard').length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Performance Main d&apos;Œuvre</h1>
        <p className="text-slate-500 mt-1">Productivité, coût par m², détection sous-performance</p>
      </div>

      {/* KPI Row — 5 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 — Effectifs aujourd'hui */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Effectifs</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">24/28</div>
          <div className="text-xs text-amber-600 mt-0.5">85% présents</div>
          <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '85%' }} />
          </div>
        </div>

        {/* KPI 2 — Productivité globale */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Productivité</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">87%</div>
          <div className="text-xs text-amber-600 mt-0.5">Globale équipes</div>
          <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '87%' }} />
          </div>
        </div>

        {/* KPI 3 — Coût MO/m² */}
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Coût MO/m²</span>
            <TrendingUp className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-700">142 €/m²</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-red-500">Cible: 128 €/m²</span>
            <span className="inline-flex items-center bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">+14 €</span>
          </div>
        </div>

        {/* KPI 4 — Heures productives */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Heures prod.</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800">186h</div>
          <div className="text-xs text-slate-500 mt-0.5">/ 214h planifiées (87%)</div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: '87%' }} />
          </div>
        </div>

        {/* KPI 5 — Alertes RH */}
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Alertes RH</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-red-700">2</div>
            <span className="inline-flex items-center bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">URGENT</span>
          </div>
          <div className="text-xs text-red-400 mt-1">Actions requises</div>
        </div>
      </div>

      {/* Main content: two-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2/3: Productivity by Team table */}
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Productivité par équipe</h2>
              <p className="text-xs text-slate-400 mt-0.5">Performances en temps réel — aujourd&apos;hui</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Équipe', 'Corps de métier', 'Effectif', 'Productivité', 'Coût/m²', 'Avancement', 'Alerte'].map(h => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === 'Équipe' || h === 'Corps de métier' ? 'text-left' : 'text-center'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TEAMS.map(t => {
                    const costDelta = t.costPerSqm - t.targetCostPerSqm
                    const costColor = costDelta > 0 ? 'text-red-600' : 'text-emerald-600'
                    return (
                      <tr key={t.name} className={`hover:bg-slate-50 transition-colors ${t.alert === 'crit' ? 'bg-red-50/40' : ''}`}>
                        <td className="px-4 py-3.5 text-sm font-semibold text-slate-800 whitespace-nowrap">{t.name}</td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{t.trade}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-sm font-semibold ${t.staffActual < t.staffTotal ? 'text-amber-600' : 'text-slate-700'}`}>
                            {t.staffActual}/{t.staffTotal}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${productivityBarColor(t.productivity)}`}
                                style={{ width: `${t.productivity}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold w-8 text-right ${productivityTextColor(t.productivity)}`}>
                              {t.productivity}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-sm font-semibold ${costColor}`}>
                            {t.costPerSqm}€/m²
                          </span>
                        </td>
                        <td className="px-4 py-3.5 min-w-[110px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-400 rounded-full"
                                style={{ width: `${t.progressPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 w-7 text-right">{t.progressPct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {alertBadge(t.alert, t.alertLabel)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Attendance Log */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-800">Pointage du jour</h2>
                <p className="text-xs text-slate-400 mt-0.5">Jeudi 24 avril 2026</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <UserCheck className="w-3.5 h-3.5" /> {presentCount} présents
                </span>
                <span className="flex items-center gap-1 text-red-600 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> {absentCount} absents
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <Clock className="w-3.5 h-3.5" /> {retardCount} retard
                </span>
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {ATTENDANCE.map((w, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                    {w.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{w.name}</p>
                    <p className="text-xs text-slate-400">{w.team}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-500 font-mono w-12 text-right">{w.arrivalTime}</span>
                    {statusBadge(w.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1/3: AI Performance Insights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-violet-500" />
            <h2 className="font-semibold text-slate-800">Insights IA Performance</h2>
          </div>
          {AI_INSIGHTS.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </div>
    </div>
  )
}

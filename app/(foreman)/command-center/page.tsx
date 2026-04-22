'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Lightbulb, TrendingDown, TrendingUp, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'

function HealthGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? 'Excellent' : score >= 65 ? 'Bon' : score >= 50 ? 'Attention' : 'Critique'

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="160" height="95" viewBox="0 0 160 95">
          <path d="M 18 82 A 62 62 0 0 1 142 82" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
          <path
            d="M 18 82 A 62 62 0 0 1 142 82"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${score} 100`}
          />
          <text x="80" y="68" textAnchor="middle" fontSize="30" fontWeight="700" fill="#1e293b">{score}</text>
          <text x="80" y="83" textAnchor="middle" fontSize="11" fill="#94a3b8">/100</text>
        </svg>
      </div>
      <span className="text-sm font-semibold mt-1" style={{ color }}>{label}</span>
      <span className="text-xs text-slate-500 mt-0.5">Project Health Score</span>
    </div>
  )
}

function KpiCard({ label, value, sub, trend, color = 'default' }: {
  label: string
  value: string
  sub: string
  trend?: string
  color?: 'green' | 'red' | 'amber' | 'default'
}) {
  const colors = {
    green: 'text-emerald-600',
    red: 'text-red-500',
    amber: 'text-amber-500',
    default: 'text-slate-700'
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-2xl font-bold ${colors[color]} leading-none`}>{value}</div>
      <div className="text-sm text-slate-500 mt-1">{sub}</div>
      {trend && <div className="text-xs font-medium text-slate-400 mt-2">{trend}</div>}
    </div>
  )
}

function BudgetBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-800">{pct}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

const AI_INSIGHTS = [
  {
    type: 'warning',
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'Main d\'œuvre gros oeuvre +12% vs estimation. Revoir la planification des équipes niveau 5-8.',
  },
  {
    type: 'ok',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'Matériaux sous budget cette semaine. La gestion des approvisionnements est efficace.',
  },
  {
    type: 'critical',
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'Retard plomberie critique — impact estimé 18 jours sur la livraison. Mobiliser sous-traitant alternatif.',
  },
  {
    type: 'tip',
    icon: Lightbulb,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'Opportunité : renégocier contrat béton pour commande groupée → économie potentielle 28 000 €.',
  },
]

const ALERTS = [
  { level: 'critical', text: 'Plomberie — manque d\'effectifs critique', sub: 'il y a 2h', color: 'bg-red-500' },
  { level: 'warning', text: 'Dépassement MO niveau 4 (+8 600 €)', sub: 'il y a 5h', color: 'bg-amber-400' },
  { level: 'warning', text: 'Livraison matériaux retardée de 5 jours', sub: 'hier', color: 'bg-amber-400' },
]

export default function CommandCenter() {
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Command Center</h1>
          <p className="text-slate-500 mt-1">Tour Belvédère · Paris 15e · Mis à jour il y a 12 min</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Action rapide
          </button>
          {showActions && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-10">
              {['Créer une tâche', 'Signaler un incident', 'Ajouter un coût', 'Planifier une réunion'].map(a => (
                <button key={a} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  {a}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top row: Health + KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Health Score */}
        <div className="col-span-2 lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center justify-center">
          <HealthGauge score={74} />
        </div>

        <KpiCard
          label="Budget Total"
          value="4 850 K€"
          sub="Dépensé: 2 180 K€ (45%)"
          trend="Avancement chantier: 42%"
          color="default"
        />
        <KpiCard
          label="Forecast final"
          value="4 620 K€"
          sub="Économie estimée: 230 K€"
          trend="↓ 4.7% sous budget"
          color="green"
        />
        <KpiCard
          label="Marge actuelle"
          value="18.4%"
          sub="Cible: 22%"
          trend="⚠ −3.6 pts vs cible"
          color="amber"
        />
        <KpiCard
          label="Délai restant"
          value="252 j."
          sub="Livraison: 30 déc. 2026"
          trend="Léger retard prévu"
          color="amber"
        />
      </div>

      {/* Middle row: Budget bars + Timeline + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Budget vs Avancement */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-800">Budget vs Avancement</h2>
            <span className="text-xs text-slate-400 bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-full font-medium">
              ⚠ Dépense légèrement supérieure
            </span>
          </div>
          <div className="space-y-4">
            <BudgetBar label="Budget consommé" pct={45} color="#f59e0b" />
            <BudgetBar label="Avancement chantier" pct={42} color="#3b82f6" />
            <BudgetBar label="Labour vs budget labour" pct={51} color="#ef4444" />
            <BudgetBar label="Matériaux vs budget mat." pct={38} color="#10b981" />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-4 gap-3 text-center">
            {[
              { label: 'Gros oeuvre', pct: 46, color: '#f59e0b' },
              { label: 'Plomberie', pct: 51, color: '#ef4444' },
              { label: 'Électricité', pct: 42, color: '#10b981' },
              { label: 'Finitions', pct: 7, color: '#3b82f6' },
            ].map(t => (
              <div key={t.label} className="text-xs text-slate-500">
                <div className="font-bold text-slate-700 text-sm">{t.pct}%</div>
                <div className="h-1 bg-slate-100 rounded mt-1 overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${t.pct}%`, backgroundColor: t.color }} />
                </div>
                <div className="mt-1">{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Alertes actives</h2>
            <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">3</span>
          </div>
          <div className="space-y-3">
            {ALERTS.map((a, i) => (
              <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.color}`} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-700">{a.text}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/alerts" className="flex items-center justify-center gap-1 mt-4 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors">
            Voir toutes les alertes
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Bottom row: AI Insights + Phase overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Insights */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
              <span className="text-sm">🧠</span>
            </div>
            <h2 className="font-semibold text-slate-800">AI Insights</h2>
            <span className="text-xs text-slate-400 ml-auto">Analyse en temps réel</span>
          </div>
          <div className="space-y-3">
            {AI_INSIGHTS.map((insight, i) => {
              const Icon = insight.icon
              return (
                <div key={i} className={`flex gap-3 p-3 rounded-lg border ${insight.bg} ${insight.border}`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${insight.color}`} />
                  <p className="text-sm text-slate-700 leading-relaxed">{insight.text}</p>
                </div>
              )
            })}
          </div>
          <Link href="/ai-assistant" className="flex items-center justify-center gap-1 mt-4 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors">
            Analyser avec l&apos;IA complète
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Phase overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Phases chantier</h2>
          <div className="space-y-3">
            {[
              { name: 'Fondations', pct: 100, color: '#10b981', status: 'Terminé' },
              { name: 'Gros oeuvre R1-R4', pct: 78, color: '#3b82f6', status: 'En cours' },
              { name: 'Gros oeuvre R5-R8', pct: 0, color: '#e2e8f0', status: 'À venir' },
              { name: 'Plomberie / Élec', pct: 35, color: '#f59e0b', status: 'En cours' },
              { name: 'Finitions', pct: 0, color: '#e2e8f0', status: 'À venir' },
              { name: 'Livraison', pct: 0, color: '#e2e8f0', status: 'À venir' },
            ].map(phase => (
              <div key={phase.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">{phase.name}</span>
                  <span className={`${phase.pct === 100 ? 'text-emerald-600' : phase.pct > 0 ? 'text-blue-600' : 'text-slate-400'} font-medium`}>
                    {phase.status}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${phase.pct}%`, backgroundColor: phase.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link href="/planning" className="flex items-center justify-center gap-1 mt-5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Planning détaillé
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

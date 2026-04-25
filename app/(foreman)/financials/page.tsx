'use client'

import { useState } from 'react'
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Droplets,
  Brain,
} from 'lucide-react'
import { useProject } from '@/lib/foreman/project-context'

// ─── helpers ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (n >= 1_000) return `${Math.round(n / 1_000)} K€`
  return `${n} €`
}

function fmtSign(n: number): string {
  const s = fmt(Math.abs(n))
  return n >= 0 ? `+${s}` : `-${s}`
}

// ─── static data ─────────────────────────────────────────────────────────────

const MONTHLY_BURN = [
  { month: 'Jan', amount: 320_000, forecast: false, overBudget: false },
  { month: 'Fév', amount: 315_000, forecast: false, overBudget: false },
  { month: 'Mar', amount: 340_000, forecast: false, overBudget: false },
  { month: 'Avr', amount: 295_000, forecast: false, overBudget: false },
  { month: 'Mai', amount: 360_000, forecast: false, overBudget: true },
  { month: 'Juin', amount: 380_000, forecast: true, overBudget: true },
]
const BUDGET_LINE = 305_000
const MAX_MONTH = Math.max(...MONTHLY_BURN.map(m => m.amount), BUDGET_LINE)

const COST_BREAKDOWN = [
  { label: "Main d'œuvre", amount: 1_432_000, pct: 35, status: 'ok' as const, note: 'dans les clous ✅' },
  { label: 'Matériaux', amount: 1_838_000, pct: 45, status: 'warn' as const, note: '+7% ⚠️' },
  { label: 'Sous-traitance', amount: 612_000, pct: 15, status: 'crit' as const, note: 'critique sur plomberie 🔴' },
  { label: 'Frais généraux', amount: 180_000, pct: 4.4, status: 'ok' as const, note: 'OK ✅' },
]

type TradeRow = {
  name: string
  budget: number
  actual: number
  ecart: number
  pctConsumed: number
  forecast: number
  status: 'ok' | 'warn' | 'crit' | 'todo'
  statusLabel: string
}

const TRADES: TradeRow[] = [
  { name: 'Gros oeuvre',  budget: 1_200_000, actual: 1_152_000, ecart: -48_000,   pctConsumed: 96,  forecast: 1_195_000, status: 'ok',   statusLabel: 'OK' },
  { name: 'Plomberie',    budget:   680_000, actual:   864_600, ecart:  184_600,   pctConsumed: 127, forecast:   920_000, status: 'crit', statusLabel: 'DÉPASSEMENT' },
  { name: 'Électricité',  budget:   420_000, actual:   411_600, ecart:   -8_400,   pctConsumed: 98,  forecast:   418_000, status: 'ok',   statusLabel: 'OK' },
  { name: 'Menuiserie',   budget:   380_000, actual:   399_000, ecart:   19_000,   pctConsumed: 105, forecast:   410_000, status: 'warn', statusLabel: 'ATTENTION' },
  { name: 'Peinture',     budget:   180_000, actual:     7_200, ecart: -172_800,   pctConsumed: 4,   forecast:   182_000, status: 'todo', statusLabel: 'À venir' },
  { name: 'Carrelage',    budget:   210_000, actual:         0, ecart: -210_000,   pctConsumed: 0,   forecast:   215_000, status: 'todo', statusLabel: 'À venir' },
  { name: 'VRD',          budget:   340_000, actual:   329_800, ecart:  -10_200,   pctConsumed: 97,  forecast:   338_000, status: 'ok',   statusLabel: 'OK' },
  { name: 'Autre',        budget:   210_000, actual:    97_950, ecart: -112_050,   pctConsumed: 47,  forecast:   210_000, status: 'ok',   statusLabel: 'OK' },
]

const TRADE_TOTAL_BUDGET   = TRADES.reduce((s, t) => s + t.budget, 0)
const TRADE_TOTAL_ACTUAL   = TRADES.reduce((s, t) => s + t.actual, 0)
const TRADE_TOTAL_ECART    = TRADES.reduce((s, t) => s + t.ecart, 0)
const TRADE_TOTAL_FORECAST = TRADES.reduce((s, t) => s + t.forecast, 0)

// ─── sub-components ───────────────────────────────────────────────────────────

type StatusCfg = { bg: string; text: string; border: string; dot: string }

function tradeStatusCfg(status: TradeRow['status']): StatusCfg {
  switch (status) {
    case 'crit': return { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500' }
    case 'warn': return { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400' }
    case 'ok':   return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' }
    case 'todo': return { bg: 'bg-slate-50',   text: 'text-slate-500',   border: 'border-slate-200',   dot: 'bg-slate-300' }
  }
}

function MiniBar({ pct, status }: { pct: number; status: TradeRow['status'] }) {
  const barColor =
    status === 'crit' ? 'bg-red-500' :
    status === 'warn' ? 'bg-amber-400' :
    status === 'ok'   ? 'bg-blue-500' : 'bg-slate-300'
  const capped = Math.min(pct, 100)
  const overflow = pct > 100
  return (
    <div className="flex items-center gap-2 min-w-[96px]">
      <div className="relative flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${capped}%` }} />
        {overflow && (
          <div className="absolute right-0 top-0 h-full w-1.5 bg-red-500 rounded-r-full animate-pulse" />
        )}
      </div>
      <span className={`text-xs font-semibold w-8 text-right ${status === 'crit' ? 'text-red-600' : 'text-slate-600'}`}>
        {pct}%
      </span>
    </div>
  )
}

// ─── Tab 1: Vue globale ───────────────────────────────────────────────────────

function VueGlobale() {
  const budgetLineWidthPct = (BUDGET_LINE / MAX_MONTH) * 100

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* Monthly burn chart */}
      <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-1">Dépenses mensuelles</h2>
        <p className="text-xs text-slate-400 mb-4">Budget mensuel: {fmt(BUDGET_LINE)}/mois — ligne verticale grise</p>
        <div className="space-y-3">
          {MONTHLY_BURN.map(m => {
            const barPct = (m.amount / MAX_MONTH) * 100
            const barColor = m.forecast
              ? 'bg-amber-300 opacity-80'
              : m.overBudget
                ? 'bg-red-400'
                : 'bg-blue-400'
            return (
              <div key={m.month} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-8 flex-shrink-0 font-medium">{m.month}</span>
                <div className="flex-1 relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full rounded-lg transition-all ${barColor}`}
                    style={{ width: `${barPct}%` }}
                  />
                  {/* Budget line marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-600 z-10"
                    style={{ left: `${budgetLineWidthPct}%` }}
                  />
                  {m.forecast && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1 rounded z-10">
                      Prévision
                    </span>
                  )}
                  {m.overBudget && !m.forecast && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-red-700 z-10">
                      ⚠️
                    </span>
                  )}
                </div>
                <span className={`text-xs font-semibold w-16 text-right ${m.overBudget ? 'text-red-600' : 'text-slate-700'}`}>
                  {fmt(m.amount)}
                </span>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 flex-wrap">
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400 rounded" /> Réel</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-400 rounded" /> Dépassement</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-300 rounded opacity-80" /> Prévision</div>
          <div className="flex items-center gap-1"><div className="w-0.5 h-3 bg-slate-600" /> Budget/mois</div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">Répartition des coûts</h2>
        <div className="space-y-5">
          {COST_BREAKDOWN.map(c => {
            const barColor =
              c.status === 'crit' ? 'bg-red-400' :
              c.status === 'warn' ? 'bg-amber-400' : 'bg-blue-400'
            return (
              <div key={c.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{c.label}</span>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-slate-800">{fmt(c.amount)}</span>
                    <span className="text-xs text-slate-400 ml-1">({c.pct}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(c.pct * 2, 100)}%` }} />
                </div>
                <p className="text-xs text-slate-400">{c.note}</p>
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
          <span className="text-sm font-bold text-slate-700">Total</span>
          <span className="text-sm font-bold text-slate-900">{fmt(COST_BREAKDOWN.reduce((s, c) => s + c.amount, 0))}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: Par corps d'état ──────────────────────────────────────────────────

function ParCorpsEtat() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Corps d'état", 'Budget', 'Réel', 'Écart', '% consommé', 'Prévision finale', 'Statut'].map(h => (
                <th
                  key={h}
                  className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${h === "Corps d'état" ? 'text-left' : h === 'Statut' ? 'text-center' : 'text-right'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TRADES.map(t => {
              const cfg = tradeStatusCfg(t.status)
              const ecartNeg = t.ecart < 0
              return (
                <tr key={t.name} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{t.name}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-600 text-right">{fmt(t.budget)}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-700 font-medium text-right">{t.actual > 0 ? fmt(t.actual) : '—'}</td>
                  <td className={`px-4 py-3.5 text-sm font-semibold text-right ${ecartNeg ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.ecart === 0 ? '—' : fmtSign(t.ecart)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <MiniBar pct={t.pctConsumed} status={t.status} />
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-700 text-right">{fmt(t.forecast)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {t.statusLabel}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-300">
            <tr>
              <td className="px-4 py-4 text-sm font-bold text-slate-900">TOTAL</td>
              <td className="px-4 py-4 text-sm font-bold text-slate-900 text-right">{fmt(TRADE_TOTAL_BUDGET)}</td>
              <td className="px-4 py-4 text-sm font-bold text-slate-900 text-right">{fmt(TRADE_TOTAL_ACTUAL)}</td>
              <td className={`px-4 py-4 text-sm font-bold text-right ${TRADE_TOTAL_ECART < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {fmtSign(TRADE_TOTAL_ECART)}
              </td>
              <td className="px-4 py-4 text-sm font-bold text-slate-700 text-right">
                {Math.round((TRADE_TOTAL_ACTUAL / TRADE_TOTAL_BUDGET) * 100)}%
              </td>
              <td className="px-4 py-4 text-sm font-bold text-slate-900 text-right">{fmt(TRADE_TOTAL_FORECAST)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="m-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          <strong>⚠️ La plomberie représente 100% du dépassement.</strong> Action requise immédiatement.
        </p>
      </div>
    </div>
  )
}

// ─── Tab 3: Simulation de marge ───────────────────────────────────────────────

function SimulationMarge() {
  const [targetMargin, setTargetMargin] = useState(22)
  const [plombRecup, setPlombRecup] = useState(0)
  const [moOptim, setMoOptim] = useState(0)

  const REVENUE = 4_918_000 / (1 - 0.184)
  const CURRENT_COST = 4_918_000
  const savings = (plombRecup + moOptim) * 1_000
  const newCost = CURRENT_COST - savings
  const newMargin = ((REVENUE - newCost) / REVENUE) * 100
  const targetCost = REVENUE * (1 - targetMargin / 100)
  const gapToTarget = CURRENT_COST - targetCost

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Interactive simulation */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-1">Simulation de marge</h2>
        <p className="text-xs text-slate-400 mb-5">Ajustez les paramètres pour voir l&apos;impact sur la marge</p>

        {/* Target margin slider */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-slate-700">Marge objectif</label>
            <span className="text-sm font-bold text-blue-600">{targetMargin}%</span>
          </div>
          <input
            type="range" min={5} max={40} step={0.5} value={targetMargin}
            onChange={e => setTargetMargin(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-0.5">
            <span>5%</span><span>40%</span>
          </div>
        </div>

        {/* Scenario sliders */}
        <div className="space-y-4 mb-5">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-slate-600">Récupération plomberie</label>
              <span className="text-sm font-semibold text-slate-800">{plombRecup} K€</span>
            </div>
            <input
              type="range" min={0} max={100} step={5} value={plombRecup}
              onChange={e => setPlombRecup(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>0 K€</span><span>100 K€</span></div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm text-slate-600">Optimisation main d&apos;œuvre</label>
              <span className="text-sm font-semibold text-slate-800">{moOptim} K€</span>
            </div>
            <input
              type="range" min={0} max={50} step={5} value={moOptim}
              onChange={e => setMoOptim(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>0 K€</span><span>50 K€</span></div>
          </div>
        </div>

        {/* Live result */}
        <div className={`rounded-xl border p-4 ${newMargin >= targetMargin ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Marge avec ces actions</span>
            <span className={`text-2xl font-bold ${newMargin >= targetMargin ? 'text-emerald-600' : 'text-amber-600'}`}>
              {newMargin.toFixed(1)}%
            </span>
          </div>
          <p className={`text-xs mt-1 ${newMargin >= targetMargin ? 'text-emerald-600' : 'text-amber-600'}`}>
            {newMargin >= targetMargin
              ? `✅ Objectif ${targetMargin}% atteint — économie: ${fmt(savings)}`
              : `⚠️ Encore ${(targetMargin - newMargin).toFixed(1)} pts à récupérer — manque: ${fmt(Math.max(0, gapToTarget - savings))}`
            }
          </p>
        </div>

        {/* Current state info */}
        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs text-red-700">
            <strong>Marge actuelle 18.4%:</strong> Vous perdez <strong>174 300 €</strong> vs votre objectif initial de 22%.
          </p>
        </div>
      </div>

      {/* Right column: metrics + AI insights */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-3">Indicateurs clés</h2>
          <div className="space-y-0">
            {[
              { label: 'Marge actuelle',    value: '18.4%',          color: 'text-amber-600' },
              { label: 'Marge cible',       value: '22.0%',          color: 'text-blue-600' },
              { label: 'Prévision tendance',value: '15.8%',          color: 'text-red-600' },
              { label: 'Coût final prévu',  value: '4 918 000 €',    color: 'text-red-600' },
              { label: 'Dépassement budget',value: '+68 000 €',       color: 'text-red-600' },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">{r.label}</span>
                <span className={`text-sm font-bold ${r.color}`}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-semibold text-violet-700">Apprentissage IA</span>
          </div>
          <p className="text-sm text-violet-800 leading-relaxed">
            📊 Sur vos <strong>3 projets similaires</strong>, la plomberie a été dépassée en moyenne de{' '}
            <strong>19%</strong>. Pour le prochain devis, prévoir un <strong>buffer de 15%</strong> sur ce corps d&apos;état.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 bg-violet-200 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full" style={{ width: '19%' }} />
            </div>
            <span className="text-xs text-violet-600 font-medium whitespace-nowrap">Dépassement historique moyen: 19%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Alert pills data ─────────────────────────────────────────────────────────

const ALERTS = [
  {
    emoji: '🔴',
    text: 'Plomberie +27% vs budget — Exposition: 183 600 €',
    bg: 'bg-red-50',
    border: 'border-red-200',
    textColor: 'text-red-700',
  },
  {
    emoji: '🟡',
    text: 'Marge en érosion: 22% → 18.4% → prévision 15.8%',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    textColor: 'text-amber-700',
  },
  {
    emoji: '🟢',
    text: 'Électricité 4% sous budget — Bonne performance',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    textColor: 'text-emerald-700',
  },
  {
    emoji: '🔵',
    text: 'Trésorerie: 3 semaines de couverture',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    textColor: 'text-blue-700',
  },
]

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'globale' | 'corps' | 'simulation'

export default function FinancialsPage() {
  const { currentProject } = useProject()
  const [tab, setTab] = useState<Tab>('globale')

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Intelligence Financière</h1>
        <p className="text-slate-500 mt-1">
          {currentProject.name} · Rentabilité en temps réel
        </p>
      </div>

      {/* Intelligence Alerts horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {ALERTS.map(a => (
          <div
            key={a.text}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${a.bg} ${a.border} ${a.textColor}`}
          >
            <span>{a.emoji}</span>
            <span className="whitespace-nowrap">{a.text}</span>
          </div>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1 — Budget total */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget total</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">4 850 000 €</div>
          <div className="text-xs text-slate-500 mt-0.5">Coût réel: 4 062 150 €</div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Consommé</span><span>84%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '84%' }} />
            </div>
          </div>
        </div>

        {/* KPI 2 — Marge actuelle */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Marge actuelle</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">18.4%</div>
          <div className="text-xs text-amber-600 mt-0.5">
            Cible 22% · Prévision <span className="font-semibold text-red-600">15.8%</span>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-amber-700">
            <TrendingDown className="w-3 h-3" />
            <span>Tendance à la baisse</span>
          </div>
        </div>

        {/* KPI 3 — Coût final prévu */}
        <div className="bg-red-50 rounded-xl border border-red-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">Coût final prévu</span>
            <TrendingUp className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-700">4 918 000 €</div>
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              DÉPASSEMENT +68 000 €
            </span>
          </div>
          <div className="text-xs text-red-400 mt-1.5">vs budget 4 850 000 €</div>
        </div>

        {/* KPI 4 — Trésorerie */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Trésorerie</span>
            <Droplets className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">3.2 semaines</div>
          <div className="mt-1.5">
            <span className="inline-flex items-center gap-1 bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              ⚠️ Attention
            </span>
          </div>
          <div className="text-xs text-amber-500 mt-1.5">Couverture de trésorerie restante</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([
          ['globale',    'Vue globale'],
          ['corps',      "Par corps d'état"],
          ['simulation', 'Simulation de marge'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'globale'    && <VueGlobale />}
      {tab === 'corps'      && <ParCorpsEtat />}
      {tab === 'simulation' && <SimulationMarge />}
    </div>
  )
}

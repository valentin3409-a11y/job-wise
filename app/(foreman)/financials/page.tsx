'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react'

const TRADES = [
  { name: 'Gros oeuvre',    budget: 1_800_000, spent: 830_000,  forecast: 1_760_000 },
  { name: 'Plomberie',      budget: 380_000,  spent: 198_000,  forecast: 395_000 },
  { name: 'Électricité',    budget: 420_000,  spent: 180_000,  forecast: 408_000 },
  { name: 'Menuiserie',     budget: 290_000,  spent: 87_000,   forecast: 285_000 },
  { name: 'Peinture',       budget: 180_000,  spent: 14_000,   forecast: 175_000 },
  { name: 'Carrelage',      budget: 160_000,  spent: 0,        forecast: 162_000 },
  { name: 'Façade',         budget: 380_000,  spent: 42_000,   forecast: 372_000 },
  { name: 'Autres / GG',    budget: 240_000,  spent: 829_000,  forecast: 863_000 },
]

const MONTHLY = [
  { month: 'Jan', labour: 95_000, material: 85_000 },
  { month: 'Fév', labour: 118_000, material: 102_000 },
  { month: 'Mar', labour: 165_000, material: 145_000 },
  { month: 'Avr', labour: 148_000, material: 137_000 },
]

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K€`
  return `${n} €`
}

function pct(spent: number, budget: number) {
  return Math.round((spent / budget) * 100)
}

export default function Financials() {
  const [tab, setTab] = useState<'overview' | 'trades' | 'simulation'>('overview')

  const totalBudget = TRADES.reduce((s, t) => s + t.budget, 0)
  const totalSpent  = TRADES.reduce((s, t) => s + t.spent, 0)
  const totalForecast = TRADES.reduce((s, t) => s + t.forecast, 0)
  const variance = totalBudget - totalForecast
  const margin = 22
  const revenueTarget = totalBudget / (1 - margin / 100)
  const marginReal = ((revenueTarget - totalForecast) / revenueTarget) * 100

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Financials</h1>
        <p className="text-slate-500 mt-1">Suivi budget, coûts et marges — Tour Belvédère</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Budget total', value: fmt(totalBudget), sub: '100% du projet', icon: DollarSign, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: 'Coût à date', value: fmt(totalSpent), sub: `${pct(totalSpent, totalBudget)}% du budget`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Forecast final', value: fmt(totalForecast), sub: variance >= 0 ? `Économie: ${fmt(variance)}` : `Dépassement: ${fmt(-variance)}`, icon: variance >= 0 ? TrendingDown : TrendingUp, color: variance >= 0 ? 'text-emerald-600' : 'text-red-500', bg: variance >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
          { label: 'Marge réelle', value: `${marginReal.toFixed(1)}%`, sub: `Cible: ${margin}%`, icon: marginReal >= margin ? TrendingUp : TrendingDown, color: marginReal >= margin ? 'text-emerald-600' : 'text-amber-600', bg: marginReal >= margin ? 'bg-emerald-50' : 'bg-amber-50' },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{k.label}</span>
                <div className={`w-8 h-8 ${k.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${k.color}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs text-slate-500 mt-1">{k.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit">
        {(['overview', 'trades', 'simulation'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'overview' ? 'Vue globale' : t === 'trades' ? 'Par corps d\'état' : 'Simulation marge'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Labour vs Materials */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Répartition coûts</h2>
            <div className="space-y-3">
              {[
                { label: 'Main d\'œuvre', pct: 63, amount: 1_373_400, color: '#3b82f6' },
                { label: 'Matériaux', pct: 30, amount: 654_000, color: '#f59e0b' },
                { label: 'Sous-traitants', pct: 5, amount: 109_000, color: '#10b981' },
                { label: 'Équipements', pct: 2, amount: 43_600, color: '#8b5cf6' },
              ].map(r => (
                <div key={r.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{r.label}</span>
                    <span className="font-medium text-slate-700">{r.pct}% · {fmt(r.amount)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly burn */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Dépenses mensuelles</h2>
            <div className="space-y-3">
              {MONTHLY.map(m => {
                const total = m.labour + m.material
                const maxTotal = Math.max(...MONTHLY.map(x => x.labour + x.material))
                return (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 w-8 flex-shrink-0">{m.month}</span>
                    <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden flex">
                      <div className="h-full bg-blue-400 flex items-center justify-end pr-1" style={{ width: `${(m.labour / maxTotal) * 100}%` }}>
                        {m.labour > 80_000 && <span className="text-xs text-white font-medium">{fmt(m.labour)}</span>}
                      </div>
                      <div className="h-full bg-amber-400 flex items-center justify-end pr-1" style={{ width: `${(m.material / maxTotal) * 100}%` }}>
                        {m.material > 80_000 && <span className="text-xs text-white font-medium">{fmt(m.material)}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 w-24 text-right">{fmt(total)}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 mt-3 text-xs text-slate-500">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400 rounded" /> Main d&apos;œuvre</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-400 rounded" /> Matériaux</div>
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              <strong>Burn rate actuel :</strong> {fmt(310_000)}/mois · Budget restant {fmt(totalBudget - totalSpent)} pour {8} mois restants
            </div>
          </div>
        </div>
      )}

      {tab === 'trades' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Corps d&apos;état</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Budget</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dépensé</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Forecast</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Écart</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Avancement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TRADES.map(t => {
                const ecart = t.budget - t.forecast
                const p = pct(t.spent, t.budget)
                return (
                  <tr key={t.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-slate-800">{t.name}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 text-right">{fmt(t.budget)}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 text-right">{fmt(t.spent)}</td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-700 text-right">{fmt(t.forecast)}</td>
                    <td className={`px-5 py-4 text-sm font-semibold text-right ${ecart >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {ecart >= 0 ? '+' : ''}{fmt(ecart)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${p > 60 ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: `${Math.min(p, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">{p}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td className="px-5 py-4 text-sm font-bold text-slate-800">TOTAL</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-800 text-right">{fmt(totalBudget)}</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-800 text-right">{fmt(totalSpent)}</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-800 text-right">{fmt(totalForecast)}</td>
                <td className={`px-5 py-4 text-sm font-bold text-right ${variance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {variance >= 0 ? '+' : ''}{fmt(variance)}
                </td>
                <td className="px-5 py-4 text-sm font-bold text-slate-700">{pct(totalSpent, totalBudget)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {tab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Simulation de marge</h2>
            <div className="space-y-4">
              {[
                { label: 'Prix de vente (HT)', value: '5 824 K€', color: 'text-slate-800' },
                { label: 'Coût forecast', value: fmt(totalForecast), color: 'text-red-500' },
                { label: 'Marge brute', value: fmt(5_824_000 - totalForecast), color: 'text-emerald-600' },
                { label: 'Taux de marge', value: `${(((5_824_000 - totalForecast) / 5_824_000) * 100).toFixed(1)}%`, color: 'text-emerald-600' },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm text-slate-600">{r.label}</span>
                  <span className={`font-semibold ${r.color}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="text-sm font-semibold text-emerald-700">Marge cible atteinte ✓</div>
              <div className="text-xs text-emerald-600 mt-0.5">Si le forecast est respecté, la marge dépasse l&apos;objectif de 22%</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Scénarios</h2>
            <div className="space-y-3">
              {[
                { label: 'Optimiste (-5% coûts)', margin: 26.4, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { label: 'Réaliste (forecast actuel)', margin: 20.7, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                { label: 'Pessimiste (+10% coûts)', margin: 13.1, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
                { label: 'Critique (+20% coûts)', margin: 4.2, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
              ].map(s => (
                <div key={s.label} className={`flex justify-between items-center p-3 rounded-lg border ${s.bg} ${s.border}`}>
                  <span className="text-sm text-slate-700">{s.label}</span>
                  <span className={`font-bold ${s.color}`}>{s.margin}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

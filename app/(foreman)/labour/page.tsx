'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Users, AlertTriangle } from 'lucide-react'

type Worker = {
  name: string
  role: string
  hoursWeek: number
  hourlyRate: number
  outputActual: number
  outputTarget: number
  unit: string
  phase: string
}

const TEAM: Worker[] = [
  { name: 'Pierre M.', role: 'Chef de chantier', hoursWeek: 44, hourlyRate: 85, outputActual: 0, outputTarget: 0, unit: '-', phase: 'Direction' },
  { name: 'Équipe GO (8p)', role: 'Gros oeuvre', hoursWeek: 40, hourlyRate: 48, outputActual: 2.4, outputTarget: 2.8, unit: 'm²/h', phase: 'Gros oeuvre' },
  { name: 'Équipe PLB (4p)', role: 'Plomberie', hoursWeek: 36, hourlyRate: 58, outputActual: 1.9, outputTarget: 1.6, unit: 'postes/j', phase: 'Plomberie' },
  { name: 'Équipe ÉLEC (3p)', role: 'Électricité', hoursWeek: 40, hourlyRate: 54, outputActual: 42, outputTarget: 40, unit: 'm lin/j', phase: 'Électricité' },
  { name: 'Équipe FIN (2p)', role: 'Finitions', hoursWeek: 30, hourlyRate: 42, outputActual: 0, outputTarget: 0, unit: '-', phase: 'Finitions' },
  { name: 'Sous-trait. FA', role: 'Façade', hoursWeek: 32, hourlyRate: 65, outputActual: 15, outputTarget: 20, unit: 'm²/j', phase: 'Façade' },
]

const WEEKLY_DATA = [
  { week: 'S13', budget: 128_000, actual: 142_000 },
  { week: 'S14', budget: 128_000, actual: 139_000 },
  { week: 'S15', budget: 128_000, actual: 145_000 },
  { week: 'S16 (actuelle)', budget: 128_000, actual: 148_000 },
]

function fmt(n: number) {
  return n >= 1_000 ? `${(n / 1_000).toFixed(0)} K€` : `${n} €`
}

export default function Labour() {
  const [view, setView] = useState<'team' | 'weekly' | 'productivity'>('team')

  const totalHours = TEAM.reduce((s, w) => s + w.hoursWeek, 0)
  const totalCostWeek = TEAM.reduce((s, w) => s + w.hoursWeek * w.hourlyRate, 0)
  const budgetWeek = 128_000
  const overage = totalCostWeek - budgetWeek
  const overagePct = (overage / budgetWeek) * 100

  const belowTarget = TEAM.filter(w => w.outputActual < w.outputTarget && w.outputTarget > 0)
  const aboveTarget = TEAM.filter(w => w.outputActual > w.outputTarget && w.outputTarget > 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Labour & Productivity</h1>
        <p className="text-slate-500 mt-1">Suivi des heures, coûts et performances — semaine 16</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total heures/sem</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800">{totalHours}h</div>
          <div className="text-xs text-slate-500 mt-1">{TEAM.length} corps / équipes</div>
        </div>

        <div className={`border rounded-xl p-5 shadow-sm ${overage > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Coût MO/sem</span>
            {overage > 0 ? <TrendingUp className="w-4 h-4 text-red-500" /> : <TrendingDown className="w-4 h-4 text-emerald-500" />}
          </div>
          <div className={`text-2xl font-bold ${overage > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(totalCostWeek)}</div>
          <div className={`text-xs mt-1 font-medium ${overage > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {overage > 0 ? '+' : ''}{fmt(overage)} vs budget ({overagePct.toFixed(1)}%)
          </div>
        </div>

        <div className={`border rounded-xl p-5 shadow-sm ${belowTarget.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sous objectif</span>
            <AlertTriangle className={`w-4 h-4 ${belowTarget.length > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
          </div>
          <div className={`text-2xl font-bold ${belowTarget.length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>{belowTarget.length}</div>
          <div className="text-xs text-slate-500 mt-1">corps d&apos;état sous cible prod.</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Au-dessus objectif</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{aboveTarget.length}</div>
          <div className="text-xs text-slate-500 mt-1">corps d&apos;état performants</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-5 w-fit">
        {(['team', 'weekly', 'productivity'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {v === 'team' ? 'Équipes' : v === 'weekly' ? 'Dépenses hebdo' : 'Productivité'}
          </button>
        ))}
      </div>

      {view === 'team' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Équipe / Corps</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">H/sem</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">€/h</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Coût/sem</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {TEAM.map((w, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-slate-800">{w.name}</div>
                    <div className="text-xs text-slate-500">{w.role}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600 text-right">{w.hoursWeek}h</td>
                  <td className="px-5 py-4 text-sm text-slate-600 text-right">{w.hourlyRate} €</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800 text-right">{fmt(w.hoursWeek * w.hourlyRate)}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                      {w.phase}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td className="px-5 py-4 text-sm font-bold text-slate-800">TOTAL</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-800 text-right">{totalHours}h</td>
                <td className="px-5 py-4" />
                <td className={`px-5 py-4 text-sm font-bold text-right ${overage > 0 ? 'text-red-500' : 'text-emerald-600'}`}>{fmt(totalCostWeek)}</td>
                <td className="px-5 py-4" />
              </tr>
              <tr>
                <td colSpan={3} className="px-5 py-2 text-xs text-slate-500">Budget hebdomadaire: {fmt(budgetWeek)}</td>
                <td className={`px-5 py-2 text-xs font-semibold text-right ${overage > 0 ? 'text-red-500' : 'text-emerald-600'}`} colSpan={2}>
                  Écart: {overage > 0 ? '+' : ''}{fmt(overage)} ({overagePct.toFixed(1)}%)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {view === 'weekly' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Budget MO vs Réel (4 dernières semaines)</h2>
          <div className="space-y-4">
            {WEEKLY_DATA.map((w, i) => {
              const diff = w.actual - w.budget
              const pct = (diff / w.budget) * 100
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600 font-medium">{w.week}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">Budget: {fmt(w.budget)}</span>
                      <span className={`font-semibold ${diff > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        Réel: {fmt(w.actual)} ({diff > 0 ? '+' : ''}{pct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-5 bg-slate-100 rounded-full overflow-hidden relative">
                    <div className="h-full bg-blue-200 rounded-full" style={{ width: '100%' }} />
                    <div
                      className={`absolute inset-0 rounded-full ${diff > 0 ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${(w.actual / (w.budget * 1.3)) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <div className="h-3 border-l-2 border-blue-500 absolute" style={{ left: `${(w.budget / (w.budget * 1.3)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
            <strong className="text-red-700">Tendance :</strong>
            <span className="text-red-600"> +{overagePct.toFixed(0)}% constant depuis 4 semaines. Action nécessaire sur composition équipe gros oeuvre.</span>
          </div>
        </div>
      )}

      {view === 'productivity' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Productivité réelle vs cible</h2>
          <div className="space-y-4">
            {TEAM.filter(w => w.outputTarget > 0).map((w, i) => {
              const ratio = (w.outputActual / w.outputTarget) * 100
              const isGood = ratio >= 100
              return (
                <div key={i} className={`p-4 rounded-xl border ${isGood ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-slate-800 text-sm">{w.role}</div>
                      <div className="text-xs text-slate-500">{w.name}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${isGood ? 'text-emerald-600' : 'text-amber-600'}`}>{ratio.toFixed(0)}%</div>
                      <div className="text-xs text-slate-500">de l&apos;objectif</div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-600">
                    <span>Réel: <strong>{w.outputActual} {w.unit}</strong></span>
                    <span>Cible: <strong>{w.outputTarget} {w.unit}</strong></span>
                    <span className={`font-semibold ${isGood ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isGood ? `+${(w.outputActual - w.outputTarget).toFixed(1)}` : (w.outputActual - w.outputTarget).toFixed(1)} {w.unit}
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isGood ? 'bg-emerald-500' : 'bg-amber-400'}`}
                      style={{ width: `${Math.min(ratio, 130)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

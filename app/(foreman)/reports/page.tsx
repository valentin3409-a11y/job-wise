'use client'

import { useState } from 'react'
import { Download, FileText, TrendingUp, BarChart3, Calendar } from 'lucide-react'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K€`
  return `${n} €`
}

const REPORT_TYPES = [
  { id: 'progress', icon: BarChart3, label: 'Rapport d\'avancement', desc: 'Avancement physique par zone et phase' },
  { id: 'financial', icon: TrendingUp, label: 'Rapport financier', desc: 'Budget, coûts, forecast et marges' },
  { id: 'forecast', icon: Calendar, label: 'Prévision de fin', desc: 'Forecast coût et délai à terminaison' },
  { id: 'performance', icon: FileText, label: 'Rapport performance', desc: 'KPIs, productivité, équipes' },
]

export default function Reports() {
  const [activeReport, setActiveReport] = useState('progress')
  const [period, setPeriod] = useState('Avril 2026')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 mt-1">Rapports projet pour client et direction</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Exporter PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {REPORT_TYPES.map(r => {
          const Icon = r.icon
          return (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className={`p-4 rounded-xl border text-left transition-all shadow-sm ${activeReport === r.id ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400' : 'bg-white border-slate-200 hover:border-amber-300'}`}
            >
              <Icon className={`w-5 h-5 mb-2 ${activeReport === r.id ? 'text-amber-500' : 'text-slate-400'}`} />
              <div className={`text-sm font-semibold ${activeReport === r.id ? 'text-amber-700' : 'text-slate-700'}`}>{r.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
            </button>
          )
        })}
      </div>

      {/* Report content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Report header */}
        <div className="bg-slate-900 text-white px-8 py-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">FOREMAN — Rapport Officiel</div>
              <h2 className="text-2xl font-bold">
                {REPORT_TYPES.find(r => r.id === activeReport)?.label}
              </h2>
              <div className="text-slate-400 text-sm mt-1">Tour Belvédère · Paris 15e · {period}</div>
            </div>
            <div className="text-right text-sm text-slate-400">
              <div>Généré le 22 avril 2026</div>
              <div>Par : Valentin</div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {activeReport === 'progress' && (
            <div className="space-y-8">
              {/* Summary */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">1. Résumé exécutif</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Avancement global', value: '42%', status: 'En cours', color: 'text-blue-600' },
                    { label: 'Phases terminées', value: '2/6', status: 'Fondations + Installation', color: 'text-emerald-600' },
                    { label: 'Délai restant', value: '252 j.', status: '30 déc. 2026', color: 'text-slate-700' },
                    { label: 'Retards actifs', value: '1', status: 'Plomberie', color: 'text-red-500' },
                  ].map(k => (
                    <div key={k.label} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="text-xs text-slate-500 mb-1">{k.label}</div>
                      <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{k.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress by phase */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">2. Avancement par phase</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Installation & Fondations', pct: 100, status: 'Terminé', color: '#10b981' },
                    { name: 'Gros oeuvre R1-R4', pct: 78, status: 'En cours', color: '#3b82f6' },
                    { name: 'Plomberie & Élec R1-R4', pct: 35, status: 'Retard 18j', color: '#ef4444' },
                    { name: 'Gros oeuvre R5-R8', pct: 8, status: 'Démarré', color: '#3b82f6' },
                    { name: 'Finitions', pct: 0, status: 'À venir', color: '#e2e8f0' },
                    { name: 'Livraison', pct: 0, status: 'À venir', color: '#e2e8f0' },
                  ].map(p => (
                    <div key={p.name} className="flex items-center gap-4">
                      <span className="text-sm text-slate-600 w-56 flex-shrink-0">{p.name}</span>
                      <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: p.color }} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 w-12 text-right">{p.pct}%</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full w-28 text-center font-medium ${
                        p.status === 'Terminé' ? 'bg-emerald-100 text-emerald-700' :
                        p.status.includes('Retard') ? 'bg-red-100 text-red-600' :
                        p.status === 'En cours' || p.status === 'Démarré' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key events */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">3. Faits marquants du mois</h3>
                <div className="space-y-2 text-sm text-slate-700">
                  {[
                    { ok: true,  text: 'Coulée dalle niveau 4 réalisée avec succès le 21 avril.' },
                    { ok: true,  text: 'Fondations complètement réceptionnées et certifiées par bureau de contrôle.' },
                    { ok: false, text: 'Retard plomberie confirmé : effectifs insuffisants, impact +18 jours.' },
                    { ok: false, text: 'Non-conformité ferraillage cage escalier R3 détectée, travaux suspendus.' },
                    { ok: false, text: 'Surcoût MO gros oeuvre persistant : +12% depuis 4 semaines.' },
                    { ok: true,  text: 'Électricité R1-R2 : progression au-dessus de l\'objectif (+5%).' },
                  ].map((e, i) => (
                    <div key={i} className={`flex items-start gap-2 p-3 rounded-lg ${e.ok ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                      <span className={e.ok ? 'text-emerald-500' : 'text-red-500'}>{ e.ok ? '✓' : '✗'}</span>
                      <span>{e.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeReport === 'financial' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">1. Synthèse financière</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Budget total', value: '4 850 K€', color: 'text-slate-700' },
                    { label: 'Coût à date', value: '2 180 K€', color: 'text-blue-600' },
                    { label: 'Forecast final', value: '4 620 K€', color: 'text-emerald-600' },
                    { label: 'Marge actuelle', value: '18.4%', color: 'text-amber-600' },
                  ].map(k => (
                    <div key={k.label} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="text-xs text-slate-500 mb-1">{k.label}</div>
                      <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">2. Répartition par corps d&apos;état</h3>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Corps d\'état', 'Budget', 'Dépensé', 'Forecast', 'Écart'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { name: 'Gros oeuvre', budget: 1_800_000, spent: 830_000, forecast: 1_760_000 },
                      { name: 'Plomberie', budget: 380_000, spent: 198_000, forecast: 395_000 },
                      { name: 'Électricité', budget: 420_000, spent: 180_000, forecast: 408_000 },
                      { name: 'Menuiserie', budget: 290_000, spent: 87_000, forecast: 285_000 },
                    ].map(r => (
                      <tr key={r.name}>
                        <td className="px-3 py-2.5 font-medium text-slate-800">{r.name}</td>
                        <td className="px-3 py-2.5 text-slate-600">{fmt(r.budget)}</td>
                        <td className="px-3 py-2.5 text-slate-600">{fmt(r.spent)}</td>
                        <td className="px-3 py-2.5 font-medium">{fmt(r.forecast)}</td>
                        <td className={`px-3 py-2.5 font-semibold ${r.budget - r.forecast >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {r.budget - r.forecast >= 0 ? '+' : ''}{fmt(r.budget - r.forecast)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(activeReport === 'forecast' || activeReport === 'performance') && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                  {activeReport === 'forecast' ? 'Prévision de fin de projet' : 'Indicateurs de performance'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {(activeReport === 'forecast' ? [
                    { label: 'Date fin prévue', value: '14 jan. 2027', note: '+15 jours vs planning initial', bad: true },
                    { label: 'Coût final estimé', value: '4 620 K€', note: '230 K€ sous budget', bad: false },
                    { label: 'Marge prévue', value: '20.7%', note: 'Si forecast respecté', bad: false },
                    { label: 'Budget restant', value: '2 670 K€', note: 'Pour 58% de travaux restants', bad: false },
                  ] : [
                    { label: 'Productivité GO', value: '86%', note: 'de l\'objectif (2.4 vs 2.8 m²/h)', bad: true },
                    { label: 'Productivité PLB', value: '119%', note: 'Au-dessus de l\'objectif', bad: false },
                    { label: 'Coût MO/m²', value: '312 €', note: 'Cible 280 €/m² (+11%)', bad: true },
                    { label: 'Taux incidents', value: '2/mois', note: 'Cible < 1/mois', bad: true },
                  ]).map(k => (
                    <div key={k.label} className={`p-4 rounded-xl border ${k.bad ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <div className="text-xs text-slate-500 mb-1">{k.label}</div>
                      <div className={`text-2xl font-bold ${k.bad ? 'text-amber-700' : 'text-emerald-700'}`}>{k.value}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{k.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

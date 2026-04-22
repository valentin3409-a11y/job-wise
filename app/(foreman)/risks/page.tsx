'use client'

import { useState } from 'react'
import { AlertTriangle, Plus, Brain, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react'

type Risk = {
  id: number
  title: string
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  probability: number
  costImpact: number
  delayImpact: number
  status: 'open' | 'mitigated' | 'closed'
  owner: string
  recommendation: string
  date: string
}

const RISKS: Risk[] = [
  {
    id: 1,
    title: 'Sous-traitant plomberie — effectifs insuffisants',
    category: 'Sous-traitance',
    priority: 'critical',
    probability: 90,
    costImpact: 48_000,
    delayImpact: 18,
    status: 'open',
    owner: 'Valentin',
    recommendation: 'Contacter 2 sous-traitants alternatifs sous 48h. Si non résolu, envisager embauche directe d\'urgence.',
    date: '2026-04-20',
  },
  {
    id: 2,
    title: 'Retard livraison acier niveau 5-8',
    category: 'Approvisionnement',
    priority: 'high',
    probability: 70,
    costImpact: 22_000,
    delayImpact: 12,
    status: 'open',
    owner: 'Marc D.',
    recommendation: 'Pré-commander l\'acier pour les niveaux 5-8 immédiatement. Identifier fournisseur de substitution en région parisienne.',
    date: '2026-04-18',
  },
  {
    id: 3,
    title: 'Surcoût main d\'œuvre gros oeuvre (+12%)',
    category: 'Labour',
    priority: 'high',
    probability: 85,
    costImpact: 35_000,
    delayImpact: 0,
    status: 'open',
    owner: 'Valentin',
    recommendation: 'Revoir la composition des équipes. Remplacer 3 postes par des compagnons moins expérimentés pour les tâches standardisées.',
    date: '2026-04-15',
  },
  {
    id: 4,
    title: 'Conditions météo défavorables semaines 18-19',
    category: 'Environnement',
    priority: 'medium',
    probability: 60,
    costImpact: 8_500,
    delayImpact: 5,
    status: 'open',
    owner: 'Chef chantier',
    recommendation: 'Avancer les travaux extérieurs la semaine prochaine. Prévoir bâches de protection et planning de repli.',
    date: '2026-04-22',
  },
  {
    id: 5,
    title: 'Coordination défaillante niveaux 3-5',
    category: 'Organisation',
    priority: 'medium',
    probability: 45,
    costImpact: 12_000,
    delayImpact: 7,
    status: 'open',
    owner: 'Sophie L.',
    recommendation: 'Point quotidien inter-corps obligatoire. Nommer un coordinateur dédié pour les niveaux 3-5.',
    date: '2026-04-16',
  },
  {
    id: 6,
    title: 'Non-conformité potentielle cage escalier R3',
    category: 'Qualité',
    priority: 'high',
    probability: 40,
    costImpact: 18_000,
    delayImpact: 8,
    status: 'open',
    owner: 'Bureau de contrôle',
    recommendation: 'Inspection immédiate avec bureau de contrôle. Suspendre les travaux sur ce secteur jusqu\'à validation.',
    date: '2026-04-21',
  },
  {
    id: 7,
    title: 'Dépassement budget fondations',
    category: 'Budget',
    priority: 'low',
    probability: 100,
    costImpact: 14_000,
    delayImpact: 0,
    status: 'mitigated',
    owner: 'Valentin',
    recommendation: 'Absorbé par provision sur gros oeuvre. Surveillance renforcée des corps suivants.',
    date: '2026-03-10',
  },
]

const PRIORITY_CONFIG = {
  critical: { label: 'Critique', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' },
  high: { label: 'Élevé', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  medium: { label: 'Moyen', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400' },
  low: { label: 'Faible', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400' },
}

function fmt(n: number) {
  return n >= 1_000 ? `${(n / 1_000).toFixed(0)} K€` : `${n} €`
}

export default function Risks() {
  const [expanded, setExpanded] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'mitigated'>('open')

  const filtered = RISKS.filter(r => filter === 'all' || r.status === filter)
  const totalCostImpact = RISKS.filter(r => r.status === 'open').reduce((s, r) => s + r.costImpact, 0)
  const totalDelayImpact = Math.max(...RISKS.filter(r => r.status === 'open').map(r => r.delayImpact))
  const criticalCount = RISKS.filter(r => r.priority === 'critical' && r.status === 'open').length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Risks & Issues</h1>
          <p className="text-slate-500 mt-1">Suivi des risques et problèmes ouverts</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Nouveau risque
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="text-xs font-medium text-red-500 uppercase tracking-wider">Critique</div>
          <div className="text-3xl font-bold text-red-600 mt-1">{criticalCount}</div>
          <div className="text-xs text-red-400 mt-1">Action immédiate requise</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="text-xs font-medium text-orange-500 uppercase tracking-wider">Risques ouverts</div>
          <div className="text-3xl font-bold text-orange-600 mt-1">{RISKS.filter(r => r.status === 'open').length}</div>
          <div className="text-xs text-orange-400 mt-1">À traiter</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">Impact budget total</div>
          <div className="text-3xl font-bold text-amber-700 mt-1">{fmt(totalCostImpact)}</div>
          <div className="text-xs text-amber-500 mt-1">Si tous non traités</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="text-xs font-medium text-blue-500 uppercase tracking-wider">Délai max cumulé</div>
          <div className="text-3xl font-bold text-blue-600 mt-1">{totalDelayImpact} j.</div>
          <div className="text-xs text-blue-400 mt-1">Impact potentiel</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-5 w-fit">
        {(['open', 'mitigated', 'all'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {f === 'open' ? `Ouverts (${RISKS.filter(r => r.status === 'open').length})` : f === 'mitigated' ? 'Atténués' : 'Tous'}
          </button>
        ))}
      </div>

      {/* Risk list */}
      <div className="space-y-3">
        {filtered.map(risk => {
          const cfg = PRIORITY_CONFIG[risk.priority]
          const isExpanded = expanded === risk.id

          return (
            <div
              key={risk.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${cfg.border}`}
            >
              <button
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : risk.id)}
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{risk.title}</span>
                    {risk.status === 'mitigated' && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Atténué</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                    <span className={`font-medium ${cfg.color}`}>{cfg.label}</span>
                    <span>·</span>
                    <span>{risk.category}</span>
                    <span>·</span>
                    <span>Propriétaire: {risk.owner}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xs text-slate-400">Impact coût</div>
                    <div className="text-sm font-bold text-red-500">{fmt(risk.costImpact)}</div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs text-slate-400">Délai</div>
                    <div className="text-sm font-bold text-blue-500">{risk.delayImpact > 0 ? `${risk.delayImpact}j` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Prob.</div>
                    <div className="text-sm font-bold text-slate-700">{risk.probability}%</div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className={`border-t ${cfg.border} ${cfg.bg} p-4`}>
                  <div className="flex items-start gap-2 mb-3">
                    <Brain className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-1">Recommandation IA</div>
                      <p className="text-sm text-slate-700 leading-relaxed">{risk.recommendation}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-500">Impact budget</div>
                      <div className="font-bold text-red-500">{fmt(risk.costImpact)}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-500">Impact délai</div>
                      <div className="font-bold text-blue-500">{risk.delayImpact > 0 ? `${risk.delayImpact} jours` : 'Aucun'}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="text-xs text-slate-500">Probabilité</div>
                      <div className="font-bold text-slate-700">{risk.probability}%</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Marquer résolu
                    </button>
                    <button className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      Créer une tâche associée
                    </button>
                    <button className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      Escalader
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Brain, AlertTriangle, DollarSign, ChevronDown, ChevronUp, RotateCcw, ArrowRight, Loader2, CheckCircle, TrendingDown } from 'lucide-react'
import { useProject } from '@/lib/foreman/project-context'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K€`
  return `${Math.round(Math.abs(n))} €`
}

type DecisionOption = {
  id: string; title: string; description: string
  costImpact: number; timeImpact: number; riskLevel: string
  marginImpact: number; pros: string[]; cons: string[]
  effort: string; timeToExecute: string
}
type DecisionResult = {
  issue: string; severity: string; financialExposure: number
  options: DecisionOption[]; recommendation: string
  recommendationReason: string; urgency: string; nextSteps: string[]
}

const ISSUE_LIBRARY = [
  { id: 1, issue: 'Sous-traitant plomberie défaillant — 3 semaines de retard', category: 'Planning',        severity: 'critical' },
  { id: 2, issue: 'Livraison acier retardée — rupture fournisseur',            category: 'Approvisionnement',severity: 'critical' },
  { id: 3, issue: 'Fissures détectées dans la dalle niveau 3',                 category: 'Qualité',          severity: 'critical' },
  { id: 4, issue: 'Dépassement budget menuiserie +18%',                        category: 'Finance',          severity: 'high'     },
  { id: 5, issue: 'Arrêt chantier météo — 1 semaine prévue',                  category: 'Planning',         severity: 'high'     },
  { id: 6, issue: "Conflit équipes — productivité chute 30%",                  category: 'RH',               severity: 'high'     },
  { id: 7, issue: 'Client demande modification plans R3-R5',                   category: 'Contrat',          severity: 'medium'   },
  { id: 8, issue: 'Inspection OPPBTP — non-conformité sécurité détectée',      category: 'Sécurité',         severity: 'critical' },
]

const HISTORY = [
  { date: '18/04/2026', issue: 'Retard plomberie 2 semaines',  chosen: 'B', outcome: 'good',    savings:  45000 },
  { date: '10/04/2026', issue: 'Hausse prix acier +15%',        chosen: 'A', outcome: 'neutral', savings:  12000 },
  { date: '28/03/2026', issue: 'Sous-effectif niveaux 3-4',     chosen: 'A', outcome: 'good',    savings:  28000 },
  { date: '15/03/2026', issue: 'Livraison béton retardée',      chosen: 'C', outcome: 'bad',     savings:  -8000 },
  { date: '20/02/2026', issue: 'Fuite réseaux sous-sol',        chosen: 'A', outcome: 'good',    savings:  95000 },
]

const SEV_CONFIG: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-amber-100 text-amber-700 border-amber-200',
}
const CAT_COLOR: Record<string, string> = {
  Planning: 'bg-blue-50 text-blue-600', Finance: 'bg-emerald-50 text-emerald-600',
  Qualité: 'bg-violet-50 text-violet-600', RH: 'bg-pink-50 text-pink-600',
  Contrat: 'bg-indigo-50 text-indigo-600', Sécurité: 'bg-red-50 text-red-600',
  Approvisionnement: 'bg-amber-50 text-amber-600',
}
const RISK_COLOR: Record<string, string> = { low: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-red-100 text-red-700' }
const OUTCOME_CONFIG = { good: { color: 'text-emerald-600', label: '✅ Bonne' }, neutral: { color: 'text-slate-500', label: '➖ Neutre' }, bad: { color: 'text-red-600', label: '❌ Mauvaise' } }

const LOADING_STEPS = [
  'Analyse du contexte projet…',
  'Génération des options…',
  'Calcul des impacts financiers…',
  'Formulation de la recommandation…',
]

export default function Decisions() {
  const { currentProject } = useProject()
  const [customIssue, setCustomIssue]     = useState('')
  const [activeIssue, setActiveIssue]     = useState<string | null>(null)
  const [analyzing, setAnalyzing]         = useState(false)
  const [loadingStep, setLoadingStep]     = useState(0)
  const [result, setResult]               = useState<DecisionResult | null>(null)
  const [error, setError]                 = useState('')
  const [expandedOpts, setExpandedOpts]   = useState<Record<string, boolean>>({})

  async function analyzeIssue(issue: string) {
    if (!issue.trim() || analyzing) return
    setActiveIssue(issue); setResult(null); setError(''); setAnalyzing(true); setLoadingStep(0)
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setLoadingStep(i)
      await new Promise(r => setTimeout(r, 650))
    }
    try {
      const res = await fetch('/api/foreman/decisions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue, projectContext: { name: currentProject.name, budget: currentProject.budget, progress: currentProject.progress, margin: 18.4, targetMargin: 22, type: currentProject.type } }),
      })
      const j = await res.json()
      if (!res.ok || !j.success) throw new Error(j.error || 'Erreur')
      setResult(j.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue')
    } finally {
      setAnalyzing(false)
    }
  }

  const urgencyConfig: Record<string, { color: string; label: string }> = {
    immediate: { color: 'bg-red-600 text-white', label: '🚨 ACTION IMMÉDIATE' },
    today:     { color: 'bg-orange-500 text-white', label: "⚡ AUJOURD'HUI" },
    this_week: { color: 'bg-amber-500 text-white', label: '📅 CETTE SEMAINE' },
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-6 h-6 text-violet-600" />
          <h1 className="text-2xl font-bold text-slate-900">AI Decision Engine</h1>
        </div>
        <p className="text-slate-500">Analyse multi-scénarios — Chaque décision est chiffrée, justifiée, priorisée</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* ── LEFT: Issue Library ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Bibliothèque de problèmes
          </h2>

          <div className="flex gap-2 mb-4">
            <input
              value={customIssue}
              onChange={e => setCustomIssue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyzeIssue(customIssue)}
              placeholder="Décrivez une situation…"
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-violet-400"
            />
            <button onClick={() => analyzeIssue(customIssue)} disabled={!customIssue.trim() || analyzing}
              className="px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors">
              →
            </button>
          </div>

          <div className="text-xs text-slate-400 text-center mb-3">— ou choisissez un problème courant —</div>

          <div className="space-y-2">
            {ISSUE_LIBRARY.map(item => (
              <button key={item.id} onClick={() => { setCustomIssue(item.issue); analyzeIssue(item.issue) }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${activeIssue === item.issue ? 'border-violet-400 bg-violet-50 shadow-sm' : 'border-slate-200 hover:border-violet-200 hover:bg-slate-50'}`}>
                <div className="flex items-start gap-2 mb-1.5">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${SEV_CONFIG[item.severity]}`}>{item.severity}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${CAT_COLOR[item.category] || 'bg-slate-100 text-slate-600'}`}>{item.category}</span>
                </div>
                <p className="text-sm text-slate-700 leading-snug">{item.issue}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Analysis Panel ── */}
        <div className="lg:col-span-2">

          {/* Placeholder */}
          {!activeIssue && !analyzing && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center h-full">
              <div className="w-20 h-20 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
                <Brain className="w-10 h-10 text-violet-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">Moteur de Décision IA</h3>
              <p className="text-slate-400 text-sm max-w-xs">Sélectionnez un problème ou décrivez la situation. FOREMAN génère 3 options chiffrées et recommande la meilleure.</p>
            </div>
          )}

          {/* Loading */}
          {analyzing && (
            <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-10 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">FOREMAN analyse les scénarios…</h3>
              <p className="text-slate-500 text-sm mb-6 text-center max-w-sm">{activeIssue}</p>
              <div className="space-y-2 w-full max-w-xs">
                {LOADING_STEPS.map((step, i) => (
                  <div key={step} className={`flex items-center gap-3 text-sm ${i <= loadingStep ? 'text-slate-800' : 'text-slate-300'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < loadingStep ? 'bg-emerald-500' : i === loadingStep ? 'bg-violet-500' : 'bg-slate-200'}`}>
                      {i < loadingStep ? <CheckCircle className="w-3 h-3 text-white" /> : i === loadingStep ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <div className="w-2 h-2 bg-slate-400 rounded-full" />}
                    </div>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && !analyzing && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-red-700 font-semibold">{error}</p>
              <button onClick={() => { setError(''); setActiveIssue(null) }} className="mt-3 text-sm text-red-500 underline">Réessayer</button>
            </div>
          )}

          {/* Result */}
          {result && !analyzing && (
            <div className="space-y-4">
              {/* Header */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${SEV_CONFIG[result.severity] || SEV_CONFIG.medium}`}>{result.severity}</span>
                      {result.urgency && urgencyConfig[result.urgency] && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${urgencyConfig[result.urgency].color}`}>{urgencyConfig[result.urgency].label}</span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900">{result.issue}</h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-slate-500 mb-0.5">Exposition financière</div>
                    <div className="text-2xl font-bold text-red-600">{fmt(result.financialExposure)}</div>
                  </div>
                </div>
              </div>

              {/* 3 Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.options.map(opt => {
                  const isRec = opt.id === result.recommendation
                  const expanded = expandedOpts[opt.id]
                  return (
                    <div key={opt.id} className={`bg-white rounded-2xl border shadow-sm p-4 relative flex flex-col ${isRec ? 'border-amber-400 shadow-amber-100' : 'border-slate-200'}`}>
                      {isRec && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-0.5 rounded-full">⭐ RECOMMANDÉ</div>}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black mb-3 ${isRec ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{opt.id}</div>
                      <h4 className="font-bold text-slate-800 mb-1 text-sm">{opt.title}</h4>
                      <p className="text-xs text-slate-500 mb-3 flex-1 leading-relaxed">{opt.description}</p>
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Impact coût</span>
                          <span className={`font-bold ${opt.costImpact < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {opt.costImpact < 0 ? `-${fmt(Math.abs(opt.costImpact))}` : `+${fmt(opt.costImpact)}`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Délai</span>
                          <span className={`font-bold ${opt.timeImpact > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{opt.timeImpact > 0 ? `-${opt.timeImpact}j` : opt.timeImpact < 0 ? `+${Math.abs(opt.timeImpact)}j` : '0j'}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Marge</span>
                          <span className={`font-bold ${(opt.marginImpact ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{(opt.marginImpact ?? 0) >= 0 ? '+' : ''}{(opt.marginImpact ?? 0).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Risque</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${RISK_COLOR[opt.riskLevel] || 'bg-slate-100 text-slate-600'}`}>{opt.riskLevel}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 mb-2">{opt.effort} effort · {opt.timeToExecute}</div>
                      <button onClick={() => setExpandedOpts(p => ({ ...p, [opt.id]: !p[opt.id] }))}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {expanded ? 'Masquer' : 'Pros/Cons'}
                      </button>
                      {expanded && (
                        <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-100">
                          {opt.pros.map((p, i) => <div key={i} className="text-xs text-emerald-600 flex gap-1"><span>✓</span>{p}</div>)}
                          {opt.cons.map((c, i) => <div key={i} className="text-xs text-red-500 flex gap-1"><span>✗</span>{c}</div>)}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Recommendation box */}
              <div className="bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-violet-900 mb-1">FOREMAN RECOMMANDE OPTION {result.recommendation}</p>
                    <p className="text-violet-700 text-sm leading-relaxed mb-3">{result.recommendationReason}</p>
                    {result.nextSteps?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-2">Prochaines étapes</p>
                        <div className="space-y-1">
                          {result.nextSteps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-violet-800">
                              <span className="w-5 h-5 bg-violet-200 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                    <ArrowRight className="w-4 h-4" /> Créer les tâches
                  </button>
                  <button onClick={() => { setResult(null); setActiveIssue(null); setCustomIssue('') }}
                    className="flex items-center gap-2 bg-white border border-violet-200 text-violet-600 text-sm font-medium px-4 py-2 rounded-lg hover:bg-violet-50 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" /> Nouvelle analyse
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── HISTORY ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <h2 className="font-bold text-slate-800">Historique des décisions</h2>
        </div>
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['Date', 'Problème', 'Option choisie', 'Résultat', 'Économies / Pertes'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {HISTORY.map((h, i) => {
              const oc = OUTCOME_CONFIG[h.outcome as keyof typeof OUTCOME_CONFIG]
              return (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-500">{h.date}</td>
                  <td className="px-4 py-3 text-sm text-slate-800 max-w-xs truncate">{h.issue}</td>
                  <td className="px-4 py-3"><span className="w-7 h-7 bg-violet-100 text-violet-700 font-bold text-sm rounded-full flex items-center justify-center">{h.chosen}</span></td>
                  <td className="px-4 py-3 text-sm font-medium"><span className={oc.color}>{oc.label}</span></td>
                  <td className={`px-4 py-3 text-sm font-bold ${h.savings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {h.savings >= 0 ? '+' : '-'}{fmt(Math.abs(h.savings))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

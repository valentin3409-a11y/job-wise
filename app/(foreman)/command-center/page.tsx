'use client'

import { useState, useMemo } from 'react'
import {
  Brain, TrendingDown, AlertTriangle, Zap, BarChart3, Activity,
  ChevronRight, Loader2, Lightbulb, Play, RefreshCw, CheckCircle,
  Building2, ArrowDown, ArrowRight,
} from 'lucide-react'
import { useProject } from '@/lib/foreman/project-context'
import Link from 'next/link'

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K€`
  return `${Math.round(n)} €`
}

type BriefPriority = { rank: number; text: string; urgency: 'critical' | 'high' | 'medium'; category: string; impact: string }
type DailyBrief = {
  mood: 'critical' | 'warning' | 'stable' | 'good'
  headline: string; financialStatus: string
  topPriorities: BriefPriority[]
  opportunity: string; blockers: string[]; advice: string
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

const MOOD_CONFIG = {
  critical: { bg: 'bg-red-950',    border: 'border-red-500',    text: 'text-red-300',    emoji: '🚨', label: 'SITUATION CRITIQUE' },
  warning:  { bg: 'bg-amber-950',  border: 'border-amber-500',  text: 'text-amber-300',  emoji: '⚠️', label: 'ATTENTION REQUISE' },
  stable:   { bg: 'bg-blue-950',   border: 'border-blue-500',   text: 'text-blue-300',   emoji: '✅', label: 'SITUATION STABLE' },
  good:     { bg: 'bg-emerald-950',border: 'border-emerald-500',text: 'text-emerald-300',emoji: '🟢', label: 'BONNE PERFORMANCE' },
}
const URGENCY_BADGE = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-amber-100 text-amber-700 border-amber-200',
}
const RISK_COLOR: Record<string, string> = { low: 'text-emerald-600', medium: 'text-amber-600', high: 'text-red-600' }

const ISSUES = [
  { text: 'Retard plomberie 3 semaines', color: 'border-red-400 hover:bg-red-50' },
  { text: 'Surcoût matériaux +12%',      color: 'border-amber-400 hover:bg-amber-50' },
  { text: "Manque d'effectifs niv.5",    color: 'border-orange-400 hover:bg-orange-50' },
]

const PHASES = [
  { name: 'Fondations',   pct: 100, status: 'Terminé',  color: '#10b981', start: '15/01', end: '15/03' },
  { name: 'Gros Œuvre',  pct: 65,  status: 'En cours', color: '#3b82f6', start: '15/03', end: '30/07' },
  { name: 'Second Œuvre',pct: 20,  status: 'En cours', color: '#f59e0b', start: '01/07', end: '15/10' },
  { name: 'Finitions',   pct: 0,   status: 'À venir',  color: '#94a3b8', start: '01/10', end: '15/12' },
  { name: 'Réception',   pct: 0,   status: 'À venir',  color: '#94a3b8', start: '15/12', end: '30/12' },
]

const TRADES = [
  { name: 'Gros oeuvre', budget: 1_200_000, actual: 1_152_000 },
  { name: 'Plomberie',   budget:   680_000, actual:   864_600 },
  { name: 'Électricité', budget:   420_000, actual:   411_600 },
  { name: 'Menuiserie',  budget:   380_000, actual:   399_000 },
]

function HealthArc({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Satisfaisant' : score >= 45 ? 'Attention' : 'Critique'
  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="72" viewBox="0 0 120 72">
        <path d="M 8 66 A 52 52 0 0 1 112 66" fill="none" stroke="#e2e8f0" strokeWidth="9" strokeLinecap="round" />
        <path d="M 8 66 A 52 52 0 0 1 112 66" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          pathLength="100" strokeDasharray={`${score} 100`} />
        <text x="60" y="58" textAnchor="middle" fontSize="24" fontWeight="700" fill="#1e293b">{score}</text>
      </svg>
      <div className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</div>
    </div>
  )
}

export default function CommandCenter() {
  const { currentProject } = useProject()

  const [brief, setBrief]                     = useState<DailyBrief | null>(null)
  const [briefLoading, setBriefLoading]       = useState(false)
  const [activeIssue, setActiveIssue]         = useState<string | null>(null)
  const [decision, setDecision]               = useState<DecisionResult | null>(null)
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [extraWorkers, setExtraWorkers]       = useState(0)
  const [materialPct, setMaterialPct]         = useState(0)
  const [extraWeeks, setExtraWeeks]           = useState(0)

  const budget      = currentProject.budget
  const progress    = currentProject.progress
  const actualCost  = budget * (progress / 100) * 1.07
  const margin      = 18.4
  const weeksLeft   = 38
  const healthScore = 68

  const sim = useMemo(() => {
    const base = budget * (1 - margin / 100)
    const delta = extraWorkers * 1200 * weeksLeft + base * 0.45 * (materialPct / 100) + extraWeeks * 15000
    const newMargin = ((budget - (base + delta)) / budget) * 100
    const date = new Date(); date.setDate(date.getDate() + (weeksLeft + extraWeeks) * 7)
    return { newMargin, delta, date }
  }, [budget, extraWorkers, materialPct, extraWeeks, margin, weeksLeft])

  async function fetchBrief() {
    setBriefLoading(true)
    try {
      const r = await fetch('/api/foreman/daily-brief', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectContext: { name: currentProject.name, budget, progress, type: currentProject.type, margin, targetMargin: 22, activeRisks: 4, criticalRisks: 2, workers: 24, weeksLeft }, date: new Date().toLocaleDateString('fr-FR') }),
      })
      const j = await r.json()
      if (j.success) setBrief(j.data)
    } catch { /* silent */ }
    finally { setBriefLoading(false) }
  }

  async function analyzeIssue(issue: string) {
    setActiveIssue(issue); setDecision(null); setDecisionLoading(true)
    try {
      const r = await fetch('/api/foreman/decisions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue, projectContext: { name: currentProject.name, budget, progress, margin, targetMargin: 22, type: currentProject.type } }),
      })
      const j = await r.json()
      if (j.success) setDecision(j.data)
    } catch { /* silent */ }
    finally { setDecisionLoading(false) }
  }

  const simChanged = extraWorkers > 0 || materialPct > 0 || extraWeeks > 0

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── DAILY AI BRIEF ── */}
      {!brief && !briefLoading && (
        <div className="bg-gradient-to-br from-slate-900 to-violet-950 rounded-2xl border border-violet-800/50 p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-violet-600/30 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-violet-300" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">FOREMAN AI — Daily Brief</h2>
          <p className="text-slate-400 text-sm mb-1">{currentProject.name} · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p className="text-slate-500 text-xs mb-6">Analyse temps réel : risques, priorités, finances, actions recommandées</p>
          <button onClick={fetchBrief}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg">
            <Play className="w-4 h-4" /> Générer le brief du jour
          </button>
        </div>
      )}

      {briefLoading && (
        <div className="bg-gradient-to-br from-slate-900 to-violet-950 rounded-2xl border border-violet-700 p-8 text-center shadow-xl">
          <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-3" />
          <p className="text-white font-semibold text-lg">FOREMAN AI analyse la situation…</p>
          <p className="text-slate-400 text-sm mt-1">Évaluation des risques, finances et planning en cours</p>
        </div>
      )}

      {brief && !briefLoading && (() => {
        const m = MOOD_CONFIG[brief.mood]
        return (
          <div className={`${m.bg} border ${m.border} rounded-2xl p-6 shadow-xl`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className={`text-xs font-bold uppercase tracking-widest ${m.text} mb-1`}>{m.emoji} {m.label}</div>
                <h2 className="text-xl font-bold text-white">{brief.headline}</h2>
                <p className={`text-sm mt-1 ${m.text}`}>{brief.financialStatus}</p>
              </div>
              <button onClick={fetchBrief} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {brief.topPriorities?.slice(0, 3).map(p => (
                <div key={p.rank} className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{p.rank}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${URGENCY_BADGE[p.urgency]}`}>{p.urgency}</span>
                  </div>
                  <p className="text-white text-sm font-medium leading-snug">{p.text}</p>
                  {p.impact && <p className={`text-xs mt-1 ${m.text}`}>{p.impact}</p>}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {brief.opportunity && (
                <div className="bg-emerald-900/40 border border-emerald-700/50 rounded-xl p-3 flex gap-2">
                  <Lightbulb className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div><p className="text-xs text-emerald-400 font-semibold mb-0.5">OPPORTUNITÉ</p><p className="text-emerald-200 text-sm">{brief.opportunity}</p></div>
                </div>
              )}
              {brief.advice && (
                <div className="bg-violet-900/40 border border-violet-700/50 rounded-xl p-3 flex gap-2">
                  <Brain className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                  <div><p className="text-xs text-violet-400 font-semibold mb-0.5">CONSEIL DU JOUR</p><p className="text-violet-200 text-sm">{brief.advice}</p></div>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Budget total</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700">{fmt(budget)}</div>
          <div className="text-xs text-slate-500 mt-0.5">Marché signé</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Coût réel</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{fmt(actualCost)}</div>
          <div className="text-xs text-slate-500 mt-0.5">{progress}% avancé</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Marge actuelle</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{margin}%</div>
          <div className="text-xs text-slate-500 mt-0.5">Cible: 22% ↓</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avancement</span>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{progress}%</div>
          <div className="mt-2 h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col items-center justify-center">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Health Score</div>
          <HealthArc score={healthScore} />
        </div>
      </div>

      {/* ── FINANCIAL INTELLIGENCE + DECISION ENGINE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            <h2 className="font-bold text-slate-900">Intelligence Financière</h2>
            <Link href="/financials" className="ml-auto text-xs text-blue-600 hover:underline flex items-center gap-1">
              Détail <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center justify-between mb-5 bg-slate-50 rounded-xl p-3 border border-slate-200">
            {[{ label: 'Cible', value: '22%', color: 'text-emerald-600' }, { label: 'Actuelle', value: '18.4%', color: 'text-amber-600' }, { label: 'Prévision', value: '15.8%', color: 'text-red-600' }].map((item, i) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                  <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
                </div>
                {i < 2 && <ArrowDown className="w-4 h-4 text-slate-400" />}
              </div>
            ))}
          </div>
          <div className="space-y-2.5 mb-4">
            {TRADES.map(t => {
              const pct = Math.round((t.actual / t.budget) * 100)
              const over = t.actual > t.budget
              return (
                <div key={t.name} className="flex items-center gap-3">
                  <div className="w-28 text-sm text-slate-600 truncate">{t.name}</div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${over ? 'bg-red-400' : 'bg-blue-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="w-10 text-xs text-right font-semibold text-slate-600">{pct}%</div>
                  <div className={`text-xs font-semibold w-20 text-right ${over ? 'text-red-600' : 'text-emerald-600'}`}>
                    {over ? `+${fmt(t.actual - t.budget)}` : '✅'}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700"><span className="font-bold">Plomberie +27% vs budget</span> — Exposition: 183 600 €. Action immédiate requise.</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-violet-500" />
            <h2 className="font-bold text-slate-900">Décisions IA</h2>
            <Link href="/decisions" className="ml-auto text-xs text-violet-600 hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2 mb-4">
            {ISSUES.map(issue => (
              <button key={issue.text} onClick={() => analyzeIssue(issue.text)}
                className={`w-full text-left px-3 py-2.5 border-l-4 rounded-lg text-sm font-medium text-slate-700 bg-slate-50 transition-all ${issue.color} ${activeIssue === issue.text ? 'ring-2 ring-violet-300' : ''}`}>
                <div className="flex items-center justify-between">
                  <span>{issue.text}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
          {decisionLoading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-4">
              <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
              <p className="text-sm text-violet-600 font-medium">FOREMAN évalue les scénarios…</p>
            </div>
          )}
          {decision && !decisionLoading && (
            <div className="flex-1 space-y-2.5">
              {decision.options.slice(0, 3).map(opt => (
                <div key={opt.id} className={`rounded-xl p-3 border text-sm ${opt.id === decision.recommendation ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${opt.id === decision.recommendation ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{opt.id}</span>
                    <span className="font-semibold text-slate-800 flex-1 truncate">{opt.title}</span>
                    {opt.id === decision.recommendation && <span className="text-xs text-amber-600 font-bold flex-shrink-0">⭐</span>}
                    <span className={`text-xs font-semibold flex-shrink-0 ${RISK_COLOR[opt.riskLevel] ?? 'text-slate-500'}`}>{opt.riskLevel}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span className={opt.costImpact < 0 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                      {opt.costImpact < 0 ? `-${fmt(Math.abs(opt.costImpact))}` : `+${fmt(opt.costImpact)}`}
                    </span>
                    <span>{opt.timeImpact > 0 ? `-${opt.timeImpact}j` : `+${Math.abs(opt.timeImpact)}j`}</span>
                    <span>{(opt.marginImpact ?? 0) > 0 ? '+' : ''}{(opt.marginImpact ?? 0).toFixed(1)}% marge</span>
                  </div>
                </div>
              ))}
              {decision.recommendationReason && (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-700">
                  <p className="font-bold mb-1">RECOMMANDE OPTION {decision.recommendation}</p>
                  <p className="leading-relaxed">{decision.recommendationReason}</p>
                </div>
              )}
            </div>
          )}
          {!decision && !decisionLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <Brain className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">Sélectionnez un problème pour analyser les options</p>
            </div>
          )}
        </div>
      </div>

      {/* ── WHAT-IF SIMULATOR ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <Play className="w-5 h-5 text-emerald-500" />
          <h2 className="font-bold text-slate-900">Simulateur de Scénarios</h2>
          <span className="text-xs text-slate-400 ml-2">Modifiez les paramètres — l&apos;impact sur la marge se calcule en temps réel</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            {[
              { label: 'Effectifs supplémentaires', val: extraWorkers, set: setExtraWorkers, max: 20, unit: ' pers.' },
              { label: 'Hausse des matériaux',      val: materialPct,  set: setMaterialPct,  max: 30, unit: '%' },
              { label: 'Retard supplémentaire',     val: extraWeeks,   set: setExtraWeeks,   max: 12, unit: ' sem.' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 font-medium">{s.label}</span>
                  <span className="text-slate-800 font-bold">+{s.val}{s.unit}</span>
                </div>
                <input type="range" min={0} max={s.max} value={s.val} onChange={e => s.set(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer" />
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            {!simChanged ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <CheckCircle className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-slate-400 text-sm">Scénario de base — Aucun changement simulé</p>
                <p className="text-slate-400 text-xs mt-1">Déplacez les curseurs pour simuler un impact</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-1">Nouvelle marge simulée</div>
                  <div className={`text-4xl font-bold ${sim.newMargin < 10 ? 'text-red-600' : sim.newMargin < 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {sim.newMargin.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">vs {margin}% actuellement ({(sim.newMargin - margin).toFixed(1)} pts)</div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Surcoût simulé</div>
                    <div className="text-lg font-bold text-red-600">+{fmt(sim.delta)}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-xs text-slate-500 mb-1">Livraison estimée</div>
                    <div className="text-base font-bold text-slate-700">{sim.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                  </div>
                </div>
                {sim.newMargin < 10 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-red-700 font-bold text-sm">⚠️ DANGER — Marge critique, projet non rentable</p>
                  </div>
                )}
                {sim.newMargin >= 10 && sim.newMargin < 15 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    <p className="text-amber-700 font-semibold text-sm">⚠️ Marge insuffisante — Revoir le plan d&apos;action</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PHASE OVERVIEW ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {PHASES.map(ph => (
          <div key={ph.name} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-800 truncate">{ph.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-1 ${ph.status === 'Terminé' ? 'bg-emerald-100 text-emerald-700' : ph.status === 'En cours' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {ph.status}
              </span>
            </div>
            <div className="text-2xl font-bold mb-2" style={{ color: ph.pct > 0 ? ph.color : '#94a3b8' }}>{ph.pct}%</div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full" style={{ width: `${ph.pct}%`, backgroundColor: ph.color }} />
            </div>
            <div className="text-xs text-slate-400">{ph.start} → {ph.end}</div>
          </div>
        ))}
      </div>

    </div>
  )
}

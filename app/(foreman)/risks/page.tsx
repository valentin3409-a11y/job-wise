'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Brain,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRight,
  CheckCircle,
  Eye,
  ArrowUpCircle,
  ListTree,
} from 'lucide-react'
import { useProject } from '@/lib/foreman/project-context'

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = 'critique' | 'élevé' | 'moyen' | 'faible'

type RiskCard = {
  id: number
  level: RiskLevel
  title: string
  probability: number
  impact: number
  delay: number
  blockedDeps: string[]
  recommendation: string
  description: string
  rootCause: string
}

// ─── Static data ──────────────────────────────────────────────────────────────

const RISKS: RiskCard[] = [
  {
    id: 1,
    level: 'critique',
    title: 'Défaillance sous-traitant plomberie',
    probability: 75,
    impact: 280_000,
    delay: 21,
    blockedDeps: ['Second œuvre (6 lots)', 'Finitions (8 lots)'],
    recommendation: 'Déclencher plan B sous-traitant dès aujourd\'hui. Contact PLB Services.',
    description: 'L\'équipe de sous-traitance plomberie est en sous-effectif critique (2/4) depuis 3 semaines. Les délais contractuels sont menacés.',
    rootCause: 'Problème de trésorerie du sous-traitant + départ de 2 compagnons qualifiés.',
  },
  {
    id: 2,
    level: 'critique',
    title: 'Rupture acier fournisseur',
    probability: 60,
    impact: 195_000,
    delay: 14,
    blockedDeps: ['Structure R5-R9', 'Armatures niveaux 6-9'],
    recommendation: 'Commander surplus chez Arcelor via second fournisseur. Budget: +45K€.',
    description: 'Alerte de rupture de stock reçue du fournisseur principal d\'acier BA. Délai de livraison porté à 6 semaines.',
    rootCause: 'Tensions mondiales sur l\'acier + forte demande en région parisienne.',
  },
  {
    id: 3,
    level: 'élevé',
    title: 'Intempéries semaine 17-18',
    probability: 65,
    impact: 87_000,
    delay: 5,
    blockedDeps: ['Façade', 'Étanchéité', 'Terrasses'],
    recommendation: 'Avancer travaux extérieurs avant jeudi. Prévoir bâches.',
    description: 'Météo France annonce des vents violents (>70km/h) et précipitations importantes pour les semaines 17-18.',
    rootCause: 'Phénomène météorologique saisonnier, imprévisible à long terme.',
  },
  {
    id: 4,
    level: 'élevé',
    title: 'Coordination défaillante niveaux 3-5',
    probability: 50,
    impact: 124_500,
    delay: 8,
    blockedDeps: ['Électricité', 'Plomberie', 'Ventilation'],
    recommendation: 'Réunion coordination quotidienne 8h. Désigner coordinateur dédié.',
    description: 'Conflits de planning entre corps d\'état aux niveaux 3 à 5. Interventions simultanées non coordonnées créent des pertes de temps.',
    rootCause: 'Absence de coordinateur inter-corps sur ces niveaux.',
  },
  {
    id: 5,
    level: 'moyen',
    title: 'Pénurie main d\'œuvre spécialisée',
    probability: 40,
    impact: 161_000,
    delay: 10,
    blockedDeps: ['Menuiserie métallique', 'Serrurerie'],
    recommendation: 'Contacter 3 agences intérim spécialisées cette semaine.',
    description: 'Tension sur le marché du travail spécialisé (menuisiers métalliques, serruriers). Plusieurs lots à venir nécessitent ces profils.',
    rootCause: 'Fort carnet de commandes régional. Compétition accrue entre chantiers IDF.',
  },
]

type CriticalTask = {
  id: string
  label: string
  progress: number | null
  status: 'done' | 'active' | 'blocked' | 'critical'
  retardLabel?: string
}

const CRITICAL_PATH: CriticalTask[] = [
  { id: 'fond',    label: 'Fondations',        progress: 100, status: 'done' },
  { id: 'struct04',label: 'Structure R0-R4',   progress: 65,  status: 'active' },
  { id: 'plomb',   label: 'Plomberie encastrée',progress: 41, status: 'critical', retardLabel: 'RETARD 3 semaines' },
  { id: 'struct59',label: 'Structure R5-R9',   progress: 20,  status: 'active' },
  { id: 'second',  label: 'Second œuvre',      progress: null,status: 'blocked' },
  { id: 'finish',  label: 'Finitions',         progress: null,status: 'blocked' },
]

// Dependency matrix data: [source, target] = true if dependency
type DepMatrix = {
  tasks: string[]
  deps: boolean[][]
  atRisk: boolean[][]
}

const DEPENDENCY_MATRIX: DepMatrix = {
  tasks: ['Fondations', 'Structure R0-R4', 'Plomberie', 'Second œuvre', 'Finitions'],
  deps: [
    [false, true,  false, false, false],
    [false, false, true,  true,  false],
    [false, false, false, true,  false],
    [false, false, false, false, true ],
    [false, false, false, false, false],
  ],
  atRisk: [
    [false, false, false, false, false],
    [false, false, true,  true,  false],
    [false, false, false, true,  false],
    [false, false, false, false, true ],
    [false, false, false, false, false],
  ],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (n >= 1_000) return `${Math.round(n / 1_000)} K€`
  return `${n} €`
}

type LevelCfg = { bg: string; text: string; border: string; dot: string; badge: string }

function levelCfg(level: RiskLevel): LevelCfg {
  switch (level) {
    case 'critique': return {
      bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',
      dot: 'bg-red-500',   badge: 'bg-red-500 text-white',
    }
    case 'élevé': return {
      bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',
      dot: 'bg-orange-500',badge: 'bg-orange-500 text-white',
    }
    case 'moyen': return {
      bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',
      dot: 'bg-amber-400', badge: 'bg-amber-400 text-white',
    }
    case 'faible': return {
      bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',
      dot: 'bg-slate-400', badge: 'bg-slate-400 text-white',
    }
  }
}

// ─── Critical Path component ──────────────────────────────────────────────────

function CriticalPath() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-amber-500" />
        <h2 className="font-semibold text-slate-800 text-base">Chemin Critique</h2>
        <span className="ml-auto text-xs bg-red-100 text-red-700 border border-red-200 font-semibold px-2 py-0.5 rounded-full">
          +12 jours de retard estimé
        </span>
      </div>

      {/* Flow diagram */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-start gap-2 min-w-max">
          {CRITICAL_PATH.map((task, i) => {
            const isDone     = task.status === 'done'
            const isCritical = task.status === 'critical'
            const isBlocked  = task.status === 'blocked'
            const isActive   = task.status === 'active'

            const boxBg =
              isDone     ? 'bg-emerald-50 border-emerald-300' :
              isCritical ? 'bg-red-50 border-red-400' :
              isBlocked  ? 'bg-slate-100 border-slate-300' :
                           'bg-blue-50 border-blue-300'

            const titleColor =
              isDone     ? 'text-emerald-700' :
              isCritical ? 'text-red-700' :
              isBlocked  ? 'text-slate-400' :
                           'text-blue-700'

            return (
              <div key={task.id} className="flex items-start gap-2">
                <div className={`relative border-2 rounded-xl p-3 w-36 shadow-sm ${boxBg} ${isCritical ? 'ring-2 ring-red-400 ring-offset-1' : ''}`}>
                  {isCritical && (
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  )}
                  <p className={`text-xs font-semibold leading-tight mb-2 ${titleColor}`}>{task.label}</p>
                  {isDone && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle className="w-3 h-3" /> Terminé
                    </div>
                  )}
                  {(isActive || isCritical) && task.progress !== null && (
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                        <span>Avancement</span><span>{task.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-white rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isCritical ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      {isCritical && task.retardLabel && (
                        <p className="text-[10px] font-bold text-red-600 mt-1.5">{task.retardLabel}</p>
                      )}
                    </div>
                  )}
                  {isBlocked && (
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BLOQUÉ</div>
                  )}
                </div>
                {i < CRITICAL_PATH.length - 1 && (
                  <div className="flex items-center self-center">
                    <ArrowRight className={`w-5 h-5 ${
                      CRITICAL_PATH[i + 1].status === 'blocked' ? 'text-red-400' : 'text-slate-300'
                    }`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Cascade warning */}
      <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 leading-relaxed">
          <strong>Cascade de retard:</strong> Retard plomberie → bloque second œuvre → bloque finitions → <strong>+3 semaines sur livraison finale</strong>
        </p>
      </div>
    </div>
  )
}

// ─── Risk card component ──────────────────────────────────────────────────────

function RiskCardComponent({ risk }: { risk: RiskCard }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = levelCfg(risk.level)
  const exposition = Math.round(risk.impact * risk.probability / 100)

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${cfg.border} ${risk.level === 'critique' ? 'ring-1 ring-red-300' : ''}`}>
      {/* Header row */}
      <button
        className={`w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors ${cfg.bg}`}
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-shrink-0 mt-0.5">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${cfg.badge}`}>
            {risk.level}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-snug">{risk.title}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-slate-500">Prob. <strong className={cfg.text}>{risk.probability}%</strong></span>
            <span className="text-xs text-slate-300">·</span>
            <span className="text-xs text-slate-500">Impact <strong className="text-red-600">{fmt(risk.impact)}</strong></span>
            <span className="text-xs text-slate-300">·</span>
            <span className="text-xs text-slate-500">Délai <strong className="text-amber-600">+{risk.delay}j</strong></span>
            <span className="text-xs text-slate-300">·</span>
            <span className="text-xs text-slate-500">Exposition <strong className="text-red-700">{fmt(exposition)}</strong></span>
          </div>
          {/* Blocked dependencies */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {risk.blockedDeps.map(dep => (
              <span key={dep} className="text-[10px] bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                🔒 {dep}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 mt-1">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className={`border-t ${cfg.border} p-4 space-y-3`}>
          {/* Description + Root cause */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border border-slate-100 p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</p>
              <p className="text-xs text-slate-600 leading-relaxed">{risk.description}</p>
            </div>
            <div className="bg-white rounded-lg border border-slate-100 p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cause racine</p>
              <p className="text-xs text-slate-600 leading-relaxed">{risk.rootCause}</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-lg p-3">
            <Brain className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-1">Recommandation IA</p>
              <p className="text-sm text-violet-800 leading-relaxed">{risk.recommendation}</p>
            </div>
          </div>

          {/* Probability gauge */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Probabilité d&apos;occurrence</span>
              <span className={`font-bold ${cfg.text}`}>{risk.probability}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  risk.level === 'critique' ? 'bg-red-500' :
                  risk.level === 'élevé'    ? 'bg-orange-500' :
                  risk.level === 'moyen'    ? 'bg-amber-400' : 'bg-slate-400'
                }`}
                style={{ width: `${risk.probability}%` }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              <CheckCircle className="w-3.5 h-3.5" /> Créer tâche
            </button>
            <button className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              <Eye className="w-3.5 h-3.5" /> Voir dépendances
            </button>
            <button className="flex items-center gap-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
              <ArrowUpCircle className="w-3.5 h-3.5" /> Escalader
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Dependency Matrix component ──────────────────────────────────────────────

function DependencyMatrix() {
  const [open, setOpen] = useState(false)
  const { tasks, deps, atRisk } = DEPENDENCY_MATRIX

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <ListTree className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-800">Matrice des dépendances</span>
          <span className="text-xs text-slate-400 ml-1">(tâches critiques)</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5">
          <p className="text-xs text-slate-400 mb-4">
            Lignes = source · Colonnes = tâche dépendante · <span className="text-slate-600 font-medium">●</span> dépendance normale · <span className="text-red-500 font-bold">●</span> dépendance à risque
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 px-3 py-2 bg-slate-50 border border-slate-200 w-40">
                    Source \ Cible
                  </th>
                  {tasks.map(t => (
                    <th key={t} className="text-center text-xs font-semibold text-slate-600 px-3 py-2 bg-slate-50 border border-slate-200 max-w-[100px]">
                      <span className="block truncate max-w-[80px] mx-auto" title={t}>{t}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((rowTask, rowIdx) => (
                  <tr key={rowTask} className="hover:bg-slate-50 transition-colors">
                    <td className="text-xs font-medium text-slate-700 px-3 py-2.5 border border-slate-200 bg-slate-50">
                      {rowTask}
                    </td>
                    {tasks.map((_, colIdx) => {
                      const hasDep  = deps[rowIdx][colIdx]
                      const isRisk  = atRisk[rowIdx][colIdx]
                      const isSelf  = rowIdx === colIdx
                      return (
                        <td key={colIdx} className="text-center px-3 py-2.5 border border-slate-200">
                          {isSelf ? (
                            <span className="text-slate-200 text-xs">—</span>
                          ) : hasDep ? (
                            <span
                              className={`text-lg leading-none ${isRisk ? 'text-red-500' : 'text-slate-500'}`}
                              title={isRisk ? 'Dépendance à risque' : 'Dépendance normale'}
                            >
                              ●
                            </span>
                          ) : (
                            <span className="text-slate-100 text-xs">·</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5"><span className="text-slate-500 font-bold text-base leading-none">●</span> Dépendance normale</div>
            <div className="flex items-center gap-1.5"><span className="text-red-500 font-bold text-base leading-none">●</span> Dépendance à risque</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RisksPage() {
  useProject()

  const criticalCount  = RISKS.filter(r => r.level === 'critique').length
  const elevéCount     = RISKS.filter(r => r.level === 'élevé').length
  const totalExposition = RISKS.reduce((s, r) => s + Math.round(r.impact * r.probability / 100), 0)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Risques &amp; Dépendances</h1>
        <p className="text-slate-500 mt-1">Détection proactive, chemin critique, impact financier</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Risques critiques</div>
          <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
          <div className="text-xs text-red-400 mt-1">Action immédiate</div>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">Risques élevés</div>
          <div className="text-3xl font-bold text-orange-600">{elevéCount}</div>
          <div className="text-xs text-orange-400 mt-1">Surveillance accrue</div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Exposition totale</div>
          <div className="text-2xl font-bold text-red-700">{fmt(totalExposition)}</div>
          <div className="text-xs text-red-400 mt-1">Impact pondéré</div>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Chemin critique</div>
          <div className="text-2xl font-bold text-amber-700">12 jours</div>
          <div className="text-xs text-amber-500 mt-1">De retard cumulé</div>
        </div>
      </div>

      {/* Critical Path section */}
      <CriticalPath />

      {/* Risk Cards */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Registre des risques
          <span className="text-xs text-slate-400 font-normal ml-1">{RISKS.length} risques identifiés</span>
        </h2>
        <div className="space-y-3">
          {RISKS.map(risk => (
            <RiskCardComponent key={risk.id} risk={risk} />
          ))}
        </div>
      </div>

      {/* Dependency Matrix (collapsible) */}
      <DependencyMatrix />
    </div>
  )
}

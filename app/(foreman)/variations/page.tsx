'use client'

import { useState } from 'react'
import {
  FileText,
  TrendingUp,
  Users,
  ShieldCheck,
  Zap,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Brain,
  Download,
  Plus,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type VariationStatus = 'en_cours' | 'accepté' | 'refusé'
type VariationCause = 'client_change' | 'design_error' | 'unforeseen' | 'weather'

type Variation = {
  id: string
  title: string
  status: VariationStatus
  amount: number
  cause: VariationCause
  description: string
  marginImpact: number
}

// ─── Static data ──────────────────────────────────────────────────────────────

const VARIATIONS: Variation[] = [
  {
    id: 'AV-001',
    title: 'Modification façade niveau 4-8',
    status: 'accepté',
    amount: 34500,
    cause: 'client_change',
    description: 'Le client demande un changement de revêtement façade. Travaux supplémentaires : 145 m² enduit spécial + isolation renforcée',
    marginImpact: 0.7,
  },
  {
    id: 'AV-002',
    title: 'Fondations profondes imprévu',
    status: 'en_cours',
    amount: 28900,
    cause: 'unforeseen',
    description: 'Sol instable découvert niveau -3. Micropieux nécessaires. Retard 8 jours.',
    marginImpact: 0.6,
  },
  {
    id: 'AV-003',
    title: 'Câblage réseau supplémentaire',
    status: 'en_cours',
    amount: 12400,
    cause: 'design_error',
    description: 'Plans initiaux manquaient les gaines réseau niveaux 6-9. Non-conformité MOE.',
    marginImpact: 0.3,
  },
  {
    id: 'AV-004',
    title: 'Adaptation ascenseur PMR',
    status: 'refusé',
    amount: 13600,
    cause: 'client_change',
    description: 'Mise aux normes PMR cabine ascenseur — client conteste la nécessité.',
    marginImpact: 0,
  },
]

const STATUS_CONFIG: Record<VariationStatus, { label: string; color: string; bg: string; border: string; Icon: typeof CheckCircle }> = {
  en_cours: { label: 'En cours',  color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   Icon: Clock },
  accepté:  { label: 'Accepté',   color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', Icon: CheckCircle },
  refusé:   { label: 'Refusé',    color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     Icon: XCircle },
}

const CAUSE_CONFIG: Record<VariationCause, { label: string; color: string; bg: string }> = {
  client_change: { label: 'Modification client', color: 'text-blue-700',   bg: 'bg-blue-50' },
  design_error:  { label: 'Erreur conception',   color: 'text-orange-700', bg: 'bg-orange-50' },
  unforeseen:    { label: 'Imprévu chantier',    color: 'text-violet-700', bg: 'bg-violet-50' },
  weather:       { label: 'Conditions météo',    color: 'text-slate-600',  bg: 'bg-slate-100' },
}

type ClaimOpportunity = {
  id: string
  title: string
  detail: string
  evidence: string[]
  estimatedValue: number
}

const CLAIM_OPPORTUNITIES: ClaimOpportunity[] = [
  {
    id: 'CLM-001',
    title: 'Arrêt chantier météo — semaine 14',
    detail: '12 jours d\'arrêt documentés = droit à prolongation + indemnités.',
    evidence: [
      'Bulletins météo officiels archivés (Météo-France)',
      'Registre journalier de chantier signé',
      'Photos datées des conditions de travail',
    ],
    estimatedValue: 87000,
  },
  {
    id: 'CLM-002',
    title: 'Retard plans MOE — 3 semaines',
    detail: 'Plans de structure livrés en retard. Impact : 3 semaines de productivité réduite.',
    evidence: [
      'E-mails de relance MOE (17 courriers)',
      'Planning contractuel vs livraisons réelles',
      'Rapport d\'impact sur les équipes terrain',
    ],
    estimatedValue: 69000,
  },
]

// ─── Document preview mock ────────────────────────────────────────────────────

const TODAY = new Date().toLocaleDateString('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace('.0', '')} K€`
  return `${n} €`
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Variations() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [docVariationId, setDocVariationId] = useState<string>('AV-002')
  const [showDocPreview, setShowDocPreview] = useState(false)

  const totalOngoing   = VARIATIONS.filter(v => v.status === 'en_cours').reduce((s, v) => s + v.amount, 0)
  const totalAccepted  = VARIATIONS.filter(v => v.status === 'accepté').reduce((s, v) => s + v.amount, 0)
  const totalClaims    = CLAIM_OPPORTUNITIES.reduce((s, c) => s + c.estimatedValue, 0)
  const marginProtected = VARIATIONS.filter(v => v.status !== 'refusé').reduce((s, v) => s + v.marginImpact, 0)

  const selectedVariation = VARIATIONS.find(v => v.id === docVariationId) ?? VARIATIONS[1]

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Avenants &amp; Réclamations</h1>
          <p className="text-slate-500 mt-1">Détection automatique, valorisation, génération de documents</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Nouvel avenant
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avenants en cours</span>
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {VARIATIONS.filter(v => v.status === 'en_cours').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total : {fmt(totalOngoing)}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Réclamations détectées</span>
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">{CLAIM_OPPORTUNITIES.length}</div>
          <div className="text-xs text-slate-500 mt-1">Montant : {fmt(totalClaims)}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Taux acceptation client</span>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600">78%</div>
          <div className="text-xs text-slate-500 mt-1">
            Accepté : {fmt(totalAccepted)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Marge protégée</span>
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">+{marginProtected.toFixed(1)} pts</div>
          <div className="text-xs text-slate-500 mt-1">Impact marge total</div>
        </div>
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT + MIDDLE (2/3): Variations list + AI Detection */}
        <div className="xl:col-span-2 space-y-6">

          {/* Variations list */}
          <div>
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              Avenants ({VARIATIONS.length})
            </h2>
            <div className="space-y-3">
              {VARIATIONS.map(v => {
                const st = STATUS_CONFIG[v.status]
                const cause = CAUSE_CONFIG[v.cause]
                const StatusIcon = st.Icon
                const isOpen = expanded === v.id

                return (
                  <div
                    key={v.id}
                    className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                      v.status === 'delayed' ? 'border-red-200' : 'border-slate-200'
                    }`}
                  >
                    <button
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
                      onClick={() => setExpanded(isOpen ? null : v.id)}
                    >
                      {/* ID */}
                      <span className="text-xs font-mono font-semibold text-slate-400 w-16 flex-shrink-0">{v.id}</span>

                      {/* Title + cause */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 text-sm truncate">{v.title}</div>
                        <span className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${cause.color} ${cause.bg}`}>
                          {cause.label}
                        </span>
                      </div>

                      {/* Amount + margin */}
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <div className="text-sm font-bold text-slate-800">{fmt(v.amount)}</div>
                        {v.marginImpact > 0 && (
                          <div className="text-xs text-emerald-600 font-medium">+{v.marginImpact.toFixed(1)} pts marge</div>
                        )}
                      </div>

                      {/* Status badge */}
                      <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${st.color} ${st.bg} ${st.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        {st.label}
                      </span>

                      {/* Expand icon */}
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      }
                    </button>

                    {/* Expanded details */}
                    {isOpen && (
                      <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                        <p className="text-sm text-slate-600 leading-relaxed mb-4">{v.description}</p>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-500">Montant avenant</div>
                            <div className="font-bold text-slate-800">{fmt(v.amount)}</div>
                          </div>
                          <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-500">Impact marge</div>
                            <div className={`font-bold ${v.marginImpact > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {v.marginImpact > 0 ? `+${v.marginImpact.toFixed(1)} pts` : '—'}
                            </div>
                          </div>
                          <div className="bg-white rounded-lg border border-slate-200 p-3">
                            <div className="text-xs text-slate-500">Statut</div>
                            <div className={`font-bold ${st.color}`}>{st.label}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {v.status === 'en_cours' ? (
                            <>
                              <button className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Finaliser
                              </button>
                              <button
                                onClick={() => { setDocVariationId(v.id); setShowDocPreview(true) }}
                                className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Générer le document
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setDocVariationId(v.id); setShowDocPreview(true) }}
                              className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Voir le document
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI Detection section */}
          <div>
            <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-500" />
              <span>Détection IA — Opportunités de réclamation</span>
              <span className="text-xs bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-medium">
                {CLAIM_OPPORTUNITIES.length} détectées
              </span>
            </h2>
            <div className="space-y-3">
              {CLAIM_OPPORTUNITIES.map(claim => (
                <div key={claim.id} className="bg-white rounded-xl border border-violet-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Brain className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">{claim.title}</div>
                        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{claim.detail}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-slate-500">Montant estimé</div>
                      <div className="text-xl font-bold text-violet-700">{fmt(claim.estimatedValue)}</div>
                    </div>
                  </div>

                  {/* Evidence points */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-3">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preuves disponibles</div>
                    <ul className="space-y-1">
                      {claim.evidence.map((e, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex items-center gap-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                      <FileText className="w-3.5 h-3.5" />
                      Préparer le dossier
                    </button>
                    <button className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      Analyser les preuves
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT (1/3): Document generator */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Download className="w-4 h-4 text-slate-400" />
                Générateur de documents
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Ordre de service automatique</p>
            </div>
            <div className="p-4 space-y-4">
              {/* Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Avenant</label>
                <select
                  value={docVariationId}
                  onChange={e => { setDocVariationId(e.target.value); setShowDocPreview(false) }}
                  className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                >
                  {VARIATIONS.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.id} — {v.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowDocPreview(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Générer le document
              </button>

              {/* Document preview */}
              {showDocPreview && selectedVariation && (
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  {/* Letterhead */}
                  <div className="bg-slate-800 text-white px-4 py-3">
                    <div className="text-xs font-semibold tracking-widest uppercase opacity-60">Foreman BTP</div>
                    <div className="font-bold text-sm mt-0.5">ORDRE DE SERVICE</div>
                    <div className="text-xs opacity-70 mt-0.5">N° {selectedVariation.id}</div>
                  </div>

                  <div className="bg-white px-4 py-3 text-xs text-slate-700 space-y-2 font-mono leading-relaxed">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date :</span>
                      <span className="font-semibold">{TODAY}</span>
                    </div>
                    <div className="border-t border-slate-100 pt-2">
                      <div className="text-slate-500 mb-1">Objet :</div>
                      <div className="font-semibold text-slate-800">Travaux supplémentaires</div>
                      <div className="text-slate-600 mt-0.5">{selectedVariation.title}</div>
                    </div>
                    <div className="border-t border-slate-100 pt-2">
                      <div className="text-slate-500 mb-1">Description :</div>
                      <div className="text-slate-700 leading-relaxed text-[10px]">{selectedVariation.description}</div>
                    </div>
                    <div className="border-t border-slate-100 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-500">Montant HT :</span>
                        <span className="text-slate-800">{fmt(selectedVariation.amount)}</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-2 pb-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Statut :</span>
                        <span className={`font-semibold ${STATUS_CONFIG[selectedVariation.status].color}`}>
                          {STATUS_CONFIG[selectedVariation.status].label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">
                      <Download className="w-3 h-3" />
                      Télécharger PDF
                    </button>
                    <button className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
                      Envoyer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

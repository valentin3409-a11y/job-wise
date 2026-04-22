'use client'

import { useState } from 'react'
import { AlertTriangle, Bell, TrendingUp, Clock, CheckCircle, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Alert = {
  id: number
  title: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  category: 'budget' | 'planning' | 'labour' | 'risk' | 'quality' | 'resource'
  time: string
  date: string
  acknowledged: boolean
  linkedPage?: string
  linkedLabel?: string
  action?: string
}

const ALERTS: Alert[] = [
  {
    id: 1,
    title: 'Plomberie — Effectifs insuffisants',
    description: 'Seulement 2 plombiers sur site au lieu de 4 requis. Retard de production estimé à 50%. Impact : +18 jours sur la livraison.',
    severity: 'critical',
    category: 'resource',
    time: '09:00',
    date: "Aujourd'hui",
    acknowledged: false,
    linkedPage: '/risks',
    linkedLabel: 'Voir Risks',
    action: 'Contacter sous-traitants alternatifs',
  },
  {
    id: 2,
    title: 'Non-conformité cage escalier R3',
    description: 'Bureau Véritas a signalé une non-conformité de ferraillage au niveau R3. Travaux suspendus sur ce secteur.',
    severity: 'critical',
    category: 'quality',
    time: '14:30',
    date: 'Hier',
    acknowledged: false,
    linkedPage: '/risks',
    linkedLabel: 'Voir risque',
    action: 'Soumettre plan correctif sous 5 jours',
  },
  {
    id: 3,
    title: 'Dépassement coût main d\'œuvre — Semaine 16',
    description: 'Coût MO réel : 148 000 € vs budget 128 000 €. Dépassement de +15.6%. Tendance constante sur 4 semaines.',
    severity: 'warning',
    category: 'budget',
    time: '08:00',
    date: "Aujourd'hui",
    acknowledged: false,
    linkedPage: '/labour',
    linkedLabel: 'Voir Labour',
    action: 'Revoir composition équipe gros oeuvre',
  },
  {
    id: 4,
    title: 'Retard livraison acier R5-R8',
    description: 'Fournisseur confirme rupture stock. Livraison repoussée au 30 avril. Impact planning : 12 jours de décalage.',
    severity: 'warning',
    category: 'planning',
    time: '10:18',
    date: "Aujourd'hui",
    acknowledged: false,
    linkedPage: '/planning',
    linkedLabel: 'Voir Planning',
    action: 'Identifier fournisseur alternatif',
  },
  {
    id: 5,
    title: 'Marge projet sous la cible',
    description: 'Marge actuelle 18.4% vs objectif 22%. Écart de 3.6 points. Si la tendance MO se maintient, forecast à risque.',
    severity: 'warning',
    category: 'budget',
    time: '07:00',
    date: "Aujourd'hui",
    acknowledged: true,
    linkedPage: '/financials',
    linkedLabel: 'Voir Financials',
    action: 'Analyser leviers d\'optimisation',
  },
  {
    id: 6,
    title: 'Risque météo semaines 17-18',
    description: 'Prévisions météo : 60% probabilité de pluie jeudi et vendredi. Travaux façade et toiture à risque.',
    severity: 'info',
    category: 'planning',
    time: '11:30',
    date: "Aujourd'hui",
    acknowledged: false,
    action: 'Avancer travaux extérieurs mercredi',
  },
  {
    id: 7,
    title: 'Rapport mensuel client — Deadline vendredi',
    description: 'Le client (Promotion IDF) attend le rapport d\'avancement mensuel avant le 25 avril.',
    severity: 'info',
    category: 'planning',
    time: '09:15',
    date: "Aujourd'hui",
    acknowledged: false,
    linkedPage: '/reports',
    linkedLabel: 'Préparer rapport',
    action: 'Préparer rapport avant vendredi',
  },
  {
    id: 8,
    title: 'Opportunité économie — BétonParis',
    description: 'Fournisseur béton propose 4% de remise sur commande groupée niveaux 5-8. Économie estimée : 28 000 €. Valable jusqu\'au 25 avril.',
    severity: 'info',
    category: 'budget',
    time: '10:42',
    date: "Aujourd'hui",
    acknowledged: false,
    action: 'Confirmer commande groupée',
  },
]

const SEV_CONFIG = {
  critical: {
    label: 'Critique',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-300',
    dot: 'bg-red-500',
    badge: 'bg-red-100 text-red-700',
  },
  warning: {
    label: 'Avertissement',
    icon: TrendingUp,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    dot: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-700',
  },
  info: {
    label: 'Info',
    icon: Bell,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    dot: 'bg-blue-400',
    badge: 'bg-blue-100 text-blue-700',
  },
}

const CAT_LABELS: Record<string, string> = {
  budget: 'Budget', planning: 'Planning', labour: 'Main d\'œuvre',
  risk: 'Risque', quality: 'Qualité', resource: 'Ressources',
}

export default function Alerts() {
  const [alerts, setAlerts] = useState(ALERTS)
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'unread'>('all')

  const filtered = alerts.filter(a => {
    if (filter === 'critical') return a.severity === 'critical'
    if (filter === 'warning') return a.severity === 'warning'
    if (filter === 'unread') return !a.acknowledged
    return true
  })

  function acknowledge(id: number) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a))
  }

  function dismissAll() {
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })))
  }

  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length
  const warningCount = alerts.filter(a => a.severity === 'warning' && !a.acknowledged).length
  const unreadCount = alerts.filter(a => !a.acknowledged).length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
          <p className="text-slate-500 mt-1">Alertes intelligentes — temps réel</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={dismissAll}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Tout marquer lu
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{criticalCount}</div>
          <div className="text-xs text-red-500 font-medium mt-0.5">Critiques non lues</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-amber-600">{warningCount}</div>
          <div className="text-xs text-amber-500 font-medium mt-0.5">Avertissements</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-slate-700">{unreadCount}</div>
          <div className="text-xs text-slate-500 font-medium mt-0.5">Total non lues</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-5 w-fit">
        {([
          { key: 'all', label: `Toutes (${alerts.length})` },
          { key: 'unread', label: `Non lues (${unreadCount})` },
          { key: 'critical', label: 'Critiques' },
          { key: 'warning', label: 'Avertissements' },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.map(alert => {
          const cfg = SEV_CONFIG[alert.severity]
          const Icon = cfg.icon
          return (
            <div
              key={alert.id}
              className={`rounded-xl border p-4 shadow-sm transition-all ${alert.acknowledged ? 'bg-slate-50 border-slate-200 opacity-60' : `${cfg.bg} ${cfg.border}`}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-100' : alert.severity === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-slate-900 ${alert.acknowledged ? 'text-slate-500' : ''}`}>{alert.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{CAT_LABELS[alert.category]}</span>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledge(alert.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                        title="Marquer comme lu"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{alert.description}</p>
                  {alert.action && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
                      <ChevronRight className="w-3.5 h-3.5" />
                      Action : {alert.action}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.date} à {alert.time}
                    </span>
                    {alert.linkedPage && (
                      <Link
                        href={alert.linkedPage}
                        className={`text-xs font-medium flex items-center gap-1 ${cfg.color} hover:underline`}
                      >
                        {alert.linkedLabel}
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                    {alert.acknowledged && (
                      <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Lu
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aucune alerte dans cette catégorie</p>
          </div>
        )}
      </div>
    </div>
  )
}

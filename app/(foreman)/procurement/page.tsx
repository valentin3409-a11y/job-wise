'use client'

import { useState } from 'react'
import {
  ShoppingCart,
  Truck,
  PiggyBank,
  Users,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Star,
  ChevronRight,
} from 'lucide-react'

type OrderStatus = 'confirmed' | 'delayed' | 'transit' | 'pending'
type RiskLevel = 'low' | 'medium' | 'high'

type Order = {
  id: string
  supplier: string
  material: string
  qty: string
  amount: number
  status: OrderStatus
  delivery: string
  risk: RiskLevel
}

const ORDERS: Order[] = [
  { id: 'CMD-001', supplier: 'ArcelorMittal',  material: 'Acier HA Ø12',                qty: '45 tonnes', amount: 44100,  status: 'confirmed', delivery: '2026-05-08', risk: 'low' },
  { id: 'CMD-002', supplier: 'Lafarge Holcim',  material: 'Béton C25/30',                qty: '280 m³',    amount: 33600,  status: 'delayed',   delivery: '2026-05-12', risk: 'high' },
  { id: 'CMD-003', supplier: 'Saint-Gobain',    material: 'Fenêtres PVC double vitrage', qty: '96 u',      amount: 62400,  status: 'transit',   delivery: '2026-05-06', risk: 'medium' },
  { id: 'CMD-004', supplier: 'Nexans',           material: 'Câble électrique 2.5mm²',    qty: '8500 ml',   amount: 23800,  status: 'pending',   delivery: '2026-05-15', risk: 'low' },
  { id: 'CMD-005', supplier: 'Aliaxis',          material: 'PVC assainissement Ø160',    qty: '620 ml',    amount: 11160,  status: 'confirmed', delivery: '2026-05-09', risk: 'low' },
]

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; border: string }> = {
  confirmed: { label: 'Confirmé',   color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  delayed:   { label: 'Retardé',    color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200' },
  transit:   { label: 'En transit', color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200' },
  pending:   { label: 'En attente', color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200' },
}

type SupplierOption = {
  name: string
  pricePerUnit: number
  leadDays: number
  reliability: number
  tag?: 'current' | 'recommended'
}

const SUPPLIER_COMPARISON: SupplierOption[] = [
  { name: 'Lafarge Holcim', pricePerUnit: 120, leadDays: 5, reliability: 94, tag: 'current' },
  { name: 'Vicat',          pricePerUnit: 115, leadDays: 4, reliability: 97, tag: 'recommended' },
  { name: 'Cemex',          pricePerUnit: 128, leadDays: 7, reliability: 89 },
]

type AlertSeverity = 'critical' | 'opportunity' | 'info'

type ProcurementAlert = {
  id: number
  severity: AlertSeverity
  icon: string
  title: string
  description: string
}

const AI_ALERTS: ProcurementAlert[] = [
  {
    id: 1,
    severity: 'critical',
    icon: '⚠️',
    title: 'Livraison béton retardée de 3j',
    description: 'Impact chantier estimé : 45 000 € de pertes de productivité si non résolu sous 48h.',
  },
  {
    id: 2,
    severity: 'opportunity',
    icon: '💡',
    title: 'Prix acier en hausse de 8%',
    description: 'Commander dès maintenant pour économiser 12 400 € avant la prochaine révision tarifaire.',
  },
  {
    id: 3,
    severity: 'info',
    icon: '✅',
    title: 'Fournisseur PLB certifié QUALIBAT',
    description: 'Recommandé pour prochain lot plomberie — fiabilité 96%, délai moyen 3j.',
  },
]

const ALERT_STYLE: Record<AlertSeverity, { bg: string; border: string; title: string }> = {
  critical:    { bg: 'bg-red-50',     border: 'border-red-200',    title: 'text-red-800' },
  opportunity: { bg: 'bg-amber-50',   border: 'border-amber-200',  title: 'text-amber-800' },
  info:        { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-800' },
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace('.0', '')} K€`
  return `${n} €`
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Procurement() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)

  const potentialSaving = 280 * (120 - 115) // 280m³ × 5€

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approvisionnement &amp; Fournisseurs</h1>
          <p className="text-slate-500 mt-1">Comparaison, suivi livraisons, optimisation coûts</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm">
          <ShoppingCart className="w-4 h-4" />
          Nouvelle commande
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Commandes en cours',
            value: '8',
            sub: 'Total : ' + fmt(ORDERS.reduce((s, o) => s + o.amount, 0)),
            icon: ShoppingCart,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Livraisons cette semaine',
            value: '3',
            sub: '1 en retard',
            icon: Truck,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          {
            label: 'Économies réalisées',
            value: '24 500 €',
            sub: 'Ce trimestre',
            icon: PiggyBank,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Fournisseurs actifs',
            value: '12',
            sub: '2 sous surveillance',
            icon: Users,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
          },
        ].map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
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

      {/* Main two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">

        {/* LEFT — Orders table (60%) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Commandes actives</h2>
            <span className="text-xs text-slate-500">{ORDERS.length} commandes</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fournisseur</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Matériau</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantité</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Montant</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Livraison prévue</th>
                  <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ORDERS.map(order => {
                  const st = STATUS_CONFIG[order.status]
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedOrder === order.id ? 'bg-amber-50/60' : ''}`}
                      onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-800">{order.supplier}</div>
                        <div className="text-xs text-slate-400">{order.id}</div>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600 max-w-[140px]">
                        <span className="truncate block">{order.material}</span>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600 text-right whitespace-nowrap">{order.qty}</td>
                      <td className="px-3 py-3 text-sm font-semibold text-slate-800 text-right whitespace-nowrap">
                        {fmt(order.amount)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${st.color} ${st.bg} ${st.border}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-right whitespace-nowrap">
                        <span className={order.status === 'delayed' ? 'text-red-600 font-medium' : 'text-slate-600'}>
                          {fmtDate(order.delivery)}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                          onClick={e => { e.stopPropagation() }}
                        >
                          Détail
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT — Supplier comparison (40%) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-slate-800">Comparaison fournisseurs</h2>
            <p className="text-xs text-slate-500 mt-0.5">Béton C25/30 — 280 m³</p>
          </div>
          <div className="p-4 space-y-3">
            {SUPPLIER_COMPARISON.map(supplier => (
              <div
                key={supplier.name}
                className={`rounded-xl border p-4 transition-all ${
                  supplier.tag === 'recommended'
                    ? 'border-emerald-300 bg-emerald-50'
                    : supplier.tag === 'current'
                    ? 'border-blue-200 bg-blue-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-slate-800 text-sm">{supplier.name}</div>
                  {supplier.tag === 'recommended' && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3" /> RECOMMANDÉ
                    </span>
                  )}
                  {supplier.tag === 'current' && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
                      ACTUEL
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
                  <div className="text-slate-500">Prix unitaire</div>
                  <div className="font-semibold text-slate-800 text-right">{supplier.pricePerUnit} €/m³</div>
                  <div className="text-slate-500">Délai livraison</div>
                  <div className="font-semibold text-slate-800 text-right">{supplier.leadDays} jours</div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Fiabilité</span>
                    <span className={`font-semibold ${supplier.reliability >= 95 ? 'text-emerald-600' : supplier.reliability >= 90 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {supplier.reliability}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${supplier.reliability >= 95 ? 'bg-emerald-400' : supplier.reliability >= 90 ? 'bg-blue-400' : 'bg-amber-400'}`}
                      style={{ width: `${supplier.reliability}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Potential saving */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <PiggyBank className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">Économie potentielle</span>
              </div>
              <div className="text-2xl font-bold text-amber-700">{potentialSaving.toLocaleString('fr-FR')} €</div>
              <div className="text-xs text-amber-600 mt-1">
                En basculant sur Vicat — 280 m³ × 5 €/m³
              </div>
              <button className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                Contacter Vicat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Alerts */}
      <div>
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <span className="w-5 h-5 bg-violet-100 rounded flex items-center justify-center text-xs">🤖</span>
          Alertes IA &amp; Opportunités
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {AI_ALERTS.map(alert => {
            const style = ALERT_STYLE[alert.severity]
            return (
              <div key={alert.id} className={`rounded-xl border p-5 ${style.bg} ${style.border}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl leading-none flex-shrink-0 mt-0.5">{alert.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm ${style.title}`}>{alert.title}</div>
                    <div className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.description}</div>
                    <button className="mt-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                      {alert.severity === 'critical' && (
                        <><AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Voir le détail</>
                      )}
                      {alert.severity === 'opportunity' && (
                        <><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Agir maintenant</>
                      )}
                      {alert.severity === 'info' && (
                        <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Voir le fournisseur</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

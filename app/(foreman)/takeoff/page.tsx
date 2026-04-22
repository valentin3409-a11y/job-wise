'use client'

import { useState } from 'react'
import { Plus, Trash2, Calculator, TrendingUp, Download } from 'lucide-react'

type LineItem = {
  id: number
  description: string
  unit: string
  quantity: number
  unitCost: number
  category: string
}

const INITIAL_ITEMS: LineItem[] = [
  { id: 1,  description: 'Béton C25/30 fondations',       unit: 'm³',  quantity: 180,  unitCost: 145,   category: 'Gros oeuvre' },
  { id: 2,  description: 'Coffrage banche R0-R4',          unit: 'm²',  quantity: 2400, unitCost: 28,    category: 'Gros oeuvre' },
  { id: 3,  description: 'Acier HA — armatures',           unit: 'tonne', quantity: 62, unitCost: 980,   category: 'Gros oeuvre' },
  { id: 4,  description: 'Maçonnerie blocs béton',         unit: 'm²',  quantity: 1850, unitCost: 55,    category: 'Gros oeuvre' },
  { id: 5,  description: 'Chape ciment R0-R4',             unit: 'm²',  quantity: 1200, unitCost: 22,    category: 'Gros oeuvre' },
  { id: 6,  description: 'Canalisations PVC Ø100',         unit: 'ml',  quantity: 420,  unitCost: 18,    category: 'Plomberie' },
  { id: 7,  description: 'Colonnes montantes eau froide',  unit: 'ml',  quantity: 180,  unitCost: 32,    category: 'Plomberie' },
  { id: 8,  description: 'Points de chute sanitaires',     unit: 'u',   quantity: 48,   unitCost: 380,   category: 'Plomberie' },
  { id: 9,  description: 'Câble électrique 2.5mm²',        unit: 'ml',  quantity: 8500, unitCost: 2.8,   category: 'Électricité' },
  { id: 10, description: 'Tableau électrique divisionnaire',unit: 'u',  quantity: 24,   unitCost: 420,   category: 'Électricité' },
  { id: 11, description: 'Menuiseries ext. aluminium',     unit: 'u',   quantity: 96,   unitCost: 1250,  category: 'Menuiserie' },
  { id: 12, description: 'Porte palière coupe-feu',        unit: 'u',   quantity: 32,   unitCost: 780,   category: 'Menuiserie' },
]

const CATEGORIES = ['Tous', 'Gros oeuvre', 'Plomberie', 'Électricité', 'Menuiserie', 'Peinture', 'Carrelage']
const UNITS = ['m²', 'm³', 'ml', 'u', 'tonne', 'forfait', 'h']

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(3)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} K€`
  return `${n.toFixed(0)} €`
}

export default function Takeoff() {
  const [items, setItems] = useState<LineItem[]>(INITIAL_ITEMS)
  const [filterCat, setFilterCat] = useState('Tous')
  const [margin, setMargin] = useState(22)
  const [nextId, setNextId] = useState(13)

  const filtered = filterCat === 'Tous' ? items : items.filter(i => i.category === filterCat)

  const totalCost = items.reduce((s, i) => s + i.quantity * i.unitCost, 0)
  const recommendedPrice = totalCost / (1 - margin / 100)
  const marginAmount = recommendedPrice - totalCost

  function addLine() {
    setItems(prev => [...prev, {
      id: nextId, description: 'Nouvelle ligne', unit: 'm²',
      quantity: 0, unitCost: 0, category: 'Gros oeuvre'
    }])
    setNextId(n => n + 1)
  }

  function updateItem(id: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  function removeItem(id: number) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const byCategory = CATEGORIES.slice(1).map(cat => ({
    cat,
    total: items.filter(i => i.category === cat).reduce((s, i) => s + i.quantity * i.unitCost, 0)
  })).filter(c => c.total > 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Takeoff & Estimation</h1>
          <p className="text-slate-500 mt-1">Quantitatif, coûts automatiques et prix recommandé</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm">
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button
            onClick={addLine}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter ligne
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Coût total estimé</div>
          <div className="text-2xl font-bold text-slate-800">{fmt(totalCost)}</div>
          <div className="text-xs text-slate-500 mt-1">{items.length} lignes de devis</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-2">Prix recommandé</div>
          <div className="text-2xl font-bold text-blue-700">{fmt(recommendedPrice)}</div>
          <div className="text-xs text-blue-500 mt-1">Marge cible {margin}%</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">Marge brute</div>
          <div className="text-2xl font-bold text-emerald-700">{fmt(marginAmount)}</div>
          <div className="text-xs text-emerald-500 mt-1">{margin}% du prix de vente</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Marge cible</div>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="range" min={5} max={40} value={margin}
              onChange={e => setMargin(Number(e.target.value))}
              className="flex-1 accent-amber-500"
            />
            <span className="text-xl font-bold text-amber-600 w-12 text-right">{margin}%</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Ajuster la marge cible</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Cost by category */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-slate-400" />
            Par corps d&apos;état
          </h2>
          <div className="space-y-3">
            {byCategory.map(c => (
              <div key={c.cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{c.cat}</span>
                  <span className="font-semibold text-slate-700">{fmt(c.total)}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(c.total / totalCost) * 100}%` }} />
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{((c.total / totalCost) * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Line items table */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Category filter */}
          <div className="flex gap-1 p-3 border-b border-slate-200 overflow-x-auto">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${filterCat === cat ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Unité</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Quantité</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">P.U. (€)</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Total</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                    <td className="px-4 py-2.5">
                      <input
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        className="w-full text-sm text-slate-800 bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-300 rounded px-1 py-0.5"
                      />
                      <span className="text-xs text-slate-400">{item.category}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={item.unit}
                        onChange={e => updateItem(item.id, 'unit', e.target.value)}
                        className="text-xs text-slate-600 bg-transparent border-0 focus:outline-none w-full"
                      >
                        {UNITS.map(u => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full text-sm text-slate-700 text-right bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-300 rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={e => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="w-full text-sm text-slate-700 text-right bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-300 rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-sm font-semibold text-slate-800 text-right">
                      {fmt(item.quantity * item.unitCost)}
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-800">
                    {filterCat === 'Tous' ? 'TOTAL' : `Total — ${filterCat}`}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-slate-800 text-right">
                    {fmt(filtered.reduce((s, i) => s + i.quantity * i.unitCost, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

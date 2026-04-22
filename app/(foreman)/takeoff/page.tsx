'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, Download, Upload, FileText, Loader2, CheckCircle, AlertTriangle, Ruler } from 'lucide-react'
import { useProject } from '@/lib/foreman/project-context'

type LineItem = {
  id: number
  description: string
  unit: string
  quantity: number
  unitCost: number
  category: string
}

const UNITS = ['m²', 'm³', 'ml', 'u', 'tonne', 'forfait', 'h']
const CATEGORIES = ['Tous', 'Gros oeuvre', 'Plomberie', 'Électricité', 'Menuiserie', 'Peinture', 'Carrelage', 'VRD', 'Autre']

const INITIAL_ITEMS: LineItem[] = [
  { id: 1,  description: 'Béton C25/30 fondations',        unit: 'm³',   quantity: 180,  unitCost: 145,  category: 'Gros oeuvre' },
  { id: 2,  description: 'Coffrage banche R0-R4',           unit: 'm²',   quantity: 2400, unitCost: 28,   category: 'Gros oeuvre' },
  { id: 3,  description: 'Acier HA — armatures',            unit: 'tonne', quantity: 62,  unitCost: 980,  category: 'Gros oeuvre' },
  { id: 4,  description: 'Maçonnerie blocs béton',          unit: 'm²',   quantity: 1850, unitCost: 55,   category: 'Gros oeuvre' },
  { id: 5,  description: 'Canalisations PVC Ø100',          unit: 'ml',   quantity: 420,  unitCost: 18,   category: 'Plomberie' },
  { id: 6,  description: 'Points de chute sanitaires',      unit: 'u',    quantity: 48,   unitCost: 380,  category: 'Plomberie' },
  { id: 7,  description: 'Câble électrique 2.5mm²',         unit: 'ml',   quantity: 8500, unitCost: 2.8,  category: 'Électricité' },
  { id: 8,  description: 'Tableau divisionnaire',           unit: 'u',    quantity: 24,   unitCost: 420,  category: 'Électricité' },
  { id: 9,  description: 'Menuiseries ext. aluminium',      unit: 'u',    quantity: 96,   unitCost: 1250, category: 'Menuiserie' },
  { id: 10, description: 'Porte palière coupe-feu',         unit: 'u',    quantity: 32,   unitCost: 780,  category: 'Menuiserie' },
]

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(3)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} K€`
  return `${n.toFixed(0)} €`
}

type AIResult = {
  surfaces: { shob: number; shon: number; plancher: number; facade: number }
  items: { description: string; category: string; unit: string; quantity: number; unitCost: number }[]
  confidence: 'high' | 'medium' | 'low'
  notes: string
  extractedInfo: { levels: number; logements: number; surface_totale: number }
}

export default function Takeoff() {
  const { currentProject } = useProject()
  const [tab, setTab] = useState<'metré' | 'lecture'>('lecture')
  const [items, setItems] = useState<LineItem[]>(INITIAL_ITEMS)
  const [filterCat, setFilterCat] = useState('Tous')
  const [margin, setMargin] = useState(22)
  const [nextId, setNextId] = useState(11)

  // Plan reading state
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const STEPS = [
    'Lecture du fichier…',
    'Extraction du texte…',
    'Analyse IA des surfaces…',
    'Calcul des quantités…',
    'Génération du métré…',
  ]

  const filtered = filterCat === 'Tous' ? items : items.filter(i => i.category === filterCat)
  const totalCost = items.reduce((s, i) => s + i.quantity * i.unitCost, 0)
  const recommendedPrice = totalCost / (1 - margin / 100)

  function addLine() {
    setItems(prev => [...prev, { id: nextId, description: 'Nouvelle ligne', unit: 'm²', quantity: 0, unitCost: 0, category: 'Gros oeuvre' }])
    setNextId(n => n + 1)
  }

  function updateItem(id: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  function removeItem(id: number) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function importAIItems() {
    if (!aiResult) return
    const newItems = aiResult.items.map((item, i) => ({
      id: nextId + i,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      unitCost: item.unitCost,
      category: item.category,
    }))
    setItems(prev => [...prev, ...newItems])
    setNextId(n => n + newItems.length)
    setTab('metré')
  }

  async function analyzeFile(file: File) {
    setUploadedFile(file)
    setAnalyzing(true)
    setError('')
    setAiResult(null)
    setAnalysisStep(0)

    try {
      // Read file as text (works for .txt, basic .pdf text layer)
      let planText = ''

      if (file.type === 'text/plain') {
        planText = await file.text()
      } else {
        // For PDFs, send file to extract text
        const formData = new FormData()
        formData.append('file', file)
        // Simulate step progression
        for (let s = 0; s < STEPS.length - 1; s++) {
          await new Promise(r => setTimeout(r, 600))
          setAnalysisStep(s + 1)
        }
        // Use filename + type as context if can't parse PDF client-side
        planText = `Plan PDF: ${file.name}\nTaille: ${(file.size / 1024).toFixed(0)} KB\nProjet: ${currentProject.name}\nType: ${currentProject.type}\nBudget estimé: ${currentProject.budget.toLocaleString()} €`
      }

      // Animate steps
      for (let s = analysisStep; s < STEPS.length; s++) {
        await new Promise(r => setTimeout(r, 500))
        setAnalysisStep(s)
      }

      const res = await fetch('/api/foreman/takeoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planText,
          projectType: currentProject.type,
          projectName: currentProject.name,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erreur analyse')
      setAiResult(json.data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue')
    } finally {
      setAnalyzing(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) analyzeFile(file)
  }

  const CONF_CONFIG = {
    high: { label: 'Confiance élevée', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    medium: { label: 'Confiance moyenne', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    low: { label: 'Estimations indicatives', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  }

  const byCategory = CATEGORIES.slice(1).map(cat => ({
    cat,
    total: items.filter(i => i.category === cat).reduce((s, i) => s + i.quantity * i.unitCost, 0)
  })).filter(c => c.total > 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Takeoff & Estimation</h1>
          <p className="text-slate-500 mt-1">{currentProject.name} · Quantitatif et prix recommandé</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium px-4 py-2.5 rounded-lg text-sm shadow-sm">
            <Download className="w-4 h-4" /> Exporter
          </button>
          {tab === 'metré' && (
            <button onClick={addLine} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm shadow-sm">
              <Plus className="w-4 h-4" /> Ajouter ligne
            </button>
          )}
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Coût total estimé</div>
          <div className="text-2xl font-bold text-slate-800">{fmt(totalCost)}</div>
          <div className="text-xs text-slate-500 mt-1">{items.length} lignes</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-2">Prix recommandé</div>
          <div className="text-2xl font-bold text-blue-700">{fmt(recommendedPrice)}</div>
          <div className="text-xs text-blue-500 mt-1">Marge cible {margin}%</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2">Marge brute</div>
          <div className="text-2xl font-bold text-emerald-700">{fmt(recommendedPrice - totalCost)}</div>
          <div className="text-xs text-emerald-500 mt-1">{margin}% du prix de vente</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Marge cible</div>
          <div className="flex items-center gap-2 mt-2">
            <input type="range" min={5} max={40} value={margin} onChange={e => setMargin(Number(e.target.value))} className="flex-1 accent-amber-500" />
            <span className="text-xl font-bold text-amber-600 w-12 text-right">{margin}%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg mb-6 w-fit">
        {([
          { id: 'lecture', label: '🧠 Lecture de plans (IA)' },
          { id: 'metré', label: '📋 Métré manuel' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* LECTURE DE PLANS */}
      {tab === 'lecture' && (
        <div className="space-y-4">
          {/* Upload zone */}
          {!analyzing && !aiResult && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                dragOver ? 'border-amber-400 bg-amber-50' : 'border-slate-300 hover:border-amber-400 hover:bg-amber-50/30'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) analyzeFile(f) }}
              />
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Déposez votre plan ici</h3>
              <p className="text-slate-500 text-sm mb-4">PDF, plans DXF (texte), fichiers de données · Glissez-déposez ou cliquez</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['PDF', 'Plan texte', 'Export CAD', 'Tableau Excel'].map(f => (
                  <span key={f} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">{f}</span>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-md mx-auto text-left">
                <div className="text-xs font-semibold text-blue-700 mb-1">Comment ça fonctionne</div>
                <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                  <li>Importez votre plan PDF ou fichier texte</li>
                  <li>L'IA extrait les surfaces, dimensions et quantités</li>
                  <li>Le métré est généré automatiquement avec les coûts</li>
                  <li>Ajustez et exportez en devis</li>
                </ol>
              </div>
            </div>
          )}

          {/* Analyzing */}
          {analyzing && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Analyse en cours…</h3>
              <p className="text-slate-500 text-sm mb-6">{uploadedFile?.name}</p>
              <div className="max-w-sm mx-auto space-y-2">
                {STEPS.map((step, i) => (
                  <div key={step} className={`flex items-center gap-3 text-sm transition-all ${i <= analysisStep ? 'text-slate-800' : 'text-slate-300'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      i < analysisStep ? 'bg-emerald-500' : i === analysisStep ? 'bg-violet-500' : 'bg-slate-200'
                    }`}>
                      {i < analysisStep
                        ? <CheckCircle className="w-3 h-3 text-white" />
                        : i === analysisStep
                          ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                          : <div className="w-2 h-2 bg-white rounded-full" />
                      }
                    </div>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && !analyzing && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-700">Erreur d&apos;analyse</div>
                <div className="text-sm text-red-600 mt-0.5">{error}</div>
                <button onClick={() => { setError(''); setUploadedFile(null) }} className="text-xs text-red-500 underline mt-2">Réessayer</button>
              </div>
            </div>
          )}

          {/* AI Results */}
          {aiResult && !analyzing && (
            <div className="space-y-4">
              {/* Header */}
              <div className={`flex items-start justify-between p-4 rounded-xl border ${CONF_CONFIG[aiResult.confidence].bg} ${CONF_CONFIG[aiResult.confidence].border}`}>
                <div className="flex items-start gap-3">
                  <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${CONF_CONFIG[aiResult.confidence].color}`} />
                  <div>
                    <div className={`font-semibold ${CONF_CONFIG[aiResult.confidence].color}`}>
                      {CONF_CONFIG[aiResult.confidence].label} · {uploadedFile?.name}
                    </div>
                    <div className="text-sm text-slate-600 mt-0.5">{aiResult.notes}</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={importAIItems}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Importer dans le métré →
                  </button>
                  <button
                    onClick={() => { setAiResult(null); setUploadedFile(null) }}
                    className="bg-white border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-50"
                  >
                    Nouveau
                  </button>
                </div>
              </div>

              {/* Surfaces */}
              {(aiResult.surfaces.plancher > 0 || aiResult.extractedInfo.surface_totale > 0) && (
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-slate-400" />
                    Surfaces extraites
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'SHOB', value: aiResult.surfaces.shob },
                      { label: 'SHON', value: aiResult.surfaces.shon },
                      { label: 'Surface plancher', value: aiResult.surfaces.plancher },
                      { label: 'Surface façades', value: aiResult.surfaces.facade },
                    ].filter(s => s.value > 0).map(s => (
                      <div key={s.label} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-500">{s.label}</div>
                        <div className="text-xl font-bold text-slate-800">{s.value.toLocaleString()} m²</div>
                      </div>
                    ))}
                    {aiResult.extractedInfo.levels > 0 && (
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-500">Niveaux</div>
                        <div className="text-xl font-bold text-slate-800">{aiResult.extractedInfo.levels}</div>
                      </div>
                    )}
                    {aiResult.extractedInfo.logements > 0 && (
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <div className="text-xs text-slate-500">Logements</div>
                        <div className="text-xl font-bold text-slate-800">{aiResult.extractedInfo.logements}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Extracted items */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Quantités extraites par l&apos;IA</h3>
                  <span className="text-xs text-slate-500">{aiResult.items.length} postes · Total : {fmt(aiResult.items.reduce((s, i) => s + i.quantity * i.unitCost, 0))}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">Description</th>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Catégorie</th>
                        <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Qté</th>
                        <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">P.U.</th>
                        <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {aiResult.items.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 text-sm text-slate-800">{item.description}</td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">{item.category}</span>
                          </td>
                          <td className="px-3 py-2.5 text-sm text-slate-600 text-right">{item.quantity} {item.unit}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-600 text-right">{item.unitCost} €</td>
                          <td className="px-3 py-2.5 text-sm font-semibold text-slate-800 text-right">{fmt(item.quantity * item.unitCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MÉTRÉ MANUEL */}
      {tab === 'metré' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Répartition */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">Par corps d&apos;état</h2>
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
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex gap-1 p-3 border-b border-slate-200 overflow-x-auto">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setFilterCat(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${filterCat === cat ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Description</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase w-20">Unité</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase w-24">Quantité</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase w-28">P.U. (€)</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase w-28">Total</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                      <td className="px-4 py-2.5">
                        <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)}
                          className="w-full text-sm text-slate-800 bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-300 rounded px-1 py-0.5" />
                        <span className="text-xs text-slate-400">{item.category}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <select value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}
                          className="text-xs text-slate-600 bg-transparent border-0 focus:outline-none w-full">
                          {UNITS.map(u => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full text-sm text-slate-700 text-right bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-300 rounded px-1 py-0.5" />
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="number" value={item.unitCost} onChange={e => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-full text-sm text-slate-700 text-right bg-transparent border-0 focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-300 rounded px-1 py-0.5" />
                      </td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-slate-800 text-right">{fmt(item.quantity * item.unitCost)}</td>
                      <td className="px-2 py-2.5">
                        <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-800">TOTAL</td>
                    <td className="px-3 py-3 text-sm font-bold text-slate-800 text-right">{fmt(filtered.reduce((s, i) => s + i.quantity * i.unitCost, 0))}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

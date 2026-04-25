'use client'

import { useState, useRef } from 'react'
import { Upload, Camera, X, FileText, Loader2, CheckCircle, AlertTriangle, Ruler, Brain, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'
import { useProject } from '@/lib/foreman/project-context'

type AIResult = {
  surfaces: { shob: number; shon: number; plancher: number; facade: number }
  items: { description: string; category: string; unit: string; quantity: number; unitCost: number }[]
  confidence: 'high' | 'medium' | 'low'
  notes: string
  extractedInfo: { levels: number; logements: number; surface_totale: number }
}

type Plan = {
  id: string
  name: string
  type: string
  date: string
  isDemo: boolean
  result?: AIResult
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K€`
  return `${Math.round(n)} €`
}

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/* ── SVG Demo Plans ── */
function PlanT3() {
  return (
    <svg viewBox="0 0 320 220" className="w-full h-full" style={{ background: '#f8fafc' }}>
      <rect x="0" y="195" width="320" height="25" fill="#1e293b"/>
      <text x="160" y="207" textAnchor="middle" fill="white" fontSize="7" fontFamily="monospace">APT T3 — 62m² — RDC — Tour Belvédère</text>
      <text x="160" y="216" textAnchor="middle" fill="#94a3b8" fontSize="5.5" fontFamily="monospace">Plan d&apos;architecte — Réf: TB-RDC-T3-001 — Éch. 1:50</text>
      {[40,80,120,160,200,240,280].map(x => <line key={x} x1={x} y1="0" x2={x} y2="195" stroke="#f1f5f9" strokeWidth="0.5"/>)}
      {[40,80,120,160].map(y => <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#f1f5f9" strokeWidth="0.5"/>)}
      {/* Outer walls */}
      <rect x="12" y="12" width="296" height="178" fill="white" stroke="#1e293b" strokeWidth="5"/>
      {/* Interior walls */}
      <line x1="75" y1="12" x2="75" y2="145" stroke="#1e293b" strokeWidth="3"/>
      <line x1="12" y1="145" x2="200" y2="145" stroke="#1e293b" strokeWidth="3"/>
      <line x1="200" y1="12" x2="200" y2="190" stroke="#1e293b" strokeWidth="3"/>
      <line x1="200" y1="120" x2="308" y2="120" stroke="#1e293b" strokeWidth="3"/>
      <line x1="12" y1="110" x2="75" y2="110" stroke="#1e293b" strokeWidth="2"/>
      {/* Door gaps + arcs */}
      <rect x="75" y="118" width="22" height="5" fill="#f8fafc"/>
      <path d="M 75 145 Q 97 145 97 123" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="2,1"/>
      <line x1="75" y1="123" x2="75" y2="145" stroke="#64748b" strokeWidth="1.2"/>
      <rect x="112" y="143" width="28" height="5" fill="#f8fafc"/>
      <path d="M 112 145 Q 112 167 134 167" fill="none" stroke="#64748b" strokeWidth="1.2" strokeDasharray="2,1"/>
      <line x1="112" y1="145" x2="134" y2="145" stroke="#64748b" strokeWidth="1.2"/>
      {/* Windows */}
      <rect x="90" y="187" width="90" height="5" fill="#e0f2fe"/>
      <line x1="90" y1="189" x2="180" y2="189" stroke="#93c5fd" strokeWidth="2"/>
      <rect x="308" y="30" width="5" height="60" fill="#e0f2fe"/>
      <line x1="310" y1="30" x2="310" y2="90" stroke="#93c5fd" strokeWidth="2"/>
      {/* Room fills */}
      <rect x="14" y="14" width="59" height="94" fill="#f0f9ff" opacity="0.6"/>
      <rect x="14" y="112" width="59" height="31" fill="#fdf4ff" opacity="0.6"/>
      <rect x="14" y="147" width="59" height="41" fill="#f0fdf4" opacity="0.6"/>
      <rect x="77" y="14" width="121" height="129" fill="#fffbeb" opacity="0.4"/>
      <rect x="77" y="147" width="121" height="41" fill="#fefce8" opacity="0.4"/>
      <rect x="202" y="14" width="104" height="104" fill="#f5f3ff" opacity="0.5"/>
      <rect x="202" y="122" width="104" height="66" fill="#fdf4ff" opacity="0.5"/>
      {/* Labels */}
      <text x="43" y="55" textAnchor="middle" fill="#334155" fontSize="7" fontFamily="sans-serif" fontWeight="bold">SDB</text>
      <text x="43" y="64" textAnchor="middle" fill="#94a3b8" fontSize="5.5" fontFamily="sans-serif">5 m²</text>
      <text x="43" y="130" textAnchor="middle" fill="#334155" fontSize="7" fontFamily="sans-serif" fontWeight="bold">WC</text>
      <text x="43" y="138" textAnchor="middle" fill="#94a3b8" fontSize="5.5" fontFamily="sans-serif">2 m²</text>
      <text x="43" y="167" textAnchor="middle" fill="#334155" fontSize="7" fontFamily="sans-serif" fontWeight="bold">ENTRÉE</text>
      <text x="43" y="175" textAnchor="middle" fill="#94a3b8" fontSize="5.5" fontFamily="sans-serif">4 m²</text>
      <text x="137" y="72" textAnchor="middle" fill="#334155" fontSize="9" fontFamily="sans-serif" fontWeight="bold">SÉJOUR</text>
      <text x="137" y="83" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="sans-serif">25 m²</text>
      <text x="137" y="163" textAnchor="middle" fill="#334155" fontSize="8" fontFamily="sans-serif" fontWeight="bold">CUISINE</text>
      <text x="137" y="172" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="sans-serif">11 m²</text>
      <text x="254" y="62" textAnchor="middle" fill="#334155" fontSize="9" fontFamily="sans-serif" fontWeight="bold">CH. 1</text>
      <text x="254" y="73" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="sans-serif">12 m²</text>
      <text x="254" y="155" textAnchor="middle" fill="#334155" fontSize="8" fontFamily="sans-serif" fontWeight="bold">CH. 2</text>
      <text x="254" y="165" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="sans-serif">10 m²</text>
      {/* Dims */}
      <line x1="12" y1="6" x2="308" y2="6" stroke="#94a3b8" strokeWidth="0.5"/>
      <line x1="12" y1="4" x2="12" y2="8" stroke="#94a3b8" strokeWidth="0.5"/>
      <line x1="308" y1="4" x2="308" y2="8" stroke="#94a3b8" strokeWidth="0.5"/>
      <text x="160" y="5" textAnchor="middle" fill="#94a3b8" fontSize="5.5" fontFamily="monospace">14.80 m</text>
      {/* North */}
      <polygon points="295,18 291,28 295,26 299,28" fill="#1e293b"/>
      <text x="295" y="36" textAnchor="middle" fill="#1e293b" fontSize="7" fontFamily="sans-serif" fontWeight="bold">N</text>
    </svg>
  )
}

function PlanFacade() {
  return (
    <svg viewBox="0 0 320 220" className="w-full h-full" style={{ background: '#f8fafc' }}>
      <rect x="0" y="195" width="320" height="25" fill="#1e293b"/>
      <text x="160" y="207" textAnchor="middle" fill="white" fontSize="7" fontFamily="monospace">FAÇADE PRINCIPALE — Élévation Est — Tour Belvédère</text>
      <text x="160" y="216" textAnchor="middle" fill="#94a3b8" fontSize="5.5" fontFamily="monospace">Plan d&apos;architecte — Réf: TB-FAC-EST-001 — Éch. 1:100</text>
      {/* Sky */}
      <rect x="0" y="0" width="320" height="195" fill="#f0f9ff"/>
      {/* Ground */}
      <rect x="0" y="178" width="320" height="17" fill="#e2e8f0"/>
      <line x1="0" y1="178" x2="320" y2="178" stroke="#94a3b8" strokeWidth="1"/>
      {/* Building body */}
      <rect x="40" y="18" width="240" height="160" fill="white" stroke="#1e293b" strokeWidth="3"/>
      {/* Floor lines */}
      {[38,58,78,98,118,138,158].map((y, i) => (
        <g key={y}>
          <line x1="40" y1={y+20} x2="280" y2={y+20} stroke="#e2e8f0" strokeWidth="1"/>
          <text x="30" y={y+20+5} textAnchor="middle" fill="#94a3b8" fontSize="5.5" fontFamily="monospace">R{8-i}</text>
        </g>
      ))}
      {/* Windows grid 5x8 */}
      {Array.from({length:8}, (_,row) => Array.from({length:5}, (_,col) => (
        <rect key={`${row}-${col}`} x={58+col*38} y={22+row*20} width={24} height={14} fill="#bae6fd" stroke="#93c5fd" strokeWidth="1" rx="1"/>
      )))}
      {/* Ground floor entrance */}
      <rect x="130" y="158" width="60" height="20" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.5"/>
      <line x1="160" y1="158" x2="160" y2="178" stroke="#64748b" strokeWidth="1"/>
      <text x="160" y="171" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="sans-serif">ENTRÉE</text>
      {/* Roof parapet */}
      <rect x="38" y="14" width="244" height="6" fill="#334155" stroke="#1e293b" strokeWidth="1"/>
      {/* Scale bar */}
      <rect x="220" y="184" width="40" height="3" fill="#64748b"/>
      <line x1="220" y1="182" x2="220" y2="188" stroke="#64748b" strokeWidth="1"/>
      <line x1="260" y1="182" x2="260" y2="188" stroke="#64748b" strokeWidth="1"/>
      <text x="240" y="192" textAnchor="middle" fill="#64748b" fontSize="5.5" fontFamily="monospace">10 m</text>
      {/* Height dim */}
      <line x1="285" y1="18" x2="285" y2="178" stroke="#94a3b8" strokeWidth="0.5"/>
      <text x="300" y="100" fill="#94a3b8" fontSize="5.5" fontFamily="monospace" transform="rotate(90 300 100)">32.50 m</text>
    </svg>
  )
}

function PlanMasse() {
  return (
    <svg viewBox="0 0 320 220" className="w-full h-full" style={{ background: '#f8fafc' }}>
      <rect x="0" y="195" width="320" height="25" fill="#1e293b"/>
      <text x="160" y="207" textAnchor="middle" fill="white" fontSize="7" fontFamily="monospace">PLAN DE MASSE — Site Tour Belvédère — Paris 15e</text>
      <text x="160" y="216" textAnchor="middle" fill="#94a3b8" fontSize="5.5" fontFamily="monospace">Plan d&apos;architecte — Réf: TB-MASSE-001 — Éch. 1:500</text>
      {/* Trottoirs / voirie */}
      <rect x="0" y="0" width="320" height="195" fill="#f1f5f9"/>
      {/* Road */}
      <rect x="0" y="0" width="35" height="195" fill="#e2e8f0"/>
      <rect x="0" y="0" width="320" height="25" fill="#e2e8f0"/>
      <line x1="35" y1="0" x2="35" y2="195" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4,3"/>
      <line x1="0" y1="25" x2="320" y2="25" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4,3"/>
      <text x="17" y="110" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="sans-serif" transform="rotate(-90 17 110)">Rue Brancion</text>
      <text x="160" y="16" textAnchor="middle" fill="#94a3b8" fontSize="6" fontFamily="sans-serif">Boulevard Lefebvre</text>
      {/* Green spaces */}
      <rect x="45" y="35" width="45" height="60" fill="#d1fae5" stroke="#6ee7b7" strokeWidth="1" rx="3"/>
      <text x="67" y="60" textAnchor="middle" fill="#059669" fontSize="6" fontFamily="sans-serif" fontWeight="bold">Espace</text>
      <text x="67" y="69" textAnchor="middle" fill="#059669" fontSize="6" fontFamily="sans-serif">vert</text>
      <text x="67" y="78" textAnchor="middle" fill="#059669" fontSize="5.5" fontFamily="sans-serif">620 m²</text>
      {/* Parking */}
      <rect x="45" y="110" width="65" height="75" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="1"/>
      {Array.from({length:4}, (_,row) => Array.from({length:3}, (_,col) => (
        <rect key={`p${row}-${col}`} x={48+col*20} y={113+row*17} width={17} height={13} fill="white" stroke="#d1d5db" strokeWidth="0.8"/>
      )))}
      <text x="77" y="190" textAnchor="middle" fill="#6b7280" fontSize="6" fontFamily="sans-serif">Parking 45 pl.</text>
      {/* Main building */}
      <rect x="125" y="45" width="110" height="130" fill="#fbbf24" stroke="#d97706" strokeWidth="2.5"/>
      <rect x="145" y="45" width="70" height="130" fill="#fde68a" stroke="#d97706" strokeWidth="1" strokeDasharray="3,2"/>
      <text x="180" y="103" textAnchor="middle" fill="#92400e" fontSize="9" fontFamily="sans-serif" fontWeight="bold">TOUR</text>
      <text x="180" y="115" textAnchor="middle" fill="#92400e" fontSize="9" fontFamily="sans-serif" fontWeight="bold">BELVÉDÈRE</text>
      <text x="180" y="127" textAnchor="middle" fill="#b45309" fontSize="7" fontFamily="sans-serif">R+9 — 1 760 m²</text>
      {/* Annexe */}
      <rect x="245" y="120" width="65" height="55" fill="#e0e7ff" stroke="#818cf8" strokeWidth="1.5"/>
      <text x="277" y="148" textAnchor="middle" fill="#4338ca" fontSize="6.5" fontFamily="sans-serif" fontWeight="bold">Local</text>
      <text x="277" y="158" textAnchor="middle" fill="#4338ca" fontSize="6.5" fontFamily="sans-serif">technique</text>
      {/* North arrow */}
      <polygon points="295,32 291,44 295,42 299,44" fill="#1e293b"/>
      <text x="295" y="50" textAnchor="middle" fill="#1e293b" fontSize="7" fontFamily="sans-serif" fontWeight="bold">N</text>
      {/* Scale */}
      <rect x="50" y="186" width="50" height="3" fill="#64748b"/>
      <line x1="50" y1="184" x2="50" y2="190" stroke="#64748b" strokeWidth="1"/>
      <line x1="100" y1="184" x2="100" y2="190" stroke="#64748b" strokeWidth="1"/>
      <text x="75" y="193" textAnchor="middle" fill="#64748b" fontSize="5.5" fontFamily="monospace">50 m</text>
    </svg>
  )
}

const DEMO_PLANS: Plan[] = [
  { id: 'demo-1', name: 'Appartement T3 — Plan masse RDC',   type: 'Plan architectural', date: '2026-01-15', isDemo: true },
  { id: 'demo-2', name: 'Façade Principale — Élévation Est', type: 'Plan de façade',      date: '2026-01-15', isDemo: true },
  { id: 'demo-3', name: 'Plan de masse — Site complet',      type: 'Plan de masse',       date: '2026-01-15', isDemo: true },
]

const CONF_CONFIG = {
  high:   { label: 'Confiance élevée',      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  medium: { label: 'Confiance moyenne',     color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  low:    { label: 'Estimations indicatives',color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200' },
}

const STEPS = ['Lecture des fichiers…', 'Préparation IA…', 'Analyse des plans…', 'Extraction des quantités…', 'Génération du métré…']

function DemoSVG({ id }: { id: string }) {
  if (id === 'demo-1') return <PlanT3 />
  if (id === 'demo-2') return <PlanFacade />
  return <PlanMasse />
}

export default function Plans() {
  const { currentProject } = useProject()
  const [uploadedFiles, setUploadedFiles]     = useState<File[]>([])
  const [thumbnails, setThumbnails]           = useState<Record<string, string>>({})
  const [plans, setPlans]                     = useState<Plan[]>(DEMO_PLANS)
  const [analyzing, setAnalyzing]             = useState(false)
  const [analyzeStep, setAnalyzeStep]         = useState(0)
  const [activePlan, setActivePlan]           = useState<string | null>(null)
  const [activeResult, setActiveResult]       = useState<AIResult | null>(null)
  const [expandedResult, setExpandedResult]   = useState(false)
  const [dragOver, setDragOver]               = useState(false)
  const [error, setError]                     = useState('')
  const fileRef   = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  function addFiles(list: FileList) {
    const remaining = 100 - uploadedFiles.length
    const newFiles = Array.from(list).slice(0, remaining)
    newFiles.forEach(f => {
      if (f.type.startsWith('image/')) {
        setThumbnails(prev => ({ ...prev, [f.name + f.size]: URL.createObjectURL(f) }))
      }
    })
    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  function removeFile(i: number) {
    setUploadedFiles(prev => {
      const f = prev[i]
      const key = f.name + f.size
      if (thumbnails[key]) URL.revokeObjectURL(thumbnails[key])
      setThumbnails(t => { const n = { ...t }; delete n[key]; return n })
      return prev.filter((_, j) => j !== i)
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  async function analyzeUploadedFiles() {
    if (!uploadedFiles.length || analyzing) return
    setAnalyzing(true); setError(''); setAnalyzeStep(0)
    try {
      const toProcess = uploadedFiles.slice(0, 20)
      const fileData: { name: string; type: string; data: string }[] = []
      for (let i = 0; i < toProcess.length; i++) {
        setAnalyzeStep(Math.floor(i / toProcess.length * 2))
        const f = toProcess[i]
        if (f.type.startsWith('image/')) {
          fileData.push({ name: f.name, type: f.type, data: await toBase64(f) })
        } else {
          try { fileData.push({ name: f.name, type: 'text/plain', data: (await f.text()).slice(0, 6000) }) }
          catch { fileData.push({ name: f.name, type: 'text/plain', data: `${f.name} (${f.size} bytes)` }) }
        }
      }
      setAnalyzeStep(2)
      await new Promise(r => setTimeout(r, 400))
      setAnalyzeStep(3)
      const res = await fetch('/api/foreman/takeoff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileData, projectType: currentProject.type, projectName: currentProject.name }),
      })
      setAnalyzeStep(4)
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Erreur analyse')
      const newPlan: Plan = { id: `plan-${Date.now()}`, name: uploadedFiles.length === 1 ? uploadedFiles[0].name : `${uploadedFiles.length} fichiers importés`, type: 'Import', date: new Date().toLocaleDateString('fr-FR'), isDemo: false, result: json.data }
      setPlans(prev => [newPlan, ...prev])
      setActivePlan(newPlan.id); setActiveResult(json.data); setExpandedResult(true)
      setUploadedFiles([]); setThumbnails({})
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue')
    } finally {
      setAnalyzing(false)
    }
  }

  async function analyzeDemoPlan(plan: Plan) {
    if (analyzing) return
    setActivePlan(plan.id); setAnalyzing(true); setError('')
    for (let s = 0; s < STEPS.length; s++) {
      setAnalyzeStep(s); await new Promise(r => setTimeout(r, 500))
    }
    try {
      const res = await fetch('/api/foreman/takeoff', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planText: `Plan architectural: ${plan.name}\nType: ${plan.type}\nProjet: ${currentProject.name}\nType projet: ${currentProject.type}`, projectType: currentProject.type, projectName: currentProject.name }),
      })
      const json = await res.json()
      if (json.success) {
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, result: json.data } : p))
        setActiveResult(json.data); setExpandedResult(true)
      }
    } catch { /* silent */ }
    finally { setAnalyzing(false) }
  }

  const hasPendingFiles = uploadedFiles.length > 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Plans & Documents techniques</h1>
        <p className="text-slate-500 mt-1">Import, analyse IA multi-pages, bibliothèque de plans — jusqu&apos;à 100 pages simultanées</p>
      </div>

      {/* ── Upload Zone ── */}
      {!hasPendingFiles && !analyzing && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all mb-6 ${dragOver ? 'border-amber-400 bg-amber-50' : 'border-slate-300 hover:border-amber-300 hover:bg-amber-50/20'}`}
        >
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Importez vos plans</h3>
          <p className="text-slate-500 text-sm mb-5">Glissez-déposez jusqu&apos;à 100 pages — PDF, images, photos de plans</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-amber-400 text-slate-700 font-medium px-5 py-2.5 rounded-xl text-sm shadow-sm transition-all">
              <ImageIcon className="w-4 h-4 text-amber-500" /> Importer des fichiers
            </button>
            <button onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-400 text-slate-700 font-medium px-5 py-2.5 rounded-xl text-sm shadow-sm transition-all">
              <Camera className="w-4 h-4 text-blue-500" /> Prendre une photo
            </button>
            <input ref={fileRef} type="file" accept=".pdf,image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
          </div>
          <div className="flex gap-2 justify-center mt-4 flex-wrap">
            {['PDF', 'PNG / JPG', 'Photos de plans', 'DXF export'].map(f => (
              <span key={f} className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── File Queue ── */}
      {hasPendingFiles && !analyzing && (
        <div className="bg-white rounded-2xl border border-amber-300 shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-amber-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-slate-800">{uploadedFiles.length} fichier(s) — prêt pour analyse</span>
              {uploadedFiles.length > 20 && (
                <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full">⚠️ Les 20 premiers seront analysés</span>
              )}
            </div>
            <button onClick={() => { setUploadedFiles([]); setThumbnails({}) }} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Tout effacer</button>
          </div>
          <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
            {uploadedFiles.map((f, i) => {
              const key = f.name + f.size
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                  {thumbnails[key]
                    ? <img src={thumbnails[key]} alt="" className="w-10 h-10 rounded object-cover border border-slate-200 flex-shrink-0" />
                    : <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-slate-400" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{f.name}</div>
                    <div className="text-xs text-slate-400">{(f.size / 1024).toFixed(0)} KB · {f.type.split('/')[1]?.toUpperCase() || 'FILE'}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${i < 20 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
                    {i < 20 ? `#${i + 1}` : 'skip'}
                  </span>
                  <button onClick={() => removeFile(i)} className="p-1 text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"><X className="w-4 h-4" /></button>
                </div>
              )
            })}
          </div>
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <ImageIcon className="w-4 h-4" /> Ajouter
            </button>
            <button onClick={() => cameraRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
              <Camera className="w-4 h-4" /> Photo
            </button>
            <input ref={fileRef} type="file" accept=".pdf,image/*" multiple className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => e.target.files && addFiles(e.target.files)} />
            <div className="flex-1" />
            <button onClick={analyzeUploadedFiles}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2 rounded-xl text-sm shadow-sm transition-colors">
              <Brain className="w-4 h-4" /> Analyser {uploadedFiles.length} plan{uploadedFiles.length > 1 ? 's' : ''} →
            </button>
          </div>
        </div>
      )}

      {/* ── Analyzing ── */}
      {analyzing && (
        <div className="bg-white rounded-2xl border border-violet-200 shadow-sm p-10 text-center mb-6">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Analyse IA en cours…</h3>
          <p className="text-slate-500 text-sm mb-6">{uploadedFiles.length > 0 ? `${Math.min(uploadedFiles.length, 20)} fichier(s)` : 'Plan de démonstration'}</p>
          <div className="max-w-xs mx-auto space-y-2">
            {STEPS.map((step, i) => (
              <div key={step} className={`flex items-center gap-3 text-sm ${i <= analyzeStep ? 'text-slate-800' : 'text-slate-300'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${i < analyzeStep ? 'bg-emerald-500' : i === analyzeStep ? 'bg-violet-500' : 'bg-slate-200'}`}>
                  {i < analyzeStep ? <CheckCircle className="w-3 h-3 text-white" /> : i === analyzeStep ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <div className="w-2 h-2 bg-slate-400 rounded-full" />}
                </div>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 mb-6">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-700">Erreur d&apos;analyse</p>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
            <button onClick={() => setError('')} className="text-xs text-red-500 underline mt-1">Fermer</button>
          </div>
        </div>
      )}

      {/* ── AI Result Panel ── */}
      {activeResult && expandedResult && !analyzing && (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm mb-6 overflow-hidden">
          <div className={`px-5 py-3 border-b flex items-center justify-between ${CONF_CONFIG[activeResult.confidence].bg} ${CONF_CONFIG[activeResult.confidence].border}`}>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${CONF_CONFIG[activeResult.confidence].color}`} />
              <span className={`font-semibold ${CONF_CONFIG[activeResult.confidence].color}`}>{CONF_CONFIG[activeResult.confidence].label}</span>
              <span className="text-sm text-slate-600 ml-2">{activeResult.notes}</span>
            </div>
            <button onClick={() => setExpandedResult(false)} className="p-1.5 rounded-lg hover:bg-white/50 text-slate-500 transition-colors">
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">
            {/* Surfaces */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'SHOB', v: activeResult.surfaces.shob },
                { label: 'SHON', v: activeResult.surfaces.shon },
                { label: 'Surface plancher', v: activeResult.surfaces.plancher },
                { label: 'Surface façades', v: activeResult.surfaces.facade },
              ].filter(s => s.v > 0).map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-center">
                  <div className="text-xs text-slate-500 mb-1 flex items-center justify-center gap-1"><Ruler className="w-3 h-3" />{s.label}</div>
                  <div className="text-xl font-bold text-slate-800">{s.v.toLocaleString()} m²</div>
                </div>
              ))}
            </div>
            {/* Items table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {['Description', 'Catégorie', 'Quantité', 'P.U.', 'Total'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeResult.items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-sm text-slate-800">{item.description}</td>
                      <td className="px-4 py-2.5"><span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">{item.category}</span></td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-600">{item.unitCost} €</td>
                      <td className="px-4 py-2.5 text-sm font-semibold text-slate-800">{fmt(item.quantity * item.unitCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Plans Grid ── */}
      <div>
        <h2 className="font-bold text-slate-800 mb-4">
          Bibliothèque de plans <span className="text-slate-400 font-normal text-sm ml-1">({plans.length} plan{plans.length > 1 ? 's' : ''})</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map(plan => (
            <div key={plan.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${activePlan === plan.id ? 'border-amber-400 shadow-amber-100' : 'border-slate-200'}`}>
              {/* SVG or placeholder */}
              <div className="aspect-[4/3] bg-slate-50 border-b border-slate-200 overflow-hidden">
                {plan.isDemo
                  ? <DemoSVG id={plan.id} />
                  : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <FileText className="w-12 h-12 text-slate-300" />
                      <p className="text-xs text-slate-400">{plan.name}</p>
                    </div>
                  )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm leading-snug">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{plan.type} · {plan.date}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 font-medium ${plan.result ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {plan.result ? '✅ Analysé' : 'Non analysé'}
                  </span>
                </div>
                {plan.result && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {plan.result.surfaces.plancher > 0 && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{plan.result.surfaces.plancher} m²</span>}
                    <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{plan.result.items.length} postes</span>
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{fmt(plan.result.items.reduce((s, i) => s + i.quantity * i.unitCost, 0))}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  {plan.result ? (
                    <button onClick={() => { setActivePlan(plan.id); setActiveResult(plan.result!); setExpandedResult(true) }}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                      <ChevronDown className="w-3.5 h-3.5" /> Voir l&apos;analyse
                    </button>
                  ) : (
                    <button onClick={() => analyzeDemoPlan(plan)} disabled={analyzing}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-semibold py-2 rounded-lg transition-colors">
                      <Brain className="w-3.5 h-3.5" /> Analyser avec IA
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

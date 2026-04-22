'use client'

import { useState } from 'react'
import { FolderOpen, FileText, Image, File, Search, Upload, Download, Eye } from 'lucide-react'

type Doc = {
  id: number
  name: string
  type: 'pdf' | 'dwg' | 'xlsx' | 'img' | 'doc'
  category: 'plans' | 'devis' | 'contrats' | 'photos' | 'specs' | 'rapports'
  size: string
  date: string
  author: string
  version?: string
  tags: string[]
}

const DOCS: Doc[] = [
  { id: 1, name: 'Plan_masse_Belvédère_v3.dwg', type: 'dwg', category: 'plans', size: '8.4 MB', date: '15 jan. 2026', author: 'Bureau études', version: 'v3', tags: ['masse', 'implantation'] },
  { id: 2, name: 'Plans_structure_R0-R4_rev2.pdf', type: 'pdf', category: 'plans', size: '12.1 MB', date: '8 mar. 2026', author: 'Bureau études', version: 'rev2', tags: ['structure', 'béton armé'] },
  { id: 3, name: 'Plan_plomberie_sanitaires.pdf', type: 'pdf', category: 'plans', size: '5.2 MB', date: '1 fév. 2026', author: 'BET Fluides', version: 'v1', tags: ['plomberie', 'sanitaires'] },
  { id: 4, name: 'Plan_électricité_TGBT.pdf', type: 'pdf', category: 'plans', size: '4.8 MB', date: '1 fév. 2026', author: 'BET Élec', version: 'v1', tags: ['électricité', 'TGBT'] },
  { id: 5, name: 'Devis_gros_oeuvre_signé.pdf', type: 'pdf', category: 'devis', size: '2.1 MB', date: '10 jan. 2026', author: 'Valentin', tags: ['gros oeuvre', 'signé'] },
  { id: 6, name: 'Devis_plomberie_PLB_v2.xlsx', type: 'xlsx', category: 'devis', size: '380 KB', date: '5 mar. 2026', author: 'PLB Services', version: 'v2', tags: ['plomberie', 'en cours'] },
  { id: 7, name: 'Contrat_Promotion_IDF.pdf', type: 'pdf', category: 'contrats', size: '1.8 MB', date: '5 jan. 2026', author: 'Valentin', tags: ['client', 'signé', 'principal'] },
  { id: 8, name: 'Contrat_sous-traitance_GO.pdf', type: 'pdf', category: 'contrats', size: '1.2 MB', date: '12 jan. 2026', author: 'Valentin', tags: ['sous-traitance', 'GO', 'signé'] },
  { id: 9, name: 'Photos_chantier_sem16_R4.jpg', type: 'img', category: 'photos', size: '24.5 MB', date: '21 avr. 2026', author: 'Chef chantier', tags: ['semaine 16', 'R4', 'dalle'] },
  { id: 10, name: 'Photos_fondations_réception.jpg', type: 'img', category: 'photos', size: '18.2 MB', date: '10 mar. 2026', author: 'Chef chantier', tags: ['fondations', 'réception'] },
  { id: 11, name: 'CCTP_gros_oeuvre.pdf', type: 'pdf', category: 'specs', size: '3.4 MB', date: '5 jan. 2026', author: 'Bureau études', tags: ['CCTP', 'gros oeuvre'] },
  { id: 12, name: 'Rapport_avancement_mars.pdf', type: 'pdf', category: 'rapports', size: '1.1 MB', date: '5 avr. 2026', author: 'Valentin', tags: ['avancement', 'mars 2026'] },
]

const CATEGORIES = [
  { id: 'all', label: 'Tous', icon: FolderOpen },
  { id: 'plans', label: 'Plans', icon: FileText },
  { id: 'devis', label: 'Devis', icon: FileText },
  { id: 'contrats', label: 'Contrats', icon: FileText },
  { id: 'photos', label: 'Photos', icon: Image },
  { id: 'specs', label: 'Spécifications', icon: File },
  { id: 'rapports', label: 'Rapports', icon: FileText },
]

const TYPE_ICON: Record<string, string> = {
  pdf: '📄', dwg: '📐', xlsx: '📊', img: '🖼️', doc: '📝'
}

const TYPE_COLOR: Record<string, string> = {
  pdf: 'text-red-500 bg-red-50 border-red-200',
  dwg: 'text-blue-500 bg-blue-50 border-blue-200',
  xlsx: 'text-emerald-500 bg-emerald-50 border-emerald-200',
  img: 'text-purple-500 bg-purple-50 border-purple-200',
  doc: 'text-amber-500 bg-amber-50 border-amber-200',
}

export default function Documents() {
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = DOCS.filter(d => {
    if (category !== 'all' && d.category !== category) return false
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) &&
      !d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500 mt-1">Plans, devis, contrats et photos chantier</p>
        </div>
        <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm">
          <Upload className="w-4 h-4" />
          Importer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {CATEGORIES.slice(1).map(cat => {
          const count = DOCS.filter(d => d.category === cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`p-3 rounded-xl border text-center transition-all shadow-sm ${category === cat.id ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-400' : 'bg-white border-slate-200 hover:border-amber-300'}`}
            >
              <div className={`text-2xl font-bold mb-0.5 ${category === cat.id ? 'text-amber-600' : 'text-slate-700'}`}>{count}</div>
              <div className="text-xs text-slate-500 leading-tight">{cat.label}</div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un document…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {[{ id: 'all', label: 'Tous' }, ...CATEGORIES.slice(1).map(c => ({ id: c.id, label: c.label }))].slice(0, 4).map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${category === cat.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(doc => (
          <div key={doc.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center text-lg flex-shrink-0 ${TYPE_COLOR[doc.type]}`}>
                {TYPE_ICON[doc.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{doc.name}</div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>{doc.size}</span>
                  <span>·</span>
                  <span>{doc.date}</span>
                  {doc.version && (
                    <>
                      <span>·</span>
                      <span className="text-blue-500 font-medium">{doc.version}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {doc.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Eye className="w-3.5 h-3.5" /> Voir
              </button>
              <button className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-700 font-medium">
                <Download className="w-3.5 h-3.5" /> Télécharger
              </button>
              <span className="text-xs text-slate-400 ml-auto">{doc.author}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun document trouvé</p>
          </div>
        )}
      </div>
    </div>
  )
}

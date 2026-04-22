'use client'

import { useState } from 'react'
import { Save, Building2, DollarSign, Users, Target, Zap } from 'lucide-react'

type TradeRate = { trade: string; rate: number; unit: string; productivity: number; prodUnit: string }

const DEFAULT_RATES: TradeRate[] = [
  { trade: 'Chef de chantier',   rate: 85,  unit: '€/h',   productivity: 0,   prodUnit: '-' },
  { trade: 'Gros oeuvre',        rate: 48,  unit: '€/h',   productivity: 2.8, prodUnit: 'm²/h' },
  { trade: 'Plombier',           rate: 58,  unit: '€/h',   productivity: 1.6, prodUnit: 'postes/j' },
  { trade: 'Électricien',        rate: 54,  unit: '€/h',   productivity: 40,  prodUnit: 'm lin/j' },
  { trade: 'Menuisier',          rate: 50,  unit: '€/h',   productivity: 12,  prodUnit: 'm²/j' },
  { trade: 'Peintre',            rate: 40,  unit: '€/h',   productivity: 25,  prodUnit: 'm²/j' },
  { trade: 'Carreleur',          rate: 46,  unit: '€/h',   productivity: 8,   prodUnit: 'm²/j' },
]

const DEFAULT_MATERIALS = [
  { name: 'Béton C25/30',        price: 145,   unit: 'm³' },
  { name: 'Acier HA',            price: 980,   unit: 'tonne' },
  { name: 'Brique M6',           price: 0.45,  unit: 'u' },
  { name: 'Câble électrique 2.5', price: 2.8,  unit: 'ml' },
  { name: 'Tube cuivre 22mm',    price: 12,    unit: 'ml' },
  { name: 'Parquet contrecollé', price: 38,    unit: 'm²' },
  { name: 'Peinture (10L)',      price: 65,    unit: 'pot' },
]

const SECTIONS = [
  { id: 'company', icon: Building2, label: 'Entreprise' },
  { id: 'labour', icon: Users, label: 'Main d\'œuvre' },
  { id: 'materials', icon: DollarSign, label: 'Matériaux' },
  { id: 'targets', icon: Target, label: 'Objectifs' },
  { id: 'ai', icon: Zap, label: 'IA & Alertes' },
]

export default function Settings() {
  const [section, setSection] = useState('company')
  const [saved, setSaved] = useState(false)
  const [rates, setRates] = useState(DEFAULT_RATES)
  const [materials, setMaterials] = useState(DEFAULT_MATERIALS)

  const [company, setCompany] = useState({
    name: 'BTP Valentin SAS',
    siret: '123 456 789 00012',
    address: '12 rue de la Construction, 75015 Paris',
    contact: 'Valentin',
    email: 'contact@btp-valentin.fr',
    phone: '01 23 45 67 89',
  })

  const [targets, setTargets] = useState({
    marginTarget: 22,
    hoursPerWeek: 40,
    overtimeCost: 1.25,
    safetyBuffer: 8,
    maxDelayDays: 14,
  })

  const [aiSettings, setAiSettings] = useState({
    budgetAlertPct: 10,
    delayAlertDays: 5,
    marginAlertPct: 3,
    autoAnalysis: true,
    weeklyReport: true,
    slackNotif: false,
  })

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Settings</h1>
          <p className="text-slate-500 mt-1">Configuration de votre entreprise et paramètres par défaut</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 font-medium px-4 py-2.5 rounded-lg text-sm transition-all shadow-sm ${saved ? 'bg-emerald-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
        >
          <Save className="w-4 h-4" />
          {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Side nav */}
        <div className="w-44 flex-shrink-0">
          <nav className="space-y-1">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${section === s.id ? 'bg-amber-50 text-amber-700 font-medium border border-amber-200' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {s.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {section === 'company' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h2 className="font-bold text-slate-800 text-lg">Informations entreprise</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Nom de l\'entreprise', key: 'name' as const },
                  { label: 'SIRET', key: 'siret' as const },
                  { label: 'Adresse', key: 'address' as const },
                  { label: 'Responsable', key: 'contact' as const },
                  { label: 'Email', key: 'email' as const },
                  { label: 'Téléphone', key: 'phone' as const },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">{f.label}</label>
                    <input
                      value={company[f.key]}
                      onChange={e => setCompany(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'labour' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-bold text-slate-800 text-lg">Taux horaires & productivité cible</h2>
                <p className="text-sm text-slate-500 mt-0.5">Ces valeurs sont utilisées pour les estimations et forecasts automatiques.</p>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Corps d&apos;état</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Taux horaire</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Productivité cible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rates.map((r, i) => (
                    <tr key={r.trade} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-sm font-medium text-slate-800">{r.trade}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            value={r.rate}
                            onChange={e => setRates(prev => prev.map((x, j) => j === i ? { ...x, rate: Number(e.target.value) } : x))}
                            className="w-20 text-right px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                          />
                          <span className="text-xs text-slate-400 w-8">{r.unit}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {r.productivity > 0 ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              value={r.productivity}
                              onChange={e => setRates(prev => prev.map((x, j) => j === i ? { ...x, productivity: Number(e.target.value) } : x))}
                              className="w-20 text-right px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-xs text-slate-400 w-16">{r.prodUnit}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-sm text-right block pr-2">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section === 'materials' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-bold text-slate-800 text-lg">Prix matériaux de référence</h2>
                <p className="text-sm text-slate-500 mt-0.5">Utilisés pour les estimations Takeoff. Mis à jour manuellement ou via import.</p>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Matériau</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Prix unitaire</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Unité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map((m, i) => (
                    <tr key={m.name} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-sm font-medium text-slate-800">{m.name}</td>
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          value={m.price}
                          step="0.01"
                          onChange={e => setMaterials(prev => prev.map((x, j) => j === i ? { ...x, price: Number(e.target.value) } : x))}
                          className="w-24 text-right px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 ml-auto block"
                        />
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-500 text-right">{m.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section === 'targets' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h2 className="font-bold text-slate-800 text-lg">Objectifs & ratios cibles</h2>
              <div className="space-y-4">
                {[
                  { label: 'Marge cible (%)', key: 'marginTarget' as const, min: 5, max: 50, unit: '%', desc: 'Marge brute visée sur vos projets' },
                  { label: 'Heures / semaine', key: 'hoursPerWeek' as const, min: 35, max: 60, unit: 'h', desc: 'Base de calcul des budgets main d\'œuvre' },
                  { label: 'Coût heures sup. (×)', key: 'overtimeCost' as const, min: 1, max: 2, unit: '×', desc: 'Multiplicateur pour les heures supplémentaires' },
                  { label: 'Provision imprévus (%)', key: 'safetyBuffer' as const, min: 0, max: 20, unit: '%', desc: 'Ajouté aux estimations de coûts' },
                  { label: 'Délai toléré max. (j)', key: 'maxDelayDays' as const, min: 0, max: 60, unit: 'j', desc: 'Seuil d\'alerte retard automatique' },
                ].map(f => (
                  <div key={f.key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{f.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={targets[f.key]}
                        min={f.min}
                        max={f.max}
                        step={f.unit === '×' ? 0.05 : 1}
                        onChange={e => setTargets(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                        className="w-20 text-right px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-sm text-slate-500 w-6">{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'ai' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
              <h2 className="font-bold text-slate-800 text-lg">Paramètres IA & Alertes</h2>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Seuils d&apos;alertes automatiques</h3>
                {[
                  { label: 'Alerte dépassement budget', key: 'budgetAlertPct' as const, unit: '%', desc: 'Déclenche une alerte si le coût dépasse le budget de X%' },
                  { label: 'Alerte retard', key: 'delayAlertDays' as const, unit: 'j', desc: 'Déclenche une alerte si un retard dépasse X jours' },
                  { label: 'Alerte marge sous cible', key: 'marginAlertPct' as const, unit: 'pts', desc: 'Alerte si la marge est X points sous l\'objectif' },
                ].map(f => (
                  <div key={f.key} className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{f.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={aiSettings[f.key]}
                        onChange={e => setAiSettings(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                        className="w-20 text-right px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-sm text-slate-500 w-8">{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Automatisations IA</h3>
                {[
                  { label: 'Analyse IA quotidienne automatique', key: 'autoAnalysis' as const, desc: 'L\'IA analyse le projet chaque matin et génère des insights' },
                  { label: 'Rapport hebdomadaire automatique', key: 'weeklyReport' as const, desc: 'Génère et envoie un rapport chaque vendredi' },
                  { label: 'Notifications Slack', key: 'slackNotif' as const, desc: 'Envoie les alertes critiques sur Slack' },
                ].map(f => (
                  <div key={f.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{f.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                    </div>
                    <button
                      onClick={() => setAiSettings(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${aiSettings[f.key] ? 'bg-amber-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${aiSettings[f.key] ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

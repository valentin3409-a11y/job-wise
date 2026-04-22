'use client'

import { useState } from 'react'
import { Save, Building2, DollarSign, Users, Target, Zap, Trash2, UserPlus, Copy, Check, Share2 } from 'lucide-react'
import { useProject, ROLE_CONFIG, type UserRole } from '@/lib/foreman/project-context'

type TradeRate = { trade: string; rate: number; unit: string; productivity: number; prodUnit: string }

const DEFAULT_RATES: TradeRate[] = [
  { trade: 'Chef de chantier',   rate: 85, unit: '€/h', productivity: 0,   prodUnit: '-' },
  { trade: 'Gros oeuvre',        rate: 48, unit: '€/h', productivity: 2.8, prodUnit: 'm²/h' },
  { trade: 'Plombier',           rate: 58, unit: '€/h', productivity: 1.6, prodUnit: 'postes/j' },
  { trade: 'Électricien',        rate: 54, unit: '€/h', productivity: 40,  prodUnit: 'm lin/j' },
  { trade: 'Menuisier',          rate: 50, unit: '€/h', productivity: 12,  prodUnit: 'm²/j' },
  { trade: 'Peintre',            rate: 40, unit: '€/h', productivity: 25,  prodUnit: 'm²/j' },
]

const SECTIONS = [
  { id: 'company',  icon: Building2, label: 'Entreprise' },
  { id: 'team',     icon: Users,     label: 'Équipe & Accès' },
  { id: 'labour',   icon: Users,     label: 'Main d\'œuvre' },
  { id: 'targets',  icon: Target,    label: 'Objectifs' },
  { id: 'ai',       icon: Zap,       label: 'IA & Alertes' },
]

const ROLE_ACCESS_MATRIX: { section: string; owner: boolean; manager: boolean; supervisor: boolean; client: boolean; viewer: boolean }[] = [
  { section: 'Command Center', owner: true, manager: true, supervisor: false, client: false, viewer: true },
  { section: 'Financials',     owner: true, manager: true, supervisor: false, client: false, viewer: false },
  { section: 'Takeoff',        owner: true, manager: true, supervisor: false, client: false, viewer: false },
  { section: 'Site',           owner: true, manager: true, supervisor: true,  client: false, viewer: false },
  { section: 'Planning',       owner: true, manager: true, supervisor: true,  client: false, viewer: false },
  { section: 'Labour',         owner: true, manager: true, supervisor: true,  client: false, viewer: false },
  { section: 'Risks',          owner: true, manager: true, supervisor: false, client: false, viewer: false },
  { section: 'Tasks',          owner: true, manager: true, supervisor: true,  client: false, viewer: false },
  { section: 'Chat',           owner: true, manager: true, supervisor: true,  client: false, viewer: false },
  { section: 'Emails',         owner: true, manager: true, supervisor: false, client: false, viewer: false },
  { section: 'Alerts',         owner: true, manager: true, supervisor: true,  client: false, viewer: false },
  { section: 'AI Assistant',   owner: true, manager: true, supervisor: false, client: false, viewer: false },
  { section: 'Reports',        owner: true, manager: true, supervisor: false, client: true,  viewer: true },
  { section: 'Documents',      owner: true, manager: true, supervisor: true,  client: true,  viewer: false },
  { section: 'Settings',       owner: true, manager: false,supervisor: false, client: false, viewer: false },
]

export default function SettingsPage() {
  const { team, addTeamMember, removeTeamMember, currentRole, setCurrentRole, currentProject } = useProject()
  const [section, setSection] = useState('team')
  const [saved, setSaved] = useState(false)
  const [rates, setRates] = useState(DEFAULT_RATES)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // New member form
  const [invite, setInvite] = useState({ name: '', email: '', role: 'supervisor' as UserRole })
  const [inviteError, setInviteError] = useState('')

  const [company, setCompany] = useState({
    name: 'BTP Valentin SAS', siret: '123 456 789 00012',
    address: '12 rue de la Construction, 75015 Paris',
    contact: 'Valentin', email: 'contact@btp-valentin.fr', phone: '01 23 45 67 89',
  })

  const [targets, setTargets] = useState({ marginTarget: 22, hoursPerWeek: 40, overtimeCost: 1.25, safetyBuffer: 8, maxDelayDays: 14 })
  const [aiSettings, setAiSettings] = useState({ budgetAlertPct: 10, delayAlertDays: 5, marginAlertPct: 3, autoAnalysis: true, weeklyReport: true, slackNotif: false })

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500) }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!invite.name.trim() || !invite.email.trim()) { setInviteError('Nom et email requis'); return }
    addTeamMember({ name: invite.name, email: invite.email, role: invite.role, avatar: invite.name[0].toUpperCase() })
    setInvite({ name: '', email: '', role: 'supervisor' })
    setInviteError('')
  }

  function generateShareLink(role: UserRole) {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://foreman.app'
    return `${base}/share?project=${currentProject.id}&role=${role}&token=${Math.random().toString(36).slice(2, 10)}`
  }

  function copyLink(role: UserRole) {
    const link = generateShareLink(role)
    navigator.clipboard.writeText(link).catch(() => {})
    setCopiedLink(role)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const SHARE_OPTIONS: { role: UserRole; label: string; desc: string }[] = [
    { role: 'manager',    label: 'Chef de projet',  desc: 'Accès complet sauf paramètres entreprise' },
    { role: 'supervisor', label: 'Superviseur',      desc: 'Site, Planning, Labour, Tasks, Chat uniquement' },
    { role: 'client',     label: 'Client',           desc: 'Rapports et documents uniquement (lecture seule)' },
    { role: 'viewer',     label: 'Invité',           desc: 'Aperçu Command Center + Reports (lecture seule)' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Settings</h1>
          <p className="text-slate-500 mt-1">Configuration entreprise, équipe et accès</p>
        </div>
        <button onClick={handleSave}
          className={`flex items-center gap-2 font-medium px-4 py-2.5 rounded-lg text-sm shadow-sm transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
          <Save className="w-4 h-4" />
          {saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
        </button>
      </div>

      {/* Demo role switcher */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="text-sm font-semibold text-blue-700 mb-2">Simuler un rôle (démo)</div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROLE_CONFIG) as UserRole[]).map(role => {
            const cfg = ROLE_CONFIG[role]
            return (
              <button key={role} onClick={() => setCurrentRole(role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  currentRole === role ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-1 ring-current` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}>
                {currentRole === role && <Check className="w-3.5 h-3.5" />}
                {cfg.label}
              </button>
            )
          })}
        </div>
        <div className="text-xs text-blue-600 mt-2">
          {ROLE_CONFIG[currentRole].description} · Les sections verrouillées apparaissent en gris dans la sidebar.
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-44 flex-shrink-0">
          <nav className="space-y-1">
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <button key={s.id} onClick={() => setSection(s.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${section === s.id ? 'bg-amber-50 text-amber-700 font-medium border border-amber-200' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {s.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex-1 min-w-0 space-y-4">

          {/* TEAM & ACCESS */}
          {section === 'team' && (
            <>
              {/* Share links */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Share2 className="w-4 h-4 text-slate-400" />
                  <h2 className="font-bold text-slate-800">Partager le projet</h2>
                </div>
                <p className="text-sm text-slate-500 mb-4">Générez un lien d&apos;accès selon le niveau de permission souhaité.</p>
                <div className="space-y-2">
                  {SHARE_OPTIONS.map(opt => {
                    const cfg = ROLE_CONFIG[opt.role]
                    return (
                      <div key={opt.role} className={`flex items-center justify-between p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                        <div>
                          <div className={`text-sm font-semibold ${cfg.color}`}>{opt.label}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                        </div>
                        <button
                          onClick={() => copyLink(opt.role)}
                          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                            copiedLink === opt.role
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : `bg-white ${cfg.border} ${cfg.color} hover:opacity-80`
                          }`}
                        >
                          {copiedLink === opt.role ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedLink === opt.role ? 'Copié !' : 'Copier le lien'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Team members */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="font-bold text-slate-800">Membres de l&apos;équipe</h2>
                  <span className="text-xs text-slate-500">{team.length} membres</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {team.map(member => {
                    const cfg = ROLE_CONFIG[member.role]
                    return (
                      <div key={member.id} className="flex items-center gap-4 px-5 py-3.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-800">{member.name}</div>
                          <div className="text-xs text-slate-500">{member.email}</div>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        {member.role !== 'owner' && (
                          <button onClick={() => removeTeamMember(member.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Invite form */}
                <form onSubmit={handleInvite} className="px-5 py-4 bg-slate-50 border-t border-slate-200">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Inviter un membre</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      placeholder="Nom complet"
                      value={invite.name}
                      onChange={e => setInvite(p => ({ ...p, name: e.target.value }))}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={invite.email}
                      onChange={e => setInvite(p => ({ ...p, email: e.target.value }))}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400"
                    />
                    <div className="flex gap-2">
                      <select
                        value={invite.role}
                        onChange={e => setInvite(p => ({ ...p, role: e.target.value as UserRole }))}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 bg-white"
                      >
                        {(Object.keys(ROLE_CONFIG) as UserRole[]).filter(r => r !== 'owner').map(r => (
                          <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                        ))}
                      </select>
                      <button type="submit" className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0">
                        <UserPlus className="w-4 h-4" />
                        Inviter
                      </button>
                    </div>
                  </div>
                  {inviteError && <p className="text-xs text-red-500 mt-1.5">{inviteError}</p>}
                </form>
              </div>

              {/* Permissions matrix */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h2 className="font-bold text-slate-800">Matrice des permissions</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Section</th>
                        {(['owner', 'manager', 'supervisor', 'client', 'viewer'] as UserRole[]).map(r => (
                          <th key={r} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">
                            {ROLE_CONFIG[r].label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ROLE_ACCESS_MATRIX.map(row => (
                        <tr key={row.section} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium text-slate-700">{row.section}</td>
                          {(['owner', 'manager', 'supervisor', 'client', 'viewer'] as const).map(r => (
                            <td key={r} className="px-3 py-2.5 text-center">
                              {row[r]
                                ? <span className="text-emerald-500 text-base">✓</span>
                                : <span className="text-slate-200 text-base">—</span>
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {section === 'company' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
              <h2 className="font-bold text-slate-800 text-lg">Informations entreprise</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([['Nom de l\'entreprise', 'name'], ['SIRET', 'siret'], ['Adresse', 'address'], ['Responsable', 'contact'], ['Email', 'email'], ['Téléphone', 'phone']] as const).map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
                    <input value={company[key]} onChange={e => setCompany(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'labour' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-bold text-slate-800 text-lg">Taux horaires & productivité cible</h2>
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
                          <input type="number" value={r.rate}
                            onChange={e => setRates(prev => prev.map((x, j) => j === i ? { ...x, rate: Number(e.target.value) } : x))}
                            className="w-20 text-right px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
                          <span className="text-xs text-slate-400 w-8">{r.unit}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {r.productivity > 0 ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <input type="number" value={r.productivity}
                              onChange={e => setRates(prev => prev.map((x, j) => j === i ? { ...x, productivity: Number(e.target.value) } : x))}
                              className="w-20 text-right px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-400" />
                            <span className="text-xs text-slate-400 w-16">{r.prodUnit}</span>
                          </div>
                        ) : <span className="text-slate-300 text-sm text-right block pr-2">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {section === 'targets' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="font-bold text-slate-800 text-lg mb-5">Objectifs & ratios cibles</h2>
              <div className="space-y-4">
                {([
                  { label: 'Marge cible (%)', key: 'marginTarget' as const, unit: '%', desc: 'Marge brute visée sur vos projets' },
                  { label: 'Heures / semaine', key: 'hoursPerWeek' as const, unit: 'h', desc: 'Base de calcul des budgets main d\'œuvre' },
                  { label: 'Provision imprévus (%)', key: 'safetyBuffer' as const, unit: '%', desc: 'Ajouté aux estimations de coûts' },
                  { label: 'Délai toléré max. (j)', key: 'maxDelayDays' as const, unit: 'j', desc: 'Seuil d\'alerte retard automatique' },
                ] as const).map(f => (
                  <div key={f.key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{f.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" value={targets[f.key]} onChange={e => setTargets(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                        className="w-20 text-right px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-amber-400" />
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
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Seuils d&apos;alertes</h3>
                {([
                  { label: 'Alerte dépassement budget', key: 'budgetAlertPct' as const, unit: '%' },
                  { label: 'Alerte retard', key: 'delayAlertDays' as const, unit: 'j' },
                  { label: 'Alerte marge sous cible', key: 'marginAlertPct' as const, unit: 'pts' },
                ] as const).map(f => (
                  <div key={f.key} className="flex items-center justify-between py-3 border-b border-slate-100">
                    <span className="text-sm font-medium text-slate-800">{f.label}</span>
                    <div className="flex items-center gap-2">
                      <input type="number" value={aiSettings[f.key]} onChange={e => setAiSettings(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                        className="w-20 text-right px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-amber-400" />
                      <span className="text-sm text-slate-500 w-8">{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Automatisations</h3>
                {([
                  { label: 'Analyse IA quotidienne', key: 'autoAnalysis' as const },
                  { label: 'Rapport hebdomadaire auto', key: 'weeklyReport' as const },
                  { label: 'Notifications Slack', key: 'slackNotif' as const },
                ] as const).map(f => (
                  <div key={f.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <span className="text-sm font-medium text-slate-800">{f.label}</span>
                    <button onClick={() => setAiSettings(p => ({ ...p, [f.key]: !p[f.key] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${aiSettings[f.key] ? 'bg-amber-500' : 'bg-slate-200'}`}>
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

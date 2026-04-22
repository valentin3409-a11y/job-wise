'use client'

import { useState } from 'react'
import { Mail, Tag, Link2, AlertTriangle, CheckCircle, Clock, Star } from 'lucide-react'

type Email = {
  id: number
  from: string
  company: string
  subject: string
  preview: string
  time: string
  date: string
  read: boolean
  starred: boolean
  category: 'fournisseur' | 'client' | 'sous-traitant' | 'admin' | 'urgent'
  aiTags: string[]
  aiExtracted?: { label: string; value: string }[]
  linkedTo?: string
  body: string
}

const EMAILS: Email[] = [
  {
    id: 1,
    from: 'Jean-Pierre Moreau',
    company: 'BétonParis SAS',
    subject: 'RE: Commande 2024-089 — Livraison niveau 5-8',
    preview: 'Suite à votre demande, nous pouvons envisager une livraison groupée avec une remise de 4% sur le volume total…',
    time: '10:42',
    date: "Aujourd'hui",
    read: false,
    starred: true,
    category: 'fournisseur',
    aiTags: ['négociation', 'remise', 'livraison'],
    aiExtracted: [
      { label: 'Remise proposée', value: '4% sur volume groupé' },
      { label: 'Économie estimée', value: '~28 000 €' },
      { label: 'Action requise', value: 'Répondre avant 25 avril' },
    ],
    linkedTo: 'Risk #1 — Acier R5-R8',
    body: 'Bonjour Monsieur Valentin,\n\nSuite à votre demande de renégociation, nous sommes en mesure de vous proposer une remise de 4% sur la commande groupée béton pour les niveaux 5 à 8.\n\nCela représente une économie d\'environ 28 000 € sur votre devis initial.\n\nNous attendons votre confirmation avant le 25 avril pour maintenir ce tarif préférentiel.\n\nCordialement,\nJean-Pierre Moreau\nBétonParis SAS',
  },
  {
    id: 2,
    from: 'Direction Promotion IDF',
    company: 'Client',
    subject: 'Rapport avancement mensuel — Avril 2026',
    preview: 'Nous souhaiterions recevoir le rapport d\'avancement mensuel avant vendredi 25 avril. Points attendus : avancement physique, situation budgétaire…',
    time: '09:15',
    date: "Aujourd'hui",
    read: false,
    starred: false,
    category: 'client',
    aiTags: ['rapport', 'deadline', 'client'],
    aiExtracted: [
      { label: 'Deadline rapport', value: 'Vendredi 25 avril' },
      { label: 'Points attendus', value: 'Avancement, budget, planning' },
      { label: 'Action requise', value: 'Préparer rapport sous 3 jours' },
    ],
    linkedTo: 'Reports — Rapport mensuel',
    body: 'Bonjour,\n\nNous souhaiterions recevoir le rapport d\'avancement mensuel avant vendredi 25 avril.\n\nPoints attendus :\n- Avancement physique par zone\n- Situation budgétaire\n- Planning mis à jour\n- Risques en cours\n\nMerci de votre diligence.\n\nDirection Promotion IDF',
  },
  {
    id: 3,
    from: 'PLB Services SARL',
    company: 'Sous-traitant',
    subject: 'Disponibilité intervention urgente plomberie',
    preview: 'Suite à votre appel, nous confirmons notre disponibilité pour une intervention dès lundi 27 avril. Notre équipe de 4 personnes peut…',
    time: '11:20',
    date: "Aujourd'hui",
    read: true,
    starred: false,
    category: 'urgent',
    aiTags: ['urgent', 'plomberie', 'disponibilité', 'sous-traitant'],
    aiExtracted: [
      { label: 'Disponibilité', value: 'Lundi 27 avril' },
      { label: 'Effectifs', value: '4 personnes' },
      { label: 'Action requise', value: 'Confirmer et signer contrat' },
    ],
    linkedTo: 'Risk #1 — Plomberie effectifs',
    body: 'Bonjour,\n\nSuite à votre appel de ce matin, nous confirmons notre disponibilité pour une intervention urgente dès lundi 27 avril.\n\nNotre équipe de 4 plombiers qualifiés peut intervenir sur les niveaux 2 à 4 immédiatement.\n\nMerci de nous faire parvenir le bon de commande pour finaliser notre intervention.\n\nPLB Services SARL',
  },
  {
    id: 4,
    from: 'Bureau Véritas',
    company: 'Bureau de contrôle',
    subject: 'Inspection cage escalier R3 — Résultats',
    preview: 'Suite à notre visite du 21 avril, nous avons constaté une non-conformité sur le ferraillage de la cage escalier niveau R3. Action corrective requise…',
    time: '14:30',
    date: 'Hier',
    read: true,
    starred: true,
    category: 'urgent',
    aiTags: ['non-conformité', 'sécurité', 'action corrective'],
    aiExtracted: [
      { label: 'Non-conformité', value: 'Ferraillage cage escalier R3' },
      { label: 'Gravité', value: 'Majeure — travaux suspendus' },
      { label: 'Action requise', value: 'Plan correctif sous 5 jours' },
    ],
    linkedTo: 'Risk #6 — Non-conformité R3',
    body: 'Suite à notre visite de contrôle du 21 avril, nous avons constaté une non-conformité sur le ferraillage de la cage escalier niveau R3.\n\nLes travaux sur ce secteur doivent être suspendus dans l\'immédiat jusqu\'à validation du plan correctif.\n\nNous vous demandons de nous soumettre un plan correctif dans les 5 jours ouvrés.\n\nBureau Véritas',
  },
  {
    id: 5,
    from: 'Mairie de Paris 15e',
    company: 'Administration',
    subject: 'Arrêté temporaire de voirie — Grue mobile',
    preview: 'Suite à votre demande du 10 avril, l\'arrêté temporaire pour l\'utilisation de la voirie lors du déplacement de la grue mobile est accordé pour la période…',
    time: '10:00',
    date: 'Hier',
    read: true,
    starred: false,
    category: 'admin',
    aiTags: ['autorisation', 'voirie', 'grue'],
    aiExtracted: [
      { label: 'Autorisation', value: 'Accordée' },
      { label: 'Période', value: '28-29 avril 2026' },
      { label: 'Action requise', value: 'Aucune — archiver' },
    ],
    body: 'Madame, Monsieur,\n\nSuite à votre demande du 10 avril 2026, l\'arrêté temporaire de voirie pour le déplacement de votre grue mobile est accordé pour les journées du 28 et 29 avril 2026.\n\nVeuillez vous conformer aux conditions de l\'arrêté joint.\n\nMairie de Paris 15e',
  },
]

const CAT_CONFIG = {
  fournisseur: { label: 'Fournisseur', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  client: { label: 'Client', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  'sous-traitant': { label: 'Sous-traitant', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  admin: { label: 'Admin', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
}

export default function Emails() {
  const [selected, setSelected] = useState<Email | null>(EMAILS[0])
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'urgent'>('all')

  const filtered = EMAILS.filter(e => {
    if (filter === 'unread') return !e.read
    if (filter === 'starred') return e.starred
    if (filter === 'urgent') return e.category === 'urgent'
    return true
  })

  const unreadCount = EMAILS.filter(e => !e.read).length

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Left panel — list */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-900">Emails</h1>
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount} nouveaux</span>
            )}
          </div>
          <div className="flex gap-1">
            {(['all', 'unread', 'starred', 'urgent'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {f === 'all' ? 'Tout' : f === 'unread' ? 'Non lus' : f === 'starred' ? '★' : 'Urgent'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filtered.map(email => {
            const cfg = CAT_CONFIG[email.category]
            return (
              <button
                key={email.id}
                onClick={() => setSelected(email)}
                className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${selected?.id === email.id ? 'bg-amber-50 border-l-2 border-amber-500' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold ${email.read ? 'text-slate-600' : 'text-slate-900'}`}>{email.from}</span>
                  <span className="text-xs text-slate-400">{email.time}</span>
                </div>
                <div className={`text-xs font-medium mb-1 truncate ${email.read ? 'text-slate-500' : 'text-slate-700'}`}>{email.subject}</div>
                <div className="text-xs text-slate-400 truncate">{email.preview}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
                  {!email.read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full ml-auto" />}
                  {email.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400 ml-auto" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right panel — email detail */}
      {selected ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Email header */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-lg leading-tight">{selected.subject}</h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">{selected.from}</span>
                  <span>·</span>
                  <span>{selected.company}</span>
                  <span>·</span>
                  <span>{selected.date} à {selected.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">Répondre</button>
                <button className="text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-medium transition-colors">Archiver</button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* AI Extraction */}
            {selected.aiExtracted && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center">
                    <span className="text-xs">🧠</span>
                  </div>
                  <span className="text-sm font-semibold text-violet-700">Analyse IA — Informations extraites</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selected.aiExtracted.map(item => (
                    <div key={item.label} className="bg-white rounded-lg p-3 border border-violet-200">
                      <div className="text-xs text-violet-500 font-medium mb-0.5">{item.label}</div>
                      <div className="text-sm font-semibold text-slate-800">{item.value}</div>
                    </div>
                  ))}
                </div>
                {selected.aiTags.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <Tag className="w-3.5 h-3.5 text-violet-400" />
                    <div className="flex flex-wrap gap-1">
                      {selected.aiTags.map(tag => (
                        <span key={tag} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selected.linkedTo && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-violet-600 font-medium">
                    <Link2 className="w-3.5 h-3.5" />
                    Lié à : {selected.linkedTo}
                  </div>
                )}
              </div>
            )}

            {/* Email body */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">{selected.body}</pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <div className="text-center">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sélectionnez un email</p>
          </div>
        </div>
      )}
    </div>
  )
}

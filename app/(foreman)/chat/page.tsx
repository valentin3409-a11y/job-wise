'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Brain, Hash, MessageCircle, Zap, X } from 'lucide-react'

type Message = { id: number; author: string; avatar: string; time: string; text: string; isAI?: boolean; aiAction?: { label: string; type: 'task' | 'risk' | 'alert' } }
type ExtractedAction = { id: number; type: 'task' | 'risk' | 'alert'; title: string; description: string; urgency: 'critical' | 'high' | 'medium' }

const CHANNELS = [
  { id: 'general',  name: 'général',      unread: 0 },
  { id: 'chantier', name: 'chantier',     unread: 3 },
  { id: 'plomberie',name: 'plomberie',    unread: 7 },
  { id: 'go',       name: 'gros-oeuvre',  unread: 1 },
  { id: 'direction',name: 'direction',    unread: 0 },
]

const MESSAGES_BY_CHANNEL: Record<string, Message[]> = {
  general: [
    { id: 1, author: 'Valentin', avatar: 'V', time: '08:12', text: 'Bonjour à tous. Point de situation : retard plomberie confirmé, 3 semaines de décalage estimé.' },
    { id: 2, author: 'FOREMAN AI', avatar: '🧠', time: '08:12', isAI: true, text: "Analyse : ce retard impacte le chemin critique. Recommandation : contacter 2 sous-traitants alternatifs aujourd'hui.", aiAction: { label: 'Créer tâche urgente', type: 'task' } },
    { id: 3, author: 'Pierre M.', avatar: 'P', time: '08:35', text: "J'ai le contact de PLB Services qui peut intervenir dès lundi. Je les appelle." },
    { id: 4, author: 'Sophie L.', avatar: 'S', time: '09:02', text: 'Réunion coordination niveaux 3-5 confirmée pour 14h.' },
    { id: 5, author: 'FOREMAN AI', avatar: '🧠', time: '09:02', isAI: true, text: 'Note : la coordination niveaux 3-5 est liée au risque #5. Intégré dans le suivi automatiquement.' },
    { id: 6, author: 'Marc D.', avatar: 'M', time: '10:18', text: 'Livraison acier R5-R8 repoussée au 30 avril. Fournisseur en rupture.' },
    { id: 7, author: 'FOREMAN AI', avatar: '🧠', time: '10:18', isAI: true, text: '⚠️ Rupture acier R5-R8 → impact planning estimé 12 jours. Risque #2 mis à jour.', aiAction: { label: 'Voir risque #2', type: 'risk' } },
  ],
  chantier: [
    { id: 1, author: 'Chef chantier', avatar: 'C', time: '07:45', text: 'Dalle niveau 4 coulée hier soir. Démoulage dans 48h.' },
    { id: 2, author: 'Pierre M.', avatar: 'P', time: '08:00', text: 'OK. Prévoir inspection avant reprise.' },
    { id: 3, author: 'Chef chantier', avatar: 'C', time: '11:30', text: 'Météo annonce pluie jeudi-vendredi. Faut prévoir les bâches façade ouest.' },
    { id: 4, author: 'FOREMAN AI', avatar: '🧠', time: '11:30', isAI: true, text: 'Confirmé : 60% pluie jeudi-vendredi. Risque #4 activé. Recommandation : avancer travaux extérieurs mercredi.', aiAction: { label: 'Créer alerte météo', type: 'alert' } },
  ],
  plomberie: [
    { id: 1, author: 'Équipe PLB', avatar: 'E', time: '09:00', text: "On est que 2 aujourd'hui au lieu de 4. Difficile d'avancer niveau 3." },
    { id: 2, author: 'FOREMAN AI', avatar: '🧠', time: '09:00', isAI: true, text: '🚨 URGENT : effectifs PLB insuffisants (2/4). Risque critique activé. Action requise sous 2h.', aiAction: { label: 'Escalader à Valentin', type: 'task' } },
    { id: 3, author: 'Valentin', avatar: 'V', time: '09:15', text: 'Je traite immédiatement. Marc, tu peux appeler PLB Services ?' },
  ],
  go: [
    { id: 1, author: 'Équipe GO', avatar: 'E', time: '07:30', text: 'Bonne avancée sur niveau 5. 8% en une matinée.' },
    { id: 2, author: 'Pierre M.', avatar: 'P', time: '08:00', text: 'Super. On rattrape le retard. Continuez.' },
  ],
  direction: [
    { id: 1, author: 'Valentin', avatar: 'V', time: '08:00', text: 'Rapport hebdo client envoyé. RDV vendredi 10h.' },
    { id: 2, author: 'FOREMAN AI', avatar: '🧠', time: '08:00', isAI: true, text: "Points à aborder vendredi : retard plomberie, situation acier, marge 18.4% vs cible 22%." },
  ],
}

const DM_MESSAGES: Record<string, Message[]> = {
  'Pierre M.': [
    { id: 1, author: 'Pierre M.', avatar: 'P', time: '09:00', text: "Salut, t'as vu le rapport fondations niveau -2 ?" },
    { id: 2, author: 'Valentin',  avatar: 'V', time: '09:05', text: 'Oui, je valide en fin de journée.' },
    { id: 3, author: 'Pierre M.', avatar: 'P', time: '09:07', text: 'RDV à 14h pour la réunion coordination ?' },
    { id: 4, author: 'Valentin',  avatar: 'V', time: '09:08', text: 'Oui, confirmé 14h.' },
  ],
  'Sophie L.': [
    { id: 1, author: 'Sophie L.', avatar: 'S', time: '08:30', text: "Bonjour, les équipes GO arrivent à 7h30 demain." },
    { id: 2, author: 'Valentin',  avatar: 'V', time: '08:45', text: "Parfait. N'oublie pas les EPI pour tout le monde." },
    { id: 3, author: 'Sophie L.', avatar: 'S', time: '08:46', text: 'Toujours. Bonne journée !' },
  ],
  'Marc D.': [
    { id: 1, author: 'Marc D.',  avatar: 'M', time: '10:00', text: 'Problème livraison acier — repoussée encore.' },
    { id: 2, author: 'Valentin', avatar: 'V', time: '10:03', text: 'Tu as le contact du fournisseur de secours ?' },
    { id: 3, author: 'Marc D.',  avatar: 'M', time: '10:05', text: "Oui, j'appelle tout de suite. Je te tiens au courant." },
  ],
  'Direction IDF': [
    { id: 1, author: 'Direction IDF', avatar: 'D', time: '14:00', text: "Pouvez-vous nous préparer un point d'avancement pour vendredi ?" },
    { id: 2, author: 'Valentin',      avatar: 'V', time: '14:15', text: 'Bien sûr, rapport complet avec KPIs et prévisionnel.' },
  ],
}

const DM_CONTACTS = ['Pierre M.', 'Sophie L.', 'Marc D.', 'Direction IDF']

const DM_AVATARS: Record<string, { letter: string; color: string }> = {
  'Pierre M.':    { letter: 'P', color: 'bg-blue-500' },
  'Sophie L.':    { letter: 'S', color: 'bg-pink-500' },
  'Marc D.':      { letter: 'M', color: 'bg-emerald-500' },
  'Direction IDF':{ letter: 'D', color: 'bg-violet-500' },
}

const AI_SYSTEM = `Tu es FOREMAN AI, l'assistant IA de l'équipe chantier Tour Belvédère. Tu analyses les messages et identifies les risques, urgences et actions. Tu réponds de manière concise et actionnable en français.`

function extractActions(text: string): ExtractedAction | null {
  const t = text.toLowerCase()
  if (/retard|décalage|délai/.test(t)) return { id: Date.now(), type: 'risk',  title: 'Risque retard détecté',        description: text.slice(0, 80),  urgency: 'high' }
  if (/urgent|immédiat|critique/.test(t))    return { id: Date.now(), type: 'alert', title: 'Alerte urgente',                description: text.slice(0, 80),  urgency: 'critical' }
  if (/livraison|commander|acheter/.test(t)) return { id: Date.now(), type: 'task',  title: 'Tâche approvisionnement',      description: text.slice(0, 80),  urgency: 'medium' }
  if (/manque|absent|effectif/.test(t))      return { id: Date.now(), type: 'alert', title: 'Alerte effectifs',              description: text.slice(0, 80),  urgency: 'high' }
  if (/problème|issue|erreur|fissure/.test(t)) return { id: Date.now(), type: 'risk', title: 'Problème signalé',             description: text.slice(0, 80),  urgency: 'medium' }
  return null
}

const ACTION_CONFIG = {
  task:  { color: 'bg-blue-100 text-blue-700 border-blue-200',    icon: '📋' },
  risk:  { color: 'bg-red-100 text-red-700 border-red-200',       icon: '⚠️' },
  alert: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '🔔' },
}
const URGENCY_DOT = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-400' }

export default function Chat() {
  const [activeType, setActiveType]               = useState<'channel' | 'dm'>('channel')
  const [activeChannel, setActiveChannel]         = useState('general')
  const [activeDM, setActiveDM]                   = useState('')
  const [channelMessages, setChannelMessages]     = useState(MESSAGES_BY_CHANNEL)
  const [dmMessages, setDmMessages]               = useState(DM_MESSAGES)
  const [input, setInput]                         = useState('')
  const [loading, setLoading]                     = useState(false)
  const [extractedActions, setExtractedActions]   = useState<ExtractedAction[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  const currentMessages = activeType === 'channel'
    ? (channelMessages[activeChannel] || [])
    : (dmMessages[activeDM] || [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [currentMessages, activeChannel, activeDM])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const userMsg: Message = { id: Date.now(), author: 'Valentin', avatar: 'V', time: now, text }

    if (activeType === 'dm') {
      setDmMessages(prev => ({ ...prev, [activeDM]: [...(prev[activeDM] || []), userMsg] }))
      return
    }

    setChannelMessages(prev => ({ ...prev, [activeChannel]: [...(prev[activeChannel] || []), userMsg] }))

    // Extract actions from message
    const action = extractActions(text)
    if (action) setExtractedActions(prev => [action, ...prev].slice(0, 5))

    setLoading(true)
    try {
      const history = currentMessages.slice(-8).map(m => ({ role: m.isAI ? 'assistant' : 'user', content: `${m.author}: ${m.text}` }))
      const res = await fetch('/api/jarvis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, systemPrompt: AI_SYSTEM, history }),
      })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
      }
      const aiMsg: Message = { id: Date.now() + 1, author: 'FOREMAN AI', avatar: '🧠', time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), text: full, isAI: true }
      setChannelMessages(prev => ({ ...prev, [activeChannel]: [...(prev[activeChannel] || []), aiMsg] }))
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  function handleKey(e: React.KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  const channelName = CHANNELS.find(c => c.id === activeChannel)?.name || ''

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── LEFT SIDEBAR ── */}
      <div className="w-52 bg-slate-800 flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="text-slate-200 font-bold text-sm">Tour Belvédère</div>
          <div className="text-slate-500 text-xs mt-0.5">Équipe chantier</div>
        </div>
        <div className="flex-1 py-3 overflow-y-auto">
          {/* Channels */}
          <div className="px-3 mb-1"><span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Canaux</span></div>
          {CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => { setActiveType('channel'); setActiveChannel(ch.id) }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg mx-1 transition-colors ${activeType === 'channel' && activeChannel === ch.id ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              style={{ width: 'calc(100% - 8px)' }}>
              <Hash className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{ch.name}</span>
              {ch.unread > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">{ch.unread}</span>}
            </button>
          ))}

          {/* DMs */}
          <div className="px-3 mt-4 mb-1"><span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Messages directs</span></div>
          {DM_CONTACTS.map(contact => {
            const av = DM_AVATARS[contact]
            const isActive = activeType === 'dm' && activeDM === contact
            return (
              <button key={contact} onClick={() => { setActiveType('dm'); setActiveDM(contact) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg mx-1 transition-colors ${isActive ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
                style={{ width: 'calc(100% - 8px)' }}>
                <div className={`w-6 h-6 ${av.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{av.letter}</div>
                <span className="flex-1 text-left truncate">{contact}</span>
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full flex-shrink-0" />
              </button>
            )
          })}
        </div>
      </div>

      {/* ── MAIN CHAT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center gap-2 flex-shrink-0">
          {activeType === 'channel' ? (
            <><Hash className="w-4 h-4 text-slate-400" /><span className="font-semibold text-slate-800">{channelName}</span></>
          ) : (
            <>
              <div className={`w-7 h-7 ${DM_AVATARS[activeDM]?.color || 'bg-slate-400'} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {DM_AVATARS[activeDM]?.letter}
              </div>
              <span className="font-semibold text-slate-800">{activeDM}</span>
              <span className="text-xs text-slate-400 ml-1">Message direct</span>
            </>
          )}
          {activeType === 'channel' && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
              <Brain className="w-3.5 h-3.5" /> FOREMAN AI actif
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {currentMessages.map(msg => (
            <div key={msg.id} className="flex gap-3 items-start">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${msg.isAI ? 'bg-violet-600 text-white' : 'bg-amber-500 text-white'}`}>
                {msg.isAI ? '🧠' : msg.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-sm font-semibold ${msg.isAI ? 'text-violet-700' : 'text-slate-800'}`}>{msg.author}</span>
                  <span className="text-xs text-slate-400">{msg.time}</span>
                </div>
                <div className={`text-sm rounded-xl px-3 py-2.5 leading-relaxed inline-block max-w-prose ${msg.isAI ? 'bg-violet-50 border border-violet-200 text-violet-800' : 'bg-white border border-slate-200 text-slate-700'}`}>
                  {msg.text}
                </div>
                {msg.aiAction && (
                  <button className={`mt-2 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${msg.aiAction.type === 'risk' ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : msg.aiAction.type === 'alert' ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100' : 'bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100'}`}>
                    {msg.aiAction.label} →
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-sm flex-shrink-0">🧠</div>
              <div className="bg-violet-50 border border-violet-200 rounded-xl px-3 py-2.5">
                <div className="flex gap-1">{[0, 150, 300].map(d => <div key={d} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder={activeType === 'channel' ? `Message #${channelName}…` : `Message à ${activeDM}…`}
              rows={1}
              className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:bg-white transition-all max-h-32" />
            <button onClick={send} disabled={!input.trim() || loading}
              className="w-10 h-10 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
          {activeType === 'channel' && <div className="text-xs text-slate-400 mt-1.5 ml-1">L&apos;IA analyse chaque message et détecte les risques automatiquement</div>}
          {activeType === 'dm' && <div className="text-xs text-slate-400 mt-1.5 ml-1 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Message direct — privé</div>}
        </div>
      </div>

      {/* ── RIGHT: ACTION EXTRACTION PANEL ── */}
      <div className="w-56 bg-white border-l border-slate-200 flex flex-col flex-shrink-0">
        <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-slate-800">Actions détectées</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {extractedActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Brain className="w-8 h-8 text-slate-200 mb-2" />
              <p className="text-xs text-slate-400 leading-relaxed">L&apos;IA détecte automatiquement les tâches, risques et alertes dans les messages</p>
            </div>
          ) : (
            extractedActions.map(action => {
              const cfg = ACTION_CONFIG[action.type]
              return (
                <div key={action.id} className={`rounded-xl border p-3 text-xs ${cfg.color}`}>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span>{cfg.icon}</span>
                      <span className="font-bold leading-tight">{action.title}</span>
                    </div>
                    <button onClick={() => setExtractedActions(p => p.filter(a => a.id !== action.id))} className="opacity-50 hover:opacity-100 flex-shrink-0">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs opacity-80 leading-snug mb-2 line-clamp-2">{action.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${URGENCY_DOT[action.urgency]}`} />
                      <span className="opacity-70">{action.urgency}</span>
                    </div>
                    <button className="font-semibold hover:opacity-80">Créer →</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="px-3 py-2.5 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-400 text-center">Basé sur l&apos;analyse des messages</p>
        </div>
      </div>

    </div>
  )
}

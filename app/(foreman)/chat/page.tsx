'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Brain, Plus, Hash, Users } from 'lucide-react'

type Message = {
  id: number
  author: string
  avatar: string
  time: string
  text: string
  isAI?: boolean
  aiAction?: { label: string; type: 'task' | 'risk' | 'alert' }
}

const CHANNELS = [
  { id: 'general', name: 'général', unread: 0 },
  { id: 'chantier', name: 'chantier', unread: 3 },
  { id: 'plomberie', name: 'plomberie', unread: 7 },
  { id: 'go', name: 'gros-oeuvre', unread: 1 },
  { id: 'direction', name: 'direction', unread: 0 },
]

const MESSAGES_BY_CHANNEL: Record<string, Message[]> = {
  general: [
    { id: 1, author: 'Valentin', avatar: 'V', time: '08:12', text: 'Bonjour à tous. Point de situation ce matin : retard plomberie confirmé, 3 semaines de décalage estimé.' },
    { id: 2, author: 'FOREMAN AI', avatar: '🧠', time: '08:12', isAI: true, text: 'Analyse : ce retard impacte le chemin critique. Recommandation : contacter 2 sous-traitants alternatifs aujourd\'hui. Voulez-vous que je crée une tâche urgente ?', aiAction: { label: 'Créer tâche urgente', type: 'task' } },
    { id: 3, author: 'Pierre M.', avatar: 'P', time: '08:35', text: 'J\'ai le contact de PLB Services qui peut intervenir dès lundi. Je les appelle.' },
    { id: 4, author: 'Sophie L.', avatar: 'S', time: '09:02', text: 'Réunion coordination niveaux 3-5 confirmée pour 14h aujourd\'hui.' },
    { id: 5, author: 'FOREMAN AI', avatar: '🧠', time: '09:02', isAI: true, text: 'Note : la coordination niveaux 3-5 est liée au risque #5 (coordination défaillante). Je l\'intègre dans le suivi des risques automatiquement.' },
    { id: 6, author: 'Marc D.', avatar: 'M', time: '10:18', text: 'Livraison acier R5-R8 repoussée au 30 avril. Fournisseur en rupture.' },
    { id: 7, author: 'FOREMAN AI', avatar: '🧠', time: '10:18', isAI: true, text: '⚠️ Alerte détectée : rupture acier R5-R8 → impact planning estimé 12 jours. Risque #2 mis à jour. Je recherche des fournisseurs alternatifs en région parisienne.', aiAction: { label: 'Voir risque #2', type: 'risk' } },
  ],
  chantier: [
    { id: 1, author: 'Chef chantier', avatar: 'C', time: '07:45', text: 'Dalle niveau 4 coulée hier soir. Démoulage dans 48h.' },
    { id: 2, author: 'Pierre M.', avatar: 'P', time: '08:00', text: 'OK. Prévoir inspection avant reprise des travaux.' },
    { id: 3, author: 'Chef chantier', avatar: 'C', time: '11:30', text: 'Météo annonce pluie jeudi-vendredi. Faut prévoir les bâches pour la façade ouest.' },
    { id: 4, author: 'FOREMAN AI', avatar: '🧠', time: '11:30', isAI: true, text: 'Confirmé : prévisions météo semaine 17 → 60% probabilité pluie jeudi-vendredi. Risque #4 activé. Recommandation : avancer les travaux extérieurs mercredi.', aiAction: { label: 'Créer alerte météo', type: 'alert' } },
  ],
  plomberie: [
    { id: 1, author: 'Équipe PLB', avatar: 'E', time: '09:00', text: 'On est que 2 aujourd\'hui au lieu de 4. Difficile d\'avancer sur le niveau 3.' },
    { id: 2, author: 'FOREMAN AI', avatar: '🧠', time: '09:00', isAI: true, text: '🚨 URGENT : effectifs plomberie insuffisants (2/4 présents). Risque #1 critique activé. Valentin notifié. Action requise sous 2h.', aiAction: { label: 'Escalader à Valentin', type: 'task' } },
    { id: 3, author: 'Valentin', avatar: 'V', time: '09:15', text: 'Je traite ça immédiatement. Marc, tu peux appeler PLB Services ?' },
  ],
  go: [
    { id: 1, author: 'Équipe GO', avatar: 'E', time: '07:30', text: 'Bonne avancée sur le niveau 5 ce matin. On est à 8% d\'avancement.' },
    { id: 2, author: 'Pierre M.', avatar: 'P', time: '08:00', text: 'Super. Continuez à ce rythme, on rattrape le retard.' },
  ],
  direction: [
    { id: 1, author: 'Valentin', avatar: 'V', time: '08:00', text: 'Rapport hebdo client envoyé. RDV vendredi 10h pour point avancement.' },
    { id: 2, author: 'FOREMAN AI', avatar: '🧠', time: '08:00', isAI: true, text: 'Rapport préparé. Points à aborder vendredi : retard plomberie, situation acier, marge actuelle 18.4% vs cible 22%.' },
  ],
}

const AI_SYSTEM = `Tu es FOREMAN AI, l'assistant IA de l'équipe chantier Tour Belvédère. Tu analyses les messages de l'équipe en temps réel et tu identifies les risques, urgences et actions à prendre. Tu réponds de manière concise et actionnable en français.`

export default function Chat() {
  const [activeChannel, setActiveChannel] = useState('general')
  const [messagesByChannel, setMessagesByChannel] = useState(MESSAGES_BY_CHANNEL)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = messagesByChannel[activeChannel] || []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChannel])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: Message = {
      id: Date.now(),
      author: 'Valentin',
      avatar: 'V',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      text,
    }

    setMessagesByChannel(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), userMsg]
    }))
    setLoading(true)

    try {
      const res = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          systemPrompt: AI_SYSTEM,
          history: messages.slice(-10).map(m => ({
            role: m.isAI ? 'assistant' : 'user',
            content: `${m.author}: ${m.text}`,
          })),
        }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
      }

      const aiMsg: Message = {
        id: Date.now() + 1,
        author: 'FOREMAN AI',
        avatar: '🧠',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        text: full,
        isAI: true,
      }
      setMessagesByChannel(prev => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] || []), aiMsg]
      }))
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Channel sidebar */}
      <div className="w-52 bg-slate-800 flex flex-col flex-shrink-0">
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="text-slate-200 font-bold text-sm">Tour Belvédère</div>
          <div className="text-slate-500 text-xs mt-0.5">Équipe chantier</div>
        </div>
        <div className="flex-1 py-3 overflow-y-auto">
          <div className="px-3 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Canaux</span>
          </div>
          {CHANNELS.map(ch => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg mx-1 transition-colors ${activeChannel === ch.id ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
              style={{ width: 'calc(100% - 8px)' }}
            >
              <Hash className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{ch.name}</span>
              {ch.unread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {ch.unread}
                </span>
              )}
            </button>
          ))}
          <div className="px-3 mt-4 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Membres</span>
          </div>
          {['Valentin', 'Pierre M.', 'Marc D.', 'Sophie L.', 'Chef chantier'].map(m => (
            <div key={m} className="flex items-center gap-2 px-4 py-1.5 text-sm text-slate-400">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center gap-2 flex-shrink-0">
          <Hash className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">{CHANNELS.find(c => c.id === activeChannel)?.name}</span>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
            <Brain className="w-3.5 h-3.5" />
            FOREMAN AI actif
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.isAI ? 'items-start' : 'items-start'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${msg.isAI ? 'bg-violet-600 text-white' : 'bg-amber-500 text-white'}`}>
                {msg.isAI ? '🧠' : msg.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-sm font-semibold ${msg.isAI ? 'text-violet-700' : 'text-slate-800'}`}>{msg.author}</span>
                  <span className="text-xs text-slate-400">{msg.time}</span>
                </div>
                <div className={`text-sm rounded-xl px-3 py-2.5 leading-relaxed inline-block max-w-full ${msg.isAI ? 'bg-violet-50 border border-violet-200 text-violet-800' : 'bg-white border border-slate-200 text-slate-700'}`}>
                  {msg.text}
                </div>
                {msg.aiAction && (
                  <button className={`mt-2 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    msg.aiAction.type === 'risk' ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' :
                    msg.aiAction.type === 'alert' ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100' :
                    'bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100'
                  }`}>
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
                <div className="flex gap-1">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Message #${CHANNELS.find(c => c.id === activeChannel)?.name}…`}
              rows={1}
              className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:bg-white transition-all max-h-32"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-10 h-10 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-slate-400 mt-1.5 ml-1">L&apos;IA analyse chaque message et détecte les risques automatiquement</div>
        </div>
      </div>
    </div>
  )
}

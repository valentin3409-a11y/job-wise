'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Brain, Zap, ChevronRight } from 'lucide-react'

type Message = { role: 'user' | 'assistant'; content: string }

const SYSTEM_PROMPT = `Tu es FOREMAN AI, l'assistant IA spécialisé dans la gestion de chantiers de construction. Tu analyses les données du projet "Tour Belvédère" à Paris 15e.

Données projet actuelles :
- Budget total : 4 850 000 €
- Coût à date : 2 180 000 € (45% du budget, avancement réel 42%)
- Forecast : 4 620 000 € (économie de 230 000 €)
- Marge actuelle : 18.4% (cible 22%)
- Avancement : 42%
- Délai restant : 252 jours (livraison 30 déc. 2026)
- Risques ouverts : 6 (dont 1 critique : plomberie -effectifs insuffisants)
- Main d'œuvre : +12% vs estimation sur gros oeuvre
- Phases : Fondations terminées ✓, Gros oeuvre R1-R4 à 78%, Plomberie/Élec à 35%

Tu réponds en français, de manière concrète et actionnable. Tu es direct, pragmatique, orienté résultats. Chaque conseil doit être applicable immédiatement sur le terrain.`

const STARTERS = [
  'Que dois-je faire aujourd\'hui en priorité ?',
  'Analyse les risques critiques et donne-moi un plan d\'action.',
  'Comment améliorer la marge de 18.4% à 22% ?',
  'Le retard plomberie va-t-il impacter la livraison ?',
  'Optimise le planning des 4 prochaines semaines.',
  'Quels corps d\'état dois-je surveiller cette semaine ?',
]

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamText, setStreamText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamText])

  async function send(text?: string) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    const updated = [...messages, { role: 'user' as const, content: msg }]
    setMessages(updated)
    setLoading(true)
    setStreamText('')

    try {
      const res = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          systemPrompt: SYSTEM_PROMPT,
          history: updated.slice(-20).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error('Erreur API')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setStreamText(full)
      }

      setMessages(prev => [...prev, { role: 'assistant', content: full }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion. Veuillez réessayer.' }])
    } finally {
      setLoading(false)
      setStreamText('')
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center shadow-sm">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900">AI Assistant</h1>
            <p className="text-xs text-slate-500">Analyse temps réel · Tour Belvédère</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            En ligne
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="max-w-2xl mx-auto mt-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">FOREMAN AI</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Votre copilote intelligent pour piloter le chantier.<br />
                Analyse, décisions, optimisations — en temps réel.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 text-left transition-all group shadow-sm"
                >
                  <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 group-hover:text-violet-500" />
                  <span className="flex-1">{s}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} max-w-3xl ${m.role === 'assistant' ? 'mx-0' : 'ml-auto'}`}>
            {m.role === 'assistant' && (
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <Brain className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-violet-600 text-white rounded-tr-sm'
                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && streamText && (
          <div className="flex justify-start max-w-3xl">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-violet-700 rounded-lg flex items-center justify-center flex-shrink-0 mr-2 mt-1">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
              {streamText}
              <span className="inline-block w-1.5 h-4 bg-violet-400 ml-0.5 animate-pulse rounded" />
            </div>
          </div>
        )}

        {loading && !streamText && (
          <div className="flex items-center gap-2 text-slate-400 text-sm pl-9">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            Analyse en cours…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={taRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Posez votre question sur le projet…"
            rows={1}
            className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:bg-white transition-all max-h-32"
            style={{ minHeight: '44px' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center text-xs text-slate-400 mt-2">Entrée pour envoyer · Shift+Entrée pour retour à la ligne</div>
      </div>
    </div>
  )
}

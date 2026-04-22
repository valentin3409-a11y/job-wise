'use client'
import { useState, useEffect, useRef } from 'react'

const AGENTS = [
  {
    id: 'jarvis',
    icon: '⚡',
    label: 'JARVIS',
    color: '#00d4ff',
    desc: 'Système central — assistant IA personnel, style Iron Man',
    system: `You are JARVIS (Just A Rather Very Intelligent System), Tony Stark's personal AI assistant. You are precise, highly intelligent, and occasionally witty. You assist with any task efficiently and with insight. Speak concisely and professionally, with subtle dry humor when appropriate. Address the user as "Sir" or "Ma'am" occasionally for immersion.`,
  },
  {
    id: 'youtube',
    icon: '▶',
    label: 'YouTube',
    color: '#ff4444',
    desc: 'Scripts, titres SEO, croissance de chaîne',
    system: `You are JARVIS YouTube Module. You specialize in YouTube content creation: writing compelling video scripts with strong hooks, optimizing titles and descriptions for SEO, crafting thumbnail concepts, analyzing audience retention strategies, and developing channel growth plans. You understand the YouTube algorithm deeply and know what makes videos go viral.`,
  },
  {
    id: 'tiktok',
    icon: '♪',
    label: 'TikTok',
    color: '#ff0050',
    desc: 'Contenu viral, hooks, tendances',
    system: `You are JARVIS TikTok Module. You specialize in TikTok content strategy: creating viral hooks (first 3 seconds are critical), identifying trending sounds and challenges, writing scripts for short-form videos (15-60 seconds), optimizing captions and hashtags, and understanding TikTok's algorithm in 2025. You know what makes content explode on the platform.`,
  },
  {
    id: 'instagram',
    icon: '◈',
    label: 'Instagram',
    color: '#e1306c',
    desc: 'Posts, Reels, Stories, hashtags',
    system: `You are JARVIS Instagram Module. You specialize in Instagram content creation and growth: writing engaging captions that drive interaction, creating Reel concepts that get views, designing Stories sequences that convert, optimizing hashtag strategies, planning cohesive feed aesthetics, and growing follower engagement organically.`,
  },
  {
    id: 'content',
    icon: '✍',
    label: 'Contenu',
    color: '#a855f7',
    desc: 'Articles, copywriting, stratégie éditoriale',
    system: `You are JARVIS Content Module. You specialize in content marketing and copywriting: writing compelling articles and blog posts, creating persuasive ad copy, developing content strategies, crafting email sequences, and producing SEO-optimized content. You write in a clear, engaging style that converts readers.`,
  },
  {
    id: 'cyber',
    icon: '🛡',
    label: 'Cyber',
    color: '#10b981',
    desc: 'Sécurité, analyse de code, CTF',
    system: `You are JARVIS Cyber Security Module. You specialize in cybersecurity: analyzing code for vulnerabilities, explaining security concepts clearly, helping with CTF challenges, reviewing security architectures, explaining OWASP Top 10, and teaching defensive security practices. You provide actionable security advice.`,
  },
  {
    id: 'builder',
    icon: '⚙',
    label: 'Builder',
    color: '#f59e0b',
    desc: 'Dev, architecture, génération de code',
    system: `You are JARVIS Builder Module. You specialize in software development: designing scalable application architectures, writing clean and efficient code, debugging complex issues, reviewing code quality, recommending appropriate tech stacks, and explaining development concepts. You write production-ready code.`,
  },
]

interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

type AgentMemory = Record<string, Message[]>

const STORAGE_KEY = 'jarvis_memory_v1'
const MAX_MSGS = 50

function load(): AgentMemory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function save(m: AgentMemory) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)) } catch {}
}

export default function JarvisPage() {
  const [activeId, setActiveId] = useState('jarvis')
  const [memory, setMemory] = useState<AgentMemory>({})
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Ref so async callbacks always see the latest memory without stale closures
  const memRef = useRef<AgentMemory>({})

  useEffect(() => {
    const m = load()
    setMemory(m)
    memRef.current = m
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [memory, activeId])

  function setMem(next: AgentMemory) {
    memRef.current = next
    setMemory(next)
    save(next)
  }

  const agent = AGENTS.find(a => a.id === activeId)!
  const messages: Message[] = memory[activeId] ?? []
  const c = agent.color

  async function send() {
    const text = input.trim()
    if (!text || busy) return

    const prev = memRef.current[activeId] ?? []
    const userMsg: Message = { role: 'user', content: text, ts: Date.now() }
    const withUser = [...prev, userMsg].slice(-MAX_MSGS)

    setMem({ ...memRef.current, [activeId]: withUser })
    setInput('')
    setBusy(true)

    // Placeholder streaming message
    const streamTs = Date.now()
    const getNext = (content: string): AgentMemory => ({
      ...memRef.current,
      [activeId]: [...withUser, { role: 'assistant', content, ts: streamTs }].slice(-MAX_MSGS),
    })

    try {
      const history = withUser.slice(-21, -1).map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, systemPrompt: agent.system, history }),
      })

      if (!res.ok || !res.body) {
        let msg = `Erreur ${res.status}`
        try { const d = await res.json(); msg = d.error ?? msg } catch {}
        throw new Error(msg)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        // Update streaming message in real-time
        setMem(getNext(accumulated))
      }

      if (!accumulated) throw new Error('Réponse vide de JARVIS')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setMem(getNext(`⚠ ${msg}`))
    } finally {
      setBusy(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  function clearAgent() {
    setMem({ ...memRef.current, [activeId]: [] })
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#020b10', color: '#e0e0e0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(2,11,16,0.97)',
        borderBottom: `1px solid ${c}22`,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <ArcReactor color={c} size={36} />
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: c, lineHeight: 1.2, letterSpacing: '.04em' }}>
            JARVIS
          </div>
          <div style={{ fontSize: 10, color: '#2a4555', letterSpacing: '.1em', textTransform: 'uppercase' }}>
            {agent.label} · {busy ? 'traitement…' : 'en ligne'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {messages.length > 0 && (
            <button onClick={clearAgent} style={ghostBtn}>Effacer</button>
          )}
          <span style={{ fontSize: 10, color: '#1a3040' }}>{messages.length}/{MAX_MSGS}</span>
        </div>
      </div>

      {/* ── Agent bar ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 12px',
        background: '#010810', borderBottom: '1px solid #0a1520',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {AGENTS.map(ag => {
          const active = ag.id === activeId
          const count = (memory[ag.id] ?? []).length
          return (
            <button key={ag.id} onClick={() => setActiveId(ag.id)} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 13px', borderRadius: 20, flexShrink: 0,
              cursor: 'pointer', border: '1px solid',
              fontSize: 12, fontWeight: 600,
              background: active ? `${ag.color}18` : 'transparent',
              color: active ? ag.color : '#3a4a55',
              borderColor: active ? `${ag.color}55` : '#0d1a22',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 13 }}>{ag.icon}</span>
              {ag.label}
              {count > 0 && (
                <span style={{
                  fontSize: 9, background: ag.color + '22',
                  color: ag.color, borderRadius: 8, padding: '1px 5px',
                }}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Messages ───────────────────────────────────────────────── */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '16px 14px 120px',
        maxWidth: 720, width: '100%', margin: '0 auto',
        alignSelf: 'stretch', boxSizing: 'border-box',
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 56 }}>
            <ArcReactor color={c} size={72} style={{ margin: '0 auto 20px' }} />
            <div style={{ fontSize: 22, fontWeight: 700, color: c, marginBottom: 8 }}>
              {agent.label} Module
            </div>
            <div style={{ fontSize: 13, color: '#1e3545', lineHeight: 1.7, maxWidth: 300, margin: '0 auto 28px' }}>
              {agent.desc}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {getStarters(agent.id).map(s => (
                <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus() }}
                  style={{
                    fontSize: 12, padding: '7px 13px', borderRadius: 16,
                    background: `${c}0d`, color: `${c}99`,
                    border: `1px solid ${c}22`, cursor: 'pointer',
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 14,
          }}>
            {msg.role === 'assistant' && (
              <div style={{ fontSize: 10, color: c, marginBottom: 4, paddingLeft: 2, letterSpacing: '.05em' }}>
                JARVIS · {agent.label}
                {busy && i === messages.length - 1 && (
                  <span style={{ marginLeft: 6 }}>
                    <Dots color={c} />
                  </span>
                )}
              </div>
            )}
            <div style={{
              maxWidth: '88%', padding: '10px 14px',
              fontSize: 14, lineHeight: 1.65,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              background: msg.role === 'user' ? `${c}12` : '#0a1820',
              border: `1px solid ${msg.role === 'user' ? `${c}2a` : '#0c1e2c'}`,
              color: msg.role === 'user' ? '#cce8f4' : '#aac8dc',
              borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
            }}>
              {msg.content || (busy && i === messages.length - 1 ? ' ' : '')}
            </div>
            <div style={{ fontSize: 10, color: '#0e1e2a', marginTop: 3, paddingInline: 4 }}>
              {new Date(msg.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}

        {/* Typing indicator when waiting for first chunk */}
        {busy && (messages.length === 0 || messages[messages.length - 1]?.role === 'user') && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: c, marginBottom: 4, paddingLeft: 2 }}>
              JARVIS · {agent.label}
            </div>
            <div style={{
              padding: '12px 16px', borderRadius: '4px 14px 14px 14px',
              background: '#0a1820', border: '1px solid #0c1e2c',
            }}>
              <Dots color={c} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(2,11,16,0.98)',
        borderTop: `1px solid ${c}18`,
        padding: '10px 14px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
      }}>
        <div style={{ display: 'flex', gap: 10, maxWidth: 720, margin: '0 auto', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={autoResize}
            onKeyDown={handleKey}
            placeholder={busy ? 'JARVIS traite votre demande…' : `Message ${agent.label}… (Entrée pour envoyer)`}
            rows={1}
            disabled={busy}
            style={{
              flex: 1, resize: 'none', padding: '11px 14px',
              background: '#0a1820',
              border: `1px solid ${busy ? '#0c1e2c' : `${c}2a`}`,
              borderRadius: 14, color: '#d0e8f4', fontSize: 14,
              outline: 'none', lineHeight: 1.5,
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              opacity: busy ? 0.5 : 1,
              transition: 'opacity 0.2s, border-color 0.2s',
            }}
          />
          <button
            onClick={send}
            disabled={busy || !input.trim()}
            style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: busy || !input.trim() ? '#0a1820' : c,
              color: busy || !input.trim() ? '#1a3040' : '#000',
              border: `1px solid ${busy || !input.trim() ? '#0c1e2c' : c}`,
              cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: 18, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            {busy ? '…' : '↑'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes arcpulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:.75; transform:scale(.95); }
        }
        @keyframes jdot {
          0%,80%,100% { opacity:.2; transform:translateY(0); }
          40% { opacity:1; transform:translateY(-5px); }
        }
        *::-webkit-scrollbar { width:3px; height:3px; }
        *::-webkit-scrollbar-track { background:transparent; }
        *::-webkit-scrollbar-thumb { background:#0d1e2c; border-radius:2px; }
      `}</style>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ArcReactor({ color, size, style }: { color: string; size: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `radial-gradient(circle at 38% 36%, #fff 0%, ${color} 36%, ${color}44 58%, transparent 74%)`,
      boxShadow: `0 0 ${size * 0.45}px ${color}88, 0 0 ${size * 0.9}px ${color}28`,
      animation: 'arcpulse 2.6s ease-in-out infinite',
      ...style,
    }} />
  )
}

function Dots({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          display: 'inline-block',
          width: 6, height: 6, borderRadius: '50%',
          background: color,
          animation: `jdot 1.4s ease-in-out ${i * 0.22}s infinite`,
        }} />
      ))}
    </span>
  )
}

const ghostBtn: React.CSSProperties = {
  fontSize: 11, padding: '4px 10px',
  background: 'transparent', color: '#1e3545',
  border: '1px solid #0d1e2c', borderRadius: 6, cursor: 'pointer',
}

function getStarters(id: string): string[] {
  const map: Record<string, string[]> = {
    jarvis:    ['Présente-toi', 'Quelles sont tes capacités ?', 'Aide-moi à planifier ma journée'],
    youtube:   ['Script sur [sujet]', 'Optimise ce titre : [titre]', 'Idées pour [niche]'],
    tiktok:    ['Hook viral pour [sujet]', 'Script 30s pour [produit]', 'Tendances TikTok 2025'],
    instagram: ['Caption pour [post]', 'Stratégie hashtags [niche]', 'Idées de Reels pour [thème]'],
    content:   ['Article SEO sur [sujet]', 'Email de vente pour [produit]', 'Plan de contenu mensuel'],
    cyber:     ['Analyse ce code', 'Explique les injections SQL', 'Aide-moi sur ce CTF'],
    builder:   ['Architecture pour [app]', 'Code une fonction qui [fait quoi]', 'Revue de code'],
  }
  return map[id] ?? []
}

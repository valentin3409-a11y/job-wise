'use client'
import { useState, useEffect, useRef } from 'react'

// ─── Agents ────────────────────────────────────────────────────────────────

const AGENTS = [
  {
    id: 'jarvis', icon: '⚡', label: 'JARVIS', color: '#00d4ff',
    desc: 'Ton assistant central — parle-lui de tout',
    base: `You are JARVIS, a personal AI mentor and life assistant. You are intelligent, warm, and direct. You know the user deeply through your persistent memory. You speak naturally, never robotically. You remember everything about the user and reference it naturally. You adapt your tone: serious for important matters, light when casual. You proactively give advice when you spot opportunities. Never say "I don't have memory" — you DO have memory via the profile and notes injected below.`,
  },
  {
    id: 'finance', icon: '💰', label: 'Finance', color: '#f0c040',
    desc: 'Investissement, budget, patrimoine, crypto',
    base: `You are JARVIS Finance Module — an expert financial mentor. You provide clear, actionable advice on investing (stocks, ETF, crypto, real estate), budgeting, wealth building, and financial independence. You give concrete strategies adapted to the user's situation. You're direct: you give your honest opinion, not generic disclaimers. You help build long-term wealth step by step.`,
  },
  {
    id: 'sport', icon: '💪', label: 'Sport', color: '#22c55e',
    desc: 'Entraînement, nutrition, performance, bien-être',
    base: `You are JARVIS Sport & Wellness Module — a personal coach and nutritionist. You create personalized training plans, advise on nutrition and supplementation, help optimize recovery, and support mental performance. You know the user's fitness level and goals from their profile. You give specific, science-backed advice. You're motivating but realistic.`,
  },
  {
    id: 'business', icon: '🚀', label: 'Business', color: '#f97316',
    desc: 'Entrepreneur, stratégie, revenus, marketing',
    base: `You are JARVIS Business Module — a startup mentor and business strategist. You help build businesses from idea to revenue: market validation, product-market fit, go-to-market strategy, pricing, sales, marketing, and scaling. You think like a founder. You give honest feedback on ideas and concrete next steps. You know the user's projects from their profile.`,
  },
  {
    id: 'youtube', icon: '▶', label: 'YouTube', color: '#ff4444',
    desc: 'Scripts, titres SEO, croissance de chaîne',
    base: `You are JARVIS YouTube Module. Expert in YouTube content creation: compelling scripts with strong hooks, SEO-optimized titles and descriptions, thumbnail concepts, audience retention strategies, channel growth plans. You deeply understand the YouTube algorithm and what makes videos go viral.`,
  },
  {
    id: 'tiktok', icon: '♪', label: 'TikTok', color: '#ff0050',
    desc: 'Contenu viral, hooks, tendances',
    base: `You are JARVIS TikTok Module. Expert in TikTok content strategy: viral hooks (first 3 seconds), trending sounds, short-form scripts (15-60s), hashtag optimization, and the 2025 TikTok algorithm. You know what makes content explode.`,
  },
  {
    id: 'instagram', icon: '◈', label: 'Instagram', color: '#e1306c',
    desc: 'Posts, Reels, Stories, hashtags',
    base: `You are JARVIS Instagram Module. Expert in Instagram growth: engaging captions, Reel concepts, Stories sequences, hashtag strategies, feed aesthetics, and follower engagement. You understand all Instagram formats and the algorithm.`,
  },
  {
    id: 'content', icon: '✍', label: 'Contenu', color: '#a855f7',
    desc: 'Articles, copywriting, stratégie éditoriale',
    base: `You are JARVIS Content Module. Expert copywriter and content strategist: articles, blog posts, ad copy, email sequences, SEO content. You write in a clear, converting style.`,
  },
  {
    id: 'cyber', icon: '🛡', label: 'Cyber', color: '#10b981',
    desc: 'Sécurité, code, CTF',
    base: `You are JARVIS Cyber Security Module. Expert in cybersecurity: code vulnerability analysis, security concepts, CTF challenges, security architecture, OWASP Top 10, defensive practices.`,
  },
  {
    id: 'builder', icon: '⚙', label: 'Builder', color: '#f59e0b',
    desc: 'Dev, architecture, génération de code',
    base: `You are JARVIS Builder Module. Expert software developer: scalable architectures, clean code, debugging, code reviews, tech stack recommendations. You write production-ready code.`,
  },
]

// ─── Types ─────────────────────────────────────────────────────────────────

interface Message { role: 'user' | 'assistant'; content: string; ts: number }
interface Memory  { id: string; content: string; ts: number }
interface Profile {
  name: string; age: string; context: string; goals: string; rules: string
}

type Conversations = Record<string, Message[]>

// ─── Storage ───────────────────────────────────────────────────────────────

const K = {
  convs:    'jarvis_convs_v2',
  memories: 'jarvis_memories_v2',
  profile:  'jarvis_profile_v2',
}

function loadJSON<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback } catch { return fallback }
}
function saveJSON(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── Memory injection ──────────────────────────────────────────────────────

function buildPrompt(base: string, profile: Profile, memories: Memory[]): string {
  const lines: string[] = []
  if (profile.name)    lines.push(`Name/Prénom : ${profile.name}`)
  if (profile.age)     lines.push(`Âge : ${profile.age}`)
  if (profile.context) lines.push(`Contexte de vie : ${profile.context}`)
  if (profile.goals)   lines.push(`Objectifs principaux : ${profile.goals}`)
  if (profile.rules)   lines.push(`Instructions personnalisées : ${profile.rules}`)

  const memLines = memories.slice(-80).map(m => `• ${m.content}`)

  const memory = [
    lines.length   ? `\n\n=== PROFIL UTILISATEUR (mémorisé) ===\n${lines.join('\n')}` : '',
    memLines.length ? `\n\n=== MÉMOIRE PERMANENTE ===\nFaits importants mémorisés :\n${memLines.join('\n')}` : '',
    `\n\nTu as une mémoire persistante et continue. Tu connais cet utilisateur profondément. Réfère-toi naturellement à ce que tu sais de lui. Si l'utilisateur dit "souviens-toi que X" ou "retiens X", réponds que tu le notes et il ajoutera ça à ta mémoire via l'interface. Tu es un vrai mentor de vie, pas un assistant générique.`,
  ].join('')

  return base + memory
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function JarvisPage() {
  const [activeId,  setActiveId]  = useState('jarvis')
  const [convs,     setConvs]     = useState<Conversations>({})
  const [memories,  setMemories]  = useState<Memory[]>([])
  const [profile,   setProfile]   = useState<Profile>({ name:'', age:'', context:'', goals:'', rules:'' })
  const [input,     setInput]     = useState('')
  const [busy,      setBusy]      = useState(false)
  const [panel,     setPanel]     = useState<'none'|'profile'|'memory'>('none')
  const [newMem,    setNewMem]    = useState('')
  const [draftProf, setDraftProf] = useState<Profile|null>(null)
  const [installEv, setInstallEv] = useState<any>(null)
  const [installed, setInstalled] = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const textaRef   = useRef<HTMLTextAreaElement>(null)
  const convsRef   = useRef<Conversations>({})
  const memoriesRef = useRef<Memory[]>([])
  const profileRef = useRef<Profile>({ name:'', age:'', context:'', goals:'', rules:'' })

  // ── Load from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    const c = loadJSON<Conversations>(K.convs, {})
    const m = loadJSON<Memory[]>(K.memories, [])
    const p = loadJSON<Profile>(K.profile, { name:'', age:'', context:'', goals:'', rules:'' })
    setConvs(c);    convsRef.current    = c
    setMemories(m); memoriesRef.current = m
    setProfile(p);  profileRef.current  = p
  }, [])

  // ── PWA install prompt ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallEv(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [convs, activeId, busy])

  // ── Setters with ref sync ───────────────────────────────────────────────
  function setC(next: Conversations) {
    convsRef.current = next; setConvs(next); saveJSON(K.convs, next)
  }
  function setM(next: Memory[]) {
    memoriesRef.current = next; setMemories(next); saveJSON(K.memories, next)
  }
  function setP(next: Profile) {
    profileRef.current = next; setProfile(next); saveJSON(K.profile, next)
  }

  // ── Send ────────────────────────────────────────────────────────────────
  const agent = AGENTS.find(a => a.id === activeId)!
  const messages: Message[] = convs[activeId] ?? []

  async function send() {
    const text = input.trim()
    if (!text || busy) return

    const prev    = convsRef.current[activeId] ?? []
    const userMsg: Message = { role: 'user', content: text, ts: Date.now() }
    const withUser = [...prev, userMsg]

    setC({ ...convsRef.current, [activeId]: withUser })
    setInput('')
    setBusy(true)

    const streamTs  = Date.now()
    const getNext   = (content: string): Conversations => ({
      ...convsRef.current,
      [activeId]: [...withUser, { role: 'assistant', content, ts: streamTs }],
    })

    try {
      // Last 30 messages as history for API context
      const history = withUser.slice(-31, -1).map(m => ({ role: m.role, content: m.content }))
      const systemPrompt = buildPrompt(agent.base, profileRef.current, memoriesRef.current)

      const res = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, systemPrompt, history }),
      })

      if (!res.ok || !res.body) {
        let msg = `Erreur ${res.status}`
        try { const d = await res.json(); msg = d.error ?? msg } catch {}
        throw new Error(msg)
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setC(getNext(accumulated))
      }

      if (!accumulated) throw new Error('Réponse vide')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      setC(getNext(`⚠ ${msg}\n\n_Vérifie que ANTHROPIC_API_KEY est configurée sur Vercel._`))
    } finally {
      setBusy(false)
      setTimeout(() => textaRef.current?.focus(), 50)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }
  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    const el = e.target; el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  // ── Memory actions ──────────────────────────────────────────────────────
  function addMemory() {
    const text = newMem.trim()
    if (!text) return
    const m: Memory = { id: Date.now().toString(), content: text, ts: Date.now() }
    setM([...memoriesRef.current, m])
    setNewMem('')
  }
  function deleteMemory(id: string) {
    setM(memoriesRef.current.filter(m => m.id !== id))
  }
  function clearAgent() {
    setC({ ...convsRef.current, [activeId]: [] })
  }

  // ── Install PWA ─────────────────────────────────────────────────────────
  async function installPWA() {
    if (!installEv) return
    installEv.prompt()
    const { outcome } = await installEv.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallEv(null)
  }

  const c = agent.color
  const totalMsgs = Object.values(convs).reduce((s, msgs) => s + msgs.length, 0)

  return (
    <div style={{
      minHeight: '100vh', background: '#020b10', color: '#e0e0e0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(2,11,16,0.97)',
        borderBottom: `1px solid ${c}22`,
        padding: '9px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <ArcReactor color={c} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: c, letterSpacing: '.04em', lineHeight: 1.2 }}>
            JARVIS
          </div>
          <div style={{ fontSize: 10, color: '#1e3a4a', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {agent.label} · {busy ? 'traitement…' : 'en ligne'} · {memories.length} souvenirs
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {(installEv && !installed) && (
            <button onClick={installPWA} style={{
              fontSize: 11, padding: '5px 10px', borderRadius: 8,
              background: `${c}18`, color: c, border: `1px solid ${c}44`,
              cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              ↓ Installer
            </button>
          )}
          <button onClick={() => setPanel(p => p === 'memory' ? 'none' : 'memory')} style={{
            ...iconBtn, background: panel === 'memory' ? '#0a1820' : 'transparent',
            color: panel === 'memory' ? '#00d4ff' : '#2a4555',
            borderColor: panel === 'memory' ? '#00d4ff33' : '#0d1e2c',
          }}>🧠</button>
          <button onClick={() => {
            setDraftProf({ ...profileRef.current })
            setPanel(p => p === 'profile' ? 'none' : 'profile')
          }} style={{
            ...iconBtn, background: panel === 'profile' ? '#0a1820' : 'transparent',
            color: panel === 'profile' ? '#00d4ff' : '#2a4555',
            borderColor: panel === 'profile' ? '#00d4ff33' : '#0d1e2c',
          }}>👤</button>
        </div>
      </div>

      {/* ── Agent bar ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 5, padding: '7px 12px',
        background: '#010810', borderBottom: '1px solid #0a1520',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {AGENTS.map(ag => {
          const active = ag.id === activeId
          const count  = (convs[ag.id] ?? []).length
          return (
            <button key={ag.id} onClick={() => setActiveId(ag.id)} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 11px', borderRadius: 20, flexShrink: 0,
              cursor: 'pointer', border: '1px solid', fontSize: 12, fontWeight: 600,
              background:   active ? `${ag.color}18` : 'transparent',
              color:        active ? ag.color : '#2a3a45',
              borderColor:  active ? `${ag.color}55` : '#0d1a22',
              transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 12 }}>{ag.icon}</span>
              {ag.label}
              {count > 0 && (
                <span style={{
                  fontSize: 9, background: ag.color + '22', color: ag.color,
                  borderRadius: 8, padding: '1px 5px', minWidth: 14, textAlign: 'center',
                }}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Main area (messages + optional panel) ────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px 14px 130px',
          maxWidth: 720, width: '100%', margin: '0 auto',
          boxSizing: 'border-box', alignSelf: 'stretch',
        }}>
          {/* Empty state */}
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 48 }}>
              <ArcReactor color={c} size={68} style={{ margin: '0 auto 18px' }} />
              <div style={{ fontSize: 20, fontWeight: 700, color: c, marginBottom: 6 }}>{agent.label}</div>
              <div style={{ fontSize: 13, color: '#1a3040', lineHeight: 1.7, maxWidth: 300, margin: '0 auto 24px' }}>
                {agent.desc}
              </div>
              {profile.name && (
                <div style={{ fontSize: 12, color: '#1e4a5a', marginBottom: 20 }}>
                  Bonjour {profile.name} — {memories.length} souvenir{memories.length > 1 ? 's' : ''} actif{memories.length > 1 ? 's' : ''}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
                {starters(agent.id).map(s => (
                  <button key={s} onClick={() => { setInput(s); textaRef.current?.focus() }} style={{
                    fontSize: 12, padding: '7px 13px', borderRadius: 16,
                    background: `${c}0c`, color: `${c}88`, border: `1px solid ${c}20`,
                    cursor: 'pointer',
                  }}>{s}</button>
                ))}
              </div>
              {!profile.name && (
                <button onClick={() => { setDraftProf({ ...profileRef.current }); setPanel('profile') }}
                  style={{
                    marginTop: 24, fontSize: 12, padding: '8px 16px', borderRadius: 20,
                    background: `${c}12`, color: c, border: `1px solid ${c}33`,
                    cursor: 'pointer',
                  }}>
                  👤 Configurer mon profil pour une mémoire personnalisée
                </button>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: 14,
            }}>
              {msg.role === 'assistant' && (
                <div style={{ fontSize: 10, color: c, marginBottom: 3, paddingLeft: 2, letterSpacing: '.05em' }}>
                  JARVIS · {agent.label}
                  {busy && i === messages.length - 1 && <span style={{ marginLeft: 6 }}><Dots color={c} /></span>}
                </div>
              )}
              <div style={{
                maxWidth: '88%', padding: '10px 14px', fontSize: 14, lineHeight: 1.65,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                background:   msg.role === 'user' ? `${c}12` : '#0a1820',
                border:       `1px solid ${msg.role === 'user' ? `${c}2a` : '#0c1e2c'}`,
                color:        msg.role === 'user' ? '#cce8f4' : '#aac8dc',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
              }}>
                {msg.content || (busy && i === messages.length - 1 ? ' ' : '')}
              </div>
              <div style={{ fontSize: 10, color: '#0a1a22', marginTop: 2, paddingInline: 3 }}>
                {new Date(msg.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {busy && messages.length === 0 || (busy && messages[messages.length - 1]?.role === 'user') ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: c, marginBottom: 3, paddingLeft: 2 }}>JARVIS · {agent.label}</div>
              <div style={{ padding: '12px 16px', borderRadius: '4px 14px 14px 14px', background: '#0a1820', border: '1px solid #0c1e2c' }}>
                <Dots color={c} />
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        {/* ── Memory Panel ──────────────────────────────────────────── */}
        {panel === 'memory' && (
          <div style={{
            width: Math.min(320, typeof window !== 'undefined' ? window.innerWidth : 320),
            background: '#010c14', borderLeft: '1px solid #0a1e2c',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
            position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 45,
            overflowY: 'auto', padding: '14px',
            paddingTop: 'calc(14px + 54px)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              🧠 Mémoire permanente
            </div>
            <div style={{ fontSize: 11, color: '#1e3a4a', marginBottom: 14, lineHeight: 1.6 }}>
              JARVIS injecte ces souvenirs dans chaque conversation. Ils persistent indéfiniment.
            </div>

            {/* Add memory */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <input
                value={newMem}
                onChange={e => setNewMem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMemory()}
                placeholder="Ajouter un souvenir…"
                style={{
                  flex: 1, padding: '8px 10px', background: '#0a1820',
                  border: '1px solid #0d2030', borderRadius: 8,
                  color: '#d0e8f4', fontSize: 12, outline: 'none',
                }}
              />
              <button onClick={addMemory} style={{
                padding: '0 12px', background: '#00d4ff', color: '#000',
                border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer', fontWeight: 700,
              }}>+</button>
            </div>

            {memories.length === 0 && (
              <div style={{ fontSize: 12, color: '#0e2030', textAlign: 'center', paddingTop: 20 }}>
                Aucun souvenir — ajoute des faits importants sur toi
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[...memories].reverse().map(m => (
                <div key={m.id} style={{
                  padding: '8px 10px', background: '#0a1820', borderRadius: 8,
                  border: '1px solid #0c1e2c', display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 12, color: '#5a8aa0', flex: 1, lineHeight: 1.5 }}>• {m.content}</span>
                  <button onClick={() => deleteMemory(m.id)} style={{
                    background: 'none', border: 'none', color: '#1a3040',
                    cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 0,
                  }}>×</button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #0a1a22' }}>
              <div style={{ fontSize: 11, color: '#1a3040', marginBottom: 8 }}>
                Stats : {totalMsgs} messages au total · {Object.keys(convs).length} agents actifs
              </div>
              {messages.length > 0 && (
                <button onClick={clearAgent} style={{
                  fontSize: 11, padding: '6px 12px', borderRadius: 7, width: '100%',
                  background: 'transparent', color: '#1e3545', border: '1px solid #0d1e2c', cursor: 'pointer',
                }}>
                  Effacer la conversation {agent.label}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Profile Panel ─────────────────────────────────────────── */}
        {panel === 'profile' && draftProf && (
          <div style={{
            width: Math.min(340, typeof window !== 'undefined' ? window.innerWidth : 340),
            background: '#010c14', borderLeft: '1px solid #0a1e2c',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
            position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 45,
            overflowY: 'auto', padding: '14px',
            paddingTop: 'calc(14px + 54px)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              👤 Mon profil
            </div>
            <div style={{ fontSize: 11, color: '#1e3a4a', marginBottom: 16, lineHeight: 1.6 }}>
              JARVIS mémorise qui tu es. Plus tu complètes ce profil, mieux il te connaît — sur tous les agents.
            </div>

            {([
              { key: 'name',    label: 'Prénom / Nom',    placeholder: 'Ex: Alex Dupont' },
              { key: 'age',     label: 'Âge & localisation', placeholder: 'Ex: 28 ans, Paris' },
              { key: 'context', label: 'Contexte de vie', placeholder: 'Ex: entrepreneur, père de famille, sportif…', rows: 3 },
              { key: 'goals',   label: 'Objectifs principaux', placeholder: 'Ex: indépendance financière en 5 ans, courir un marathon, créer une app…', rows: 3 },
              { key: 'rules',   label: 'Instructions pour JARVIS', placeholder: 'Ex: réponds toujours en français, sois direct sans filtre, tutoie-moi…', rows: 3 },
            ] as { key: keyof Profile; label: string; placeholder: string; rows?: number }[]).map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#2a4a5a', marginBottom: 4, fontWeight: 600 }}>{f.label}</div>
                {(f.rows ?? 1) > 1 ? (
                  <textarea
                    value={draftProf[f.key]}
                    onChange={e => setDraftProf({ ...draftProf, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    rows={f.rows}
                    style={{
                      width: '100%', resize: 'vertical', padding: '8px 10px',
                      background: '#0a1820', border: '1px solid #0d2030',
                      borderRadius: 8, color: '#d0e8f4', fontSize: 12,
                      outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <input
                    value={draftProf[f.key]}
                    onChange={e => setDraftProf({ ...draftProf, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{
                      width: '100%', padding: '8px 10px',
                      background: '#0a1820', border: '1px solid #0d2030',
                      borderRadius: 8, color: '#d0e8f4', fontSize: 12,
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>
            ))}

            <button
              onClick={() => { setP(draftProf); setPanel('none') }}
              style={{
                width: '100%', padding: '11px 0', fontSize: 13, fontWeight: 700,
                background: '#00d4ff', color: '#000', border: 'none', borderRadius: 10,
                cursor: 'pointer', marginTop: 4,
              }}
            >
              ✓ Sauvegarder le profil
            </button>
          </div>
        )}
      </div>

      {/* ── Input ────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(2,11,16,0.98)',
        borderTop: `1px solid ${c}18`,
        padding: '10px 14px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
      }}>
        <div style={{ display: 'flex', gap: 8, maxWidth: 720, margin: '0 auto', alignItems: 'flex-end' }}>
          <textarea
            ref={textaRef}
            value={input}
            onChange={autoResize}
            onKeyDown={handleKey}
            placeholder={busy ? 'JARVIS analyse…' : `Parle à ${agent.label}…`}
            rows={1}
            disabled={busy}
            style={{
              flex: 1, resize: 'none', padding: '11px 14px',
              background: '#0a1820', border: `1px solid ${busy ? '#0c1e2c' : `${c}2a`}`,
              borderRadius: 14, color: '#d0e8f4', fontSize: 14,
              outline: 'none', lineHeight: 1.5, fontFamily: 'inherit',
              boxSizing: 'border-box', opacity: busy ? 0.5 : 1,
              transition: 'opacity 0.2s, border-color 0.2s',
            }}
          />
          <button
            onClick={send} disabled={busy || !input.trim()}
            style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background:  busy || !input.trim() ? '#0a1820' : c,
              color:       busy || !input.trim() ? '#1a3040' : '#000',
              border:      `1px solid ${busy || !input.trim() ? '#0c1e2c' : c}`,
              cursor:      busy || !input.trim() ? 'not-allowed' : 'pointer',
              fontSize: 18, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >{busy ? '…' : '↑'}</button>
        </div>
      </div>

      <style>{`
        @keyframes arcpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.72;transform:scale(.94)} }
        @keyframes jdot { 0%,80%,100%{opacity:.18;transform:translateY(0)} 40%{opacity:1;transform:translateY(-5px)} }
        *::-webkit-scrollbar{width:3px;height:3px}
        *::-webkit-scrollbar-track{background:transparent}
        *::-webkit-scrollbar-thumb{background:#0d1e2c;border-radius:2px}
      `}</style>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ArcReactor({ color, size, style }: { color: string; size: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `radial-gradient(circle at 38% 36%, #fff 0%, ${color} 36%, ${color}44 56%, transparent 74%)`,
      boxShadow: `0 0 ${size*.45}px ${color}88, 0 0 ${size*.9}px ${color}28`,
      animation: 'arcpulse 2.6s ease-in-out infinite', ...style,
    }} />
  )
}

function Dots({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: color,
          animation: `jdot 1.4s ease-in-out ${i * 0.22}s infinite`,
        }} />
      ))}
    </span>
  )
}

const iconBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center',
  justifyContent: 'center', border: '1px solid', cursor: 'pointer', fontSize: 16, flexShrink: 0,
}

function starters(id: string): string[] {
  const m: Record<string, string[]> = {
    jarvis:   ['Présente-toi', 'Comment tu peux m\'aider ?', 'Fais le point sur mes objectifs'],
    finance:  ['Mon bilan financier', 'Stratégie d\'investissement pour moi', 'Comment construire mon patrimoine ?'],
    sport:    ['Crée mon programme d\'entraînement', 'Plan nutrition personnalisé', 'Comment progresser vite ?'],
    business: ['Valide mon idée de business', 'Comment générer mes premiers revenus ?', 'Stratégie de lancement'],
    youtube:  ['Script sur [sujet]', 'Optimise ce titre : [titre]', 'Idées pour [niche]'],
    tiktok:   ['Hook viral pour [sujet]', 'Script 30s pour [produit]', 'Tendances 2025'],
    instagram:['Caption pour [post]', 'Stratégie hashtags [niche]', 'Idées de Reels'],
    content:  ['Article SEO sur [sujet]', 'Email de vente pour [produit]', 'Plan de contenu'],
    cyber:    ['Analyse ce code', 'Explique les injections SQL', 'Aide CTF'],
    builder:  ['Architecture pour [app]', 'Code une fonction qui [fait quoi]', 'Revue de code'],
  }
  return m[id] ?? []
}

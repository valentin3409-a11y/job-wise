'use client'
import { useState, useRef, useEffect } from 'react'
import { Site, MultiAIHead } from '@/lib/types'
import Avatar from '@/components/ui/Avatar'
import MessageBubble from './MessageBubble'

interface MultiAIResult {
  heads: Array<{ id: string; name: string; emoji: string; color: string; response: string }>
  synthesis: string
}

interface Props {
  site: Site
  currentUserId: string
  onSendMessage: (text: string) => void
  onNotifyAll: (text: string) => void
  onAskMultiAI?: (q: string) => void
  multiAILoading?: boolean
  multiAIResult?: MultiAIResult | null
  // single-AI props
  aiLoading?: boolean
  aiReply?: string
  aiInput?: string
  onAiInputChange?: (v: string) => void
  onAskAI?: (q?: string) => void
}

const QUICK_PROMPTS = [
  'What tasks are urgent today?',
  'Summarise site activity',
  'What needs attention before the pour?',
  'Any compliance risks?',
  'Budget status overview',
]

type AIMode = 'quick' | 'council'

export default function ChatTab({
  site,
  currentUserId,
  onSendMessage,
  onNotifyAll,
  onAskMultiAI,
  multiAILoading = false,
  multiAIResult = null,
}: Props) {
  const [mainTab, setMainTab] = useState<'team' | 'ai'>('team')
  const [aiMode, setAiMode] = useState<AIMode>('quick')
  const [chatInput, setChatInput] = useState('')
  const [quickInput, setQuickInput] = useState('')
  const [quickReply, setQuickReply] = useState('')
  const [quickLoading, setQuickLoading] = useState(false)
  const [councilInput, setCouncilInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [site.messages])

  const pinned = site.messages.filter(m => m.pinned)

  function sendChat() {
    if (!chatInput.trim()) return
    onSendMessage(chatInput.trim())
    setChatInput('')
  }

  function sendUrgent() {
    if (!chatInput.trim()) return
    onNotifyAll(`🚨 URGENT: ${chatInput.trim()}`)
    setChatInput('')
  }

  async function askQuick() {
    if (!quickInput.trim()) return
    setQuickLoading(true)
    setQuickReply('')
    // Simulate quick AI — in production, call real AI
    await new Promise(r => setTimeout(r, 900))
    setQuickReply(
      `Based on the current status of ${site.name} (${site.progress}% complete, phase: ${site.phase}):\n\n` +
      `Regarding "${quickInput.trim()}" — the site has ${site.tasks.filter(t => !t.done && t.priority === 'high').length} high-priority open tasks ` +
      `and ${site.emails.filter(e => !e.read).length} unread emails requiring attention. ` +
      `Budget utilisation is at ${Math.round((site.spent / site.budget) * 100)}%. ` +
      `Recommend reviewing all HIGH priority items before end of day.`
    )
    setQuickLoading(false)
  }

  function submitCouncil() {
    if (!councilInput.trim() || !onAskMultiAI) return
    onAskMultiAI(councilInput.trim())
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Main tab row */}
      <div style={{ padding: '10px 14px 0', flexShrink: 0 }}>
        <div className="tab-row">
          <button
            className={`tab-btn ${mainTab === 'team' ? 'active t-blue' : ''}`}
            onClick={() => setMainTab('team')}
          >
            💬 Team
          </button>
          <button
            className={`tab-btn ${mainTab === 'ai' ? 'active t-indigo' : ''}`}
            onClick={() => setMainTab('ai')}
          >
            🤖 AI Assistant
          </button>
        </div>
      </div>

      {/* TEAM TAB */}
      {mainTab === 'team' && (
        <>
          {/* Pinned strip */}
          {pinned.length > 0 && (
            <div
              style={{
                flexShrink: 0,
                borderBottom: '1px solid var(--border)',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div className="sec-title" style={{ marginBottom: 6 }}>Pinned</div>
              {pinned.map(m => (
                <MessageBubble key={m.id} message={m} isMe={m.userId === currentUserId} site={site} />
              ))}
            </div>
          )}

          {/* Messages scroll */}
          <div
            ref={scrollRef}
            className="content-scroll"
            style={{ flex: 1 }}
          >
            {site.messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMe={msg.userId === currentUserId}
                site={site}
              />
            ))}
          </div>

          {/* Input row */}
          <div
            style={{
              flexShrink: 0,
              padding: '10px 14px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(7,7,15,0.6)',
            }}
          >
            <Avatar uid={currentUserId} size={28} />
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Message the team…"
              style={{ flex: 1 }}
            />
            <button
              onClick={sendChat}
              className="btn btn-amber btn-icon"
              aria-label="Send"
            >
              →
            </button>
            <button
              onClick={sendUrgent}
              className="btn btn-danger btn-icon"
              title="Send as urgent"
              aria-label="Send urgent"
            >
              🚨
            </button>
          </div>
        </>
      )}

      {/* AI TAB */}
      {mainTab === 'ai' && (
        <div className="content-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Mode toggle */}
          <div className="tab-row">
            <button
              className={`tab-btn ${aiMode === 'quick' ? 'active t-amber' : ''}`}
              onClick={() => setAiMode('quick')}
            >
              ⚡ Quick AI
            </button>
            <button
              className={`tab-btn ${aiMode === 'council' ? 'active t-indigo' : ''}`}
              onClick={() => setAiMode('council')}
            >
              🧠 AI Council (3 experts)
            </button>
          </div>

          {/* QUICK MODE */}
          {aiMode === 'quick' && (
            <>
              {/* Quick prompt chips */}
              <div>
                <div className="sec-title" style={{ marginBottom: 8 }}>Quick Prompts</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {QUICK_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={() => setQuickInput(p)}
                      style={{
                        background: 'var(--bg3)',
                        border: '1px solid var(--border2)',
                        borderRadius: 20,
                        padding: '5px 12px',
                        fontSize: 11,
                        color: 'var(--w60)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-head)',
                        transition: 'border-color 0.15s, color 0.15s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--amber)'
                        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--amber)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)'
                        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--w60)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick reply bubble */}
              {quickLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber)', fontSize: 13 }}>
                  <div className="spin" />
                  AI thinking…
                </div>
              )}
              {quickReply && !quickLoading && (
                <div className="bubble-ai anim-in">
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: 'var(--indigo2)', marginBottom: 8, textTransform: 'uppercase' }}>
                    🤖 AI Response
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--w80)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {quickReply}
                  </p>
                </div>
              )}

              {/* Quick input */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                <input
                  value={quickInput}
                  onChange={e => setQuickInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askQuick()}
                  placeholder={`Ask about ${site.shortName}…`}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-amber"
                  onClick={askQuick}
                  disabled={quickLoading}
                >
                  Ask
                </button>
              </div>
            </>
          )}

          {/* COUNCIL MODE */}
          {aiMode === 'council' && (
            <>
              <div style={{ fontSize: 12, color: 'var(--w60)', lineHeight: 1.5 }}>
                Consult 3 specialist AI experts simultaneously — Technical, Commercial, and Risk.
              </div>

              {/* Council input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  value={councilInput}
                  onChange={e => setCouncilInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitCouncil()}
                  placeholder="Your question for the expert council…"
                />
                <button
                  className="btn btn-indigo btn-full"
                  onClick={submitCouncil}
                  disabled={multiAILoading || !councilInput.trim()}
                >
                  🧠 Consult 3 Experts
                </button>
              </div>

              {/* Loading state */}
              {multiAILoading && (
                <div className="glass anim-in" style={{ borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { emoji: '⚙️', label: 'Technical Analysis…' },
                      { emoji: '💰', label: 'Commercial Review…' },
                      { emoji: '🛡️', label: 'Risk Assessment…' },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="anim-up"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          animationDelay: `${i * 0.15}s`,
                          opacity: 0,
                          animation: `fadeUp 0.4s ease ${i * 0.15}s forwards`,
                        }}
                      >
                        <div className="spin" style={{ borderTopColor: 'var(--indigo2)' }} />
                        <span style={{ fontSize: 12, color: 'var(--indigo2)', fontWeight: 600 }}>
                          {item.emoji} {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Council results */}
              {multiAIResult && !multiAILoading && (
                <div className="anim-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Expert heads */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {multiAIResult.heads.map(head => (
                      <div
                        key={head.id}
                        className="ai-head"
                        style={{
                          background: `${head.color}0D`,
                          border: `1px solid ${head.color}30`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 10,
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{head.emoji}</span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: '0.12em',
                              textTransform: 'uppercase',
                              color: head.color,
                            }}
                          >
                            {head.name}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: 'var(--w80)',
                            lineHeight: 1.65,
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {head.response}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Synthesis card */}
                  <div
                    className="glass-indigo"
                    style={{ borderRadius: 14, padding: 16 }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--indigo2)',
                        marginBottom: 10,
                      }}
                    >
                      ✨ Expert Synthesis
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--w80)',
                        lineHeight: 1.7,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {multiAIResult.synthesis}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

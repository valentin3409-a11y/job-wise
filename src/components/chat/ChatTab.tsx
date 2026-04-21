'use client'
import { useState, useRef, useEffect } from 'react'
import { Site } from '@/lib/types'
import { COLORS } from '@/lib/constants'
import Avatar from '@/components/ui/Avatar'
import MessageBubble from './MessageBubble'

interface Props {
  site: Site
  currentUserId: string
  onSendMessage: (text: string) => void
  onNotifyAll: (text: string) => void
  aiLoading: boolean
  aiReply: string
  aiInput: string
  onAiInputChange: (v: string) => void
  onAskAI: () => void
}

const QUICK_PROMPTS = [
  'What tasks are urgent?',
  'Summarise today\'s site activity',
  'What needs attention before the pour?',
  'Check compliance items',
]

export default function ChatTab({
  site, currentUserId, onSendMessage, onNotifyAll,
  aiLoading, aiReply, aiInput, onAiInputChange, onAskAI,
}: Props) {
  const [tab, setTab] = useState<'chat' | 'ai'>('chat')
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [site.messages])

  const pinned = site.messages.filter(m => m.pinned)

  function send() {
    if (!input.trim()) return
    onSendMessage(input.trim())
    setInput('')
  }

  function sendUrgent() {
    if (!input.trim()) return
    onNotifyAll(`🚨 URGENT: ${input.trim()}`)
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, padding: '0 16px' }}>
        {(['chat', 'ai'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? `2px solid ${site.color}` : '2px solid transparent',
              color: tab === t ? site.color : COLORS.w40,
              fontSize: 13,
              fontWeight: 700,
              padding: '10px 16px 8px',
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            {t === 'chat' ? '💬 Team Chat' : '🤖 AI Assistant'}
          </button>
        ))}
      </div>

      {tab === 'chat' && (
        <>
          {/* Pinned messages */}
          {pinned.length > 0 && (
            <div
              style={{
                background: COLORS.amber + '18',
                borderBottom: `1px solid ${COLORS.amber}33`,
                padding: '8px 16px',
              }}
            >
              <div style={{ fontSize: 10, color: COLORS.amber, fontWeight: 700, marginBottom: 4 }}>📌 PINNED</div>
              {pinned.map(m => (
                <div key={m.id} style={{ fontSize: 12, color: COLORS.w60, marginBottom: 2 }}>
                  <span style={{ color: COLORS.w80, fontWeight: 600 }}>
                    {m.userId.charAt(0).toUpperCase() + m.userId.slice(1)}:
                  </span>{' '}
                  {m.text}
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {site.messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMe={msg.userId === currentUserId}
                site={site}
              />
            ))}
          </div>

          {/* Input */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Avatar uid={currentUserId} size={28} />
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Message the team…"
              style={{
                flex: 1,
                background: COLORS.bg3,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 20,
                padding: '8px 14px',
                color: COLORS.w80,
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={send}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: site.color,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                color: '#000',
                fontWeight: 700,
              }}
            >
              →
            </button>
            <button
              onClick={sendUrgent}
              title="Send as urgent"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: COLORS.redDim,
                border: `1px solid ${COLORS.red}66`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              🚨
            </button>
          </div>
        </>
      )}

      {tab === 'ai' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Quick prompts */}
          <div>
            <div style={{ fontSize: 11, color: COLORS.w40, fontWeight: 700, marginBottom: 8 }}>QUICK PROMPTS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => { onAiInputChange(p); }}
                  style={{
                    background: COLORS.bg3,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 20,
                    padding: '6px 12px',
                    fontSize: 12,
                    color: COLORS.w60,
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* AI reply */}
          {aiReply && (
            <div
              style={{
                background: COLORS.bg3,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 10, color: COLORS.amber, fontWeight: 700, marginBottom: 8 }}>🤖 AI RESPONSE</div>
              <div style={{ fontSize: 13, color: COLORS.w80, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{aiReply}</div>
            </div>
          )}

          {aiLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: COLORS.amber, fontSize: 13 }}>
              <div className="spin" />
              Thinking…
            </div>
          )}

          {/* AI input */}
          <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
            <input
              value={aiInput}
              onChange={e => onAiInputChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onAskAI()}
              placeholder="Ask the AI about this site…"
              style={{
                flex: 1,
                background: COLORS.bg3,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                padding: '10px 14px',
                color: COLORS.w80,
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              onClick={onAskAI}
              disabled={aiLoading}
              style={{
                background: COLORS.amber,
                border: 'none',
                borderRadius: 10,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                color: '#000',
                cursor: 'pointer',
                opacity: aiLoading ? 0.5 : 1,
              }}
            >
              Ask
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

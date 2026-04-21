'use client'
import { useState } from 'react'
import { Email, Site, EmailAnalysis } from '@/lib/types'
import { COLORS, TYPE_COL, TYPE_ICO } from '@/lib/constants'
import Chip from '@/components/ui/Chip'
import Toast from '@/components/ui/Toast'

interface Props {
  email: Email
  site: Site
  analysis: EmailAnalysis | null
  analysing: boolean
  onBack: () => void
  onAnalyse: () => void
  onNotifyTeam: () => void
}

const PRIORITY_COL: Record<string, string> = {
  high:   COLORS.red,
  medium: COLORS.amber,
  low:    COLORS.green,
}

export default function EmailDetail({
  email, site, analysis, analysing, onBack, onAnalyse, onNotifyTeam,
}: Props) {
  const [toast, setToast] = useState<string | null>(null)
  const col = TYPE_COL[email.type] ?? COLORS.w60

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          className="btn btn-ghost btn-icon"
          style={{ flexShrink: 0, fontSize: 16 }}
          aria-label="Back"
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--w90)',
              lineHeight: 1.3,
              marginBottom: 4,
            }}
          >
            {email.subject}
          </div>
          <Chip label={email.type} col={col} icon={TYPE_ICO[email.type]} />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>

        {/* From info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            background: 'var(--bg3)',
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: `${col}22`,
              border: `1px solid ${col}44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {TYPE_ICO[email.type] ?? '📧'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--w90)' }}>{email.fromName}</div>
            <div style={{ fontSize: 11, color: 'var(--w40)' }}>{email.from}</div>
          </div>
          <span className="mono" style={{ fontSize: 10, color: 'var(--w40)', flexShrink: 0 }}>{email.date}</span>
        </div>

        {/* Attachment */}
        {email.att && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              color: 'var(--w60)',
              alignSelf: 'flex-start',
            }}
          >
            <span>📎</span>
            <span>{email.att}</span>
          </div>
        )}

        {/* AI Analysis card */}
        <div className="glass-indigo" style={{ borderRadius: 14, padding: 14 }}>
          {analysing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--indigo2)', fontSize: 13 }}>
              <div className="spin" style={{ borderTopColor: 'var(--indigo2)' }} />
              AI analysing…
            </div>
          ) : analysis ? (
            <>
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
                🤖 AI Analysis
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                <Chip label={analysis.category} col={col} icon={TYPE_ICO[analysis.category] ?? '📧'} />
                <Chip
                  label={`${analysis.priority} priority`}
                  col={PRIORITY_COL[analysis.priority] ?? COLORS.w60}
                />
                {analysis.isInvoice && analysis.amount && (
                  <Chip label={`$${analysis.amount.toLocaleString()}`} col={COLORS.green} icon="💰" />
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--w80)', lineHeight: 1.6, marginBottom: 10 }}>
                <span style={{ color: 'var(--w40)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Summary </span>
                {analysis.summary}
              </div>
              <div
                style={{
                  background: 'var(--bg3)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: 'var(--amber)',
                  fontWeight: 600,
                  marginBottom: analysis.isInvoice && analysis.dueDate ? 10 : 0,
                }}
              >
                ✅ {analysis.action}
              </div>
              {analysis.isInvoice && analysis.dueDate && (
                <div className="mono" style={{ fontSize: 11, color: 'var(--w60)', marginTop: 8 }}>
                  📅 Due: {analysis.dueDate}
                </div>
              )}
            </>
          ) : (
            <button
              onClick={onAnalyse}
              className="btn btn-indigo btn-full"
            >
              🤖 Analyse with AI
            </button>
          )}
        </div>

        {/* Email body */}
        <div className="card">
          <div className="sec-title" style={{ marginBottom: 12 }}>Email Body</div>
          <pre
            style={{
              fontSize: 13,
              color: 'var(--w80)',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'var(--font-head)',
              margin: 0,
            }}
          >
            {email.body}
          </pre>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => { onNotifyTeam(); showToast('Team notified! 🔔') }}
            className="btn btn-ghost btn-full"
          >
            📢 Notify Team
          </button>
          {(analysis?.isInvoice || email.type === 'invoice') && (
            <button
              onClick={() => showToast('Forwarded to accountant! 📤')}
              className="btn btn-amber btn-full"
            >
              💼 Send to Accountant
            </button>
          )}
        </div>
      </div>

      {toast && <Toast message={toast} col={COLORS.green} />}
    </div>
  )
}

'use client'
import { Email, Site, EmailAnalysis } from '@/lib/types'
import { COLORS, TYPE_COL, TYPE_ICO } from '@/lib/constants'
import Chip from '@/components/ui/Chip'
import Toast from '@/components/ui/Toast'
import { useState } from 'react'

interface Props {
  email: Email
  site: Site
  onBack: () => void
  onNotifyTeam: () => void
  onAnalyse: () => void
  analysis: EmailAnalysis | null
  analysing: boolean
}

export default function EmailDetail({ email, site, onBack, onNotifyTeam, onAnalyse, analysis, analysing }: Props) {
  const [toast, setToast] = useState<string | null>(null)
  const col = TYPE_COL[email.type] ?? COLORS.w60

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const PRIORITY_COL: Record<string, string> = {
    high:   COLORS.red,
    medium: COLORS.amber,
    low:    COLORS.green,
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 18,
            color: COLORS.w60,
            padding: 0,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.w80, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email.subject}
          </div>
          <div style={{ fontSize: 11, color: COLORS.w40 }}>{email.fromName} · {email.from}</div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* AI analysis card */}
        {analysis ? (
          <div
            style={{
              background: COLORS.amber + '14',
              border: `1px solid ${COLORS.amber}44`,
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div style={{ fontSize: 10, color: COLORS.amber, fontWeight: 700, marginBottom: 10, letterSpacing: '0.1em' }}>
              🤖 AI ANALYSIS
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              <Chip label={analysis.category.toUpperCase()} col={col} icon={TYPE_ICO[analysis.category] ?? '📧'} />
              <Chip
                label={`${analysis.priority.toUpperCase()} PRIORITY`}
                col={PRIORITY_COL[analysis.priority] ?? COLORS.w60}
              />
              {analysis.isInvoice && analysis.amount && (
                <Chip label={`$${analysis.amount.toLocaleString()}`} col={COLORS.green} icon="💰" />
              )}
            </div>
            <div style={{ fontSize: 13, color: COLORS.w80, marginBottom: 8, lineHeight: 1.55 }}>
              <span style={{ color: COLORS.w40, fontWeight: 700 }}>Summary: </span>
              {analysis.summary}
            </div>
            <div
              style={{
                background: COLORS.bg3,
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 13,
                color: COLORS.amber,
                fontWeight: 600,
              }}
            >
              ✅ Action: {analysis.action}
            </div>
            {analysis.isInvoice && analysis.dueDate && (
              <div style={{ fontSize: 12, color: COLORS.w60, marginTop: 8 }}>
                📅 Due: {analysis.dueDate}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onAnalyse}
            disabled={analysing}
            style={{
              background: COLORS.amber + '22',
              border: `1px solid ${COLORS.amber}55`,
              borderRadius: 10,
              padding: '12px 16px',
              cursor: analysing ? 'not-allowed' : 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.amber,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              opacity: analysing ? 0.6 : 1,
            }}
          >
            {analysing ? <><div className="spin" style={{ borderTopColor: COLORS.amber }} /> Analysing…</> : '🤖 ANALYSE WITH AI'}
          </button>
        )}

        {/* Email body */}
        <div
          style={{
            background: COLORS.bg2,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 10, color: COLORS.w40, fontWeight: 700, marginBottom: 10, letterSpacing: '0.08em' }}>EMAIL BODY</div>
          {email.att && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: COLORS.bg3,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                color: COLORS.w60,
                marginBottom: 12,
              }}
            >
              📎 {email.att}
            </div>
          )}
          <div style={{ fontSize: 13, color: COLORS.w80, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
            {email.body}
          </div>
        </div>

        {/* Action buttons */}
        <button
          onClick={() => { onNotifyTeam(); showToast('Team notified! 🔔') }}
          style={{
            background: site.color + '22',
            border: `1px solid ${site.color}55`,
            borderRadius: 10,
            padding: '12px 16px',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            color: site.color,
            width: '100%',
          }}
        >
          🔔 NOTIFY TEAM ABOUT THIS EMAIL
        </button>

        {(analysis?.isInvoice || email.type === 'invoice') && (
          <button
            onClick={() => showToast('Forwarded to accountant! 📤')}
            style={{
              background: COLORS.green + '22',
              border: `1px solid ${COLORS.green}55`,
              borderRadius: 10,
              padding: '12px 16px',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.green,
              width: '100%',
            }}
          >
            💳 SEND TO ACCOUNTANT
          </button>
        )}
      </div>

      {toast && <Toast message={toast} col={COLORS.green} />}
    </div>
  )
}

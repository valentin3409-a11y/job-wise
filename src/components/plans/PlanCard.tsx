'use client'
import { Plan } from '@/lib/types'

const DISCIPLINE_EMOJI: Record<string, string> = {
  architectural: '📐',
  structural: '🏗️',
  electrical: '⚡',
  mechanical: '🔧',
  plumbing: '💧',
  landscape: '🌿',
  civil: '🛣️',
  routing: '🛣️',
  pond: '🏊',
}

const DISCIPLINE_COLOR: Record<string, string> = {
  architectural: 'var(--amber)',
  structural: 'var(--blue)',
  electrical: 'var(--amber2)',
  mechanical: 'var(--purple2)',
  plumbing: 'var(--blue2)',
  landscape: 'var(--green2)',
  civil: 'var(--w60)',
  routing: 'var(--w60)',
}

function getDisciplineEmoji(discipline: string): string {
  const key = discipline.toLowerCase()
  for (const [k, v] of Object.entries(DISCIPLINE_EMOJI)) {
    if (key.includes(k)) return v
  }
  return '📐'
}

function getDisciplineColor(discipline: string): string {
  const key = discipline.toLowerCase()
  for (const [k, v] of Object.entries(DISCIPLINE_COLOR)) {
    if (key.includes(k)) return v
  }
  return 'var(--w60)'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })
  } catch {
    return iso
  }
}

export default function PlanCard({ plan, onClick }: { plan: Plan; onClick: () => void }) {
  const emoji = getDisciplineEmoji(plan.discipline)
  const discColor = getDisciplineColor(plan.discipline)
  const confidence = plan.analysis?.confidence ?? 0

  return (
    <div className="plan-card" onClick={onClick}>
      {/* Thumbnail */}
      <div className="plan-thumb">
        {plan.imageBase64 ? (
          <img
            src={`data:${plan.mediaType || 'image/jpeg'};base64,${plan.imageBase64}`}
            alt={plan.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 40, lineHeight: 1 }}>{emoji}</span>
            <span style={{ fontSize: 10, color: 'var(--w40)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {plan.discipline}
            </span>
          </div>
        )}

        {/* Duplicate badge overlay */}
        {plan.isDuplicate && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(239,68,68,0.92)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.1em',
              padding: '3px 7px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(239,68,68,0.5)',
            }}
          >
            ⚠ DUPLICATE
          </div>
        )}

        {/* Revision badge */}
        {plan.revision && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: 'rgba(99,102,241,0.85)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: 5,
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(99,102,241,0.4)',
            }}
          >
            Rev {plan.revision}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--w90)',
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {plan.title || plan.name}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <span
            className="chip"
            style={{
              background: discColor + '18',
              borderColor: discColor + '40',
              color: discColor,
            }}
          >
            {plan.discipline}
          </span>
          <span style={{ fontSize: 10, color: 'var(--w40)', fontWeight: 600 }}>{plan.planType}</span>
        </div>

        <div style={{ fontSize: 10, color: 'var(--w40)', marginBottom: 8 }}>
          {formatDate(plan.uploadDate)}
        </div>

        {/* Confidence bar */}
        {confidence > 0 && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 3,
              }}
            >
              <span style={{ fontSize: 9, color: 'var(--w40)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                AI Confidence
              </span>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--w60)', fontWeight: 700 }}>
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.round(confidence * 100)}%`,
                  background: confidence >= 0.8
                    ? 'var(--green)'
                    : confidence >= 0.5
                    ? 'var(--amber)'
                    : 'var(--red)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

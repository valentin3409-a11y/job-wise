'use client'
import { Plan } from '@/lib/types'

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

function getDisciplineColor(discipline: string): string {
  const key = discipline.toLowerCase()
  for (const [k, v] of Object.entries(DISCIPLINE_COLOR)) {
    if (key.includes(k)) return v
  }
  return 'var(--w60)'
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '6px 10px',
        minWidth: 70,
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w40)', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--w80)', fontFamily: 'var(--font-mono)' }}>
        {value}
      </div>
    </div>
  )
}

export default function PlanDetail({
  plan,
  onBack,
  onTakeoff,
}: {
  plan: Plan
  onBack: () => void
  onTakeoff: (plan: Plan) => void
}) {
  const analysis = plan.analysis
  const discColor = getDisciplineColor(plan.discipline)
  const confidence = analysis?.confidence ?? 0

  return (
    <div>
      {/* Back button + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <button
          className="btn btn-sm btn-ghost btn-icon"
          onClick={onBack}
          style={{ width: 34, height: 34, flexShrink: 0 }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--w90)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {plan.title || plan.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
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
            {plan.revision && (
              <span
                className="chip"
                style={{
                  background: 'rgba(99,102,241,0.1)',
                  borderColor: 'rgba(99,102,241,0.3)',
                  color: 'var(--indigo2)',
                }}
              >
                Rev {plan.revision}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Plan image */}
      {plan.imageBase64 && (
        <div
          style={{
            background: 'var(--bg1)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: 16,
          }}
        >
          <img
            src={`data:${plan.mediaType || 'image/jpeg'};base64,${plan.imageBase64}`}
            alt={plan.name}
            style={{
              width: '100%',
              maxHeight: 300,
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      )}

      {/* Analysis card */}
      {analysis && (
        <div className="glass-indigo" style={{ borderRadius: 14, padding: 16, marginBottom: 16 }}>
          {/* AI label */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--indigo2)',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            🤖 AI Analysis
          </div>

          {/* Meta info row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {analysis.scale && <InfoPill label="Scale" value={analysis.scale} />}
            {analysis.revision && <InfoPill label="Rev" value={analysis.revision} />}
            {analysis.date && <InfoPill label="Date" value={analysis.date} />}
            {analysis.level && <InfoPill label="Level" value={analysis.level} />}
            <InfoPill label="Type" value={analysis.planType} />
          </div>

          {/* Summary */}
          <div style={{ marginBottom: 14 }}>
            <div className="lbl" style={{ marginBottom: 6 }}>Summary</div>
            <div style={{ fontSize: 12, color: 'var(--w70)', lineHeight: 1.6 }}>
              {analysis.summary}
            </div>
          </div>

          {/* Elements */}
          {analysis.elements.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>Elements</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {analysis.elements.map((el, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '7px 10px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                    }}
                  >
                    <span
                      className="chip"
                      style={{
                        background: 'rgba(99,102,241,0.1)',
                        borderColor: 'rgba(99,102,241,0.25)',
                        color: 'var(--indigo2)',
                        flexShrink: 0,
                      }}
                    >
                      {el.type}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--w60)', flex: 1, lineHeight: 1.5 }}>
                      {el.description}
                    </span>
                    {el.estimatedCount !== undefined && (
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--amber)',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        ×{el.estimatedCount}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key dimensions */}
          {analysis.keyDimensions.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>Key Dimensions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {analysis.keyDimensions.map((dim, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(245,158,11,0.08)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: 6,
                      padding: '3px 9px',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--amber2)',
                      fontWeight: 600,
                    }}
                  >
                    {dim}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rooms table */}
          {analysis.rooms.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>Rooms</div>
              <table className="q-table">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Est. Area</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.rooms.map((room, i) => (
                    <tr key={i}>
                      <td>{room.name}</td>
                      <td className="mono">{room.estimatedArea ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          {analysis.notes.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>Notes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {analysis.notes.map((note, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--w40)', flexShrink: 0, marginTop: 1 }}>·</span>
                    <span style={{ fontSize: 11, color: 'var(--w60)', lineHeight: 1.5 }}>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence bar */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 5,
              }}
            >
              <span className="lbl" style={{ margin: 0 }}>AI Confidence</span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: confidence >= 0.8 ? 'var(--green2)' : confidence >= 0.5 ? 'var(--amber2)' : 'var(--red2)',
                  fontWeight: 700,
                }}
              >
                {Math.round(confidence * 100)}%
              </span>
            </div>
            <div className="progress-track" style={{ height: 5 }}>
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
        </div>
      )}

      {/* Takeoff CTA */}
      <button
        className="btn btn-amber btn-full btn-lg"
        onClick={() => onTakeoff(plan)}
        style={{ letterSpacing: '0.12em' }}
      >
        🔢 Generate Quantity Takeoff
      </button>
    </div>
  )
}

'use client'
import { Plan } from '@/lib/types'

export default function PlanDuplicateAlert({
  plan,
  existingPlan,
  onKeep,
  onDiscard,
}: {
  plan: Plan
  existingPlan: Plan
  onKeep: () => void
  onDiscard: () => void
}) {
  return (
    <div className="dup-alert">
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--red2)',
          }}
        >
          Possible Duplicate Detected
        </span>
      </div>

      {/* Side-by-side plan names */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        {/* Existing plan */}
        <div
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w40)', marginBottom: 4 }}>
            Existing
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--w80)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {existingPlan.title || existingPlan.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--w40)', marginTop: 2 }}>
            {existingPlan.discipline} · {existingPlan.planType}
          </div>
        </div>

        <div style={{ fontSize: 14, color: 'var(--w40)', textAlign: 'center', userSelect: 'none' }}>≈</div>

        {/* New plan */}
        <div
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--w40)', marginBottom: 4 }}>
            New upload
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--w80)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {plan.title || plan.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--w40)', marginTop: 2 }}>
            {plan.discipline} · {plan.planType}
          </div>
        </div>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 12,
          color: 'var(--w60)',
          marginBottom: 14,
          lineHeight: 1.5,
        }}
      >
        This plan appears similar to an existing plan. Please verify before proceeding.
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onKeep}>
          Keep both
        </button>
        <button className="btn btn-danger" style={{ flex: 1 }} onClick={onDiscard}>
          Discard new
        </button>
      </div>
    </div>
  )
}

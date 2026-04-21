'use client'
import { useState } from 'react'
import { Plan } from '@/lib/types'
import PlanCard from './PlanCard'
import PlanUpload from './PlanUpload'

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Architectural', value: 'architectural' },
  { label: 'Structural', value: 'structural' },
  { label: 'Civil', value: 'civil' },
  { label: 'MEP', value: 'mep' },
  { label: 'Landscape', value: 'landscape' },
  { label: 'Routing', value: 'routing' },
]

const MEP_DISCIPLINES = ['electrical', 'mechanical', 'plumbing', 'mep']

function matchesCategory(plan: Plan, cat: string): boolean {
  if (cat === 'all') return true
  const d = plan.discipline.toLowerCase()
  if (cat === 'mep') return MEP_DISCIPLINES.some(m => d.includes(m))
  return d.includes(cat)
}

function getSectionTitle(discipline: string): string {
  const d = discipline.toLowerCase()
  if (d.includes('architect')) return '📐 Architectural'
  if (d.includes('struct')) return '🏗️ Structural'
  if (d.includes('civil')) return '🛣️ Civil'
  if (d.includes('electric')) return '⚡ Electrical'
  if (d.includes('mechanic')) return '🔧 Mechanical'
  if (d.includes('plumb')) return '💧 Plumbing'
  if (d.includes('landscape')) return '🌿 Landscape'
  if (d.includes('routing') || d.includes('pond')) return '🛣️ Routing / Site'
  return '📋 ' + discipline
}

export default function PlanGrid({
  plans,
  onSelectPlan,
  onAddPlan,
  siteId,
}: {
  plans: Plan[]
  onSelectPlan: (plan: Plan) => void
  onAddPlan: (plan: Plan) => void
  siteId: string
}) {
  const [activeCat, setActiveCat] = useState('all')
  const [showUpload, setShowUpload] = useState(false)

  const filtered = [...plans]
    .filter(p => matchesCategory(p, activeCat))
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())

  // Group by discipline for section titles
  const sections: Array<{ title: string; plans: Plan[] }> = []
  const seen = new Map<string, Plan[]>()
  for (const plan of filtered) {
    const key = plan.discipline.toLowerCase()
    if (!seen.has(key)) seen.set(key, [])
    seen.get(key)!.push(plan)
  }
  Array.from(seen.entries()).forEach(([discipline, disciplinePlans]) => {
    sections.push({ title: getSectionTitle(discipline), plans: disciplinePlans })
  })

  const handleUpload = (plan: Plan) => {
    onAddPlan(plan)
    setShowUpload(false)
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>📐</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--w80)',
            }}
          >
            Plans &amp; Drawings
          </span>
          {plans.length > 0 && (
            <span
              className="chip"
              style={{
                background: 'rgba(99,102,241,0.1)',
                borderColor: 'rgba(99,102,241,0.25)',
                color: 'var(--indigo2)',
              }}
            >
              {plans.length}
            </span>
          )}
        </div>
        <button
          className="btn btn-sm btn-amber"
          onClick={() => setShowUpload(v => !v)}
        >
          + Upload Plan
        </button>
      </div>

      {/* Category filter tabs */}
      {plans.length > 0 && (
        <div className="tab-row" style={{ marginBottom: 14 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              className={`tab-btn${activeCat === cat.value ? ' active t-indigo' : ''}`}
              onClick={() => setActiveCat(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Upload zone (always at top when plans exist, or full empty state) */}
      {(showUpload || plans.length === 0) && (
        <div style={{ marginBottom: plans.length === 0 ? 0 : 16 }}>
          <PlanUpload
            siteId={siteId}
            onUpload={handleUpload}
            existingPlans={plans}
          />
        </div>
      )}

      {/* Empty state */}
      {plans.length === 0 && !showUpload && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--w40)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>📐</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--w60)', marginBottom: 6 }}>
            No plans uploaded yet
          </div>
          <div style={{ fontSize: 12 }}>
            Upload architectural plans to get started with AI analysis
          </div>
        </div>
      )}

      {/* Plan grid grouped by section */}
      {filtered.length > 0 && (
        <div>
          {sections.map(section => (
            <div key={section.title} style={{ marginBottom: 20 }}>
              <div className="sec-title" style={{ marginBottom: 10 }}>
                {section.title}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                }}
              >
                {section.plans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    onClick={() => onSelectPlan(plan)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtered empty state */}
      {plans.length > 0 && filtered.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '28px 20px',
            color: 'var(--w40)',
          }}
        >
          <div style={{ fontSize: 12 }}>No plans in this category</div>
        </div>
      )}
    </div>
  )
}

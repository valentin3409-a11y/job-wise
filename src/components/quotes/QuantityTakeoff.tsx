'use client'
import { useState } from 'react'
import { Plan, Takeoff, WorkerRate, Material, LabourItem } from '@/lib/types'

function fmt(n: number, currency = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat('en-AU', { maximumFractionDigits: 2 }).format(n)
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="stat-box">
      <div className="stat-val" style={{ color: color ?? 'var(--w90)' }}>{value}</div>
      <div className="stat-lbl">{label}</div>
    </div>
  )
}

export default function QuantityTakeoff({
  plan,
  siteId,
  workerRates,
  onSaveTakeoff,
}: {
  plan: Plan | null
  siteId: string
  workerRates: WorkerRate[]
  onSaveTakeoff: (t: Takeoff) => void
}) {
  const [scope, setScope] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [takeoff, setTakeoff] = useState<Takeoff | null>(null)
  const [useTeamRates, setUseTeamRates] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleGenerate = async () => {
    setError('')
    setLoading(true)
    setSaved(false)
    try {
      const res = await fetch('/api/quotes/takeoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          planId: plan?.id,
          planName: plan?.name,
          analysis: plan?.analysis,
          scope: scope || plan?.analysis?.summary || '',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Takeoff generation failed')
      setTakeoff(data.takeoff as Takeoff)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate takeoff')
    }
    setLoading(false)
  }

  // Apply worker rates to labour items
  const resolvedLabour: LabourItem[] = takeoff
    ? takeoff.labour.map(item => {
        if (!useTeamRates || workerRates.length === 0) return item
        const match = workerRates.find(r =>
          r.task.toLowerCase().includes(item.trade.toLowerCase()) ||
          item.trade.toLowerCase().includes(r.task.toLowerCase())
        )
        if (match) {
          return {
            ...item,
            estimatedRate: match.ratePerHour,
            estimatedTotal: match.ratePerHour * item.quantity,
          }
        }
        return item
      })
    : []

  const resolvedLabourTotal = resolvedLabour.reduce((s, i) => s + i.estimatedTotal, 0)
  const resolvedSubtotal = takeoff
    ? takeoff.subtotalMaterials + resolvedLabourTotal
    : 0
  const resolvedTotal = resolvedSubtotal * (1 + (takeoff?.contingency ?? 0) / 100)

  const handleSave = () => {
    if (!takeoff) return
    const updated: Takeoff = {
      ...takeoff,
      labour: resolvedLabour,
      subtotalLabour: resolvedLabourTotal,
      subtotal: resolvedSubtotal,
      total: resolvedTotal,
    }
    onSaveTakeoff(updated)
    setSaved(true)
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <span style={{ fontSize: 16 }}>🔢</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--w80)',
          }}
        >
          Quantity Takeoff
        </span>
        {plan && (
          <span
            className="chip"
            style={{
              background: 'rgba(245,158,11,0.1)',
              borderColor: 'rgba(245,158,11,0.25)',
              color: 'var(--amber2)',
              maxWidth: 140,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {plan.name}
          </span>
        )}
      </div>

      {/* Scope input (always shown if no plan, optional if plan exists) */}
      {(!plan || !takeoff) && (
        <div style={{ marginBottom: 14 }}>
          <label className="lbl">
            {plan ? 'Additional scope notes (optional)' : 'Describe scope of work'}
          </label>
          <textarea
            value={scope}
            onChange={e => setScope(e.target.value)}
            placeholder={
              plan
                ? 'e.g. Focus on ground floor only, exclude FF&E...'
                : 'e.g. Two-storey residential addition, 120m² ground floor extension with open plan kitchen/dining...'
            }
            rows={3}
          />
        </div>
      )}

      {/* Generate button */}
      {!takeoff && (
        <button
          className="btn btn-amber btn-full"
          onClick={handleGenerate}
          disabled={loading || (!plan && !scope.trim())}
          style={{ marginBottom: 14 }}
        >
          {loading ? (
            <>
              <div className="spin" style={{ borderTopColor: '#000' }} />
              Calculating quantities...
            </>
          ) : (
            'Generate Takeoff'
          )}
        </button>
      )}

      {error && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--red2)',
            marginBottom: 14,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {takeoff && (
        <div>
          {/* Stats row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <StatBox
              label="Materials"
              value={fmt(takeoff.subtotalMaterials, takeoff.currency)}
              color="var(--blue2)"
            />
            <StatBox
              label="Labour"
              value={fmt(resolvedLabourTotal, takeoff.currency)}
              color="var(--green2)"
            />
            <StatBox
              label={`Contingency ${takeoff.contingency}%`}
              value={fmt(resolvedTotal - resolvedSubtotal, takeoff.currency)}
              color="var(--w60)"
            />
            <StatBox
              label="Grand Total"
              value={fmt(resolvedTotal, takeoff.currency)}
              color="var(--amber)"
            />
          </div>

          {/* Team rates toggle */}
          {workerRates.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 10,
                marginBottom: 14,
              }}
            >
              <input
                type="checkbox"
                id="team-rates"
                checked={useTeamRates}
                onChange={e => setUseTeamRates(e.target.checked)}
                style={{ width: 'auto', cursor: 'pointer', accentColor: 'var(--green)' }}
              />
              <label
                htmlFor="team-rates"
                style={{ fontSize: 12, color: 'var(--green2)', fontWeight: 600, cursor: 'pointer' }}
              >
                Apply your team rates ({workerRates.length} rates loaded)
              </label>
            </div>
          )}

          {/* Materials table */}
          <div style={{ marginBottom: 20 }}>
            <div className="sec-title" style={{ marginBottom: 10 }}>Materials</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="q-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Material</th>
                    <th>Spec</th>
                    <th>Unit</th>
                    <th>Qty</th>
                    <th>+Wastage</th>
                    <th>Rate ({takeoff.currency})</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {takeoff.materials.map((m: Material, i: number) => (
                    <tr key={i}>
                      <td>
                        <span
                          className="chip"
                          style={{
                            background: 'rgba(99,102,241,0.08)',
                            borderColor: 'rgba(99,102,241,0.2)',
                            color: 'var(--indigo2)',
                          }}
                        >
                          {m.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td style={{ color: 'var(--w40)', fontSize: 11 }}>{m.specification}</td>
                      <td className="mono">{m.unit}</td>
                      <td className="mono">{fmtNum(m.quantity)}</td>
                      <td className="mono" style={{ color: 'var(--amber2)' }}>
                        {fmtNum(m.totalWithWastage)}
                        <span style={{ fontSize: 10, color: 'var(--w40)', marginLeft: 3 }}>
                          +{m.wastagePercent}%
                        </span>
                      </td>
                      <td className="mono">
                        {m.estimatedUnitRate != null
                          ? fmt(m.estimatedUnitRate, takeoff.currency)
                          : '—'}
                      </td>
                      <td className="mono" style={{ color: 'var(--w90)', fontWeight: 700 }}>
                        {m.estimatedTotal != null
                          ? fmt(m.estimatedTotal, takeoff.currency)
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Labour table */}
          <div style={{ marginBottom: 20 }}>
            <div className="sec-title" style={{ marginBottom: 10 }}>Labour</div>
            <div style={{ overflowX: 'auto' }}>
              <table className="q-table">
                <thead>
                  <tr>
                    <th>Trade</th>
                    <th>Description</th>
                    <th>Unit</th>
                    <th>Qty</th>
                    <th>Rate/hr</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedLabour.map((l: LabourItem, i: number) => (
                    <tr key={i}>
                      <td>
                        <span
                          className="chip"
                          style={{
                            background: 'rgba(16,185,129,0.08)',
                            borderColor: 'rgba(16,185,129,0.22)',
                            color: 'var(--green2)',
                          }}
                        >
                          {l.trade}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{l.description}</td>
                      <td className="mono">{l.unit}</td>
                      <td className="mono">{fmtNum(l.quantity)}</td>
                      <td className="mono" style={{ color: useTeamRates ? 'var(--green2)' : undefined }}>
                        {fmt(l.estimatedRate, takeoff.currency)}
                      </td>
                      <td className="mono" style={{ color: 'var(--w90)', fontWeight: 700 }}>
                        {fmt(l.estimatedTotal, takeoff.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total summary card */}
          <div
            className="glass-amber glow-amber"
            style={{ borderRadius: 14, padding: 16, marginBottom: 16 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Materials subtotal', value: fmt(takeoff.subtotalMaterials, takeoff.currency) },
                { label: 'Labour subtotal', value: fmt(resolvedLabourTotal, takeoff.currency) },
                { label: `Subtotal`, value: fmt(resolvedSubtotal, takeoff.currency) },
                { label: `Contingency (${takeoff.contingency}%)`, value: fmt(resolvedTotal - resolvedSubtotal, takeoff.currency) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--w60)' }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--w80)', fontWeight: 600 }}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div
                style={{
                  height: 1,
                  background: 'rgba(245,158,11,0.25)',
                  margin: '4px 0',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--amber2)' }}>
                  Grand Total
                </span>
                <span
                  style={{
                    fontSize: 20,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: 'var(--amber)',
                  }}
                >
                  {fmt(resolvedTotal, takeoff.currency)}
                </span>
              </div>
              {takeoff.currency && (
                <div style={{ fontSize: 10, color: 'var(--w40)', textAlign: 'right' }}>
                  All amounts in {takeoff.currency} (inc. GST)
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {takeoff.notes && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontSize: 12,
                color: 'var(--w60)',
                marginBottom: 14,
                lineHeight: 1.6,
              }}
            >
              <span style={{ color: 'var(--w40)', fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Notes ·{' '}
              </span>
              {takeoff.notes}
            </div>
          )}

          {/* Save button */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-ghost"
              onClick={() => { setTakeoff(null); setSaved(false) }}
              style={{ flex: 0 }}
            >
              ↺ Regenerate
            </button>
            <button
              className="btn btn-amber btn-full"
              onClick={handleSave}
              disabled={saved}
              style={{ letterSpacing: '0.1em' }}
            >
              {saved ? '✓ Saved' : 'Save Quotation'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

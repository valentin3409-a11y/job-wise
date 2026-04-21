'use client'
import { useState, useCallback } from 'react'
import { WorkerRate } from '@/lib/types'

interface ExtractedRate {
  task: string
  ratePerHour: number
  currency: string
}

export default function WorkerRateCapture({
  onRatesExtracted,
  userId,
}: {
  onRatesExtracted: (rates: WorkerRate[]) => void
  userId: string
}) {
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [extracted, setExtracted] = useState<ExtractedRate[]>([])
  const [applied, setApplied] = useState(false)

  const processImage = useCallback(async (file: File) => {
    setError('')
    setExtracted([])
    setApplied(false)
    setLoading(true)

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => {
          const result = e.target?.result as string
          resolve(result.split(',')[1] || result)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType: file.type || 'image/jpeg' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'OCR failed')
      setExtracted(data.rates as ExtractedRate[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to extract rates')
    }
    setLoading(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processImage(file)
  }, [processImage])

  const handleApply = () => {
    const rates: WorkerRate[] = extracted.map(r => ({
      userId,
      task: r.task,
      ratePerHour: r.ratePerHour,
      currency: r.currency,
      effectiveDate: new Date().toISOString().split('T')[0],
    }))
    onRatesExtracted(rates)
    setApplied(true)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--w80)',
            marginBottom: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          📸 Rate Card Capture
        </div>
        <div style={{ fontSize: 12, color: 'var(--w40)' }}>
          Take a photo of your rate card or price list to auto-extract labour rates
        </div>
      </div>

      {/* Upload zone */}
      {!extracted.length && (
        <div
          className={`upload-zone${dragOver ? ' drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            onChange={e => { const f = e.target.files?.[0]; if (f) processImage(f) }}
          />
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="spin" style={{ width: 28, height: 28, borderWidth: 3 }} />
              <div style={{ fontSize: 13, color: 'var(--indigo2)', fontWeight: 600 }}>🤖 Extracting rates...</div>
              <div style={{ fontSize: 11, color: 'var(--w40)' }}>Reading tasks and hourly rates...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 36 }}>📸</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--w80)' }}>
                Drop rate card photo here
              </div>
              <div style={{ fontSize: 11, color: 'var(--w40)' }}>JPG · PNG · HEIC accepted</div>
              <div className="btn btn-sm btn-ghost" style={{ marginTop: 4, pointerEvents: 'none' }}>
                Browse photo
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: 10,
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 10,
            fontSize: 12,
            color: 'var(--red2)',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Extracted rates table */}
      {extracted.length > 0 && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--green2)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ✓ {extracted.length} rates extracted
            </div>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => { setExtracted([]); setApplied(false) }}
            >
              ↺ Retake
            </button>
          </div>

          <div
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              marginBottom: 14,
            }}
          >
            <table className="q-table">
              <thead>
                <tr>
                  <th>Task / Trade</th>
                  <th>Rate / hr</th>
                  <th>Currency</th>
                </tr>
              </thead>
              <tbody>
                {extracted.map((rate, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{rate.task}</td>
                    <td className="mono" style={{ color: 'var(--amber)', fontWeight: 700 }}>
                      ${rate.ratePerHour.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className="chip"
                        style={{
                          background: 'rgba(245,158,11,0.08)',
                          borderColor: 'rgba(245,158,11,0.22)',
                          color: 'var(--amber2)',
                        }}
                      >
                        {rate.currency}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Apply button */}
          <button
            className="btn btn-success btn-full"
            onClick={handleApply}
            disabled={applied}
            style={{ letterSpacing: '0.1em' }}
          >
            {applied ? '✓ Rates Applied' : '✓ Apply These Rates'}
          </button>

          {applied && (
            <div
              style={{
                marginTop: 10,
                padding: '10px 14px',
                background: 'rgba(16,185,129,0.07)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 10,
                fontSize: 12,
                color: 'var(--green2)',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              Rates saved — they will be applied to future takeoffs
            </div>
          )}
        </div>
      )}
    </div>
  )
}

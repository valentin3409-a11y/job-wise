'use client'
import { useState, useCallback } from 'react'
import { Plan, PlanAnalysisResult } from '@/lib/types'

function isSimilar(a: Plan, analysis: PlanAnalysisResult): boolean {
  const aKey = `${a.discipline}_${a.planType}_${a.title || a.name}`.toLowerCase()
  const bKey = `${analysis.discipline}_${analysis.planType}_${analysis.title}`.toLowerCase()
  if (a.discipline === analysis.discipline && a.planType === analysis.planType) {
    const aw = aKey.split(/\W+/).filter(Boolean)
    const bw = bKey.split(/\W+/).filter(Boolean)
    const common = aw.filter(w => bw.includes(w) && w.length > 3)
    if (common.length >= 2 || a.title?.toLowerCase() === analysis.title?.toLowerCase()) return true
  }
  return false
}

export default function PlanUpload({ siteId, onUpload, existingPlans }: {
  siteId: string
  onUpload: (plan: Plan) => void
  existingPlans: Plan[]
}) {
  const [analyzing, setAnalyzing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [lastAnalyzed, setLastAnalyzed] = useState<PlanAnalysisResult | null>(null)

  const processFile = useCallback(async (file: File) => {
    setError('')
    setLastAnalyzed(null)
    setAnalyzing(true)

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

      const res = await fetch('/api/plans/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: file.type || 'image/jpeg',
          siteId,
          planName: file.name,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      const analysis: PlanAnalysisResult = data.analysis
      setLastAnalyzed(analysis)

      const dupOf = existingPlans.find(p => isSimilar(p, analysis))

      const newPlan: Plan = {
        id: `plan_${Date.now()}`,
        siteId,
        name: analysis.title || file.name,
        discipline: analysis.discipline,
        planType: analysis.planType,
        category: analysis.discipline,
        uploadDate: new Date().toISOString(),
        uploadedBy: 'valentin',
        imageBase64: base64,
        mediaType: file.type,
        analysis,
        title: analysis.title,
        revision: analysis.revision,
        isDuplicate: !!dupOf,
        duplicateOf: dupOf?.id,
      }

      onUpload(newPlan)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    }
    setAnalyzing(false)
  }, [siteId, existingPlans, onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  return (
    <div>
      <div
        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }}
        />
        {analyzing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="spin" style={{ width: 28, height: 28, borderWidth: 3 }} />
            <div style={{ fontSize: 13, color: 'var(--indigo2)', fontWeight: 600 }}>🤖 AI analyzing plan...</div>
            <div style={{ fontSize: 11, color: 'var(--w40)' }}>Identifying discipline, elements, dimensions...</div>
          </div>
        ) : lastAnalyzed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 28 }}>✅</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green2)' }}>Plan analyzed successfully</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              <span
                className="chip"
                style={{
                  background: 'rgba(99,102,241,0.12)',
                  borderColor: 'rgba(99,102,241,0.3)',
                  color: 'var(--indigo2)',
                }}
              >
                {lastAnalyzed.discipline}
              </span>
              <span
                className="chip"
                style={{
                  background: 'rgba(245,158,11,0.12)',
                  borderColor: 'rgba(245,158,11,0.3)',
                  color: 'var(--amber2)',
                }}
              >
                {lastAnalyzed.planType}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--w60)', textAlign: 'center', maxWidth: 260 }}>
              {lastAnalyzed.title}
            </div>
            <div style={{ fontSize: 10, color: 'var(--w40)' }}>Drop another plan to continue</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 36 }}>📐</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--w80)' }}>Drop architectural plans here</div>
            <div style={{ fontSize: 11, color: 'var(--w40)' }}>JPG · PNG · PDF · DWG preview accepted</div>
            <div className="btn btn-sm btn-ghost" style={{ marginTop: 4, pointerEvents: 'none' }}>Browse files</div>
          </div>
        )}
      </div>

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
    </div>
  )
}

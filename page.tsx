'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/Topbar'
import { JobListing, BatchItem } from '@/types'

type Step = 'search' | 'results' | 'review'

const COUNTRIES = ['Suisse','France','Belgique','Canada','Australie','Royaume-Uni','États-Unis','Allemagne','Luxembourg','Pays-Bas']

export default function AnalyzePage() {
  const router = useRouter()

  // Step
  const [step, setStep] = useState<Step>('search')

  // Search form
  const [cvText, setCvText] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [country, setCountry] = useState('Suisse')
  const [city, setCity] = useState('')
  const [level, setLevel] = useState('senior')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')

  // Results
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [filter, setFilter] = useState('all')

  // Batch review
  const [batch, setBatch] = useState<BatchItem[]>([])
  const [openDetail, setOpenDetail] = useState<number | null>(null)
  const [detailTab, setDetailTab] = useState<Record<number, string>>({})

  // ── SEARCH ────────────────────────────────────────────────
  async function doSearch() {
    if (cvText.trim().length < 30) { setSearchError('Veuillez décrire votre profil (min 30 caractères).'); return }
    if (!jobTitle.trim()) { setSearchError('Veuillez indiquer le poste recherché.'); return }
    setSearchError(''); setSearchLoading(true)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: jobTitle, country, city, level, cvText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Recherche échouée')
      setJobs(data.jobs || [])
      setSelected([])
      setStep('results')
    } catch (e: any) {
      setSearchError(e.message)
    }
    setSearchLoading(false)
  }

  function fillDemo() {
    setCvText('Jean Martin — Chef de Projet BTP\nVinci Construction 2019-2025: 3 chantiers simultanés 8–18M€, management 14 personnes, écart budget 2.3%, 0 retard\nEiffage 2016-2019: conducteur travaux gros œuvre jusqu\'à 5M€\nCompétences: MS Project, AutoCAD, BIM notions, gestion budgétaire\nLangues: Français natif, Anglais B2\nFormation: Master Génie Civil ESTP Paris 2016')
    setJobTitle('Chef de Projet Senior BTP')
    setCountry('Suisse')
    setCity('Genève')
    setLevel('senior')
  }

  // ── SELECTION ─────────────────────────────────────────────
  function toggleSel(id: number) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function getFilteredJobs() {
    if (filter === 'top') return jobs.filter(j => j.score >= 75)
    if (filter === 'all') return jobs
    return jobs.filter(j => j.source === filter)
  }

  // ── ANALYZE ───────────────────────────────────────────────
  async function startBatch(jobIds?: number[]) {
    const toAnalyze = jobIds
      ? jobs.filter(j => jobIds.includes(j.id))
      : selected.length > 0
        ? jobs.filter(j => selected.includes(j.id))
        : jobs.slice(0, 5)

    const initial: BatchItem[] = toAnalyze.map(j => ({
      ...j, status: 'pending', approved: false, rejected: false,
    }))
    setBatch(initial)
    setStep('review')

    // Analyze sequentially in small groups to avoid rate limits
    const updated = [...initial]
    const chunks: BatchItem[][] = []
    for (let i = 0; i < updated.length; i += 3) chunks.push(updated.slice(i, i + 3))

    for (const chunk of chunks) {
      // Mark as analyzing
      chunk.forEach(item => { item.status = 'analyzing' })
      setBatch([...updated])

      await Promise.all(chunk.map(async (item) => {
        try {
          const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cvText,
              jobTitle: item.title,
              company: item.company,
              location: item.location,
              salary: item.salary,
              jobType: item.type,
              source: item.source,
              jobDescription: `${item.description}\n\nRequis: ${item.requirements.join(', ')}`,
              lang: 'fr',
              country,
              saveToDB: true,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Erreur analyse')
          item.status = 'ready'
          item.match = data.match
          item.cover = data.cover_letter
          item.bullets = data.tailored_bullets
          item.linkedin = data.linkedin_messages
          item.qa = data.screening_qa
          item.applicationId = data.applicationId
        } catch {
          item.status = 'error'
        }
        setBatch(prev => prev.map(b => b.id === item.id ? { ...item } : b))
      }))
    }
  }

  // ── BATCH ACTIONS ─────────────────────────────────────────
  function approve(id: number) {
    setBatch(prev => prev.map(b => b.id === id ? { ...b, approved: true, rejected: false } : b))
  }
  function reject(id: number) {
    setBatch(prev => prev.map(b => b.id === id ? { ...b, rejected: true, approved: false } : b))
  }
  function undo(id: number) {
    setBatch(prev => prev.map(b => b.id === id ? { ...b, approved: false, rejected: false } : b))
  }
  function approveAll() {
    setBatch(prev => prev.map(b => b.status === 'ready' && !b.rejected ? { ...b, approved: true } : b))
  }
  function updateCover(id: number, text: string) {
    setBatch(prev => prev.map(b => b.id === id ? { ...b, cover: text } : b))
  }

  const approved = batch.filter(b => b.approved).length
  const total = batch.filter(b => b.status === 'ready' || b.status === 'analyzing' || b.status === 'error').length
  const pct = total > 0 ? Math.round(approved / total * 100) : 0
  const sources = [...new Set(jobs.map(j => j.source))]

  // ── SCORE STYLE ───────────────────────────────────────────
  function scoreStyle(s: number) {
    return s >= 75
      ? { bg: '#e0ede6', bd: '#45856a', c: '#326b53' }
      : s >= 55
      ? { bg: '#fdf3e0', bd: '#c8820a', c: '#b97613' }
      : { bg: '#fce8e8', bd: '#c74040', c: '#a32d2d' }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink7)' }}>
      <Topbar />

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 20px' }}>

        {/* ── STEP 1: SEARCH ── */}
        {step === 'search' && (
          <div className="animate-fade-up">
            {/* Step indicator */}
            <div className="steps" style={{ marginBottom: 28 }}>
              {['Votre profil', 'Offres trouvées', 'Validation'].map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div className={`step-dot ${i === 0 ? 'active' : 'todo'}`}>{i + 1}</div>
                    <span className="step-label" style={{ color: i === 0 ? 'var(--ink)' : 'var(--ink4)' }}>{label}</span>
                  </div>
                  {i < 2 && <div className="step-line" style={{ background: 'var(--ink5)', margin: '0 8px', marginBottom: 16 }} />}
                </div>
              ))}
            </div>

            <h1 style={{ fontSize: 26, marginBottom: 6 }}>Trouvez votre prochain emploi</h1>
            <p style={{ color: 'var(--ink4)', marginBottom: 24, fontSize: 14 }}>
              L'IA cherche les offres en temps réel sur LinkedIn, Indeed, Jobs.ch et plus selon vos critères.
            </p>

            <div className="card">
              <div style={{ marginBottom: 14 }}>
                <label className="lbl">Votre profil / CV</label>
                <textarea
                  value={cvText} onChange={e => setCvText(e.target.value)} rows={5}
                  placeholder="Décrivez votre expérience, compétences, formation...&#10;Ex: Chef de Projet BTP, 6 ans chez Vinci, chantiers 8–18M€, MS Project, management 14 personnes, Français natif, Anglais B2, ESTP Paris 2016"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label className="lbl">Poste recherché</label>
                  <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Ex: Chef de Projet, Ingénieur..." />
                </div>
                <div>
                  <label className="lbl">Pays</label>
                  <select value={country} onChange={e => setCountry(e.target.value)}>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                <div>
                  <label className="lbl">Ville (optionnel)</label>
                  <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ex: Genève, Zurich, Paris..." />
                </div>
                <div>
                  <label className="lbl">Niveau</label>
                  <select value={level} onChange={e => setLevel(e.target.value)}>
                    <option value="senior">Senior (5+ ans)</option>
                    <option value="mid">Intermédiaire (2–5 ans)</option>
                    <option value="junior">Junior (0–2 ans)</option>
                    <option value="executive">Cadre dirigeant</option>
                  </select>
                </div>
              </div>
              {searchError && <p className="err" style={{ marginBottom: 12 }}>{searchError}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-gold" onClick={doSearch} disabled={searchLoading}
                  style={{ flex: 1, padding: 12, fontSize: 14 }}>
                  {searchLoading ? <><span className="spin" style={{ borderTopColor: 'white' }} /> Recherche en cours...</> : 'Trouver des offres →'}
                </button>
                <button className="btn" onClick={fillDemo}>Exemple</button>
              </div>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink5)', marginTop: 10 }}>
                LinkedIn · Indeed · Jobs.ch · JobUp · Glassdoor · Monster · et plus
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2: RESULTS ── */}
        {step === 'results' && (
          <div className="animate-fade-up">
            {/* Step indicator */}
            <div className="steps" style={{ marginBottom: 24 }}>
              {['Votre profil', 'Offres trouvées', 'Validation'].map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div className={`step-dot ${i < 1 ? 'done' : i === 1 ? 'active' : 'todo'}`}>{i < 1 ? '✓' : i + 1}</div>
                    <span className="step-label" style={{ color: i <= 1 ? 'var(--ink)' : 'var(--ink4)' }}>{label}</span>
                  </div>
                  {i < 2 && <div className="step-line" style={{ background: i < 1 ? 'var(--sage)' : 'var(--ink5)', margin: '0 8px', marginBottom: 16 }} />}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { n: jobs.length, l: 'Offres trouvées', c: 'var(--ink)' },
                { n: Math.round(jobs.reduce((a,b)=>a+b.score,0)/jobs.length), l: 'Score moyen', c: 'var(--gold)' },
                { n: jobs.filter(j=>j.score>=75).length, l: 'Fort match', c: 'var(--sage)' },
                { n: sources.length, l: 'Sources', c: 'var(--ink)' },
              ].map(s => (
                <div key={s.l} style={{ background: 'white', border: '1px solid var(--ink6)', borderRadius: 10, padding: '10px 14px', flex: 1, minWidth: 80, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 500, color: s.c, fontFamily: 'var(--font-display)' }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink4)' }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Header with action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{jobs.length} offres · {jobTitle} · {country}</span>
                <button className="btn btn-sm" onClick={() => setStep('search')} style={{ marginLeft: 10, fontSize: 11 }}>← Modifier</button>
              </div>
              {selected.length > 0 && (
                <button className="btn btn-gold" onClick={() => startBatch()}>
                  Analyser {selected.length} offre{selected.length > 1 ? 's' : ''} sélectionnée{selected.length > 1 ? 's' : ''} →
                </button>
              )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
              {['all', ...sources, 'top'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ fontSize: 11, padding: '4px 12px', borderRadius: 20, border: '1px solid var(--ink6)', background: filter === f ? 'var(--ink)' : 'white', color: filter === f ? 'white' : 'var(--ink3)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 500, transition: 'all .15s' }}>
                  {f === 'all' ? `Toutes (${jobs.length})` : f === 'top' ? `Fort match 75+ (${jobs.filter(j=>j.score>=75).length})` : `${f} (${jobs.filter(j=>j.source===f).length})`}
                </button>
              ))}
            </div>

            {/* Job list */}
            {getFilteredJobs().map(job => {
              const sc = scoreStyle(job.score)
              const isSel = selected.includes(job.id)
              const init = (job.company || 'CO').split(' ').slice(0,2).map((w:string)=>w[0]||'').join('').toUpperCase()
              return (
                <div key={job.id} className="card animate-fade-up" style={{ padding: '13px 16px', marginBottom: 8, border: isSel ? '2px solid var(--gold)' : '1px solid var(--ink6)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 7, background: 'var(--ink7)', border: '1px solid var(--ink6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 500, fontSize: 12, color: 'var(--ink3)', flexShrink: 0 }}>{init}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 4 }}>{job.company} · {job.location}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {job.salary && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: '#e8f4e8', color: '#2d6b4a', border: '1px solid #a3c9b5' }}>{job.salary}</span>}
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'var(--ink7)', color: 'var(--ink4)', border: '1px solid var(--ink6)' }}>{job.type}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: '#eff4ff', color: '#1d4ed8', border: '1px solid #bfcfef' }}>{job.source}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: 'var(--ink7)', color: 'var(--ink4)', border: '1px solid var(--ink6)' }}>{job.posted}</span>
                      </div>
                    </div>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: sc.bg, border: `2px solid ${sc.bd}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: sc.c }}>{job.score}</span>
                      <span style={{ fontSize: 9, color: sc.c }}>/100</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--ink6)', flexWrap: 'wrap' }}>
                    <button className={`btn btn-sm ${isSel ? 'btn-green' : ''}`} onClick={() => toggleSel(job.id)}>
                      {isSel ? '✓ Sélectionné' : '+ Sélectionner'}
                    </button>
                    <button className="btn btn-sm" onClick={() => setOpenDetail(openDetail === job.id ? null : job.id)}>
                      {openDetail === job.id ? 'Masquer' : 'Détails'}
                    </button>
                    <button className="btn btn-sm btn-gold" onClick={() => startBatch([job.id])}>Analyser ce poste →</button>
                  </div>

                  {openDetail === job.id && (
                    <div className="animate-fade-up" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--ink6)' }}>
                      <p style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.7, marginBottom: 8 }}>{job.description}</p>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {job.requirements.map(r => (
                          <span key={r} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--ink7)', color: 'var(--ink4)', border: '1px solid var(--ink6)' }}>{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── STEP 3: REVIEW ── */}
        {step === 'review' && (
          <div className="animate-fade-up">
            {/* Step indicator */}
            <div className="steps" style={{ marginBottom: 24 }}>
              {['Votre profil', 'Offres trouvées', 'Validation'].map((label, i) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div className={`step-dot ${i < 2 ? 'done' : 'active'}`}>{i < 2 ? '✓' : i + 1}</div>
                    <span className="step-label" style={{ color: 'var(--ink)' }}>{label}</span>
                  </div>
                  {i < 2 && <div className="step-line" style={{ background: 'var(--sage)', margin: '0 8px', marginBottom: 16 }} />}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 20, marginBottom: 3 }}>Queue de validation</h2>
                <p style={{ fontSize: 13, color: 'var(--ink4)' }}>
                  {batch.filter(b=>b.status==='ready').length} prêts · {batch.filter(b=>b.status==='analyzing'||b.status==='pending').length} en cours · {approved} approuvés
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-green btn-sm" onClick={approveAll}>Tout approuver ✓</button>
                <button className="btn btn-sm" onClick={() => setStep('results')}>← Retour</button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink4)', marginBottom: 5 }}>
              <span>{approved}/{total} approuvés</span><span>{pct}%</span>
            </div>
            <div className="progress-bar" style={{ marginBottom: 16 }}>
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>

            {batch.map(item => {
              const sc = scoreStyle(item.score || 0)
              const isOpen = openDetail === item.id
              const tab = detailTab[item.id] || 'cover'

              return (
                <div key={item.id} className="card animate-fade-up" style={{
                  marginBottom: 8,
                  borderLeft: item.approved ? '3px solid var(--sage)' : item.rejected ? '3px solid var(--ink5)' : '1px solid var(--ink6)',
                  opacity: item.rejected ? 0.45 : 1,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {/* Score or spinner */}
                    {item.status === 'pending' || item.status === 'analyzing' ? (
                      <div style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="spin" style={{ width: 18, height: 18, borderTopColor: 'var(--gold)', border: '2px solid transparent', borderTop: '2px solid var(--gold)' }} />
                      </div>
                    ) : item.status === 'error' ? (
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--red2)', border: '2px solid var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, color: 'var(--red)', fontWeight: 600 }}>!</div>
                    ) : (
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: sc.bg, border: `2px solid ${sc.bd}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: sc.c }}>{item.score}</span>
                        <span style={{ fontSize: 9, color: sc.c }}>/100</span>
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink3)' }}>
                        {item.company} · {item.location}
                        {item.approved && <span style={{ color: 'var(--sage)', marginLeft: 6 }}>· ✓ Approuvé</span>}
                        {item.rejected && <span style={{ color: 'var(--ink4)', marginLeft: 6 }}>· Rejeté</span>}
                      </div>
                      {item.match && (
                        <p style={{ fontSize: 11, color: 'var(--ink4)', marginTop: 3, fontStyle: 'italic' }}>
                          "{item.match.honest_summary?.substring(0, 90)}..."
                        </p>
                      )}
                      {item.status === 'analyzing' && (
                        <p style={{ fontSize: 11, color: 'var(--gold)', marginTop: 3 }}>Analyse IA en cours...</p>
                      )}
                      {item.status === 'error' && (
                        <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>Erreur d'analyse</p>
                      )}
                    </div>

                    {item.status === 'ready' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                        {item.approved || item.rejected ? (
                          <button className="btn btn-sm" onClick={() => undo(item.id)}>Annuler</button>
                        ) : (
                          <>
                            <button className="btn btn-sm btn-green" onClick={() => approve(item.id)}>✓ Approuver</button>
                            <button className="btn btn-sm btn-red" onClick={() => reject(item.id)}>✕ Rejeter</button>
                          </>
                        )}
                        <button className="btn btn-sm" onClick={() => { setOpenDetail(isOpen ? null : item.id) }}>
                          {isOpen ? 'Fermer' : 'Réviser'}
                        </button>
                      </div>
                    )}

                    {item.applicationId && (
                      <a href={`/results/${item.applicationId}`} className="btn btn-sm" style={{ flexShrink: 0 }}>Voir →</a>
                    )}
                  </div>

                  {/* Detail panel */}
                  {isOpen && item.status === 'ready' && (
                    <div className="animate-fade-up" style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--ink6)' }}>
                      {/* Strengths / Gaps */}
                      {item.match && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                          <div style={{ background: 'var(--ink7)', borderRadius: 8, padding: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--sage)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Points forts</div>
                            {item.match.strengths?.map((s,i) => (
                              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 12, color: 'var(--ink3)' }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sage)', flexShrink: 0, marginTop: 4 }} />{s}
                              </div>
                            ))}
                          </div>
                          <div style={{ background: 'var(--ink7)', borderRadius: 8, padding: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>À améliorer</div>
                            {item.match.gaps?.map((g,i) => (
                              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, fontSize: 12, color: 'var(--ink3)' }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0, marginTop: 4 }} />{g}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tabs */}
                      <div className="tabs" style={{ marginBottom: 12 }}>
                        {['cover','linkedin','qa'].map(t => (
                          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`}
                            onClick={() => setDetailTab(prev => ({ ...prev, [item.id]: t }))}>
                            {t === 'cover' ? 'Lettre de motivation' : t === 'linkedin' ? 'Messages LinkedIn' : 'Q&A entretien'}
                          </button>
                        ))}
                      </div>

                      {/* Cover letter */}
                      {tab === 'cover' && (
                        <div>
                          <label className="lbl">Modifiable avant approbation</label>
                          <textarea
                            rows={8} value={item.cover || ''}
                            onChange={e => updateCover(item.id, e.target.value)}
                            style={{ background: 'var(--ink7)', lineHeight: 1.8, fontSize: 13 }}
                          />
                        </div>
                      )}

                      {/* LinkedIn */}
                      {tab === 'linkedin' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {item.linkedin?.map((m, i) => {
                            const cols = [{ bg: 'var(--ink6)', c: 'var(--ink3)' },{ bg: 'var(--gold3)', c: '#b97613' },{ bg: 'var(--sage2)', c: 'var(--sage)' }]
                            const cl = cols[i] || cols[0]
                            return (
                              <div key={i} style={{ border: '1px solid var(--ink6)', borderRadius: 8, padding: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                                  <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 10, background: cl.bg, color: cl.c }}>{m.label}</span>
                                  <span style={{ fontSize: 10, color: m.text?.length > 290 ? 'var(--red)' : 'var(--ink4)' }}>{m.text?.length || 0}/300</span>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--ink2)', fontStyle: 'italic', lineHeight: 1.65 }}>"{m.text}"</p>
                                <button className="btn btn-sm" style={{ marginTop: 8 }}
                                  onClick={() => navigator.clipboard.writeText(m.text || '')}>
                                  Copier
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Q&A */}
                      {tab === 'qa' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {item.qa?.map((q, i) => (
                            <div key={i} style={{ border: '1px solid var(--ink6)', borderRadius: 8, padding: 12 }}>
                              <div style={{ display: 'flex', gap: 9, marginBottom: 8 }}>
                                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 500, flexShrink: 0 }}>{i+1}</div>
                                <p style={{ fontWeight: 500, fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>{q.question}</p>
                              </div>
                              <p style={{ fontSize: 13, color: 'var(--ink3)', lineHeight: 1.7, paddingLeft: 29 }}>{q.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        <button className="btn btn-green" onClick={() => approve(item.id)} style={{ flex: 1 }}>✓ Approuver ce dossier</button>
                        <button className="btn btn-red" onClick={() => reject(item.id)}>✕ Rejeter</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Go to dashboard */}
            {approved > 0 && (
              <div className="card animate-fade-up" style={{ textAlign: 'center', marginTop: 16 }}>
                <p style={{ fontSize: 14, color: 'var(--ink3)', marginBottom: 12 }}>
                  {approved} dossier{approved > 1 ? 's' : ''} approuvé{approved > 1 ? 's' : ''} · Retrouvez-les dans votre dashboard
                </p>
                <a href="/dashboard" className="btn btn-dark">Voir mon dashboard →</a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

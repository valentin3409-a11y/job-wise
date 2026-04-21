'use client'
import { useState, useCallback } from 'react'
import {
  Site, Email, EmailAnalysis, Notification, Task,
  Plan, Takeoff, WorkerRate, MultiAIResponse,
} from '@/lib/types'
import { COLORS } from '@/lib/constants'
import { INITIAL_SITES, INITIAL_NOTIFS } from '@/lib/data'
import { callAI } from '@/lib/ai'

import TopBar       from '@/components/layout/TopBar'
import BottomNav    from '@/components/layout/BottomNav'
import SiteCard     from '@/components/sites/SiteCard'
import ChatTab      from '@/components/chat/ChatTab'
import EmailList    from '@/components/email/EmailList'
import EmailDetail  from '@/components/email/EmailDetail'
import TaskList     from '@/components/tasks/TaskList'
import NotifPanel   from '@/components/notifications/NotifPanel'
import PlanGrid     from '@/components/plans/PlanGrid'
import PlanDetail   from '@/components/plans/PlanDetail'
import PlanDuplicateAlert from '@/components/plans/PlanDuplicateAlert'
import QuantityTakeoff    from '@/components/quotes/QuantityTakeoff'
import WorkerRateCapture  from '@/components/quotes/WorkerRateCapture'
import Toast        from '@/components/ui/Toast'

type Tab = 'sites' | 'chat' | 'plans' | 'quotes' | 'emails' | 'tasks' | 'notifs'

const CURRENT_USER = 'valentin'

export default function Home() {
  // ── core state ──────────────────────────────────────────────────────────
  const [sites,         setSites]        = useState<Site[]>(INITIAL_SITES)
  const [notifs,        setNotifs]       = useState<Notification[]>(INITIAL_NOTIFS)
  const [selectedSite,  setSelectedSite] = useState<Site | null>(null)
  const [selectedEmail, setSelectedEmail]= useState<Email | null>(null)
  const [selectedPlan,  setSelectedPlan] = useState<Plan | null>(null)
  const [tab,           setTab]          = useState<Tab>('sites')

  // ── plans & quotes ───────────────────────────────────────────────────────
  const [plans,         setPlans]        = useState<Plan[]>([])
  const [takeoffs,      setTakeoffs]     = useState<Takeoff[]>([])
  const [workerRates,   setWorkerRates]  = useState<WorkerRate[]>([])
  const [pendingDups,   setPendingDups]  = useState<Array<{plan: Plan; existing: Plan}>>([])
  const [showRateCapture, setShowRateCapture] = useState(false)

  // ── email AI ─────────────────────────────────────────────────────────────
  const [analyses,  setAnalyses]  = useState<Map<string, EmailAnalysis>>(new Map())
  const [analysing, setAnalysing] = useState<string | null>(null)

  // ── chat AI (single) ─────────────────────────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false)
  const [aiReply,   setAiReply]   = useState('')
  const [aiInput,   setAiInput]   = useState('')

  // ── multi-AI council ─────────────────────────────────────────────────────
  const [multiLoading, setMultiLoading] = useState(false)
  const [multiResult,  setMultiResult]  = useState<MultiAIResponse | null>(null)

  // ── toast ─────────────────────────────────────────────────────────────────
  const [toast,      setToast]      = useState<string | null>(null)
  const [toastColor, setToastColor] = useState(COLORS.amber)

  function showToast(msg: string, col = COLORS.amber) {
    setToast(msg)
    setToastColor(col)
    setTimeout(() => setToast(null), 3000)
  }

  // ── derived ──────────────────────────────────────────────────────────────
  const currentSite   = sites.find(s => s.id === selectedSite?.id) ?? null
  const sitePlans     = plans.filter(p => p.siteId === currentSite?.id)
  const siteTakeoffs  = takeoffs.filter(t => t.siteId === currentSite?.id)
  const unreadEmails  = currentSite?.emails.filter(e => !e.read).length ?? 0
  const urgentTasks   = currentSite?.tasks.filter(t => !t.done && t.priority === 'high').length ?? 0
  const unreadNotifs  = notifs.filter(n => !n.read).length

  // ── helpers ──────────────────────────────────────────────────────────────
  function updateSite(updated: Site) {
    setSites(prev => prev.map(s => s.id === updated.id ? updated : s))
    if (selectedSite?.id === updated.id) setSelectedSite(updated)
  }

  function goSite(site: Site) {
    setSelectedSite(site)
    setTab('chat')
    setSelectedEmail(null)
    setSelectedPlan(null)
    setAiReply('')
    setMultiResult(null)
  }

  function goBack() {
    if (selectedPlan)  { setSelectedPlan(null);  return }
    if (selectedEmail) { setSelectedEmail(null); return }
    setSelectedSite(null)
    setTab('sites')
    setAiReply('')
    setMultiResult(null)
  }

  function handleTab(t: Tab) {
    setTab(t as Tab)
    setSelectedEmail(null)
    setSelectedPlan(null)
  }

  // ── messages ──────────────────────────────────────────────────────────────
  function sendMessage(text: string) {
    if (!currentSite) return
    const msg = {
      id: `msg-${Date.now()}`,
      userId: CURRENT_USER,
      text,
      time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      pinned: false,
    }
    updateSite({ ...currentSite, messages: [...currentSite.messages, msg] })
  }

  function notifyAll(text: string) {
    if (!currentSite) return
    sendMessage(text)
    addNotif(currentSite.id, 'urgent', text)
    showToast('🚨 Urgent alert sent to team', COLORS.red)
  }

  function addNotif(siteId: string, type: string, text: string) {
    const n: Notification = {
      id: `n-${Date.now()}`,
      siteId,
      type,
      text,
      time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    }
    setNotifs(prev => [n, ...prev])
  }

  // ── email ─────────────────────────────────────────────────────────────────
  function selectEmail(email: Email) {
    if (!currentSite) return
    updateSite({ ...currentSite, emails: currentSite.emails.map(e => e.id === email.id ? { ...e, read: true } : e) })
    setSelectedEmail(email)
  }

  async function analyseEmail() {
    if (!selectedEmail || !currentSite) return
    setAnalysing(selectedEmail.id)
    try {
      const raw = await callAI(
        `You are a construction PM AI. Analyse emails. Return ONLY valid JSON: { category, priority, summary, action, isInvoice, amount?, dueDate? }. category options: invoice|compliance|drawings|safety|report|general. priority: high|medium|low.`,
        `From: ${selectedEmail.fromName} <${selectedEmail.from}>\nSubject: ${selectedEmail.subject}\nBody: ${selectedEmail.body}\nSite: ${currentSite.name}`
      )
      const json = JSON.parse(raw.replace(/```json\n?|```\n?/g, '').trim())
      setAnalyses(prev => new Map(prev).set(selectedEmail.id, json as EmailAnalysis))
      updateSite({ ...currentSite, emails: currentSite.emails.map(e => e.id === selectedEmail.id ? { ...e, read: true } : e) })
    } catch { /* silent */ }
    setAnalysing(null)
  }

  function notifyTeamAboutEmail() {
    if (!currentSite || !selectedEmail) return
    addNotif(currentSite.id, 'email', `Team alert: "${selectedEmail.subject}" from ${selectedEmail.fromName}`)
    showToast('📢 Team notified', COLORS.blue)
  }

  // ── AI single ─────────────────────────────────────────────────────────────
  async function askAI(question?: string) {
    const q = question || aiInput
    if (!q.trim() || !currentSite) return
    setAiLoading(true)
    setAiReply('')
    try {
      const reply = await callAI(
        `You are FOREMAN AI, expert construction project management assistant. Answer concisely and practically. Max 200 words.`,
        `Site: ${currentSite.name} | Phase: ${currentSite.phase} | Progress: ${currentSite.progress}%\nOpen tasks: ${currentSite.tasks.filter(t=>!t.done).map(t=>t.text).join('; ')}\nRecent chat: ${currentSite.messages.slice(-3).map(m=>`${m.userId}: ${m.text}`).join(' | ')}\n\nQuestion: ${q}`
      )
      setAiReply(reply)
    } catch { setAiReply('AI temporarily unavailable.') }
    setAiLoading(false)
  }

  // ── AI council (3 heads) ──────────────────────────────────────────────────
  async function askMultiAI(question: string) {
    if (!question.trim()) return
    setMultiLoading(true)
    setMultiResult(null)
    try {
      const context = currentSite
        ? `Site: ${currentSite.name} | Phase: ${currentSite.phase} | Budget: $${currentSite.budget.toLocaleString()} | Spent: $${currentSite.spent.toLocaleString()}`
        : undefined
      const res = await fetch('/api/ai/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context }),
      })
      const data = await res.json()
      setMultiResult(data as MultiAIResponse)
    } catch { /* silent */ }
    setMultiLoading(false)
  }

  // ── tasks ─────────────────────────────────────────────────────────────────
  function toggleTask(id: string) {
    if (!currentSite) return
    updateSite({ ...currentSite, tasks: currentSite.tasks.map(t => t.id === id ? { ...t, done: !t.done } : t) })
  }

  function addTask(text: string, priority: 'high'|'med'|'low' = 'med', assign: string = CURRENT_USER) {
    if (!currentSite) return
    const task: Task = { id: `task-${Date.now()}`, text, done: false, priority, assign, due: 'TBD' }
    updateSite({ ...currentSite, tasks: [...currentSite.tasks, task] })
  }

  // ── plans ─────────────────────────────────────────────────────────────────
  const handlePlanUpload = useCallback((plan: Plan) => {
    if (plan.isDuplicate && plan.duplicateOf) {
      const existing = plans.find(p => p.id === plan.duplicateOf)
      if (existing) {
        setPendingDups(prev => [...prev, { plan, existing }])
        addNotif(plan.siteId, 'urgent', `⚠️ Possible duplicate plan: "${plan.name}"`)
        return
      }
    }
    setPlans(prev => [...prev, plan])
    addNotif(plan.siteId, 'plan', `📐 New plan added: ${plan.name} (${plan.discipline})`)
    showToast(`✓ Plan analyzed: ${plan.discipline}`, COLORS.green)
  }, [plans])

  function keepBothPlans(dup: { plan: Plan; existing: Plan }) {
    setPlans(prev => [...prev, { ...dup.plan, isDuplicate: false }])
    setPendingDups(prev => prev.filter(d => d.plan.id !== dup.plan.id))
    showToast('Both plans kept', COLORS.amber)
  }

  function discardDuplicate(dup: { plan: Plan; existing: Plan }) {
    setPendingDups(prev => prev.filter(d => d.plan.id !== dup.plan.id))
    showToast('Duplicate discarded', COLORS.w60)
  }

  // ── takeoffs ──────────────────────────────────────────────────────────────
  function saveTakeoff(t: Takeoff) {
    setTakeoffs(prev => [...prev, { ...t, id: `to-${Date.now()}` }])
    if (currentSite) addNotif(currentSite.id, 'takeoff', `🔢 Quantity takeoff saved: $${t.total.toLocaleString('en-AU')}`)
    showToast(`✓ Quotation saved — $${t.total.toLocaleString('en-AU')} AUD`, COLORS.amber)
    handleTab('quotes')
  }

  // ── notifs ─────────────────────────────────────────────────────────────────
  function readNotif(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }
  function navigateFromNotif(siteId: string) {
    const site = sites.find(s => s.id === siteId)
    if (site) goSite(site)
  }

  // ── render ────────────────────────────────────────────────────────────────
  const showEmailDetail = selectedEmail && currentSite
  const showPlanDetail  = selectedPlan  && currentSite

  return (
    <div style={{ minHeight:'100dvh', maxHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--bg0)', color:'var(--w80)', maxWidth:480, margin:'0 auto', position:'relative', overflow:'hidden' }}>

      {/* Subtle grid background */}
      <div className="bg-grid" />

      {/* Toast */}
      {toast && <Toast message={toast} col={toastColor} />}

      {/* Duplicate alert modals */}
      {pendingDups.length > 0 && (
        <div style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(3,3,10,0.85)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          {pendingDups.slice(0,1).map(dup => (
            <div key={dup.plan.id} style={{ width:'100%', maxWidth:420 }}>
              <PlanDuplicateAlert
                plan={dup.plan}
                existingPlan={dup.existing}
                onKeep={() => keepBothPlans(dup)}
                onDiscard={() => discardDuplicate(dup)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Email detail — fullscreen, no nav */}
      {showEmailDetail ? (
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <EmailDetail
            email={selectedEmail}
            site={currentSite}
            onBack={() => setSelectedEmail(null)}
            onNotifyTeam={notifyTeamAboutEmail}
            onAnalyse={analyseEmail}
            analysis={analyses.get(selectedEmail.id) ?? null}
            analysing={analysing === selectedEmail.id}
          />
        </div>
      ) : showPlanDetail ? (
        /* Plan detail — fullscreen, no nav */
        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <PlanDetail
            plan={selectedPlan}
            onBack={() => setSelectedPlan(null)}
            onTakeoff={plan => { setSelectedPlan(null); handleTab('quotes') }}
          />
        </div>
      ) : (
        <>
          <TopBar
            site={currentSite}
            onBack={goBack}
            onNotifsClick={() => handleTab('notifs')}
            unreadCount={unreadNotifs}
          />

          <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>

            {/* ── SITES ────────────────────────────────────────────── */}
            {tab === 'sites' && !currentSite && (
              <div className="content-scroll">
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.2em', color:'var(--w40)', textTransform:'uppercase', marginBottom:4 }}>Active Sites</div>
                  <div style={{ fontSize:11, color:'var(--w40)' }}>
                    {new Date().toLocaleDateString('en-AU', { weekday:'long', day:'numeric', month:'long' })}
                  </div>
                </div>
                {sites.map(site => (
                  <SiteCard key={site.id} site={site} onClick={() => goSite(site)} />
                ))}
              </div>
            )}

            {/* ── CHAT ─────────────────────────────────────────────── */}
            {tab === 'chat' && currentSite && (
              <ChatTab
                site={currentSite}
                currentUserId={CURRENT_USER}
                onSendMessage={sendMessage}
                onNotifyAll={notifyAll}
                aiLoading={aiLoading}
                aiReply={aiReply}
                aiInput={aiInput}
                onAiInputChange={setAiInput}
                onAskAI={askAI}
                onAskMultiAI={askMultiAI}
                multiAILoading={multiLoading}
                multiAIResult={multiResult}
              />
            )}

            {/* ── PLANS ─────────────────────────────────────────────── */}
            {tab === 'plans' && currentSite && (
              <div className="content-scroll">
                <PlanGrid
                  plans={sitePlans}
                  onSelectPlan={plan => setSelectedPlan(plan)}
                  onAddPlan={handlePlanUpload}
                  siteId={currentSite.id}
                />
              </div>
            )}

            {/* ── QUOTES ───────────────────────────────────────────── */}
            {tab === 'quotes' && currentSite && (
              <div className="content-scroll">
                {/* Worker rate capture toggle */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div className="sec-title">Quantity Takeoff & Quotation</div>
                  <button className="btn btn-sm btn-ghost" onClick={() => setShowRateCapture(r=>!r)}>
                    {showRateCapture ? '✕ Close Rates' : '📸 My Rates'}
                  </button>
                </div>

                {showRateCapture && (
                  <div style={{ marginBottom:14 }} className="anim-in">
                    <WorkerRateCapture
                      userId={CURRENT_USER}
                      onRatesExtracted={rates => {
                        setWorkerRates(prev => {
                          const merged = [...prev]
                          rates.forEach(r => {
                            const idx = merged.findIndex(m => m.task === r.task && m.userId === r.userId)
                            if (idx >= 0) merged[idx] = r
                            else merged.push(r)
                          })
                          return merged
                        })
                        setShowRateCapture(false)
                        showToast(`✓ ${rates.length} rates extracted`, COLORS.green)
                      }}
                    />
                  </div>
                )}

                {/* Saved takeoffs */}
                {siteTakeoffs.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div className="sec-title" style={{ marginBottom:10 }}>Saved Quotations</div>
                    {siteTakeoffs.map(t => (
                      <div key={t.id} className="card card-shine anim-up" style={{ marginBottom:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:'var(--w90)', marginBottom:2 }}>{t.planName || t.scope.substring(0,40)}</div>
                          <div style={{ fontSize:11, color:'var(--w40)' }}>{new Date(t.date).toLocaleDateString('en-AU')} · {t.materials.length} materials · {t.labour.length} trades</div>
                        </div>
                        <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color:'var(--amber)' }}>
                          ${t.total.toLocaleString('en-AU')}
                        </div>
                      </div>
                    ))}
                    <hr className="sep" />
                  </div>
                )}

                <QuantityTakeoff
                  plan={sitePlans.length > 0 ? sitePlans[0] : null}
                  siteId={currentSite.id}
                  workerRates={workerRates}
                  onSaveTakeoff={saveTakeoff}
                />
              </div>
            )}

            {/* ── EMAILS ───────────────────────────────────────────── */}
            {tab === 'emails' && currentSite && (
              <EmailList site={currentSite} onSelectEmail={selectEmail} />
            )}

            {/* ── TASKS ────────────────────────────────────────────── */}
            {tab === 'tasks' && currentSite && (
              <TaskList
                site={currentSite}
                currentUserId={CURRENT_USER}
                onToggle={toggleTask}
                onAdd={addTask}
              />
            )}

            {/* ── NOTIFS ───────────────────────────────────────────── */}
            {tab === 'notifs' && (
              <NotifPanel
                notifs={notifs}
                sites={sites}
                onRead={readNotif}
                onNavigate={navigateFromNotif}
                onMarkAllRead={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))}
              />
            )}
          </div>

          <BottomNav
            tab={tab}
            site={currentSite}
            unreadEmails={unreadEmails}
            urgentTasks={urgentTasks}
            unreadNotifs={unreadNotifs}
            onTab={(t: string) => handleTab(t as Tab)}
          />
        </>
      )}
    </div>
  )
}

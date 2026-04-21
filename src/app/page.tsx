'use client'
import { useState } from 'react'
import { Site, Email, EmailAnalysis, Notification, Task } from '@/lib/types'
import { COLORS } from '@/lib/constants'
import { INITIAL_SITES, INITIAL_NOTIFS } from '@/lib/data'
import { callAI } from '@/lib/ai'

import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import SiteCard from '@/components/sites/SiteCard'
import ChatTab from '@/components/chat/ChatTab'
import EmailList from '@/components/email/EmailList'
import EmailDetail from '@/components/email/EmailDetail'
import TaskList from '@/components/tasks/TaskList'
import NotifPanel from '@/components/notifications/NotifPanel'

type BottomTab = 'sites' | 'chat' | 'emails' | 'tasks' | 'notifs'

const CURRENT_USER = 'valentin'

export default function Home() {
  const [sites, setSites] = useState<Site[]>(INITIAL_SITES)
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL_NOTIFS)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [bottomTab, setBottomTab] = useState<BottomTab>('sites')
  const [aiInput, setAiInput] = useState('')
  const [aiReply, setAiReply] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [analyses, setAnalyses] = useState<Map<string, EmailAnalysis>>(new Map())
  const [analysing, setAnalysing] = useState<string | null>(null)

  // Derived counts
  const currentSite = sites.find(s => s.id === selectedSite?.id) ?? null
  const unreadEmails = currentSite?.emails.filter(e => !e.read).length ?? 0
  const urgentTasks = currentSite?.tasks.filter(t => !t.done && t.priority === 'high').length ?? 0
  const unreadNotifs = notifs.filter(n => !n.read).length

  function updateSite(updated: Site) {
    setSites(prev => prev.map(s => s.id === updated.id ? updated : s))
    if (selectedSite?.id === updated.id) setSelectedSite(updated)
  }

  function goSite(site: Site) {
    setSelectedSite(site)
    setBottomTab('chat')
    setSelectedEmail(null)
    setAiReply('')
  }

  function goBack() {
    if (selectedEmail) {
      setSelectedEmail(null)
      return
    }
    setSelectedSite(null)
    setBottomTab('sites')
    setAiReply('')
  }

  function handleTab(tab: BottomTab) {
    setBottomTab(tab)
    setSelectedEmail(null)
  }

  // Send message
  function sendMessage(text: string) {
    if (!currentSite) return
    const msg = {
      id: `msg-${Date.now()}`,
      userId: CURRENT_USER,
      text,
      time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      pinned: false,
    }
    const updated = { ...currentSite, messages: [...currentSite.messages, msg] }
    updateSite(updated)
  }

  // Notify all (urgent)
  function notifyAll(text: string) {
    if (!currentSite) return
    sendMessage(text)
    const notif: Notification = {
      id: `n-${Date.now()}`,
      siteId: currentSite.id,
      type: 'urgent',
      text,
      time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    }
    setNotifs(prev => [notif, ...prev])
  }

  // Notify team about email
  function notifyTeamAboutEmail() {
    if (!currentSite || !selectedEmail) return
    const notif: Notification = {
      id: `n-${Date.now()}`,
      siteId: currentSite.id,
      type: 'email',
      text: `Team alert: "${selectedEmail.subject}" from ${selectedEmail.fromName}`,
      time: new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
      read: false,
    }
    setNotifs(prev => [notif, ...prev])
    // Mark email as read
    const updatedEmails = currentSite.emails.map(e =>
      e.id === selectedEmail.id ? { ...e, read: true } : e
    )
    updateSite({ ...currentSite, emails: updatedEmails })
  }

  // Analyse email with AI
  async function analyseEmail() {
    if (!selectedEmail || !currentSite) return
    setAnalysing(selectedEmail.id)
    try {
      const system = `You are a construction project management AI assistant. Analyse emails for construction site managers. Return ONLY valid JSON with these fields: category (invoice|compliance|drawings|safety|report|general), priority (high|medium|low), summary (1 sentence), action (what the PM should do next, 1 sentence), isInvoice (boolean), amount (number if invoice, omit otherwise), dueDate (string if invoice, omit otherwise).`
      const user = `Email from: ${selectedEmail.fromName} <${selectedEmail.from}>
Subject: ${selectedEmail.subject}
Body: ${selectedEmail.body}
Site: ${currentSite.name} (Client: ${currentSite.client})`

      const raw = await callAI(system, user)
      const json = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
      setAnalyses(prev => new Map(prev).set(selectedEmail.id, json as EmailAnalysis))
      // Mark email as read
      const updatedEmails = currentSite.emails.map(e =>
        e.id === selectedEmail.id ? { ...e, read: true } : e
      )
      updateSite({ ...currentSite, emails: updatedEmails })
    } catch {
      // Silent fail - user can retry
    }
    setAnalysing(null)
  }

  // Ask AI
  async function askAI() {
    if (!aiInput.trim() || !currentSite) return
    setAiLoading(true)
    setAiReply('')
    try {
      const system = `You are FOREMAN AI, an expert construction project management assistant. Answer concisely and practically for site managers. Keep responses under 200 words.`
      const user = `Site: ${currentSite.name} | Phase: ${currentSite.phase} | Progress: ${currentSite.progress}%
Open tasks: ${currentSite.tasks.filter(t => !t.done).map(t => t.text).join('; ')}
Recent messages: ${currentSite.messages.slice(-3).map(m => `${m.userId}: ${m.text}`).join(' | ')}

Question: ${aiInput}`
      const reply = await callAI(system, user)
      setAiReply(reply)
    } catch {
      setAiReply('AI is temporarily unavailable.')
    }
    setAiLoading(false)
  }

  // Toggle task
  function toggleTask(taskId: string) {
    if (!currentSite) return
    const updated = {
      ...currentSite,
      tasks: currentSite.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t),
    }
    updateSite(updated)
  }

  // Add task
  function addTask(text: string) {
    if (!currentSite) return
    const task: Task = {
      id: `task-${Date.now()}`,
      text,
      done: false,
      priority: 'med',
      assign: CURRENT_USER,
      due: 'TBD',
    }
    updateSite({ ...currentSite, tasks: [...currentSite.tasks, task] })
  }

  // Read notif
  function readNotif(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  // Mark all read
  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  // Navigate from notif
  function navigateFromNotif(siteId: string) {
    const site = sites.find(s => s.id === siteId)
    if (site) goSite(site)
    else setBottomTab('notifs')
  }

  // Select email
  function selectEmail(email: Email) {
    if (!currentSite) return
    const updatedEmails = currentSite.emails.map(e => e.id === email.id ? { ...e, read: true } : e)
    updateSite({ ...currentSite, emails: updatedEmails })
    setSelectedEmail(email)
  }

  const showEmail = selectedEmail && currentSite

  return (
    <div
      style={{
        minHeight: '100dvh',
        maxHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: COLORS.bg0,
        color: COLORS.w80,
        maxWidth: 480,
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Email detail is fullscreen (no nav) */}
      {showEmail ? (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
      ) : (
        <>
          <TopBar
            site={currentSite}
            onBack={goBack}
            onNotifsClick={() => handleTab('notifs')}
            unreadCount={unreadNotifs}
          />

          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Sites list */}
            {bottomTab === 'sites' && !currentSite && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: COLORS.w40, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 4 }}>
                    ACTIVE SITES
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.w40 }}>
                    {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                </div>
                {sites.map(site => (
                  <SiteCard key={site.id} site={site} onClick={() => goSite(site)} />
                ))}
              </div>
            )}

            {/* Chat */}
            {bottomTab === 'chat' && currentSite && (
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
              />
            )}

            {/* Emails */}
            {bottomTab === 'emails' && currentSite && (
              <EmailList site={currentSite} onSelectEmail={selectEmail} />
            )}

            {/* Tasks */}
            {bottomTab === 'tasks' && currentSite && (
              <TaskList
                site={currentSite}
                currentUserId={CURRENT_USER}
                onToggle={toggleTask}
                onAdd={addTask}
              />
            )}

            {/* Notifications */}
            {bottomTab === 'notifs' && (
              <NotifPanel
                notifs={notifs}
                sites={sites}
                onRead={readNotif}
                onNavigate={navigateFromNotif}
                onMarkAllRead={markAllRead}
              />
            )}
          </div>

          <BottomNav
            site={currentSite}
            activeTab={bottomTab}
            onTab={handleTab}
            unreadEmails={unreadEmails}
            urgentTasks={urgentTasks}
            unreadNotifs={unreadNotifs}
          />
        </>
      )}
    </div>
  )
}

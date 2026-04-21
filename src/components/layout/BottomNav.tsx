'use client'
import { Site } from '@/lib/types'

interface Props {
  tab: string
  site: Site | null
  unreadEmails: number
  urgentTasks: number
  unreadNotifs: number
  onTab: (t: string) => void
}

type NavItem = {
  id: string
  icon: string
  label: string
  tClass?: string
  badge?: number
  badgeClass?: string
}

export default function BottomNav({ tab, site, unreadEmails, urgentTasks, unreadNotifs, onTab }: Props) {
  const noSiteTabs: NavItem[] = [
    { id: 'sites',  icon: '🏗️', label: 'Sites' },
    { id: 'notifs', icon: '🔔', label: 'Alerts', tClass: 't-purple', badge: unreadNotifs },
  ]

  const siteTabs: NavItem[] = [
    { id: 'sites',  icon: '🏗️', label: 'Sites' },
    { id: 'chat',   icon: '💬', label: 'Chat',   tClass: 't-blue' },
    { id: 'plans',  icon: '📐', label: 'Plans',  tClass: 't-indigo' },
    { id: 'quotes', icon: '🔢', label: 'Quotes', tClass: 't-green' },
    { id: 'emails', icon: '📧', label: 'Emails', badge: unreadEmails },
    { id: 'tasks',  icon: '✅', label: 'Tasks',  badge: urgentTasks, badgeClass: 'badge-amber' },
    { id: 'notifs', icon: '🔔', label: 'Alerts', tClass: 't-purple', badge: unreadNotifs },
  ]

  const tabs = site ? siteTabs : noSiteTabs

  return (
    <div className="bottom-nav">
      {tabs.map(t => {
        const isActive = tab === t.id
        const activeClass = isActive ? (t.tClass ? `active ${t.tClass}` : 'active') : ''
        return (
          <button
            key={t.id}
            className={`nav-btn ${activeClass}`}
            onClick={() => onTab(t.id)}
          >
            <span className="nav-icon" style={{ position: 'relative' }}>
              {t.icon}
              {t.badge != null && t.badge > 0 && (
                <span
                  className={`badge ${t.badgeClass ?? ''}`}
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    minWidth: 14,
                    height: 14,
                    fontSize: 8,
                    padding: '0 3px',
                  }}
                >
                  {t.badge}
                </span>
              )}
            </span>
            <span className="nav-lbl">{t.label}</span>
          </button>
        )
      })}
    </div>
  )
}

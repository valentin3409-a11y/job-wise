'use client'
import { Site } from '@/lib/types'
import { COLORS } from '@/lib/constants'

type Tab = 'sites' | 'chat' | 'emails' | 'tasks' | 'notifs'

interface Props {
  site: Site | null
  activeTab: Tab
  onTab: (tab: Tab) => void
  unreadEmails: number
  urgentTasks: number
  unreadNotifs: number
}

export default function BottomNav({ site, activeTab, onTab, unreadEmails, urgentTasks, unreadNotifs }: Props) {
  const activeColor = site?.color ?? COLORS.amber

  const tabs: { id: Tab; icon: string; label: string; badge?: number }[] = site
    ? [
        { id: 'chat',   icon: '💬', label: 'Chat'   },
        { id: 'emails', icon: '📧', label: 'Emails', badge: unreadEmails },
        { id: 'tasks',  icon: '✅', label: 'Tasks',  badge: urgentTasks  },
        { id: 'notifs', icon: '🔔', label: 'Alerts', badge: unreadNotifs },
      ]
    : [
        { id: 'sites',  icon: '🏗️', label: 'Sites'  },
        { id: 'notifs', icon: '🔔', label: 'Alerts', badge: unreadNotifs },
      ]

  return (
    <div
      style={{
        height: 64,
        position: 'sticky',
        bottom: 0,
        background: COLORS.bg1,
        borderTop: `1px solid ${COLORS.border}`,
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 100,
      }}
    >
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTab(tab.id)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              borderTop: isActive ? `2px solid ${activeColor}` : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              position: 'relative',
              paddingTop: 2,
            }}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: isActive ? activeColor : COLORS.w40,
                letterSpacing: '0.04em',
              }}
            >
              {tab.label}
            </span>
            {tab.badge != null && tab.badge > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 6,
                  right: '50%',
                  marginRight: -18,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background: COLORS.red,
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}
              >
                {tab.badge}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

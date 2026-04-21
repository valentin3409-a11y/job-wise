'use client'
import { Notification, Site } from '@/lib/types'
import { COLORS, TYPE_ICO } from '@/lib/constants'

interface Props {
  notifs: Notification[]
  sites: Site[]
  onRead: (id: string) => void
  onNavigate: (siteId: string) => void
  onMarkAllRead: () => void
}

export default function NotifPanel({ notifs, sites, onRead, onNavigate, onMarkAllRead }: Props) {
  function getSiteName(siteId: string) {
    return sites.find(s => s.id === siteId)?.shortName ?? siteId
  }
  function getSiteColor(siteId: string) {
    return sites.find(s => s.id === siteId)?.color ?? COLORS.amber
  }

  const sorted = [...notifs].sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0))

  return (
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: 11, color: COLORS.w40, fontWeight: 700, letterSpacing: '0.1em' }}>
          ALERTS & NOTIFICATIONS
        </div>
        <button
          onClick={onMarkAllRead}
          style={{
            background: 'none',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            color: COLORS.w60,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          MARK ALL READ
        </button>
      </div>

      {sorted.map(notif => {
        const siteColor = getSiteColor(notif.siteId)
        const icon = TYPE_ICO[notif.type] ?? '🔔'

        return (
          <div
            key={notif.id}
            onClick={() => {
              onRead(notif.id)
              onNavigate(notif.siteId)
            }}
            style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${COLORS.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              background: notif.read ? 'transparent' : COLORS.bg3,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: COLORS.bg2,
                border: `1px solid ${COLORS.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: COLORS.w80, marginBottom: 4, lineHeight: 1.4 }}>
                {notif.text}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 10,
                    color: siteColor,
                    fontWeight: 700,
                    background: siteColor + '22',
                    border: `1px solid ${siteColor}44`,
                    padding: '2px 6px',
                    borderRadius: 4,
                  }}
                >
                  {getSiteName(notif.siteId)}
                </span>
                <span style={{ fontSize: 11, color: COLORS.w40 }}>{notif.time}</span>
              </div>
            </div>
            {!notif.read && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: siteColor,
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
            )}
          </div>
        )
      })}

      {notifs.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: COLORS.w40, fontSize: 13 }}>
          No notifications
        </div>
      )}
    </div>
  )
}

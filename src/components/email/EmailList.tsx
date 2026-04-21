'use client'
import { Site, Email } from '@/lib/types'
import { COLORS, TYPE_COL, TYPE_ICO } from '@/lib/constants'
import Chip from '@/components/ui/Chip'

interface Props {
  site: Site
  onSelectEmail: (e: Email) => void
}

export default function EmailList({ site, onSelectEmail }: Props) {
  const unreadCount = site.emails.filter(e => !e.read).length

  return (
    <div style={{ height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '14px 14px 10px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="sec-title" style={{ fontSize: 9 }}>EMAILS</span>
          {/* Pulse dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div className="pulse-dot green" />
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', letterSpacing: '0.08em' }}>
              AUTO-ROUTED
            </span>
          </div>
        </div>
        <Chip label={`${site.emails.length} msg`} col={unreadCount > 0 ? COLORS.amber : COLORS.w40} />
      </div>

      {/* Email rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {site.emails.map(email => {
          const col = TYPE_COL[email.type] ?? COLORS.w60
          const ico = TYPE_ICO[email.type] ?? '📧'
          return (
            <div
              key={email.id}
              onClick={() => onSelectEmail(email)}
              style={{
                padding: '12px 14px',
                borderBottom: '1px solid var(--border)',
                borderLeft: !email.read ? `2px solid ${site.color}` : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg3)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
            >
              {/* Main content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Row 1: name + date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: email.read ? 500 : 700,
                      color: email.read ? 'var(--w60)' : 'var(--w90)',
                    }}
                  >
                    {email.fromName}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {email.att && (
                      <span style={{ fontSize: 12, color: 'var(--w40)' }}>📎</span>
                    )}
                    <span className="mono" style={{ fontSize: 10, color: 'var(--w40)' }}>
                      {email.date}
                    </span>
                  </div>
                </div>
                {/* Row 2: subject */}
                <div
                  className="truncate"
                  style={{
                    fontSize: 12,
                    color: email.read ? 'var(--w40)' : 'var(--w60)',
                    marginBottom: 6,
                  }}
                >
                  {email.subject}
                </div>
                {/* Row 3: type chip + unread dot */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Chip label={email.type} col={col} icon={ico} />
                  {!email.read && <div className="notif-dot" />}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

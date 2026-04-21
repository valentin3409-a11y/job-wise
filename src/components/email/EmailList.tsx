'use client'
import { Site, Email } from '@/lib/types'
import { COLORS, TYPE_COL, TYPE_ICO } from '@/lib/constants'
import Chip from '@/components/ui/Chip'

interface Props {
  site: Site
  onSelectEmail: (email: Email) => void
}

export default function EmailList({ site, onSelectEmail }: Props) {
  const unread = site.emails.filter(e => !e.read).length

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
        <div>
          <div style={{ fontSize: 11, color: COLORS.w40, fontWeight: 700, letterSpacing: '0.1em' }}>
            EMAILS · {site.shortName.toUpperCase()} · {site.emails.length} messages
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.green }} />
          <span style={{ fontSize: 10, color: COLORS.green, fontWeight: 600 }}>Auto-routed</span>
        </div>
      </div>

      {/* Email list */}
      {site.emails.map(email => {
        const col = TYPE_COL[email.type] ?? COLORS.w60
        const ico = TYPE_ICO[email.type] ?? '📧'
        return (
          <div
            key={email.id}
            onClick={() => onSelectEmail(email)}
            style={{
              padding: '14px 16px',
              borderBottom: `1px solid ${COLORS.border}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              background: email.read ? 'transparent' : COLORS.bg3,
              transition: 'background 0.15s',
            }}
          >
            {/* Unread dot */}
            <div style={{ width: 8, flexShrink: 0, paddingTop: 5 }}>
              {!email.read && (
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: site.color,
                    boxShadow: `0 0 4px ${site.color}`,
                  }}
                />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: email.read ? 500 : 700,
                    color: email.read ? COLORS.w60 : COLORS.w80,
                  }}
                >
                  {email.fromName}
                </span>
                <span style={{ fontSize: 11, color: COLORS.w40, flexShrink: 0, marginLeft: 8 }}>{email.date}</span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.w60, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email.subject}
              </div>
              <Chip label={email.type.toUpperCase()} col={col} icon={ico} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

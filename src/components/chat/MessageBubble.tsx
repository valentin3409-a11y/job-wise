'use client'
import { Message, Site } from '@/lib/types'
import { TEAM } from '@/lib/data'
import { COLORS, ROLES } from '@/lib/constants'
import Avatar from '@/components/ui/Avatar'

interface Props {
  message: Message
  isMe: boolean
  site: Site
}

export default function MessageBubble({ message, isMe, site }: Props) {
  const user = TEAM.find(t => t.id === message.userId)
  if (!user) return null

  const roleInfo = ROLES[user.role]

  if (isMe) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{ maxWidth: '75%' }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${site.color}CC, ${site.color}88)`,
              borderRadius: '16px 16px 4px 16px',
              padding: '10px 14px',
              color: '#fff',
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            {message.text}
          </div>
          <div style={{ fontSize: 10, color: COLORS.w40, marginTop: 3, textAlign: 'right' }}>{message.time}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
      <Avatar uid={message.userId} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: roleInfo.color }}>{user.name}</span>
          <span style={{ fontSize: 10, color: COLORS.w40 }}>{roleInfo.label}</span>
          <span style={{ fontSize: 10, color: COLORS.w40 }}>{message.time}</span>
        </div>
        <div
          style={{
            background: COLORS.bg3,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '4px 16px 16px 16px',
            padding: '10px 14px',
            color: COLORS.w80,
            fontSize: 13,
            lineHeight: 1.55,
            maxWidth: '80%',
          }}
        >
          {message.text}
        </div>
      </div>
    </div>
  )
}

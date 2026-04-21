'use client'
import { Message, Site } from '@/lib/types'
import { TEAM } from '@/lib/data'
import { ROLES } from '@/lib/constants'
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

  if (message.pinned) {
    return (
      <div className="pinned-strip" style={{ marginBottom: 8 }}>
        <BubbleContent message={message} isMe={isMe} user={user} roleInfo={roleInfo} site={site} pinned />
      </div>
    )
  }

  return (
    <BubbleContent message={message} isMe={isMe} user={user} roleInfo={roleInfo} site={site} pinned={false} />
  )
}

function BubbleContent({
  message, isMe, user, roleInfo, pinned,
}: {
  message: Message
  isMe: boolean
  user: ReturnType<typeof TEAM.find> & object
  roleInfo: { label: string; color: string }
  site: Site
  pinned: boolean
}) {
  if (pinned) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: 'var(--amber)', fontSize: 12, flexShrink: 0 }}>📌</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: roleInfo.color }}>
            {(user as { name: string }).name}:
          </span>{' '}
          <span style={{ fontSize: 12, color: 'var(--w80)', lineHeight: 1.6 }}>{message.text}</span>
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--w40)', flexShrink: 0 }}>{message.time}</span>
      </div>
    )
  }

  if (isMe) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginBottom: 12 }}>
        <div className="bubble-me">
          <p style={{ fontSize: 13, color: 'var(--w80)', lineHeight: 1.6, margin: 0 }}>{message.text}</p>
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--w40)', marginTop: 4 }}>{message.time}</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
      <Avatar uid={message.userId} size={28} />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* Name + role */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: roleInfo.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {(user as { name: string }).name}
          </span>
          <span style={{ fontSize: 9, color: 'var(--w40)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {roleInfo.label}
          </span>
        </div>
        <div className="bubble-other">
          <p style={{ fontSize: 13, color: 'var(--w80)', lineHeight: 1.6, margin: 0 }}>{message.text}</p>
        </div>
        <span className="mono" style={{ fontSize: 10, color: 'var(--w40)', marginTop: 4 }}>{message.time}</span>
      </div>
    </div>
  )
}

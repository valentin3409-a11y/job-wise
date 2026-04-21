'use client'
import { TEAM } from '@/lib/data'
import { ROLES, COLORS } from '@/lib/constants'

interface Props {
  uid: string
  size?: number
}

export default function Avatar({ uid, size = 32 }: Props) {
  const user = TEAM.find(t => t.id === uid)
  if (!user) return null

  const col = ROLES[user.role].color

  return (
    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: col + '33',
          border: `1.5px solid ${col}80`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.4,
          fontWeight: 700,
          color: col,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {user.av}
      </div>
      {user.online && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: '50%',
            background: COLORS.green,
            border: `1.5px solid ${COLORS.bg1}`,
          }}
        />
      )}
    </div>
  )
}

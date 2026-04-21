'use client'
import { TEAM } from '@/lib/data'
import { ROLES } from '@/lib/constants'

interface Props {
  uid: string
  size?: number
}

export default function Avatar({ uid, size = 32 }: Props) {
  const user = TEAM.find(t => t.id === uid)
  if (!user) return null

  const col = ROLES[user.role].color

  // Convert hex to rgb for opacity usage
  const bgStyle = {
    backgroundColor: col,
    opacity: 0.18,
    position: 'absolute' as const,
    inset: 0,
    borderRadius: '50%',
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0, width: size, height: size }}>
      {/* Background layer */}
      <div style={bgStyle} />
      {/* Main circle */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `1.5px solid ${col}73`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.38,
          fontWeight: 700,
          color: col,
          fontFamily: 'var(--font-mono)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {user.av}
      </div>
      {/* Online dot */}
      {user.online && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: Math.round(size * 0.28),
            height: Math.round(size * 0.28),
            borderRadius: '50%',
            background: 'var(--green)',
            border: '1.5px solid var(--bg1)',
            zIndex: 2,
          }}
        />
      )}
    </div>
  )
}

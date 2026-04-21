'use client'

interface Props {
  message: string
  col: string
}

export default function Toast({ message, col }: Props) {
  return (
    <div
      className="anim-up"
      style={{
        position: 'fixed',
        bottom: 76,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        background: 'rgba(12,12,24,0.95)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${col}59`,
        boxShadow: `0 0 20px ${col}33`,
        color: col,
        padding: '11px 20px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      {message}
    </div>
  )
}

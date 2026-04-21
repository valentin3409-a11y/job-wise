'use client'

interface Props {
  message: string
  col: string
}

export default function Toast({ message, col }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        background: col + '22',
        border: `1px solid ${col}66`,
        color: col,
        padding: '10px 20px',
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 9999,
        animation: 'slideUp 0.25s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  )
}

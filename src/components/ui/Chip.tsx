'use client'

interface Props {
  label: string
  col: string
  icon?: string
}

export default function Chip({ label, col, icon }: Props) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 20,
        background: col + '26',
        border: `1px solid ${col}59`,
        color: col,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  )
}

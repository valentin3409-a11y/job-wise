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
        gap: icon ? 4 : 0,
        padding: '2px 9px',
        borderRadius: 20,
        backgroundColor: col + '24',
        border: `1px solid ${col}4D`,
        color: col,
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-head)',
      }}
    >
      {icon && <span style={{ fontSize: 10 }}>{icon}</span>}
      {label}
    </span>
  )
}

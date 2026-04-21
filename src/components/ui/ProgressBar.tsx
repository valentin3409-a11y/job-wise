'use client'

interface Props {
  val: number
  col: string
  h?: number
}

export default function ProgressBar({ val, col, h = 3 }: Props) {
  const pct = Math.min(100, Math.max(0, val))

  return (
    <div
      className="progress-track"
      style={{ height: h }}
    >
      <div
        className="progress-fill"
        style={{
          width: `${pct}%`,
          background: col,
          height: '100%',
        }}
      />
    </div>
  )
}

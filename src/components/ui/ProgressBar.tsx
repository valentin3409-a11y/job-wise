'use client'
import { COLORS } from '@/lib/constants'

interface Props {
  val: number
  col: string
  h?: number
}

export default function ProgressBar({ val, col, h = 4 }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height: h,
        background: COLORS.w20,
        borderRadius: h,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, val))}%`,
          background: col,
          borderRadius: h,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  )
}

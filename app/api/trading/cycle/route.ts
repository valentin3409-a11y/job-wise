import { NextResponse } from 'next/server'
import { runCycle } from '@/lib/trading/bot'
import { getState } from '@/lib/trading/state'

export const maxDuration = 60

// POST /api/trading/cycle — trigger one analysis + trade cycle
export async function POST() {
  try {
    await runCycle()
    return NextResponse.json({ ok: true, state: getState() })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

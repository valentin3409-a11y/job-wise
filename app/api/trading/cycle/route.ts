import { NextRequest, NextResponse } from 'next/server'
import { runCycle } from '@/lib/trading/bot'
import { getState, resetState } from '@/lib/trading/state'

export const maxDuration = 60

// POST /api/trading/cycle — trigger one analysis + trade cycle
// Accepts optional { config } to set state before running (handles serverless Lambda drift)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    if (body.config) resetState(body.config)
    await runCycle()
    return NextResponse.json({ ok: true, state: getState() })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

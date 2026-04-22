import { NextResponse } from 'next/server'
import { runCycle } from '@/lib/trading/bot'
import { getState } from '@/lib/trading/state'

// Called by Vercel Cron every N minutes (see vercel.json)
// Also callable manually: GET /api/trading/cron
export const maxDuration = 60

export async function GET(req: Request) {
  // Verify Vercel cron secret to prevent unauthorised triggers
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await runCycle()
    const s = getState()
    return NextResponse.json({
      ok:         true,
      cycleCount: s.cycleCount,
      lastCycle:  s.lastCycleAt,
      portfolio:  {
        totalValue:  s.portfolio.totalValue,
        totalPnlPct: s.portfolio.totalPnlPct,
        positions:   s.portfolio.positions.length,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

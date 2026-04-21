import { NextRequest, NextResponse } from 'next/server'
import { startBot, stopBot } from '@/lib/trading/bot'
import { getState, resetState } from '@/lib/trading/state'
import { BotConfig } from '@/lib/trading/types'

export const maxDuration = 10

// POST /api/trading/control
// body: { action: 'start' | 'stop' | 'reset', config?: Partial<BotConfig> }
export async function POST(req: NextRequest) {
  try {
    const { action, config } = await req.json()

    switch (action) {
      case 'start':
        startBot()
        return NextResponse.json({ ok: true, status: 'running' })

      case 'stop':
        stopBot()
        return NextResponse.json({ ok: true, status: 'stopped' })

      case 'reset':
        stopBot()
        resetState(config)
        return NextResponse.json({ ok: true, status: 'stopped', state: getState() })

      case 'config':
        if (config) {
          const s = getState()
          Object.assign(s.config, config)
        }
        return NextResponse.json({ ok: true, config: getState().config })

      default:
        return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

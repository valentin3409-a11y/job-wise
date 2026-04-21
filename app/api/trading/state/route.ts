import { NextResponse } from 'next/server'
import { getState } from '@/lib/trading/state'

// GET /api/trading/state — return current bot state (portfolio, signals, news, trades…)
export async function GET() {
  return NextResponse.json(getState())
}

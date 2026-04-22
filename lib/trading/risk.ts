import { Portfolio, AISignal, Trade, RiskConfig } from './types'

export const DEFAULT_RISK: RiskConfig = {
  maxPositionSizePct:      10,
  stopLossPct:             7,
  takeProfitPct:           20,
  maxDailyLossPct:         15,
  minConfidence:           65,
  maxConcurrentPositions:  8,
}

export interface RiskVerdict {
  approved:         boolean
  reason:           string
  adjustedCapital?: number  // how much USD to allocate
}

// ─── Validate a buy/sell signal against risk rules ────────────────────────────
export function validateSignal(
  signal:     AISignal,
  portfolio:  Portfolio,
  todayTrades: Trade[],
  config:     RiskConfig,
): RiskVerdict {

  if (signal.confidence < config.minConfidence)
    return { approved: false, reason: `Confidence ${signal.confidence}% < minimum ${config.minConfidence}%` }

  // Daily loss check
  if (portfolio.dayPnlPct < -config.maxDailyLossPct)
    return { approved: false, reason: `Daily loss limit reached (${portfolio.dayPnlPct.toFixed(1)}%)` }

  if (signal.action === 'buy') {
    const openPositions = portfolio.positions.filter(p => p.quantity > 0).length
    if (openPositions >= config.maxConcurrentPositions)
      return { approved: false, reason: `Max concurrent positions (${config.maxConcurrentPositions}) reached` }

    // Already have a position in this symbol?
    const exists = portfolio.positions.find(p => p.symbol === signal.symbol)
    if (exists && exists.quantity > 0)
      return { approved: false, reason: `Position in ${signal.symbol} already open` }

    const maxAllocation = portfolio.totalValue * (config.maxPositionSizePct / 100)
    const capital       = Math.min(maxAllocation * (signal.confidence / 100), portfolio.cashBalance)

    if (capital < 5)
      return { approved: false, reason: 'Insufficient cash for minimum trade ($5)' }

    return { approved: true, reason: 'Risk checks passed', adjustedCapital: capital }
  }

  if (signal.action === 'sell') {
    const pos = portfolio.positions.find(p => p.symbol === signal.symbol)
    if (!pos || pos.quantity <= 0)
      return { approved: false, reason: `No open position for ${signal.symbol}` }
    return { approved: true, reason: 'Risk checks passed' }
  }

  return { approved: false, reason: 'Action "hold" — no trade executed' }
}

// ─── Stop-loss / take-profit checks ─────────────────────────────────────────
export function shouldStopLoss(pnlPct: number, config: RiskConfig): boolean {
  return pnlPct < -config.stopLossPct
}

export function shouldTakeProfit(pnlPct: number, config: RiskConfig): boolean {
  return pnlPct > config.takeProfitPct
}

// ─── Calculate SL/TP price levels from signal ────────────────────────────────
export function computeLevels(price: number, config: RiskConfig): { stopLoss: number; takeProfit: number } {
  return {
    stopLoss:   price * (1 - config.stopLossPct   / 100),
    takeProfit: price * (1 + config.takeProfitPct / 100),
  }
}

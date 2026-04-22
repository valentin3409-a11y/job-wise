import {
  BotState, BotConfig, BotStatus, Portfolio, Position,
  Trade, MarketData, AISignal, NewsItem, PerformanceMetrics, AssetConfig,
} from './types'
import { DEFAULT_RISK } from './risk'

// ─── Default config ───────────────────────────────────────────────────────────
export const DEFAULT_CONFIG: BotConfig = {
  mode:            'paper',
  intervalMinutes: 5,
  initialCapital:  10_000,
  assets: [
    { symbol: 'BTC',  assetType: 'crypto', enabled: true },
    { symbol: 'ETH',  assetType: 'crypto', enabled: true },
    { symbol: 'SOL',  assetType: 'crypto', enabled: true },
    { symbol: 'AAPL', assetType: 'stock',  enabled: true },
    { symbol: 'NVDA', assetType: 'stock',  enabled: true },
    { symbol: 'TSLA', assetType: 'stock',  enabled: true },
  ],
  risk:      DEFAULT_RISK,
  exchanges: {
    binanceKey:     process.env.BINANCE_API_KEY,
    binanceSecret:  process.env.BINANCE_API_SECRET,
    binanceTestnet: false,
    alpacaKey:      process.env.ALPACA_API_KEY,
    alpacaSecret:   process.env.ALPACA_API_SECRET,
    alpacaPaper:    false,
  },
}

function emptyPortfolio(capital: number): Portfolio {
  return {
    totalValue:    capital,
    cashBalance:   capital,
    investedValue: 0,
    positions:     [],
    totalPnl:      0,
    totalPnlPct:   0,
    dayPnl:        0,
    dayPnlPct:     0,
    peakValue:     capital,
    drawdownPct:   0,
  }
}

function emptyPerf(): PerformanceMetrics {
  return {
    totalTrades:    0,
    winningTrades:  0,
    losingTrades:   0,
    winRate:        0,
    totalReturn:    0,
    totalReturnPct: 0,
    bestTrade:      0,
    worstTrade:     0,
    maxDrawdownPct: 0,
    sharpeRatio:    null,
  }
}

function createInitialState(config: BotConfig = DEFAULT_CONFIG): BotState {
  return {
    status:      'stopped',
    config,
    portfolio:   emptyPortfolio(config.initialCapital),
    signals:     {},
    marketData:  {},
    news:        [],
    trades:      [],
    performance: emptyPerf(),
    lastCycleAt: null,
    nextCycleAt: null,
    cycleCount:  0,
    errors:      [],
    logs:        [],
  }
}

// ─── Global singleton (persists while Node process is warm) ──────────────────
let _state: BotState | null = null

export function getState(): BotState {
  if (!_state) _state = createInitialState()
  return _state
}

export function resetState(config?: Partial<BotConfig>): BotState {
  const merged = { ...DEFAULT_CONFIG, ...(config ?? {}) }
  _state = createInitialState(merged)
  return _state
}

export function setStatus(status: BotStatus): void {
  const s = getState()
  s.status = status
}

export function addLog(msg: string): void {
  const s = getState()
  const ts = new Date().toISOString().slice(11, 19)
  s.logs = [`[${ts}] ${msg}`, ...s.logs].slice(0, 100)
}

export function addError(msg: string): void {
  const s = getState()
  s.errors = [msg, ...s.errors].slice(0, 20)
}

// ─── Market data & signals ────────────────────────────────────────────────────
export function updateMarketData(items: MarketData[]): void {
  const s = getState()
  for (const item of items) s.marketData[item.symbol] = item
}

export function updateSignal(signal: AISignal): void {
  getState().signals[signal.symbol] = signal
}

export function updateNews(news: NewsItem[]): void {
  getState().news = news
}

// ─── Portfolio mutations ──────────────────────────────────────────────────────
export function refreshPositionPrices(items: MarketData[]): void {
  const { portfolio, config } = getState()
  const priceMap = new Map(items.map(m => [m.symbol, m.price]))

  portfolio.positions = portfolio.positions.map(pos => {
    const price = priceMap.get(pos.symbol) ?? pos.currentPrice
    const value = pos.quantity * price
    const pnl   = value - pos.quantity * pos.avgEntryPrice
    return {
      ...pos,
      currentPrice:     price,
      value,
      unrealizedPnl:    pnl,
      unrealizedPnlPct: pos.avgEntryPrice > 0 ? (pnl / (pos.quantity * pos.avgEntryPrice)) * 100 : 0,
    }
  })

  const investedValue = portfolio.positions.reduce((s, p) => s + p.value, 0)
  portfolio.investedValue = investedValue
  portfolio.totalValue    = portfolio.cashBalance + investedValue
  portfolio.totalPnl      = portfolio.totalValue - config.initialCapital
  portfolio.totalPnlPct   = (portfolio.totalPnl / config.initialCapital) * 100

  if (portfolio.totalValue > portfolio.peakValue) portfolio.peakValue = portfolio.totalValue
  portfolio.drawdownPct = portfolio.peakValue > 0
    ? ((portfolio.peakValue - portfolio.totalValue) / portfolio.peakValue) * 100 : 0
}

export function executePaperTrade(trade: Trade): void {
  const { portfolio, config } = getState()

  if (trade.action === 'buy') {
    portfolio.cashBalance -= trade.totalValue + trade.fee
    const idx = portfolio.positions.findIndex(p => p.symbol === trade.symbol)
    if (idx >= 0) {
      const pos  = portfolio.positions[idx]
      const qty  = pos.quantity + trade.quantity
      const avg  = (pos.quantity * pos.avgEntryPrice + trade.quantity * trade.price) / qty
      portfolio.positions[idx] = { ...pos, quantity: qty, avgEntryPrice: avg }
    } else {
      portfolio.positions.push({
        symbol:           trade.symbol,
        assetType:        trade.assetType,
        quantity:         trade.quantity,
        avgEntryPrice:    trade.price,
        currentPrice:     trade.price,
        value:            trade.totalValue,
        unrealizedPnl:    0,
        unrealizedPnlPct: 0,
        openedAt:         trade.executedAt,
      })
    }
  } else if (trade.action === 'sell') {
    portfolio.cashBalance += trade.totalValue - trade.fee
    const idx = portfolio.positions.findIndex(p => p.symbol === trade.symbol)
    if (idx >= 0) {
      const remaining = portfolio.positions[idx].quantity - trade.quantity
      if (remaining <= 0) {
        portfolio.positions.splice(idx, 1)
      } else {
        portfolio.positions[idx] = { ...portfolio.positions[idx], quantity: remaining }
      }
    }
  }

  getState().trades = [trade, ...getState().trades].slice(0, 200)
  updatePerformance(trade)
}

function updatePerformance(trade: Trade): void {
  const { performance, config, portfolio } = getState()
  performance.totalTrades++
  performance.totalReturn    = portfolio.totalPnl
  performance.totalReturnPct = portfolio.totalPnlPct

  if (trade.action === 'sell') {
    const pnl = trade.totalValue - trade.quantity * (
      getState().trades.find(t => t.symbol === trade.symbol && t.action === 'buy')?.price ?? trade.price
    )
    if (pnl >= 0) performance.winningTrades++
    else performance.losingTrades++
    if (pnl > performance.bestTrade)  performance.bestTrade  = pnl
    if (pnl < performance.worstTrade) performance.worstTrade = pnl
  }

  const total = performance.winningTrades + performance.losingTrades
  performance.winRate = total > 0 ? (performance.winningTrades / total) * 100 : 0
  if (portfolio.drawdownPct > performance.maxDrawdownPct)
    performance.maxDrawdownPct = portfolio.drawdownPct
}

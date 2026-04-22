import { MarketData, OHLCV, TechnicalIndicators, AssetType, Trend, Momentum } from './types'

// ─── CoinGecko ID map ─────────────────────────────────────────────────────────
const CG_IDS: Record<string, string> = {
  BTC:   'bitcoin',
  ETH:   'ethereum',
  SOL:   'solana',
  BNB:   'binancecoin',
  XRP:   'ripple',
  ADA:   'cardano',
  DOGE:  'dogecoin',
  AVAX:  'avalanche-2',
  MATIC: 'matic-network',
  LINK:  'chainlink',
  DOT:   'polkadot',
  ATOM:  'cosmos',
  LTC:   'litecoin',
  UNI:   'uniswap',
  NEAR:  'near',
  ARB:   'arbitrum',
  OP:    'optimism',
  INJ:   'injective-protocol',
  SUI:   'sui',
  APT:   'aptos',
  TIA:   'celestia',
  JUP:   'jupiter-exchange-solana',
  WIF:   'dogwifcoin',
  PEPE:  'pepe',
  BONK:  'bonk',
  SEI:   'sei-network',
  TON:   'the-open-network',
  SHIB:  'shiba-inu',
  FTM:   'fantom',
  HBAR:  'hedera-hashgraph',
  ALGO:  'algorand',
  VET:   'vechain',
  ICP:   'internet-computer',
  FIL:   'filecoin',
  SAND:  'the-sandbox',
  MANA:  'decentraland',
  AXS:   'axie-infinity',
  AAVE:  'aave',
  MKR:   'maker',
  CRV:   'curve-dao-token',
  LDO:   'lido-dao',
  RUNE:  'thorchain',
  KAVA:  'kava',
  EGLD:  'elrond-erd-2',
  FLOW:  'flow',
  GRT:   'the-graph',
  ENS:   'ethereum-name-service',
  IMX:   'immutable-x',
  BLUR:  'blur',
  PYTH:  'pyth-network',
  W:     'wormhole',
  STRK:  'starknet',
  ZKSYNC: 'zksync',
  ALT:   'altlayer',
}

export function cgId(symbol: string): string {
  return CG_IDS[symbol.toUpperCase()] ?? symbol.toLowerCase()
}

// ─── Crypto prices (CoinGecko) ────────────────────────────────────────────────
export async function fetchCryptoPrices(symbols: string[]): Promise<MarketData[]> {
  if (symbols.length === 0) return []
  const ids = symbols.map(cgId).join(',')
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`)

  const data: any[] = await res.json()
  return data.map(c => ({
    symbol:      symbolFromId(c.id),
    name:        c.name,
    assetType:   'crypto' as AssetType,
    price:       c.current_price    ?? 0,
    change24h:   c.price_change_24h ?? 0,
    changePct24h: c.price_change_percentage_24h ?? 0,
    volume24h:   c.total_volume     ?? 0,
    high24h:     c.high_24h         ?? 0,
    low24h:      c.low_24h          ?? 0,
    marketCap:   c.market_cap,
    fetchedAt:   new Date().toISOString(),
  }))
}

function symbolFromId(id: string): string {
  return Object.entries(CG_IDS).find(([, v]) => v === id)?.[0] ?? id.toUpperCase()
}

// ─── Crypto OHLCV (CoinGecko) ─────────────────────────────────────────────────
export async function fetchCryptoOHLCV(symbol: string, days = 30): Promise<OHLCV[]> {
  const url = `https://api.coingecko.com/api/v3/coins/${cgId(symbol)}/ohlc?vs_currency=usd&days=${days}`
  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data: number[][] = await res.json()
    return data.map(([time, open, high, low, close]) => ({ time, open, high, low, close, volume: 0 }))
  } catch { return [] }
}

// ─── Stock prices (Yahoo Finance) ─────────────────────────────────────────────
export async function fetchStockPrices(symbols: string[]): Promise<MarketData[]> {
  if (symbols.length === 0) return []
  const results = await Promise.allSettled(symbols.map(fetchOneStock))
  return results.flatMap(r => r.status === 'fulfilled' && r.value ? [r.value] : [])
}

async function fetchOneStock(symbol: string): Promise<MarketData | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=5m`
  try {
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const data  = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return null
    const meta      = result.meta
    const current   = meta.regularMarketPrice ?? 0
    const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? current
    const change    = current - prevClose
    return {
      symbol:      symbol.toUpperCase(),
      name:        meta.shortName ?? symbol,
      assetType:   'stock',
      price:       current,
      change24h:   change,
      changePct24h: prevClose ? (change / prevClose) * 100 : 0,
      volume24h:   meta.regularMarketVolume ?? 0,
      high24h:     meta.regularMarketDayHigh  ?? current,
      low24h:      meta.regularMarketDayLow   ?? current,
      fetchedAt:   new Date().toISOString(),
    }
  } catch { return null }
}

// ─── Stock OHLCV (Yahoo Finance) ─────────────────────────────────────────────
export async function fetchStockOHLCV(symbol: string, days = 30): Promise<OHLCV[]> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${days}d&interval=1d`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data   = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return []
    const ts: number[]     = result.timestamp ?? []
    const q                = result.indicators?.quote?.[0] ?? {}
    return ts
      .map((t, i) => ({
        time:   t * 1000,
        open:   q.open?.[i]   ?? 0,
        high:   q.high?.[i]   ?? 0,
        low:    q.low?.[i]    ?? 0,
        close:  q.close?.[i]  ?? 0,
        volume: q.volume?.[i] ?? 0,
      }))
      .filter(c => c.close > 0)
  } catch { return [] }
}

// ─── Technical indicators ─────────────────────────────────────────────────────
export function computeIndicators(ohlcv: OHLCV[]): TechnicalIndicators {
  const empty: TechnicalIndicators = {
    trend: 'sideways', momentum: 'neutral',
    rsi14: null, sma20: null, sma50: null,
    macd: null, macdSignal: null,
    support: null, resistance: null, volatility: null,
  }
  if (ohlcv.length < 14) return empty

  const closes  = ohlcv.map(c => c.close)
  const last     = closes[closes.length - 1]
  const rsi14    = calcRSI(closes, 14)
  const sma20    = closes.length >= 20 ? mean(closes.slice(-20)) : null
  const sma50    = closes.length >= 50 ? mean(closes.slice(-50)) : null
  const ema12    = calcEMA(closes, 12)
  const ema26    = calcEMA(closes, 26)
  const macd     = ema12 - ema26

  // Approximate 9-period EMA of recent MACD for signal line
  const macdHistory = closes.slice(-40).map((_, i, a) => calcEMA(a.slice(0, i + 1), 12) - calcEMA(a.slice(0, i + 1), 26))
  const macdSignal  = macdHistory.length >= 9 ? calcEMA(macdHistory, 9) : null

  const recent20  = closes.slice(-20)
  const support   = Math.min(...recent20)
  const resistance = Math.max(...recent20)

  const returns    = recent20.slice(1).map((p, i) => (p - recent20[i]) / recent20[i])
  const mu         = mean(returns)
  const volatility = Math.sqrt(mean(returns.map(r => (r - mu) ** 2))) * 100

  let trend: Trend = 'sideways'
  if (sma20 && sma50) {
    if (last > sma20 && sma20 > sma50) trend = 'bullish'
    else if (last < sma20 && sma20 < sma50) trend = 'bearish'
  } else if (sma20) {
    if (last > sma20 * 1.02) trend = 'bullish'
    else if (last < sma20 * 0.98) trend = 'bearish'
  }

  let momentum: Momentum = 'neutral'
  if (rsi14 !== null) {
    if (rsi14 > 60) momentum = 'strong'
    else if (rsi14 < 40) momentum = 'weak'
  }

  return {
    trend, momentum,
    rsi14:       rsi14 !== null ? Math.round(rsi14) : null,
    sma20, sma50, macd, macdSignal,
    support, resistance, volatility,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function calcRSI(prices: number[], period: number): number | null {
  if (prices.length < period + 1) return null
  let ag = 0, al = 0
  for (let i = 1; i <= period; i++) {
    const d = prices[i] - prices[i - 1]
    if (d > 0) ag += d; else al -= d
  }
  ag /= period; al /= period
  for (let i = period + 1; i < prices.length; i++) {
    const d = prices[i] - prices[i - 1]
    ag = (ag * (period - 1) + Math.max(d, 0))  / period
    al = (al * (period - 1) + Math.max(-d, 0)) / period
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al)
}

function calcEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0
  const k = 2 / (period + 1)
  return prices.reduce((ema, p, i) => (i === 0 ? p : p * k + ema * (1 - k)))
}

import crypto from 'crypto'
import { Trade, TradingMode } from './types'

// ─── Binance connector ────────────────────────────────────────────────────────
const BINANCE_BASE    = 'https://api.binance.com'
const BINANCE_TESTNET = 'https://testnet.binance.vision'
const MIN_NOTIONAL    = 15   // Binance minimum order value USD

export async function binanceOrder(trade: Trade, apiKey: string, apiSecret: string, testnet = false): Promise<boolean> {
  const notional = trade.quantity * trade.price
  if (notional < MIN_NOTIONAL) {
    console.warn(`[Binance] order too small: $${notional.toFixed(2)} < $${MIN_NOTIONAL} minimum`)
    return false
  }

  const base     = testnet ? BINANCE_TESTNET : BINANCE_BASE
  const symbol   = `${trade.symbol}USDT`
  const side     = trade.action.toUpperCase()   // BUY | SELL
  const quantity = trade.quantity.toFixed(6)
  const ts       = Date.now()

  const params   = new URLSearchParams({
    symbol, side, type: 'MARKET', quantity, timestamp: String(ts),
  })
  const signature = hmacSHA256(params.toString(), apiSecret)
  params.set('signature', signature)

  try {
    const res = await fetch(`${base}/api/v3/order`, {
      method:  'POST',
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('[Binance] order failed:', err)
      return false
    }
    return true
  } catch (err) {
    console.error('[Binance] request error:', err)
    return false
  }
}

// ─── Binance: get USDT balance ────────────────────────────────────────────────
export async function binanceBalance(apiKey: string, apiSecret: string, testnet = true): Promise<number> {
  const base  = testnet ? BINANCE_TESTNET : BINANCE_BASE
  const ts    = Date.now()
  const query = `timestamp=${ts}`
  const sig   = hmacSHA256(query, apiSecret)

  try {
    const res  = await fetch(`${base}/api/v3/account?${query}&signature=${sig}`, {
      headers: { 'X-MBX-APIKEY': apiKey },
    })
    if (!res.ok) return 0
    const data = await res.json()
    const usdt = data.balances?.find((b: any) => b.asset === 'USDT')
    return usdt ? parseFloat(usdt.free) : 0
  } catch { return 0 }
}

// ─── Alpaca connector (stocks) ────────────────────────────────────────────────
const ALPACA_PAPER = 'https://paper-api.alpaca.markets'
const ALPACA_LIVE  = 'https://api.alpaca.markets'

export async function alpacaOrder(trade: Trade, apiKey: string, apiSecret: string, paper = false): Promise<boolean> {
  const base = paper ? ALPACA_PAPER : ALPACA_LIVE
  const body = {
    symbol:     trade.symbol,
    qty:        String(Math.floor(trade.quantity * 100) / 100),
    side:       trade.action,     // 'buy' | 'sell'
    type:       'market',
    time_in_force: 'day',
  }

  try {
    const res = await fetch(`${base}/v2/orders`, {
      method:  'POST',
      headers: {
        'APCA-API-KEY-ID':     apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
        'Content-Type':        'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('[Alpaca] order failed:', err)
      return false
    }
    return true
  } catch (err) {
    console.error('[Alpaca] request error:', err)
    return false
  }
}

// ─── Alpaca: get account equity ───────────────────────────────────────────────
export async function alpacaEquity(apiKey: string, apiSecret: string, paper = true): Promise<number> {
  const base = paper ? ALPACA_PAPER : ALPACA_LIVE
  try {
    const res = await fetch(`${base}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID':     apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
    })
    if (!res.ok) return 0
    const data = await res.json()
    return parseFloat(data.equity ?? '0')
  } catch { return 0 }
}

// ─── HMAC SHA-256 ─────────────────────────────────────────────────────────────
function hmacSHA256(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

// ─── Route live orders to the correct exchange ────────────────────────────────
export async function executeLiveOrder(
  trade:         Trade,
  binanceKey?:   string,
  binanceSecret?: string,
  binanceTestnet?: boolean,
  alpacaKey?:    string,
  alpacaSecret?: string,
  alpacaPaper?:  boolean,
): Promise<boolean> {
  if (trade.assetType === 'crypto') {
    if (!binanceKey || !binanceSecret) return false
    return binanceOrder(trade, binanceKey, binanceSecret, binanceTestnet ?? true)
  } else {
    if (!alpacaKey || !alpacaSecret) return false
    return alpacaOrder(trade, alpacaKey, alpacaSecret, alpacaPaper ?? true)
  }
}

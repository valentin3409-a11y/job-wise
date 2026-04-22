import { Trade } from './types'
import { fetchCryptoPrices, fetchStockPrices, fetchCryptoOHLCV, fetchStockOHLCV } from './market'
import { fetchMarketNews } from './news'
import { analyzeAll } from './analyzer'
import { validateSignal, shouldStopLoss, shouldTakeProfit } from './risk'
import {
  getState, setStatus, addLog, addError,
  updateMarketData, updateSignal, updateNews,
  refreshPositionPrices, executePaperTrade,
} from './state'
import { executeLiveOrder } from './exchanges'

let _timer: ReturnType<typeof setTimeout> | null = null

// ─── Start the autonomous loop ────────────────────────────────────────────────
export function startBot(): void {
  const s = getState()
  if (s.status === 'running') return
  setStatus('running')
  addLog('Bot started.')
  scheduleNext()
}

// ─── Stop the loop ────────────────────────────────────────────────────────────
export function stopBot(): void {
  if (_timer) { clearTimeout(_timer); _timer = null }
  setStatus('stopped')
  addLog('Bot stopped.')
}

// ─── Schedule the next cycle ──────────────────────────────────────────────────
function scheduleNext(): void {
  const { config, status } = getState()
  if (status !== 'running') return
  const ms = config.intervalMinutes * 60 * 1000
  getState().nextCycleAt = new Date(Date.now() + ms).toISOString()
  _timer = setTimeout(async () => {
    await runCycle()
    scheduleNext()
  }, ms)
}

// ─── One full analysis + trade cycle ─────────────────────────────────────────
export async function runCycle(): Promise<void> {
  const s = getState()
  // Run regardless of status — on serverless each request may be a fresh Lambda
  const prev = s.status === 'stopped' ? 'running' : s.status
  setStatus('analyzing')
  addLog(`Cycle #${s.cycleCount + 1} started`)

  try {
    const enabled       = s.config.assets.filter(a => a.enabled)
    const cryptoAssets  = enabled.filter(a => a.assetType === 'crypto')
    const stockAssets   = enabled.filter(a => a.assetType === 'stock')

    // ── 1. Fetch market data ────────────────────────────────────────────────
    const [cryptoData, stockData, news] = await Promise.all([
      cryptoAssets.length ? fetchCryptoPrices(cryptoAssets.map(a => a.symbol))  : Promise.resolve([]),
      stockAssets.length  ? fetchStockPrices(stockAssets.map(a => a.symbol))    : Promise.resolve([]),
      fetchMarketNews(),
    ])

    const allMarket = [...cryptoData, ...stockData]
    updateMarketData(allMarket)
    updateNews(news)
    refreshPositionPrices(allMarket)

    addLog(`Market data fetched: ${allMarket.length} assets, ${news.length} news items`)

    // ── 2. Stop-loss / take-profit check ───────────────────────────────────
    await checkAutoExit()

    // ── 3. Fetch OHLCV for technical analysis ──────────────────────────────
    const ohlcvMap: Record<string, any[]> = {}
    await Promise.allSettled(
      enabled.map(async a => {
        ohlcvMap[a.symbol] = a.assetType === 'crypto'
          ? await fetchCryptoOHLCV(a.symbol, 30)
          : await fetchStockOHLCV(a.symbol, 30)
      })
    )

    // ── 4. Claude AI analysis ──────────────────────────────────────────────
    const marketMap = Object.fromEntries(allMarket.map(m => [m.symbol, m]))
    const signals   = await analyzeAll(enabled, marketMap, ohlcvMap, news, s.config.risk)

    for (const sig of signals) {
      updateSignal(sig)
      addLog(`Signal ${sig.symbol}: ${sig.action.toUpperCase()} (${sig.confidence}%) — ${sig.reasoning.slice(0, 80)}…`)
    }

    // ── 5. Execute trades based on signals ─────────────────────────────────
    for (const signal of signals) {
      if (signal.action === 'hold') continue
      const state   = getState()
      const verdict = validateSignal(signal, state.portfolio, state.trades, state.config.risk)

      if (!verdict.approved) {
        addLog(`${signal.symbol} skipped: ${verdict.reason}`)
        continue
      }

      const price     = state.marketData[signal.symbol]?.price ?? 0
      if (price === 0) continue

      let quantity: number
      if (signal.action === 'buy') {
        quantity = (verdict.adjustedCapital ?? 100) / price
      } else {
        const pos = state.portfolio.positions.find(p => p.symbol === signal.symbol)
        quantity  = pos?.quantity ?? 0
      }
      if (quantity <= 0) continue

      const fee   = quantity * price * 0.001   // 0.1% fee simulation
      const trade: Trade = {
        id:         `${signal.symbol}-${Date.now()}`,
        symbol:     signal.symbol,
        assetType:  signal.assetType,
        action:     signal.action,
        quantity,
        price,
        totalValue: quantity * price,
        fee,
        reason:     signal.reasoning.slice(0, 200),
        confidence: signal.confidence,
        mode:       state.config.mode,
        status:     'executed',
        executedAt: new Date().toISOString(),
      }

      if (state.config.mode === 'live') {
        const ok = await executeLiveOrder(
          trade,
          state.config.exchanges.binanceKey,
          state.config.exchanges.binanceSecret,
          state.config.exchanges.binanceTestnet,
          state.config.exchanges.alpacaKey,
          state.config.exchanges.alpacaSecret,
          state.config.exchanges.alpacaPaper,
        )
        if (!ok) {
          trade.status = 'failed'
          addError(`Live order failed: ${signal.symbol} ${signal.action}`)
          continue
        }
      }

      executePaperTrade(trade)
      const st = getState()
      addLog(
        `[${trade.mode.toUpperCase()}] ${trade.action.toUpperCase()} ${quantity.toFixed(4)} ${signal.symbol} @ $${price.toFixed(2)} = $${trade.totalValue.toFixed(2)}`
      )
    }

    s.cycleCount++
    s.lastCycleAt = new Date().toISOString()

  } catch (err: any) {
    addError(`Cycle error: ${err.message}`)
  } finally {
    // Restore previous status if it was 'running'
    if (getState().status === 'analyzing') setStatus(prev === 'analyzing' ? 'running' : prev)
  }
}

// ─── Auto exit positions (stop-loss / take-profit) ───────────────────────────
async function checkAutoExit(): Promise<void> {
  const s = getState()
  for (const pos of [...s.portfolio.positions]) {
    const hitSL = shouldStopLoss(pos.unrealizedPnlPct, s.config.risk)
    const hitTP = shouldTakeProfit(pos.unrealizedPnlPct, s.config.risk)
    if (!hitSL && !hitTP) continue

    const reason = hitSL
      ? `Stop-loss at ${pos.unrealizedPnlPct.toFixed(1)}%`
      : `Take-profit at ${pos.unrealizedPnlPct.toFixed(1)}%`

    const fee   = pos.quantity * pos.currentPrice * 0.001
    const trade: Trade = {
      id:         `${pos.symbol}-exit-${Date.now()}`,
      symbol:     pos.symbol,
      assetType:  pos.assetType,
      action:     'sell',
      quantity:   pos.quantity,
      price:      pos.currentPrice,
      totalValue: pos.quantity * pos.currentPrice,
      fee,
      reason,
      confidence: 100,
      mode:       s.config.mode,
      status:     'executed',
      executedAt: new Date().toISOString(),
    }

    if (s.config.mode === 'live') {
      await executeLiveOrder(
        trade,
        s.config.exchanges.binanceKey,
        s.config.exchanges.binanceSecret,
        s.config.exchanges.binanceTestnet,
        s.config.exchanges.alpacaKey,
        s.config.exchanges.alpacaSecret,
        s.config.exchanges.alpacaPaper,
      )
    }

    executePaperTrade(trade)
    addLog(`AUTO-EXIT ${pos.symbol}: ${reason}`)
  }
}

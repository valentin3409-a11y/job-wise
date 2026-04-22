import Anthropic from '@anthropic-ai/sdk'
import { MarketData, OHLCV, TechnicalIndicators, NewsItem, AISignal, AssetType, RiskConfig } from './types'
import { computeIndicators } from './market'
import { newsContextForSymbol } from './news'
import { computeLevels } from './risk'
import { fetchCoinFundamentals } from './discovery'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ─── Analyse one asset with Claude ───────────────────────────────────────────
export async function analyzeAsset(
  symbol:           string,
  assetType:        AssetType,
  market:           MarketData,
  ohlcv:            OHLCV[],
  news:             NewsItem[],
  risk:             RiskConfig,
  discoveryReason?: string,
): Promise<AISignal> {
  const ind     = computeIndicators(ohlcv)
  const newsCtx = newsContextForSymbol(news, symbol)

  const fundamentals = assetType === 'crypto' ? await fetchCoinFundamentals(symbol).catch(() => '') : ''

  const prompt = buildPrompt(symbol, assetType, market, ind, newsCtx, fundamentals, discoveryReason)

  try {
    const msg = await client.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 800,
      messages:   [{ role: 'user', content: prompt }],
    })

    const raw  = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
    const json = extractJSON(raw)
    const def  = computeLevels(market.price, risk)

    return {
      symbol,
      assetType,
      action:           json.action  ?? 'hold',
      confidence:       clamp(json.confidence ?? 50, 0, 100),
      priceTarget:      json.priceTarget ?? null,
      stopLoss:         json.stopLoss    ?? def.stopLoss,
      takeProfit:       json.takeProfit  ?? def.takeProfit,
      reasoning:        json.reasoning        ?? 'No reasoning provided.',
      technicalSummary: json.technicalSummary ?? formatTechnicals(ind, market.price),
      newsImpact:       json.newsImpact       ?? 'No significant news.',
      riskLevel:        json.riskLevel ?? 'medium',
      generatedAt:      new Date().toISOString(),
    }
  } catch (err: any) {
    return fallbackSignal(symbol, assetType, market, ind, err.message)
  }
}

// ─── Batch-analyse all enabled assets ────────────────────────────────────────
export async function analyzeAll(
  assets:       { symbol: string; assetType: AssetType; discoveryReason?: string }[],
  marketMap:    Record<string, MarketData>,
  ohlcvMap:     Record<string, OHLCV[]>,
  news:         NewsItem[],
  risk:         RiskConfig,
): Promise<AISignal[]> {
  const results = await Promise.allSettled(
    assets.map(a =>
      analyzeAsset(a.symbol, a.assetType, marketMap[a.symbol], ohlcvMap[a.symbol] ?? [], news, risk, a.discoveryReason)
    )
  )
  return results.flatMap(r => r.status === 'fulfilled' ? [r.value] : [])
}

// ─── Prompt ───────────────────────────────────────────────────────────────────
function buildPrompt(
  symbol:    string,
  assetType: AssetType,
  market:    MarketData,
  ind:       TechnicalIndicators,
  newsCtx:   string,
  fundamentals?: string,
  discoveryReason?: string,
): string {
  return `You are an elite quantitative analyst and portfolio manager with deep expertise in both crypto and equities. Analyse all available data and provide a precise trading recommendation.

ASSET: ${symbol} (${assetType.toUpperCase()})${discoveryReason ? ` — DISCOVERED: ${discoveryReason}` : ''}
PRICE:    $${fmt(market.price)}
24h CHG:  ${market.changePct24h.toFixed(2)}% ($${fmt(market.change24h)})
VOLUME:   $${fmtM(market.volume24h)}M
DAY H/L:  $${fmt(market.high24h)} / $${fmt(market.low24h)}
${market.marketCap ? `MKTCAP:   $${fmtB(market.marketCap)}B` : ''}
${fundamentals ? `\nFUNDAMENTALS:\n${fundamentals}` : ''}

TECHNICALS:
  Trend:      ${ind.trend}
  Momentum:   ${ind.momentum}
  RSI(14):    ${ind.rsi14 ?? 'N/A'}
  MACD:       ${ind.macd !== null ? ind.macd.toFixed(4) : 'N/A'}
  SMA20/50:   ${ind.sma20 ? '$' + fmt(ind.sma20) : 'N/A'} / ${ind.sma50 ? '$' + fmt(ind.sma50) : 'N/A'}
  Support:    ${ind.support ? '$' + fmt(ind.support) : 'N/A'}
  Resistance: ${ind.resistance ? '$' + fmt(ind.resistance) : 'N/A'}
  Volatility: ${ind.volatility !== null ? ind.volatility.toFixed(2) + '%' : 'N/A'}

NEWS & SENTIMENT (last 24h):
${newsCtx}

INSTRUCTIONS:
- For DISCOVERED assets: be especially thorough — research the project quality, team, tokenomics, use case
- Consider: is the trending/momentum sustainable or a pump?
- Factor in macro environment, sector momentum, correlation with BTC/market
- Be contrarian when warranted — high confidence only when multiple signals align

Respond ONLY with valid JSON (no markdown):
{
  "action": "buy" | "sell" | "hold",
  "confidence": <integer 0-100>,
  "priceTarget": <number or null>,
  "stopLoss": <number>,
  "takeProfit": <number>,
  "reasoning": "<3-4 sentence rationale covering technicals + fundamentals + news>",
  "technicalSummary": "<1-sentence technical summary>",
  "newsImpact": "<1-sentence news/fundamental impact>",
  "riskLevel": "low" | "medium" | "high",
  "projectQuality": "strong" | "moderate" | "weak" | "unknown"
}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractJSON(text: string): any {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  try { return JSON.parse(cleaned) } catch {}
  const m = cleaned.match(/\{[\s\S]*\}/)
  if (m) { try { return JSON.parse(m[0]) } catch {} }
  return {}
}

function fallbackSignal(
  symbol:    string,
  assetType: AssetType,
  market:    MarketData,
  ind:       TechnicalIndicators,
  errMsg:    string,
): AISignal {
  const def = { stopLoss: market.price * 0.93, takeProfit: market.price * 1.20 }
  return {
    symbol, assetType,
    action:           'hold',
    confidence:       0,
    priceTarget:      null,
    stopLoss:         def.stopLoss,
    takeProfit:       def.takeProfit,
    reasoning:        `Analysis failed: ${errMsg}`,
    technicalSummary: formatTechnicals(ind, market.price),
    newsImpact:       'Analysis unavailable.',
    riskLevel:        'high',
    generatedAt:      new Date().toISOString(),
  }
}

function formatTechnicals(ind: TechnicalIndicators, price: number): string {
  return `Trend ${ind.trend}, RSI ${ind.rsi14 ?? '?'}, price vs SMA20: ${
    ind.sma20 ? ((price / ind.sma20 - 1) * 100).toFixed(1) + '%' : 'N/A'
  }`
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function fmt(n: number): string {
  return n >= 1000 ? n.toLocaleString('en-US', { maximumFractionDigits: 2 }) : n.toPrecision(5)
}
function fmtM(n: number): string { return (n / 1e6).toFixed(1) }
function fmtB(n: number): string { return (n / 1e9).toFixed(2) }

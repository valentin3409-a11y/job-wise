// ─── Asset & Bot meta ─────────────────────────────────────────────────────────
export type AssetType   = 'crypto' | 'stock'
export type TradeAction = 'buy' | 'sell' | 'hold'
export type TradingMode = 'paper' | 'live'
export type BotStatus   = 'running' | 'stopped' | 'analyzing'
export type RiskLevel   = 'low' | 'medium' | 'high'
export type Trend       = 'bullish' | 'bearish' | 'sideways'
export type Momentum    = 'strong' | 'weak' | 'neutral'
export type Sentiment   = 'positive' | 'negative' | 'neutral'

// ─── Config ───────────────────────────────────────────────────────────────────
export interface AssetConfig {
  symbol:    string
  assetType: AssetType
  enabled:   boolean
}

export interface RiskConfig {
  maxPositionSizePct:      number  // % portfolio per position  (default 10)
  stopLossPct:             number  // auto-stop loss %           (default 7)
  takeProfitPct:           number  // auto-take profit %         (default 20)
  maxDailyLossPct:         number  // halt trading threshold %   (default 15)
  minConfidence:           number  // min AI confidence to trade (default 65)
  maxConcurrentPositions:  number  // max open positions         (default 8)
}

export interface ExchangeConfig {
  binanceKey?:    string
  binanceSecret?: string
  binanceTestnet: boolean
  alpacaKey?:     string
  alpacaSecret?:  string
  alpacaPaper:    boolean
}

export interface BotConfig {
  mode:             TradingMode
  intervalMinutes:  number
  initialCapital:   number
  assets:           AssetConfig[]
  risk:             RiskConfig
  exchanges:        ExchangeConfig
  newsApiKey?:      string
}

// ─── Market data ──────────────────────────────────────────────────────────────
export interface MarketData {
  symbol:      string
  name:        string
  assetType:   AssetType
  price:       number
  change24h:   number
  changePct24h: number
  volume24h:   number
  high24h:     number
  low24h:      number
  marketCap?:  number
  fetchedAt:   string
}

export interface OHLCV {
  time:   number  // ms timestamp
  open:   number
  high:   number
  low:    number
  close:  number
  volume: number
}

export interface TechnicalIndicators {
  trend:       Trend
  momentum:    Momentum
  rsi14:       number | null
  sma20:       number | null
  sma50:       number | null
  macd:        number | null
  macdSignal:  number | null
  support:     number | null
  resistance:  number | null
  volatility:  number | null   // daily % std-dev
}

// ─── News ─────────────────────────────────────────────────────────────────────
export interface NewsItem {
  id:             string
  title:          string
  source:         string
  url:            string
  publishedAt:    string
  sentiment:      Sentiment
  sentimentScore: number    // -1 … +1
  relatedAssets:  string[]
  summary?:       string
}

// ─── AI signal ────────────────────────────────────────────────────────────────
export interface AISignal {
  symbol:           string
  assetType:        AssetType
  action:           TradeAction
  confidence:       number         // 0–100
  priceTarget:      number | null
  stopLoss:         number
  takeProfit:       number
  reasoning:        string
  technicalSummary: string
  newsImpact:       string
  riskLevel:        RiskLevel
  generatedAt:      string
}

// ─── Portfolio & trades ───────────────────────────────────────────────────────
export interface Position {
  symbol:            string
  assetType:         AssetType
  quantity:          number
  avgEntryPrice:     number
  currentPrice:      number
  value:             number
  unrealizedPnl:     number
  unrealizedPnlPct:  number
  openedAt:          string
}

export interface Portfolio {
  totalValue:    number
  cashBalance:   number
  investedValue: number
  positions:     Position[]
  totalPnl:      number
  totalPnlPct:   number
  dayPnl:        number
  dayPnlPct:     number
  peakValue:     number
  drawdownPct:   number
}

export interface Trade {
  id:          string
  symbol:      string
  assetType:   AssetType
  action:      TradeAction
  quantity:    number
  price:       number
  totalValue:  number
  fee:         number
  reason:      string
  confidence:  number
  mode:        TradingMode
  status:      'executed' | 'failed' | 'cancelled'
  executedAt:  string
}

// ─── Performance ──────────────────────────────────────────────────────────────
export interface PerformanceMetrics {
  totalTrades:      number
  winningTrades:    number
  losingTrades:     number
  winRate:          number   // %
  totalReturn:      number   // USD
  totalReturnPct:   number
  bestTrade:        number
  worstTrade:       number
  maxDrawdownPct:   number
  sharpeRatio:      number | null
}

// ─── Full bot state ───────────────────────────────────────────────────────────
export interface BotState {
  status:       BotStatus
  config:       BotConfig
  portfolio:    Portfolio
  signals:      Record<string, AISignal>
  marketData:   Record<string, MarketData>
  news:         NewsItem[]
  trades:       Trade[]
  performance:  PerformanceMetrics
  lastCycleAt:  string | null
  nextCycleAt:  string | null
  cycleCount:   number
  errors:       string[]
  logs:         string[]
}

import { NewsItem, Sentiment } from './types'

// Keywords to detect related assets in headlines
const ASSET_KEYWORDS: Record<string, string[]> = {
  BTC:   ['bitcoin', 'btc', 'satoshi'],
  ETH:   ['ethereum', 'eth', 'ether', 'vitalik'],
  SOL:   ['solana', 'sol'],
  BNB:   ['binance', 'bnb'],
  XRP:   ['ripple', 'xrp'],
  DOGE:  ['dogecoin', 'doge', 'elon musk'],
  AVAX:  ['avalanche', 'avax'],
  AAPL:  ['apple', 'iphone', 'tim cook'],
  TSLA:  ['tesla', 'elon musk', 'tsla', 'electric vehicle'],
  NVDA:  ['nvidia', 'nvda', 'gpu', 'jensen huang'],
  MSFT:  ['microsoft', 'msft', 'azure', 'satya nadella'],
  AMZN:  ['amazon', 'aws', 'bezos', 'amzn'],
  GOOGL: ['google', 'alphabet', 'googl', 'gemini', 'larry page'],
  META:  ['meta', 'facebook', 'instagram', 'zuckerberg'],
}

const POSITIVE_WORDS = ['surge', 'rally', 'rise', 'soar', 'bull', 'gain', 'growth', 'record', 'high', 'strong', 'positive', 'approval', 'launch', 'buy', 'upgrade', 'beat', 'profit', 'success']
const NEGATIVE_WORDS = ['crash', 'fall', 'drop', 'plunge', 'bear', 'loss', 'decline', 'risk', 'ban', 'hack', 'fraud', 'sell', 'downgrade', 'miss', 'concern', 'warning', 'fear', 'lawsuit']

// ─── Fetch from free RSS sources ──────────────────────────────────────────────
export async function fetchMarketNews(): Promise<NewsItem[]> {
  const sources = [
    { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^DJI,BTC-USD,ETH-USD&region=US&lang=en-US', source: 'Yahoo Finance' },
    { url: 'https://cointelegraph.com/rss', source: 'CoinTelegraph' },
    { url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', source: 'CoinDesk' },
  ]

  const allItems: NewsItem[] = []

  await Promise.allSettled(
    sources.map(async ({ url, source }) => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TradingBot/1.0)' },
          next: { revalidate: 300 },
        })
        if (!res.ok) return
        const xml   = await res.text()
        const items = parseRSSItems(xml, source)
        allItems.push(...items)
      } catch { /* skip source on error */ }
    })
  )

  // Deduplicate by title
  const seen = new Set<string>()
  return allItems
    .filter(item => {
      const key = item.title.toLowerCase().slice(0, 60)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 30)
}

// ─── RSS XML parser ───────────────────────────────────────────────────────────
function parseRSSItems(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((match = itemRegex.exec(xml)) !== null) {
    const block  = match[1]
    const title  = extractTag(block, 'title')
    const link   = extractTag(block, 'link')
    const pubDate = extractTag(block, 'pubDate')

    if (!title) continue

    const text    = title.toLowerCase()
    const sentiment = scoreSentiment(text)
    const related   = detectAssets(text)

    items.push({
      id:             link ?? title,
      title,
      source,
      url:            link ?? '',
      publishedAt:    pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      sentiment:      sentiment.label,
      sentimentScore: sentiment.score,
      relatedAssets:  related,
    })
  }
  return items
}

function extractTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:]]>)?<\\/${tag}>`, 's'))
  if (!m) return null
  return m[1].replace(/<!\[CDATA\[/, '').replace(/]]>/, '').replace(/<[^>]+>/g, '').trim()
}

// ─── Simple keyword-based sentiment ──────────────────────────────────────────
function scoreSentiment(text: string): { label: Sentiment; score: number } {
  let score = 0
  for (const w of POSITIVE_WORDS) if (text.includes(w)) score += 1
  for (const w of NEGATIVE_WORDS) if (text.includes(w)) score -= 1
  const normalized = Math.max(-1, Math.min(1, score / 3))
  const label: Sentiment = normalized > 0.1 ? 'positive' : normalized < -0.1 ? 'negative' : 'neutral'
  return { label, score: normalized }
}

// ─── Asset detection ─────────────────────────────────────────────────────────
function detectAssets(text: string): string[] {
  const found: string[] = []
  for (const [symbol, keywords] of Object.entries(ASSET_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) found.push(symbol)
  }
  return found
}

// ─── Format news for Claude prompt ───────────────────────────────────────────
export function newsContextForSymbol(news: NewsItem[], symbol: string, limit = 5): string {
  const relevant = news
    .filter(n => n.relatedAssets.includes(symbol) || n.relatedAssets.length === 0)
    .slice(0, limit)

  if (relevant.length === 0) return 'No recent news available.'

  return relevant
    .map(n => `[${n.sentiment.toUpperCase()}] ${n.title} — ${n.source} (${timeAgo(n.publishedAt)})`)
    .join('\n')
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`
  return `${Math.round(mins / 1440)}d ago`
}

import { MarketData, AssetType } from './types'
import { cgId } from './market'

export interface DiscoveredAsset {
  symbol:    string
  assetType: AssetType
  name:      string
  reason:    string   // why it was discovered
  score:     number   // trending score 0-100
}

// CoinGecko top 7 trending coins
export async function fetchTrendingCryptos(): Promise<DiscoveredAsset[]> {
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending', {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.coins ?? []).slice(0, 7).map((c: any, i: number) => ({
      symbol:    c.item.symbol.toUpperCase(),
      assetType: 'crypto' as AssetType,
      name:      c.item.name,
      reason:    `#${i + 1} trending on CoinGecko`,
      score:     Math.round(100 - i * 12),
    }))
  } catch { return [] }
}

// Yahoo Finance top gainers (stocks moving today)
export async function fetchTrendingStocks(): Promise<DiscoveredAsset[]> {
  try {
    const url = 'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=day_gainers&count=10&region=US&lang=en-US'
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    const quotes = data?.finance?.result?.[0]?.quotes ?? []
    return quotes.slice(0, 10).map((q: any, i: number) => ({
      symbol:    q.symbol,
      assetType: 'stock' as AssetType,
      name:      q.shortName ?? q.symbol,
      reason:    `Top ${i + 1} gainer today (+${q.regularMarketChangePercent?.toFixed(1)}%)`,
      score:     Math.round(Math.min(100, 50 + (q.regularMarketChangePercent ?? 0) * 2)),
    }))
  } catch { return [] }
}

// Fetch CoinGecko coin info for fundamental research
export async function fetchCoinFundamentals(symbol: string): Promise<string> {
  try {
    const id  = cgId(symbol)
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return ''
    const d = await res.json()
    const desc = (d.description?.en ?? '').replace(/<[^>]+>/g, '').slice(0, 400)
    return [
      d.market_data?.market_cap_rank ? `Market cap rank: #${d.market_data.market_cap_rank}` : '',
      d.categories?.slice(0, 3).join(', ') ?? '',
      desc,
    ].filter(Boolean).join(' | ')
  } catch { return '' }
}

// Filter out assets already being watched
export function filterNew(
  discovered: DiscoveredAsset[],
  existing: string[],
): DiscoveredAsset[] {
  const set = new Set(existing.map(s => s.toUpperCase()))
  return discovered.filter(d => !set.has(d.symbol.toUpperCase()))
}

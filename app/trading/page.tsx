'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { BotState, AISignal, Position, Trade, NewsItem, MarketData } from '@/lib/trading/types'

// ─── Constants ────────────────────────────────────────────────────────────────
const POLL_MS = 30_000

const SIGNAL_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  buy:  { bg: '#e8f5e9', text: '#1b5e20', border: '#4caf50' },
  sell: { bg: '#fce4ec', text: '#880e4f', border: '#e91e63' },
  hold: { bg: '#f5f5f5', text: '#616161', border: '#bdbdbd' },
}

const SENTIMENT_COLOR: Record<string, string> = {
  positive: '#2e7d32',
  negative: '#c62828',
  neutral:  '#616161',
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TradingPage() {
  const [state,     setState]     = useState<BotState | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [cycling,   setCycling]   = useState(false)
  const [tab,       setTab]       = useState<'dashboard' | 'trades' | 'news' | 'settings'>('dashboard')
  const [mode,      setMode]      = useState<'paper' | 'live'>('paper')
  const [capital,   setCapital]   = useState('10000')
  const [interval,  setInterval_] = useState('5')
  const [stopLoss,  setStopLoss]  = useState('7')
  const [takeProfit, setTakeProfit] = useState('20')
  const [minConf,   setMinConf]   = useState('65')
  const [maxPos,    setMaxPos]    = useState('8')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Load state ──────────────────────────────────────────────────────────────
  const loadState = useCallback(async () => {
    try {
      const res = await fetch('/api/trading/state')
      if (res.ok) {
        const data: BotState = await res.json()
        setState(data)
        setMode(data.config.mode)
      }
    } catch {}
  }, [])

  useEffect(() => {
    loadState()
    intervalRef.current = setInterval(loadState, POLL_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [loadState])

  // ── Bot controls ─────────────────────────────────────────────────────────────
  async function control(action: string, extra?: object) {
    setLoading(true)
    try {
      await fetch('/api/trading/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      await loadState()
    } finally { setLoading(false) }
  }

  async function triggerCycle() {
    setCycling(true)
    try {
      await fetch('/api/trading/cycle', { method: 'POST' })
      await loadState()
    } finally { setCycling(false) }
  }

  async function handleReset() {
    await control('reset', {
      config: {
        mode,
        intervalMinutes: Number(interval),
        initialCapital:  Number(capital),
        risk: {
          stopLossPct:            Number(stopLoss),
          takeProfitPct:          Number(takeProfit),
          minConfidence:          Number(minConf),
          maxConcurrentPositions: Number(maxPos),
          maxPositionSizePct:     10,
          maxDailyLossPct:        15,
        },
      },
    })
  }

  const s = state
  const pnlColor = (v: number) => v >= 0 ? '#2e7d32' : '#c62828'
  const fmtUSD   = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const fmtPct   = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
  const statusColor = s?.status === 'running' ? '#2e7d32' : s?.status === 'analyzing' ? '#e65100' : '#616161'

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#e0e0e0', fontFamily: 'var(--font-body, system-ui)' }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{ background: '#111', borderBottom: '1px solid #222', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>JobWise Trading</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#1a1a1a', border: '1px solid #333', color: '#aaa' }}>
            {mode === 'paper' ? 'PAPER TRADING' : 'LIVE TRADING'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {s && (
            <>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{fmtUSD(s.portfolio.totalValue)}</span>
              <span style={{ fontSize: 12, color: pnlColor(s.portfolio.totalPnl) }}>
                {fmtPct(s.portfolio.totalPnlPct)}
              </span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
              <span style={{ fontSize: 12, color: statusColor }}>{s.status.toUpperCase()}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Nav tabs ────────────────────────────────────────────────────────── */}
      <div style={{ background: '#111', borderBottom: '1px solid #1e1e1e', padding: '0 24px', display: 'flex', gap: 0 }}>
        {(['dashboard', 'trades', 'news', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '12px 16px',
              fontSize: 13, color: tab === t ? '#f0c040' : '#888',
              borderBottom: tab === t ? '2px solid #f0c040' : '2px solid transparent',
              fontWeight: tab === t ? 600 : 400, transition: 'all .15s',
            }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {/* Bot controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 4 }}>
          {s?.status === 'running' || s?.status === 'analyzing' ? (
            <button onClick={() => control('stop')} disabled={loading}
              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: '#c62828', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              ■ Stop
            </button>
          ) : (
            <button onClick={() => control('start')} disabled={loading}
              style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              ▶ Start
            </button>
          )}
          <button onClick={triggerCycle} disabled={cycling || loading}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: '#1a3a5c', color: '#7ab3e0', border: '1px solid #1e4a70', borderRadius: 6, cursor: 'pointer' }}>
            {cycling ? '⟳ Analysing…' : '⟳ Run Cycle'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px' }}>

        {/* ════════════════════ DASHBOARD ════════════════════ */}
        {tab === 'dashboard' && s && (
          <div>
            {/* Portfolio summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Valeur totale',    value: fmtUSD(s.portfolio.totalValue),   color: '#fff' },
                { label: 'Liquidités',        value: fmtUSD(s.portfolio.cashBalance),  color: '#7ab3e0' },
                { label: 'P&L total',         value: `${fmtUSD(s.portfolio.totalPnl)} (${fmtPct(s.portfolio.totalPnlPct)})`, color: pnlColor(s.portfolio.totalPnl) },
                { label: 'Drawdown max',      value: `${s.performance.maxDrawdownPct.toFixed(1)}%`,  color: s.performance.maxDrawdownPct > 10 ? '#c62828' : '#aaa' },
              ].map(c => (
                <div key={c.label} style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* Market prices */}
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Marchés en temps réel</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
              {Object.values(s.marketData).map(m => {
                const sig   = s.signals[m.symbol]
                const style = sig ? SIGNAL_STYLE[sig.action] : SIGNAL_STYLE.hold
                return (
                  <div key={m.symbol} style={{ background: '#111', border: `1px solid ${style.border}`, borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{m.symbol}</div>
                        <div style={{ fontSize: 10, color: '#555' }}>{m.assetType.toUpperCase()}</div>
                      </div>
                      {sig && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                          {sig.action.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                      ${m.price.toLocaleString('en-US', { maximumFractionDigits: m.price > 100 ? 2 : 4 })}
                    </div>
                    <div style={{ fontSize: 12, color: pnlColor(m.changePct24h) }}>
                      {m.changePct24h >= 0 ? '+' : ''}{m.changePct24h.toFixed(2)}% 24h
                    </div>
                    {sig && sig.action !== 'hold' && (
                      <div style={{ marginTop: 6, fontSize: 10, color: '#666', lineHeight: 1.5 }}>
                        Confiance: {sig.confidence}%<br />
                        SL: ${sig.stopLoss.toFixed(2)} · TP: ${sig.takeProfit.toFixed(2)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Open positions */}
            {s.portfolio.positions.length > 0 && (
              <>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Positions ouvertes</h3>
                <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #222' }}>
                        {['Symbole', 'Qté', 'Prix moyen', 'Prix actuel', 'Valeur', 'P&L'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#555', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.portfolio.positions.map(pos => (
                        <tr key={pos.symbol} style={{ borderBottom: '1px solid #1a1a1a' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#fff' }}>{pos.symbol}</td>
                          <td style={{ padding: '10px 14px', color: '#aaa' }}>{pos.quantity.toFixed(6)}</td>
                          <td style={{ padding: '10px 14px', color: '#aaa' }}>${pos.avgEntryPrice.toFixed(2)}</td>
                          <td style={{ padding: '10px 14px', color: '#aaa' }}>${pos.currentPrice.toFixed(2)}</td>
                          <td style={{ padding: '10px 14px', color: '#fff' }}>{fmtUSD(pos.value)}</td>
                          <td style={{ padding: '10px 14px', color: pnlColor(pos.unrealizedPnl) }}>
                            {fmtUSD(pos.unrealizedPnl)} ({fmtPct(pos.unrealizedPnlPct)})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* AI Signals */}
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>Signaux IA (Claude)</h3>
            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
              {Object.values(s.signals).length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#444' }}>
                  Aucun signal — cliquez sur "Run Cycle" pour démarrer l'analyse
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #222' }}>
                      {['Actif', 'Signal', 'Confiance', 'Risque', 'Stop Loss', 'Take Profit', 'Raisonnement'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#555', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(s.signals).map(sig => {
                      const style = SIGNAL_STYLE[sig.action]
                      return (
                        <tr key={sig.symbol} style={{ borderBottom: '1px solid #1a1a1a' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#fff' }}>{sig.symbol}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: style.bg, color: style.text }}>
                              {sig.action.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 4, background: '#1e1e1e', borderRadius: 2, maxWidth: 60 }}>
                                <div style={{ width: `${sig.confidence}%`, height: '100%', background: sig.confidence > 75 ? '#2e7d32' : sig.confidence > 50 ? '#f0c040' : '#c62828', borderRadius: 2 }} />
                              </div>
                              <span style={{ color: '#aaa', fontSize: 12 }}>{sig.confidence}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 11 }}>
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: sig.riskLevel === 'low' ? '#1b5e20' : sig.riskLevel === 'medium' ? '#e65100' : '#b71c1c', color: '#fff' }}>
                              {sig.riskLevel}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#c62828', fontSize: 12 }}>${sig.stopLoss.toFixed(2)}</td>
                          <td style={{ padding: '10px 14px', color: '#2e7d32', fontSize: 12 }}>${sig.takeProfit.toFixed(2)}</td>
                          <td style={{ padding: '10px 14px', color: '#888', fontSize: 12, maxWidth: 300 }}>
                            <span title={sig.reasoning}>{sig.reasoning.slice(0, 80)}{sig.reasoning.length > 80 ? '…' : ''}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Performance + Logs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 16 }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 12 }}>Performance</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { l: 'Trades total',    v: s.performance.totalTrades },
                    { l: 'Taux de réussite', v: `${s.performance.winRate.toFixed(1)}%` },
                    { l: 'Cycles',           v: s.cycleCount },
                    { l: 'Positions',        v: s.portfolio.positions.length },
                  ].map(item => (
                    <div key={item.l} style={{ background: '#0d0d0d', borderRadius: 6, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>{item.l}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 16, overflow: 'hidden' }}>
                <h4 style={{ fontSize: 12, fontWeight: 600, color: '#666', textTransform: 'uppercase', marginBottom: 12 }}>Logs récents</h4>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#666', lineHeight: 1.8, maxHeight: 120, overflow: 'auto' }}>
                  {s.logs.slice(0, 8).map((l, i) => (
                    <div key={i} style={{ color: l.includes('ERROR') ? '#ef5350' : l.includes('BUY') || l.includes('SELL') ? '#f0c040' : '#666' }}>{l}</div>
                  ))}
                  {s.logs.length === 0 && <span style={{ color: '#333' }}>Aucun log…</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ TRADES ════════════════════ */}
        {tab === 'trades' && s && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Historique des trades</h2>
            {s.trades.length === 0 ? (
              <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 40, textAlign: 'center', color: '#444' }}>
                Aucun trade exécuté. Démarrez le bot ou cliquez sur "Run Cycle".
              </div>
            ) : (
              <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #222' }}>
                      {['Date', 'Actif', 'Action', 'Qté', 'Prix', 'Total', 'Confiance', 'Mode', 'Raison'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#555', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.trades.map(t => {
                      const st = SIGNAL_STYLE[t.action] ?? SIGNAL_STYLE.hold
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                          <td style={{ padding: '10px 14px', color: '#666', fontSize: 11 }}>{new Date(t.executedAt).toLocaleString('fr-FR')}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#fff' }}>{t.symbol}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: st.bg, color: st.text }}>{t.action.toUpperCase()}</span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#aaa' }}>{t.quantity.toFixed(6)}</td>
                          <td style={{ padding: '10px 14px', color: '#aaa' }}>${t.price.toFixed(2)}</td>
                          <td style={{ padding: '10px 14px', color: '#fff', fontWeight: 600 }}>{fmtUSD(t.totalValue)}</td>
                          <td style={{ padding: '10px 14px', color: '#aaa' }}>{t.confidence}%</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: t.mode === 'paper' ? '#1a2a3a' : '#2a1a1a', color: t.mode === 'paper' ? '#7ab3e0' : '#ef9a9a' }}>
                              {t.mode.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#666', fontSize: 11, maxWidth: 200 }} title={t.reason}>
                            {t.reason.slice(0, 50)}{t.reason.length > 50 ? '…' : ''}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ NEWS ════════════════════ */}
        {tab === 'news' && s && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Actualités du marché</h2>
            {s.news.length === 0 ? (
              <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 40, textAlign: 'center', color: '#444' }}>
                Aucune actualité — lancez un cycle pour récupérer les dernières news.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.news.map(n => (
                  <div key={n.id} style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      flexShrink: 0, width: 6, height: 6, borderRadius: '50%', marginTop: 6,
                      background: SENTIMENT_COLOR[n.sentiment],
                    }} />
                    <div style={{ flex: 1 }}>
                      <a href={n.url} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#e0e0e0', fontSize: 13, fontWeight: 500, textDecoration: 'none', lineHeight: 1.5 }}>
                        {n.title}
                      </a>
                      <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, color: '#555' }}>{n.source}</span>
                        <span style={{ fontSize: 10, color: SENTIMENT_COLOR[n.sentiment], fontWeight: 600 }}>
                          {n.sentiment.toUpperCase()} ({n.sentimentScore >= 0 ? '+' : ''}{n.sentimentScore.toFixed(2)})
                        </span>
                        {n.relatedAssets.slice(0, 4).map(a => (
                          <span key={a} style={{ fontSize: 10, padding: '1px 5px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 3, color: '#888' }}>{a}</span>
                        ))}
                        <span style={{ fontSize: 10, color: '#444' }}>{new Date(n.publishedAt).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ SETTINGS ════════════════════ */}
        {tab === 'settings' && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Configuration du bot</h2>

            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 16 }}>Général</h4>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 6 }}>Mode de trading</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['paper', 'live'] as const).map(m => (
                    <button key={m} onClick={() => setMode(m)}
                      style={{
                        flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600, border: '1px solid',
                        borderRadius: 6, cursor: 'pointer', transition: 'all .15s',
                        background: mode === m ? (m === 'paper' ? '#1a2a3a' : '#2a1a1a') : '#0d0d0d',
                        color:      mode === m ? (m === 'paper' ? '#7ab3e0' : '#ef9a9a') : '#555',
                        borderColor: mode === m ? (m === 'paper' ? '#1e4a70' : '#5c1a1a') : '#222',
                      }}>
                      {m === 'paper' ? '📝 Paper Trading' : '⚡ Live Trading'}
                    </button>
                  ))}
                </div>
                {mode === 'live' && (
                  <p style={{ fontSize: 11, color: '#c62828', marginTop: 6 }}>
                    ⚠ Le mode live exécute de vrais ordres. Configurez vos clés API d'échange ci-dessous.
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Capital initial ($)', state: capital, set: setCapital },
                  { label: 'Intervalle (min)',    state: interval, set: setInterval_ },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>{f.label}</label>
                    <input value={f.state} onChange={e => f.set(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', background: '#0d0d0d', border: '1px solid #222', borderRadius: 6, color: '#e0e0e0', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 16 }}>Gestion du risque</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Stop Loss (%)',         state: stopLoss,   set: setStopLoss },
                  { label: 'Take Profit (%)',        state: takeProfit, set: setTakeProfit },
                  { label: 'Confiance min (%)',       state: minConf,    set: setMinConf },
                  { label: 'Positions simultanées',  state: maxPos,     set: setMaxPos },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>{f.label}</label>
                    <input value={f.state} onChange={e => f.set(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', background: '#0d0d0d', border: '1px solid #222', borderRadius: 6, color: '#e0e0e0', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 20, marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>Exchanges (mode live)</h4>
              <p style={{ fontSize: 12, color: '#555', marginBottom: 12 }}>
                Les clés sont stockées en mémoire uniquement et ne sont jamais envoyées à un serveur tiers.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                {[
                  { label: 'Binance API Key',    placeholder: 'Clé API Binance (optionnel)' },
                  { label: 'Alpaca API Key',      placeholder: 'Clé API Alpaca (optionnel)' },
                  { label: 'NewsAPI Key',          placeholder: 'Clé NewsAPI pour des news en temps réel (optionnel)' },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>{f.label}</label>
                    <input type="password" placeholder={f.placeholder}
                      style={{ width: '100%', padding: '8px 10px', background: '#0d0d0d', border: '1px solid #222', borderRadius: 6, color: '#e0e0e0', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleReset} disabled={loading}
                style={{ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 700, background: '#1a2a3a', color: '#7ab3e0', border: '1px solid #1e4a70', borderRadius: 8, cursor: 'pointer' }}>
                {loading ? 'Application…' : '✓ Appliquer & Réinitialiser le portfolio'}
              </button>
            </div>

            {s && (
              <div style={{ marginTop: 16, background: '#0d0d0d', borderRadius: 8, padding: 14, fontSize: 11, color: '#444' }}>
                <div>Dernier cycle: {s.lastCycleAt ? new Date(s.lastCycleAt).toLocaleString('fr-FR') : 'Aucun'}</div>
                <div>Prochain cycle: {s.nextCycleAt ? new Date(s.nextCycleAt).toLocaleString('fr-FR') : 'N/A'}</div>
                <div>Cycles exécutés: {s.cycleCount}</div>
                {s.errors.length > 0 && (
                  <div style={{ marginTop: 8, color: '#ef5350' }}>
                    Erreurs récentes:<br />
                    {s.errors.slice(0, 3).map((e, i) => <div key={i}>• {e}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state when no data yet */}
        {!s && tab === 'dashboard' && (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📈</div>
            <h2 style={{ fontSize: 20, color: '#fff', marginBottom: 8 }}>Trading Bot IA</h2>
            <p style={{ color: '#555', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              Analyse automatique des marchés crypto &amp; actions avec Claude AI.<br />
              Gestion du risque intégrée · Paper trading · Signaux en temps réel
            </p>
            <button onClick={triggerCycle}
              style={{ padding: '12px 32px', fontSize: 14, fontWeight: 700, background: '#f0c040', color: '#111', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
              Démarrer l'analyse →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

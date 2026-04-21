'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { BotState, AISignal, Position, Trade, NewsItem, MarketData } from '@/lib/trading/types'

// ─── Constants ────────────────────────────────────────────────────────────────
const POLL_MS = 30_000

const SIG: Record<string, { bg: string; text: string; border: string }> = {
  buy:  { bg: '#1b3a1b', text: '#81c784', border: '#2e7d32' },
  sell: { bg: '#3a1b1b', text: '#ef9a9a', border: '#c62828' },
  hold: { bg: '#1e1e1e', text: '#888',    border: '#333' },
}

const SENT_COLOR: Record<string, string> = {
  positive: '#81c784', negative: '#ef9a9a', neutral: '#888',
}

// ─── Shared style helpers ─────────────────────────────────────────────────────
const card = (extra?: object): React.CSSProperties => ({
  background: '#111', border: '1px solid #222', borderRadius: 10,
  padding: '14px 16px', ...extra,
})

const pnlColor = (v: number) => v >= 0 ? '#81c784' : '#ef9a9a'
const fmtUSD = (v: number) =>
  '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPct = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TradingPage() {
  const [state,    setState]    = useState<BotState | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [cycling,  setCycling]  = useState(false)
  const [tab,      setTab]      = useState<'dash' | 'positions' | 'trades' | 'news' | 'settings'>('dash')
  // Settings form
  const [mode,        setMode]       = useState<'paper' | 'live'>('paper')
  const [capital,     setCapital]    = useState('10000')
  const [intMin,      setIntMin]     = useState('5')
  const [sl,          setSl]         = useState('7')
  const [tp,          setTp]         = useState('20')
  const [minConf,     setMinConf]    = useState('65')
  const [maxPos,      setMaxPos]     = useState('8')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Polling ──────────────────────────────────────────────────────────────────
  const loadState = useCallback(async () => {
    try {
      const r = await fetch('/api/trading/state')
      if (r.ok) {
        const d: BotState = await r.json()
        setState(d)
        setMode(d.config.mode)
      }
    } catch {}
  }, [])

  useEffect(() => {
    loadState()
    pollRef.current = setInterval(loadState, POLL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [loadState])

  // ── Controls ─────────────────────────────────────────────────────────────────
  async function ctrl(action: string, extra?: object) {
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

  async function cycle() {
    setCycling(true)
    try {
      await fetch('/api/trading/cycle', { method: 'POST' })
      await loadState()
    } finally { setCycling(false) }
  }

  async function applySettings() {
    await ctrl('reset', {
      config: {
        mode, intervalMinutes: Number(intMin), initialCapital: Number(capital),
        risk: {
          stopLossPct: Number(sl), takeProfitPct: Number(tp),
          minConfidence: Number(minConf), maxConcurrentPositions: Number(maxPos),
          maxPositionSizePct: 10, maxDailyLossPct: 15,
        },
      },
    })
  }

  const s = state
  const running = s?.status === 'running' || s?.status === 'analyzing'
  const statusDot = s?.status === 'running' ? '#81c784' : s?.status === 'analyzing' ? '#ffb74d' : '#555'

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#e0e0e0',
      fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: 80 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50,
        background: '#111', borderBottom: '1px solid #1e1e1e',
        padding: '0 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 52 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Trading Bot</span>
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4,
            background: mode === 'paper' ? '#1a2a3a' : '#2a1a1a',
            color: mode === 'paper' ? '#7ab3e0' : '#ef9a9a',
            border: `1px solid ${mode === 'paper' ? '#1e4a70' : '#5c1a1a'}` }}>
            {mode === 'paper' ? 'PAPER' : 'LIVE'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {s && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                {fmtUSD(s.portfolio.totalValue)}
              </div>
              <div style={{ fontSize: 11, color: pnlColor(s.portfolio.totalPnl) }}>
                {fmtPct(s.portfolio.totalPnlPct)}
              </div>
            </div>
          )}
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot, flexShrink: 0 }} />
        </div>
      </div>

      {/* ── Bot action bar ──────────────────────────────────────────────────── */}
      <div style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a',
        padding: '10px 16px', display: 'flex', gap: 8 }}>
        {running ? (
          <button onClick={() => ctrl('stop')} disabled={loading}
            style={btnStyle('#3a1b1b', '#ef9a9a', '#c62828')}>■ Stop</button>
        ) : (
          <button onClick={() => ctrl('start')} disabled={loading}
            style={btnStyle('#1b3a1b', '#81c784', '#2e7d32')}>▶ Démarrer</button>
        )}
        <button onClick={cycle} disabled={cycling || loading}
          style={btnStyle('#1a2a3a', '#7ab3e0', '#1e4a70')}>
          {cycling ? '⟳ Analyse…' : '⟳ Cycle maintenant'}
        </button>
        {s && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#444', alignSelf: 'center' }}>
            Cycle #{s.cycleCount}
          </span>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 14px', maxWidth: 700, margin: '0 auto' }}>

        {/* DASHBOARD -------------------------------------------------------- */}
        {tab === 'dash' && s && (
          <div>
            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {[
                { l: 'Valeur totale',   v: fmtUSD(s.portfolio.totalValue),  c: '#fff' },
                { l: 'Liquidités',       v: fmtUSD(s.portfolio.cashBalance), c: '#7ab3e0' },
                { l: 'P&L total',        v: `${fmtUSD(s.portfolio.totalPnl)}\n${fmtPct(s.portfolio.totalPnlPct)}`, c: pnlColor(s.portfolio.totalPnl) },
                { l: 'Drawdown max',     v: `${s.performance.maxDrawdownPct.toFixed(1)}%`, c: s.performance.maxDrawdownPct > 10 ? '#ef9a9a' : '#888' },
              ].map(k => (
                <div key={k.l} style={card()}>
                  <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>{k.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: k.c, whiteSpace: 'pre-line', lineHeight: 1.3 }}>{k.v}</div>
                </div>
              ))}
            </div>

            {/* Market prices */}
            <SectionTitle>Marchés</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: 16 }}>
              {Object.values(s.marketData).map(m => {
                const sig = s.signals[m.symbol]
                const st  = sig ? SIG[sig.action] : SIG.hold
                return (
                  <div key={m.symbol} style={{ ...card(), borderColor: st.border }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{m.symbol}</span>
                      {sig && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
                          background: st.bg, color: st.text }}>
                          {sig.action.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                      ${m.price >= 1000
                        ? m.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
                        : m.price.toFixed(m.price < 1 ? 4 : 2)}
                    </div>
                    <div style={{ fontSize: 11, color: pnlColor(m.changePct24h) }}>
                      {m.changePct24h >= 0 ? '+' : ''}{m.changePct24h.toFixed(2)}%
                    </div>
                    {sig && sig.action !== 'hold' && (
                      <div style={{ fontSize: 9, color: '#555', marginTop: 4 }}>
                        Conf: {sig.confidence}% · {sig.riskLevel}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* AI Signals */}
            <SectionTitle>Signaux IA</SectionTitle>
            {Object.values(s.signals).length === 0 ? (
              <div style={{ ...card(), textAlign: 'center', color: '#444', fontSize: 13, marginBottom: 16 }}>
                Aucun signal — cliquez sur "Cycle maintenant"
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {Object.values(s.signals).map(sig => {
                  const st = SIG[sig.action]
                  return (
                    <div key={sig.symbol} style={{ ...card(), borderColor: st.border }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{sig.symbol}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: st.bg, color: st.text }}>{sig.action.toUpperCase()}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>{sig.confidence}%</span>
                      </div>
                      {/* Confidence bar */}
                      <div style={{ height: 3, background: '#1e1e1e', borderRadius: 2, marginBottom: 8 }}>
                        <div style={{ width: `${sig.confidence}%`, height: '100%', borderRadius: 2,
                          background: sig.confidence > 75 ? '#2e7d32' : sig.confidence > 50 ? '#f0c040' : '#c62828' }} />
                      </div>
                      <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5, marginBottom: 6 }}>{sig.reasoning}</div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                        <span style={{ color: '#ef9a9a' }}>SL: ${sig.stopLoss.toFixed(2)}</span>
                        <span style={{ color: '#81c784' }}>TP: ${sig.takeProfit.toFixed(2)}</span>
                        <span style={{ color: '#888', marginLeft: 'auto' }}>{sig.riskLevel} risk</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Perf stats */}
            <SectionTitle>Performance</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { l: 'Trades', v: s.performance.totalTrades },
                { l: 'Win rate', v: `${s.performance.winRate.toFixed(0)}%` },
                { l: 'Positions', v: s.portfolio.positions.length },
              ].map(k => (
                <div key={k.l} style={{ ...card({ padding: '10px 12px' }) }}>
                  <div style={{ fontSize: 10, color: '#555', marginBottom: 3 }}>{k.l}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{k.v}</div>
                </div>
              ))}
            </div>

            {/* Logs */}
            {s.logs.length > 0 && (
              <div style={{ ...card({ marginTop: 12, padding: 12 }) }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', marginBottom: 6 }}>Logs</div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#555', lineHeight: 1.8, maxHeight: 100, overflow: 'auto' }}>
                  {s.logs.slice(0, 6).map((l, i) => (
                    <div key={i} style={{ color: l.includes('BUY') || l.includes('SELL') ? '#f0c040' : '#555' }}>{l}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* POSITIONS ------------------------------------------------------- */}
        {tab === 'positions' && s && (
          <div>
            <SectionTitle>Positions ouvertes ({s.portfolio.positions.length})</SectionTitle>
            {s.portfolio.positions.length === 0 ? (
              <div style={{ ...card(), textAlign: 'center', color: '#444', fontSize: 13 }}>
                Aucune position ouverte
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.portfolio.positions.map(pos => (
                  <div key={pos.symbol} style={card()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{pos.symbol}</span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: pnlColor(pos.unrealizedPnl) }}>
                        {fmtUSD(pos.value)}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                      <Stat label="Quantité"    value={pos.quantity.toFixed(6)} />
                      <Stat label="Prix moyen"  value={`$${pos.avgEntryPrice.toFixed(2)}`} />
                      <Stat label="Prix actuel" value={`$${pos.currentPrice.toFixed(2)}`} />
                      <Stat label="P&L"
                        value={`${fmtUSD(pos.unrealizedPnl)} (${fmtPct(pos.unrealizedPnlPct)})`}
                        color={pnlColor(pos.unrealizedPnl)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRADES ---------------------------------------------------------- */}
        {tab === 'trades' && s && (
          <div>
            <SectionTitle>Historique ({s.trades.length} trades)</SectionTitle>
            {s.trades.length === 0 ? (
              <div style={{ ...card(), textAlign: 'center', color: '#444', fontSize: 13 }}>
                Aucun trade exécuté
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.trades.map(t => {
                  const st = SIG[t.action] ?? SIG.hold
                  return (
                    <div key={t.id} style={card()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: '#fff' }}>{t.symbol}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                          background: st.bg, color: st.text }}>{t.action.toUpperCase()}</span>
                        <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#fff', fontSize: 14 }}>
                          {fmtUSD(t.totalValue)}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 11, color: '#888' }}>
                        <span>{t.quantity.toFixed(4)} unités</span>
                        <span>@ ${t.price.toFixed(2)}</span>
                        <span style={{ color: t.mode === 'paper' ? '#7ab3e0' : '#ef9a9a' }}>{t.mode.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
                        {t.reason.slice(0, 80)}{t.reason.length > 80 ? '…' : ''}
                      </div>
                      <div style={{ fontSize: 10, color: '#333', marginTop: 4 }}>
                        {new Date(t.executedAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* NEWS ------------------------------------------------------------ */}
        {tab === 'news' && s && (
          <div>
            <SectionTitle>Actualités ({s.news.length})</SectionTitle>
            {s.news.length === 0 ? (
              <div style={{ ...card(), textAlign: 'center', color: '#444', fontSize: 13 }}>
                Lancez un cycle pour récupérer les news
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.news.map(n => (
                  <a key={n.id} href={n.url} target="_blank" rel="noopener noreferrer"
                    style={{ ...card({ padding: '12px 14px' }), textDecoration: 'none', display: 'block' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: SENT_COLOR[n.sentiment], marginTop: 4 }} />
                      <div>
                        <div style={{ fontSize: 13, color: '#ddd', lineHeight: 1.4, marginBottom: 5 }}>{n.title}</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: '#555' }}>{n.source}</span>
                          <span style={{ fontSize: 10, color: SENT_COLOR[n.sentiment], fontWeight: 600 }}>
                            {n.sentiment.toUpperCase()}
                          </span>
                          {n.relatedAssets.slice(0, 3).map(a => (
                            <span key={a} style={{ fontSize: 10, padding: '1px 5px',
                              background: '#1a1a1a', border: '1px solid #333', borderRadius: 3, color: '#777' }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS -------------------------------------------------------- */}
        {tab === 'settings' && (
          <div>
            <SectionTitle>Paramètres</SectionTitle>

            <div style={{ ...card({ marginBottom: 12 }) }}>
              <Label>Mode</Label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {(['paper', 'live'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)}
                    style={{ flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600,
                      border: '1px solid', borderRadius: 8, cursor: 'pointer',
                      background: mode === m ? (m === 'paper' ? '#1a2a3a' : '#2a1a1a') : '#0d0d0d',
                      color:      mode === m ? (m === 'paper' ? '#7ab3e0' : '#ef9a9a') : '#555',
                      borderColor: mode === m ? (m === 'paper' ? '#1e4a70' : '#5c1a1a') : '#222' }}>
                    {m === 'paper' ? '📝 Paper' : '⚡ Live'}
                  </button>
                ))}
              </div>
              {mode === 'live' && (
                <div style={{ fontSize: 11, color: '#ef9a9a', marginBottom: 14, padding: '8px 10px',
                  background: '#1a0a0a', borderRadius: 6, border: '1px solid #3a1b1b' }}>
                  ⚠ Le mode live exécute de vrais ordres avec votre argent.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Capital ($)"        value={capital}  set={setCapital} />
                <Field label="Intervalle (min)"   value={intMin}   set={setIntMin} />
              </div>
            </div>

            <div style={{ ...card({ marginBottom: 12 }) }}>
              <Label>Gestion du risque</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Stop Loss %"           value={sl}      set={setSl} />
                <Field label="Take Profit %"          value={tp}      set={setTp} />
                <Field label="Confiance min %"        value={minConf} set={setMinConf} />
                <Field label="Positions max"          value={maxPos}  set={setMaxPos} />
              </div>
            </div>

            <div style={{ ...card({ marginBottom: 16 }) }}>
              <Label>Exchanges (live seulement)</Label>
              <p style={{ fontSize: 11, color: '#555', marginBottom: 10 }}>
                Clés stockées uniquement en mémoire — jamais envoyées à un tiers.
              </p>
              {['Binance API Key', 'Binance Secret', 'Alpaca API Key', 'Alpaca Secret'].map(l => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 3 }}>{l}</div>
                  <input type="password" placeholder={`${l}…`}
                    style={{ width: '100%', padding: '9px 10px', background: '#0d0d0d',
                      border: '1px solid #222', borderRadius: 8, color: '#e0e0e0', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>

            <button onClick={applySettings} disabled={loading}
              style={{ width: '100%', padding: '13px 0', fontSize: 14, fontWeight: 700,
                background: loading ? '#1a1a1a' : '#f0c040', color: loading ? '#555' : '#111',
                border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Application…' : '✓ Appliquer & Réinitialiser'}
            </button>

            {s && (
              <div style={{ marginTop: 14, fontSize: 11, color: '#444', lineHeight: 1.8 }}>
                <div>Dernier cycle: {s.lastCycleAt ? new Date(s.lastCycleAt).toLocaleString('fr-FR') : '—'}</div>
                <div>Prochain: {s.nextCycleAt ? new Date(s.nextCycleAt).toLocaleString('fr-FR') : '—'}</div>
                <div>Bot: {s.status} · Cycles: {s.cycleCount}</div>
                {s.errors.slice(0, 2).map((e, i) => (
                  <div key={i} style={{ color: '#ef5350' }}>⚠ {e}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!s && tab === 'dash' && (
          <div style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📈</div>
            <h2 style={{ fontSize: 20, color: '#fff', marginBottom: 8, fontWeight: 700 }}>Trading Bot IA</h2>
            <p style={{ color: '#555', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
              Analyse Claude · Crypto & Actions<br />
              Stop-loss auto · Paper ou Live
            </p>
            <button onClick={cycle}
              style={{ padding: '13px 32px', fontSize: 14, fontWeight: 700,
                background: '#f0c040', color: '#111', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
              Lancer l'analyse →
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom nav (mobile-first) ───────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#111', borderTop: '1px solid #1e1e1e',
        display: 'flex', justifyContent: 'space-around', padding: '8px 0 env(safe-area-inset-bottom, 8px)',
      }}>
        {([
          { key: 'dash',      icon: '📊', label: 'Dashboard' },
          { key: 'positions', icon: '💼', label: 'Positions' },
          { key: 'trades',    icon: '📋', label: 'Trades' },
          { key: 'news',      icon: '📰', label: 'News' },
          { key: 'settings',  icon: '⚙️', label: 'Config' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
              color: tab === t.key ? '#f0c040' : '#555', minWidth: 48 }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 9, fontWeight: tab === t.key ? 700 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Micro-components ─────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase',
      letterSpacing: '.06em', marginBottom: 10 }}>{children}</div>
  )
}

function Stat({ label, value, color = '#aaa' }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color, fontWeight: 500 }}>{value}</div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase',
      letterSpacing: '.05em', marginBottom: 12 }}>{children}</div>
  )
}

function Field({ label, value, set }: { label: string; value: string; set: (v: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{label}</div>
      <input value={value} onChange={e => set(e.target.value)}
        style={{ width: '100%', padding: '9px 10px', background: '#0d0d0d',
          border: '1px solid #222', borderRadius: 8, color: '#e0e0e0',
          fontSize: 13, boxSizing: 'border-box' }} />
    </div>
  )
}

function btnStyle(bg: string, color: string, border: string): React.CSSProperties {
  return {
    flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 700,
    background: bg, color, border: `1px solid ${border}`,
    borderRadius: 8, cursor: 'pointer',
  }
}

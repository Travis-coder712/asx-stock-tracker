import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Dashboard from './Dashboard'
import './App.css'

interface TsrSummary {
  periodStart: string
  asOf: string | null
  aglTsr: number | null
  indexTsr: number | null
}

interface PricePoint {
  date: string
  agl: number | null
  asx100: number | null
}

interface Metadata {
  version: string
  builtAt: string
  latestPrice: string | null
  stockCount: number
}

interface PeerRanking {
  periodStart: string
  peerCount: number
  rankedCount: number
  aglRank: number | null
  aglTsr: number | null
  aglPercentile: number | null
  median: number | null
  top: { ticker: string; tsrPct: number } | null
  bottom: { ticker: string; tsrPct: number } | null
  rankings: Array<{ ticker: string; name: string; tsrPct: number; rank: number; percentile: number }>
}

interface PortfolioSnapshot {
  date: string
  totalValue: number
  cash: number
  numHoldings: number
  dailyReturn: number | null
}

interface Holding {
  ticker: string
  name: string
  shares: number
  buyPrice: number
  buyDate: string
  sellPrice: number | null
  sellDate: string | null
  isManual: boolean
  rationale: string
}

interface StrategyData {
  snapshots: PortfolioSnapshot[]
  holdings: Holding[]
}

const BASE = import.meta.env.BASE_URL

const STRATEGIES = [
  {
    id: 'padley_momentum',
    name: 'Padley Momentum',
    css: 'padley',
    description: 'Trend-following with capital preservation. Screen by earnings momentum + ROE, rank by 12-month price momentum. Go to cash when ASX 100 breaks below 200-day MA.',
    inspired: 'Marcus Padley / Marcus Today',
  },
  {
    id: 'damodaran_dcf',
    name: 'Damodaran Intrinsic Value',
    css: 'damodaran',
    description: 'DCF valuation with narrative-to-numbers approach. Score stocks by discount-to-intrinsic-value, supplemented by relative valuation (P/E, EV/EBITDA vs peers).',
    inspired: 'Aswath Damodaran / NYU Stern',
  },
  {
    id: 'quant_factors',
    name: 'Quantitative Factors',
    css: 'quant',
    description: 'Multi-factor model ranking stocks by value (low P/B), momentum (12-1 month returns), quality (high ROE, low debt), and low volatility. Equal-weight top-ranked.',
    inspired: 'Fama-French factor research',
  },
  {
    id: 'dividend_income',
    name: 'Dividend Income',
    css: 'dividend',
    description: 'High-yield dividend strategy with franking credit advantage. Rank by grossed-up yield, filter by payout ratio <80%, DPS growth >0 over 3 years.',
    inspired: 'Australian income investing',
  },
  {
    id: 'contrarian_value',
    name: 'Contrarian Deep Value',
    css: 'contrarian',
    description: 'Graham/Buffett-style value investing. Graham Number screen, P/B <1, current ratio >1.5, five years of positive earnings. Buy below intrinsic value.',
    inspired: 'Benjamin Graham / Warren Buffett',
  },
]

const PERIOD_LABELS: Record<string, string> = {
  '2023-07-01': 'FY24 (1 Jul 2023)',
  '2024-07-01': 'FY25 (1 Jul 2024)',
  '2025-07-01': 'FY26 (1 Jul 2025)',
  '2026-07-01': 'FY27 (1 Jul 2026)',
}

function formatTsr(val: number | null): string {
  if (val === null) return '—'
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`
}

function tsrColor(val: number | null, type: 'agl' | 'index'): string {
  if (val === null) return 'var(--text-mute)'
  if (type === 'index') return 'var(--text-dim)'
  return val >= 0 ? 'var(--green)' : 'var(--red)'
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

function formatChartDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length || !label) return null
  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ color: 'var(--text-mute)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: ${Number(p.value).toFixed(2)}
        </div>
      ))}
    </div>
  )
}

function App() {
  const [tsrSummary, setTsrSummary] = useState<TsrSummary[]>([])
  const [priceData, setPriceData] = useState<PricePoint[]>([])
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [strategyData, setStrategyData] = useState<Record<string, StrategyData>>({})
  const [peerRankings, setPeerRankings] = useState<Record<string, PeerRanking>>({})
  const [selectedPeriod, setSelectedPeriod] = useState('2023-07-01')

  useEffect(() => {
    fetch(`${BASE}data/tsr/tsr-summary.json`)
      .then(r => r.ok ? r.json() : [])
      .then(setTsrSummary)
      .catch(() => {})
    fetch(`${BASE}data/charts/agl-vs-index.json`)
      .then(r => r.ok ? r.json() : [])
      .then(setPriceData)
      .catch(() => {})
    fetch(`${BASE}data/metadata.json`)
      .then(r => r.ok ? r.json() : null)
      .then(setMetadata)
      .catch(() => {})

    const peerPeriods = ['2023-07-01', '2024-07-01', '2025-07-01']
    peerPeriods.forEach(p => {
      fetch(`${BASE}data/tsr/peer-ranking-${p}.json`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setPeerRankings(prev => ({ ...prev, [p]: data }))
        })
        .catch(() => {})
    })

    STRATEGIES.forEach(s => {
      Promise.all([
        fetch(`${BASE}data/portfolios/${s.id}.json`).then(r => r.ok ? r.json() : []),
        fetch(`${BASE}data/portfolios/${s.id}-holdings.json`).then(r => r.ok ? r.json() : []),
      ]).then(([snapshots, holdings]) => {
        setStrategyData(prev => ({ ...prev, [s.id]: { snapshots, holdings } }))
      }).catch(() => {})
    })
  }, [])

  const chartData = priceData.filter((_, i) => i % 5 === 0 || i === priceData.length - 1)

  return (
    <div className="app">
      <header className="header">
        <h1>ASX Stock Tracker</h1>
        <p className="subtitle">
          Five investment philosophies, each with a hypothetical $5,000 stake on ASX stocks.
          Auto-picked by strategy rules with manual override. Tracked over 6 months.
        </p>
        <p className="version">
          v{metadata?.version ?? '0.1.0'}
          {metadata?.latestPrice && ` · data to ${metadata.latestPrice}`}
        </p>
      </header>

      <div className="stats">
        <div className="stat">
          <div className="label">Strategies</div>
          <div className="value accent">5</div>
        </div>
        <div className="stat">
          <div className="label">Stake per strategy</div>
          <div className="value green">$5,000</div>
        </div>
        <div className="stat">
          <div className="label">Total invested</div>
          <div className="value gold">$25,000</div>
        </div>
        <div className="stat">
          <div className="label">Stocks tracked</div>
          <div className="value" style={{ fontSize: 16 }}>{metadata?.stockCount ?? '—'}</div>
        </div>
      </div>

      {/* AGL TSR Section */}
      <div className="section-header">
        <h2>AGL Total Shareholder Return</h2>
        <div className="line" />
      </div>

      <div className="tsr-card">
        <h3>AGL Energy (ASX:AGL) vs S&P/ASX 100</h3>
        <p className="tsr-subtitle">
          Total shareholder return (price + reinvested dividends) over rolling periods from 1 July.
          Benchmark: S&P/ASX 100 Index (price return; AGL gap is wider on total return basis).
          {tsrSummary.find(s => s.asOf) && (
            <> Data as of {tsrSummary.find(s => s.asOf)?.asOf}.</>
          )}
        </p>
        <div className="tsr-periods">
          {Object.keys(PERIOD_LABELS).map(period => {
            const data = tsrSummary.find(s => s.periodStart === period)
            return (
              <div key={period} className="tsr-period">
                <div className="period-label">{PERIOD_LABELS[period]}</div>
                <div className="tsr-values">
                  <div className="tsr-item">
                    <div className="name">AGL</div>
                    <div className="val" style={{ color: tsrColor(data?.aglTsr ?? null, 'agl') }}>
                      {formatTsr(data?.aglTsr ?? null)}
                    </div>
                  </div>
                  <div className="tsr-item">
                    <div className="name">ASX 100</div>
                    <div className="val" style={{ color: tsrColor(data?.indexTsr ?? null, 'index') }}>
                      {formatTsr(data?.indexTsr ?? null)}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Peer ranking */}
      {Object.keys(peerRankings).length > 0 && (() => {
        const peerRanking = peerRankings[selectedPeriod]
        const periodLabel = PERIOD_LABELS[selectedPeriod]?.replace(/\(.*/, '').trim() ?? selectedPeriod
        return (
          <div className="tsr-card" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <h3>AGL Peer Ranking — ASX 100 Constituents</h3>
              <div className="period-tabs">
                {Object.keys(peerRankings).map(p => (
                  <button
                    key={p}
                    className={`period-tab ${p === selectedPeriod ? 'active' : ''}`}
                    onClick={() => setSelectedPeriod(p)}
                  >
                    {PERIOD_LABELS[p]?.replace(/\(.*/, '').trim() ?? p}
                  </button>
                ))}
              </div>
            </div>
            {peerRanking && peerRanking.aglRank && (
              <>
                <p className="tsr-subtitle">
                  {periodLabel}: AGL ranked <strong style={{ color: 'var(--accent)' }}>
                  {peerRanking.aglRank}{ordinal(peerRanking.aglRank)}</strong> of {peerRanking.rankedCount} peers
                  ({peerRanking.peerCount - peerRanking.rankedCount} excluded — delisted/acquired).
                  Percentile: <strong style={{ color: (peerRanking.aglPercentile ?? 0) >= 50 ? 'var(--green)' : 'var(--red)' }}>
                  {peerRanking.aglPercentile?.toFixed(0)}th</strong>.
                  Median peer TSR: {formatTsr(peerRanking.median)}.
                </p>
                <div className="peer-table-wrap">
                  <table className="peer-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Ticker</th>
                        <th>Company</th>
                        <th style={{ textAlign: 'right' }}>TSR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {peerRanking.rankings.map(r => (
                        <tr key={r.ticker} className={r.ticker === 'AGL.AX' ? 'agl-row' : ''}>
                          <td>{r.rank}</td>
                          <td className="ticker-cell">{r.ticker.replace('.AX', '')}</td>
                          <td className="name-cell">{r.name}</td>
                          <td style={{
                            textAlign: 'right',
                            color: r.tsrPct >= 0 ? 'var(--green)' : 'var(--red)',
                            fontWeight: r.ticker === 'AGL.AX' ? 700 : 400,
                          }}>
                            {formatTsr(r.tsrPct)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )
      })()}

      {/* Price chart */}
      {chartData.length > 0 && (
        <div className="tsr-card" style={{ marginTop: 16 }}>
          <h3>AGL vs ASX 100 — Price History</h3>
          <p className="tsr-subtitle">Daily closing prices since July 2023. AGL (blue) vs S&P/ASX 100 Index (grey).</p>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
                  tick={{ fill: 'var(--text-mute)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                  interval={Math.floor(chartData.length / 6)}
                />
                <YAxis
                  yAxisId="agl"
                  orientation="left"
                  tick={{ fill: 'var(--accent)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${v}`}
                  domain={['auto', 'auto']}
                />
                <YAxis
                  yAxisId="idx"
                  orientation="right"
                  tick={{ fill: 'var(--text-mute)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${v}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: 'var(--text-dim)' }}
                />
                <Line
                  yAxisId="agl"
                  type="monotone"
                  dataKey="agl"
                  name="AGL"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="idx"
                  type="monotone"
                  dataKey="asx100"
                  name="ASX 100"
                  stroke="var(--text-mute)"
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="4 2"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Strategy Portfolios */}
      <div className="section-header">
        <h2>Strategy Portfolios</h2>
        <div className="line" />
      </div>

      <div className="strategy-grid">
        {STRATEGIES.map(s => {
          const data = strategyData[s.id]
          const hasData = data && data.snapshots.length > 0
          const latest = hasData ? data.snapshots[data.snapshots.length - 1] : null
          const returnPct = latest ? ((latest.totalValue - 5000) / 5000) * 100 : null

          return (
            <div key={s.id} className={`strategy-card ${s.css}`}>
              <div className="card-header">
                <h3>{s.name}</h3>
                {hasData ? (
                  <span className="badge">{data.holdings.length} holdings</span>
                ) : (
                  <span className="coming-soon">Coming Soon</span>
                )}
              </div>
              <p className="description">{s.description}</p>
              <p className="description" style={{ fontStyle: 'italic', fontSize: 12 }}>
                Inspired by: {s.inspired}
              </p>
              {hasData && data.holdings.length > 0 && (
                <div className="holdings-list">
                  {data.holdings.map(h => (
                    <span key={h.ticker} className="holding-chip">{h.ticker.replace('.AX', '')}</span>
                  ))}
                </div>
              )}
              <div className="portfolio-value">
                <span className="amount" style={{ color: hasData ? 'var(--text)' : 'var(--text-mute)' }}>
                  {latest ? `$${latest.totalValue.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '$5,000'}
                </span>
                <span className={`return ${returnPct !== null ? (returnPct >= 0 ? 'positive' : 'negative') : ''}`}>
                  {returnPct !== null ? `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <Dashboard />

      <footer className="footer">
        ASX Stock Tracker · built with Claude Code · data via yfinance
      </footer>
    </div>
  )
}

export default App

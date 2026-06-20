import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const BASE = import.meta.env.BASE_URL

interface TsrSummary {
  periodStart: string
  asOf: string | null
  aglTsr: number | null
  indexTsr: number | null
}

interface PricePoint { date: string; agl: number | null; asx100: number | null }

interface PeerRanking {
  periodStart: string
  peerCount: number
  rankedCount: number
  aglRank: number | null
  aglTsr: number | null
  aglPercentile: number | null
  median: number | null
  rankings: Array<{ ticker: string; name: string; tsrPct: number; rank: number; percentile: number }>
}

const PERIOD_LABELS: Record<string, string> = {
  '2023-07-01': 'From Jul 2023',
  '2024-07-01': 'From Jul 2024',
  '2025-07-01': 'From Jul 2025',
  '2026-07-01': 'From Jul 2026',
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
  return new Date(date).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length || !label) return null
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ color: 'var(--text-mute)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: ${Number(p.value).toFixed(2)}</div>
      ))}
    </div>
  )
}

export default function AglAnalysis() {
  const [tsrSummary, setTsrSummary] = useState<TsrSummary[]>([])
  const [priceData, setPriceData] = useState<PricePoint[]>([])
  const [peerRankings, setPeerRankings] = useState<Record<string, PeerRanking>>({})
  const [selectedPeriod, setSelectedPeriod] = useState('2023-07-01')

  useEffect(() => {
    fetch(`${BASE}data/tsr/tsr-summary.json`).then(r => r.ok ? r.json() : []).then(setTsrSummary).catch(() => {})
    fetch(`${BASE}data/charts/agl-vs-index.json`).then(r => r.ok ? r.json() : []).then(setPriceData).catch(() => {})
    const peerPeriods = ['2023-07-01', '2024-07-01', '2025-07-01']
    peerPeriods.forEach(p => {
      fetch(`${BASE}data/tsr/peer-ranking-${p}.json`)
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data) setPeerRankings(prev => ({ ...prev, [p]: data })) })
        .catch(() => {})
    })
  }, [])

  const chartData = priceData.filter((_, i) => i % 5 === 0 || i === priceData.length - 1)
  const peerRanking = peerRankings[selectedPeriod]

  return (
    <>
      <div className="tsr-card">
        <h3>AGL Energy (ASX:AGL) — Performance vs ASX 100 Peers</h3>
        <p className="tsr-subtitle">
          How has AGL performed relative to the S&P/ASX 100? Total shareholder return
          (price appreciation + reinvested dividends) measured from 1 July each year.
          {tsrSummary.find(s => s.asOf) && <> Data as of {tsrSummary.find(s => s.asOf)?.asOf}.</>}
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
                    <div className="val" style={{ color: tsrColor(data?.aglTsr ?? null, 'agl') }}>{formatTsr(data?.aglTsr ?? null)}</div>
                  </div>
                  <div className="tsr-item">
                    <div className="name">ASX 100</div>
                    <div className="val" style={{ color: tsrColor(data?.indexTsr ?? null, 'index') }}>{formatTsr(data?.indexTsr ?? null)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Peer ranking */}
      {Object.keys(peerRankings).length > 0 && (
        <div className="tsr-card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <h3>AGL vs ASX 100 — Peer Ranking</h3>
            <div className="period-tabs">
              {Object.keys(peerRankings).map(p => (
                <button key={p} className={`period-tab ${p === selectedPeriod ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod(p)}>
                  {PERIOD_LABELS[p] ?? p}
                </button>
              ))}
            </div>
          </div>
          {peerRanking && peerRanking.aglRank && (
            <>
              <p className="tsr-subtitle">
                AGL ranked <strong style={{ color: 'var(--accent)' }}>
                {peerRanking.aglRank}{ordinal(peerRanking.aglRank)}</strong> of {peerRanking.rankedCount} ASX 100 companies
                ({peerRanking.peerCount - peerRanking.rankedCount} excluded — delisted/acquired).
                Percentile: <strong style={{ color: (peerRanking.aglPercentile ?? 0) >= 50 ? 'var(--green)' : 'var(--red)' }}>
                {peerRanking.aglPercentile?.toFixed(0)}th</strong>.
                Median: {formatTsr(peerRanking.median)}.
              </p>
              <div className="peer-table-wrap">
                <table className="peer-table">
                  <thead><tr><th>#</th><th>Ticker</th><th>Company</th><th style={{ textAlign: 'right' }}>TSR</th></tr></thead>
                  <tbody>
                    {peerRanking.rankings.map(r => (
                      <tr key={r.ticker} className={r.ticker === 'AGL.AX' ? 'agl-row' : ''}>
                        <td>{r.rank}</td>
                        <td className="ticker-cell">{r.ticker.replace('.AX', '')}</td>
                        <td className="name-cell">{r.name}</td>
                        <td style={{ textAlign: 'right', color: r.tsrPct >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: r.ticker === 'AGL.AX' ? 700 : 400 }}>
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
      )}

      {/* Price chart */}
      {chartData.length > 0 && (
        <div className="tsr-card" style={{ marginTop: 16 }}>
          <h3>AGL vs ASX 100 — Price History</h3>
          <p className="tsr-subtitle">Daily closing prices since July 2023. AGL (blue) vs S&P/ASX 100 Index (grey).</p>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tickFormatter={formatChartDate}
                  tick={{ fill: 'var(--text-mute)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }} tickLine={false}
                  interval={Math.floor(chartData.length / 6)} />
                <YAxis yAxisId="agl" orientation="left"
                  tick={{ fill: 'var(--accent)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v}`} domain={['auto', 'auto']} />
                <YAxis yAxisId="idx" orientation="right"
                  tick={{ fill: 'var(--text-mute)', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${v}`} domain={['auto', 'auto']} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-dim)' }} />
                <Line yAxisId="agl" type="monotone" dataKey="agl" name="AGL" stroke="var(--accent)" strokeWidth={2} dot={false} />
                <Line yAxisId="idx" type="monotone" dataKey="asx100" name="ASX 100" stroke="var(--text-mute)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  )
}

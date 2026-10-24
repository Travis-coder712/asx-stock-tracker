import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'

const BASE = import.meta.env.BASE_URL

interface LeaderboardEntry {
  id: string
  totalReturn: number
  finalValue: number
  periods: number
}

interface PeriodHolding {
  ticker: string
  name: string
  shares: number
  buyPrice: number
}

interface PeriodData {
  period: { id: string; label: string; buy: string; end: string }
  budget: number
  holdings: PeriodHolding[]
  snapshots: Array<{ date: string; totalValue: number }>
  endValue: number
  returnPct: number
  cumulativeReturn: number
}

interface StrategyPeriods {
  strategyId: string
  periods: PeriodData[]
  finalValue: number
  totalReturn: number
}

interface ComparisonPoint {
  date: string
  [key: string]: string | number | null
}

const STRATEGY_NAMES: Record<string, string> = {
  padley_momentum: 'Padley Momentum',
  quant_factors: 'Quant Factors',
  dividend_income: 'Dividend Income',
  damodaran_dcf: 'Damodaran Value',
  contrarian_value: 'Contrarian Value',
}

interface HoldPeriodEntry {
  months: number
  endDate: string | null
  value: number | null
  returnPct: number | null
}

interface HoldPeriodStrategy {
  holdings: string[]
  buyValue: number
  holdPeriods: HoldPeriodEntry[]
}

interface HoldPeriodData {
  periodId: string
  label: string
  buyDate: string
  strategies: Record<string, HoldPeriodStrategy>
}

const STRATEGY_COLORS: Record<string, string> = {
  padley_momentum: '#ff6b6b',
  quant_factors: '#4ecdc4',
  dividend_income: '#ffd43b',
  damodaran_dcf: '#6b8cff',
  contrarian_value: '#cc5de8',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })
}

function formatDateFull(d: string) {
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DashboardTooltip({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string
}) {
  if (!active || !payload?.length || !label) return null
  const sorted = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0))
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-mute)', marginBottom: 6 }}>{label}</div>
      {sorted.map(p => (
        <div key={p.name} style={{ color: p.color, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>${Number(p.value).toLocaleString('en-AU', { maximumFractionDigits: 0 })}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [comparison, setComparison] = useState<ComparisonPoint[]>([])
  const [fullComparison, setFullComparison] = useState<ComparisonPoint[]>([])
  const [range, setRange] = useState<{ start: number; end: number } | null>(null)
  const [strategyDetail, setStrategyDetail] = useState<Record<string, StrategyPeriods>>({})
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)
  const [holdPeriods, setHoldPeriods] = useState<Record<string, HoldPeriodData>>({})

  useEffect(() => {
    fetch(`${BASE}data/periods/leaderboard.json`)
      .then(r => r.ok ? r.json() : [])
      .then(setLeaderboard)
      .catch(() => {})

    fetch(`${BASE}data/periods/comparison.json`)
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, Array<{ date: string; value: number }>>) => {
        const dateMap: Record<string, ComparisonPoint> = {}
        for (const [sid, series] of Object.entries(data)) {
          for (const pt of series) {
            if (!dateMap[pt.date]) dateMap[pt.date] = { date: pt.date }
            dateMap[pt.date][sid] = pt.value
          }
        }
        const sorted = Object.values(dateMap).sort((a, b) => (a.date as string).localeCompare(b.date as string))
        setFullComparison(sorted)
        setRange({ start: 0, end: sorted.length - 1 })
        // Sample every 3rd point for performance
        setComparison(sorted.filter((_, i) => i % 3 === 0 || i === sorted.length - 1))
      })
      .catch(() => {})

    fetch(`${BASE}data/periods/hold-periods.json`)
      .then(r => r.ok ? r.json() : {})
      .then(setHoldPeriods)
      .catch(() => {})

    Object.keys(STRATEGY_NAMES).forEach(sid => {
      fetch(`${BASE}data/periods/${sid}.json`)
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) setStrategyDetail(prev => ({ ...prev, [sid]: data }))
        })
        .catch(() => {})
    })
  }, [])

  const detail = selectedStrategy ? strategyDetail[selectedStrategy] : null

  // --- Time Explorer: windowed returns + pick rotations over a chosen window ---
  const nearestValue = (idx: number, sid: string, dir: 1 | -1): number | null => {
    for (let i = idx; i >= 0 && i < fullComparison.length; i += dir) {
      const v = fullComparison[i]?.[sid]
      if (typeof v === 'number') return v
    }
    return null
  }
  const startDate = range ? (fullComparison[range.start]?.date as string) : null
  const endDate = range ? (fullComparison[range.end]?.date as string) : null
  const windowedReturns = range
    ? Object.keys(STRATEGY_NAMES).map(sid => {
        const sv = nearestValue(range.start, sid, 1)
        const ev = nearestValue(range.end, sid, -1)
        return { sid, ret: sv && ev ? (ev / sv - 1) * 100 : null }
      }).sort((a, b) => (b.ret ?? -9999) - (a.ret ?? -9999))
    : []
  const maxAbsRet = Math.max(1, ...windowedReturns.map(w => Math.abs(w.ret ?? 0)))
  const pickTimeline = (() => {
    if (!selectedStrategy || !strategyDetail[selectedStrategy] || !startDate || !endDate) return []
    const periods = strategyDetail[selectedStrategy].periods.filter(p => p.holdings.length > 0)
    return periods
      .map((p, idx) => {
        const cur = p.holdings.map(h => h.ticker.replace('.AX', ''))
        const prev = idx > 0 ? periods[idx - 1].holdings.map(h => h.ticker.replace('.AX', '')) : []
        return {
          id: p.period.id, label: p.period.label, ret: p.returnPct, buy: p.period.buy, end: p.period.end,
          holdings: cur,
          added: cur.filter(t => !prev.includes(t)),
          removed: prev.filter(t => !cur.includes(t)),
        }
      })
      .filter(p => p.buy <= endDate && p.end >= startDate)
  })()

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Strategy Comparison Dashboard</h2>
        <div className="line" />
      </div>

      {/* Leaderboard */}
      <div className="leaderboard">
        <h3 style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Cumulative Performance — $5,000 initial, reinvested every 6 months
        </h3>
        {leaderboard.map((lb, i) => {
          const isPositive = lb.totalReturn >= 0
          return (
            <div
              key={lb.id}
              className={`lb-row ${selectedStrategy === lb.id ? 'selected' : ''}`}
              onClick={() => setSelectedStrategy(selectedStrategy === lb.id ? null : lb.id)}
              style={{ borderLeftColor: STRATEGY_COLORS[lb.id] }}
            >
              <div className="lb-rank">{i + 1}</div>
              <div className="lb-name">{STRATEGY_NAMES[lb.id]}</div>
              <div className="lb-value">${lb.finalValue.toLocaleString('en-AU', { maximumFractionDigits: 0 })}</div>
              <div className={`lb-return ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '+' : ''}{lb.totalReturn.toFixed(1)}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison chart */}
      {comparison.length > 0 && (
        <div className="tsr-card" style={{ marginTop: 16 }}>
          <h3>Portfolio Value Over Time</h3>
          <p className="tsr-subtitle">
            $5,000 initial investment, stocks re-screened and reinvested every 6 months. Vertical lines mark rebalance dates.
          </p>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <LineChart data={comparison}>
                <XAxis dataKey="date" tickFormatter={formatDate}
                  tick={{ fill: 'var(--text-mute)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }} tickLine={false}
                  interval={Math.floor(comparison.length / 6)} />
                <YAxis tick={{ fill: 'var(--text-mute)', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v/1000).toFixed(1)}k`}
                  domain={['auto', 'auto']} />
                <Tooltip content={<DashboardTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine x="2024-07-01" stroke="var(--border)" strokeDasharray="3 3" />
                <ReferenceLine x="2025-01-02" stroke="var(--border)" strokeDasharray="3 3" />
                <ReferenceLine x="2025-07-01" stroke="var(--border)" strokeDasharray="3 3" />
                <ReferenceLine x="2026-01-02" stroke="var(--border)" strokeDasharray="3 3" />
                <ReferenceLine y={5000} stroke="var(--text-mute)" strokeDasharray="6 3" strokeOpacity={0.3} />
                {Object.entries(STRATEGY_NAMES).map(([sid, name]) => (
                  <Line key={sid} type="monotone" dataKey={sid} name={name}
                    stroke={STRATEGY_COLORS[sid]} strokeWidth={selectedStrategy === sid ? 3 : 1.5}
                    strokeOpacity={selectedStrategy && selectedStrategy !== sid ? 0.25 : 1}
                    dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Time Explorer */}
      {range && fullComparison.length > 2 && (
        <div className="tsr-card" style={{ marginTop: 16 }}>
          <h3>Time Explorer</h3>
          <p className="tsr-subtitle">
            Drag the handles to any window. See each strategy's return over just that period — and,
            for a selected strategy, how its picks rotated.
          </p>
          <div className="te-window">{startDate ? formatDateFull(startDate) : ''} → {endDate ? formatDateFull(endDate) : ''}</div>
          <div className="te-sliders">
            <label>
              <span>From</span>
              <input type="range" min={0} max={fullComparison.length - 1} value={range.start}
                onChange={e => setRange(r => r && { ...r, start: Math.min(+e.target.value, r.end - 1) })} />
            </label>
            <label>
              <span>To</span>
              <input type="range" min={0} max={fullComparison.length - 1} value={range.end}
                onChange={e => setRange(r => r && { ...r, end: Math.max(+e.target.value, r.start + 1) })} />
            </label>
          </div>

          <div className="te-bars">
            {windowedReturns.map(({ sid, ret }) => (
              <div key={sid} className="te-bar-row">
                <span className="te-bar-name" style={{ color: STRATEGY_COLORS[sid] }}>{STRATEGY_NAMES[sid]}</span>
                <div className="te-bar-track">
                  <div className="te-bar-fill" style={{
                    width: `${(Math.abs(ret ?? 0) / maxAbsRet) * 100}%`,
                    background: STRATEGY_COLORS[sid],
                    opacity: ret == null ? 0.2 : 1,
                  }} />
                </div>
                <span className="te-bar-val" style={{ color: (ret ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {ret == null ? '—' : `${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%`}
                </span>
              </div>
            ))}
          </div>

          <div className="te-picks">
            {selectedStrategy ? (
              pickTimeline.length ? (
                <>
                  <h4 className="te-picks-title" style={{ color: STRATEGY_COLORS[selectedStrategy] }}>
                    {STRATEGY_NAMES[selectedStrategy]} — picks &amp; rotations in this window
                  </h4>
                  {pickTimeline.map(p => (
                    <div key={p.id} className="te-reb">
                      <div className="te-reb-head">
                        <span>{p.label}</span>
                        <span className={p.ret >= 0 ? 'positive' : 'negative'}>{p.ret >= 0 ? '+' : ''}{p.ret}%</span>
                      </div>
                      <div className="te-chips">
                        {p.holdings.map(t => (
                          <span key={t} className={`holding-chip ${p.added.includes(t) ? 'chip-added' : ''}`}>{t}</span>
                        ))}
                        {p.removed.map(t => (
                          <span key={'r' + t} className="holding-chip chip-removed">− {t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="te-legend">
                    <span className="chip-added-key" /> added this rebalance &nbsp;
                    <span className="chip-removed-key" /> dropped since last
                  </p>
                </>
              ) : <p className="te-hint">No 6-monthly rebalances fall inside this window.</p>
            ) : (
              <p className="te-hint">Click a strategy in the leaderboard above to see how its picks rotated over this window.</p>
            )}
          </div>
        </div>
      )}

      {/* Period detail for selected strategy */}
      {detail && (
        <div className="tsr-card" style={{ marginTop: 16 }}>
          <h3 style={{ color: STRATEGY_COLORS[selectedStrategy!] }}>
            {STRATEGY_NAMES[selectedStrategy!]} — Period Breakdown
          </h3>
          <div className="period-detail-grid">
            {detail.periods.filter(p => p.holdings.length > 0).map(p => (
              <div key={p.period.id} className="period-detail-card">
                <div className="pd-header">
                  <span className="pd-label">{p.period.label}</span>
                  <span className={`pd-return ${p.returnPct >= 0 ? 'positive' : 'negative'}`}>
                    {p.returnPct >= 0 ? '+' : ''}{p.returnPct}%
                  </span>
                </div>
                <div className="pd-values">
                  <span>${p.budget.toLocaleString('en-AU', { maximumFractionDigits: 0 })} → ${p.endValue.toLocaleString('en-AU', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="pd-holdings">
                  {p.holdings.map(h => (
                    <span key={h.ticker} className="holding-chip">{h.ticker.replace('.AX', '')}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hold period analysis */}
      {Object.keys(holdPeriods).length > 0 && (
        <div className="tsr-card" style={{ marginTop: 16 }}>
          <h3>What If You Held Longer?</h3>
          <p className="tsr-subtitle">
            Each period's stock picks tracked for 6, 12, 18 and 24 months — shows whether
            rebalancing every 6 months adds or destroys value vs buy-and-hold.
          </p>
          {Object.values(holdPeriods).map(hp => {
            const hasData = Object.values(hp.strategies).some(
              s => s.holdPeriods.some(h => h.returnPct !== null)
            )
            if (!hasData) return null
            return (
              <div key={hp.periodId} style={{ marginTop: 20 }}>
                <h4 style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 8 }}>
                  {hp.label} picks (bought {hp.buyDate})
                </h4>
                <div className="hold-table-wrap">
                  <table className="hold-table">
                    <thead>
                      <tr>
                        <th>Strategy</th>
                        <th>6m</th>
                        <th>12m</th>
                        <th>18m</th>
                        <th>24m</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(hp.strategies).map(([sid, sdata]) => (
                        <tr key={sid}>
                          <td style={{ color: STRATEGY_COLORS[sid], fontWeight: 500 }}>
                            {STRATEGY_NAMES[sid]}
                          </td>
                          {sdata.holdPeriods.map(h => (
                            <td key={h.months} style={{
                              textAlign: 'right',
                              color: h.returnPct === null ? 'var(--text-mute)'
                                : h.returnPct >= 0 ? 'var(--green)' : 'var(--red)',
                              fontWeight: 600,
                              fontSize: 13,
                            }}>
                              {h.returnPct !== null ? `${h.returnPct >= 0 ? '+' : ''}${h.returnPct}%` : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

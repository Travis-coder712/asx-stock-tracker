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
  const [strategyDetail, setStrategyDetail] = useState<Record<string, StrategyPeriods>>({})
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)

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
        // Sample every 3rd point for performance
        setComparison(sorted.filter((_, i) => i % 3 === 0 || i === sorted.length - 1))
      })
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
    </div>
  )
}

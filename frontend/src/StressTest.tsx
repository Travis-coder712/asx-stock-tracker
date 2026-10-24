import { useEffect, useState } from 'react'

const BASE = import.meta.env.BASE_URL

interface StrategyStress {
  id: string
  name: string
  beta: number | null
  maxDrawdown: number
  currentValue: number
  holdings: number
  exposure: { rates: number; commodity: number; cyclical: number; defensive: number; other: number }
}

interface StressData {
  asOf: string
  index: { name: string; maxDrawdown: number; current: number; ma200: number; pctVsMa200: number; riskOff: boolean }
  strategies: StrategyStress[]
}

const BUCKETS: Array<{ key: keyof StrategyStress['exposure']; label: string; color: string }> = [
  { key: 'cyclical', label: 'Cyclical / high-beta', color: '#ff6b6b' },
  { key: 'rates', label: 'Rate-sensitive (banks/REITs)', color: '#ffd43b' },
  { key: 'commodity', label: 'Commodity (miners/energy)', color: '#ff922b' },
  { key: 'defensive', label: 'Defensive', color: '#51cf66' },
]

const SHOCKS = [-10, -20, -30, -40]

function money(n: number) {
  return `$${Math.round(n).toLocaleString('en-AU')}`
}

export default function StressTest() {
  const [data, setData] = useState<StressData | null>(null)
  const [shock, setShock] = useState(-20)

  useEffect(() => {
    fetch(`${BASE}data/risk/stress-test.json`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  const maxImplied = Math.max(
    ...data.strategies.map(s => Math.abs((s.beta ?? 0) * shock)),
    Math.abs(shock),
    1,
  )

  return (
    <div className="stress-section">
      <h3 className="risk-h3">Correction stress test</h3>
      <p className="risk-sub">
        Drag a hypothetical ASX 100 fall and see the first-order hit to each strategy
        (beta&nbsp;×&nbsp;shock), next to the worst it has actually fallen so far. Higher-beta,
        concentrated strategies lose the most — and historically fell further than beta alone implies.
      </p>

      {/* Risk-off signal */}
      <div
        className="stress-signal"
        style={{
          borderColor: data.index.riskOff ? 'var(--red)' : 'var(--green)',
          color: data.index.riskOff ? 'var(--red)' : 'var(--green)',
        }}
      >
        {data.index.riskOff
          ? `RISK-OFF — ASX 100 is ${Math.abs(data.index.pctVsMa200)}% below its 200-day MA. Padley's rule would move to cash at the next rebalance.`
          : `Risk-on — ASX 100 is +${data.index.pctVsMa200}% above its 200-day MA (as at ${data.asOf}). Padley's circuit breaker has not tripped.`}
      </div>

      {/* Shock control */}
      <div className="stress-controls">
        <div className="stress-presets">
          {SHOCKS.map(s => (
            <button key={s} className={`te-preset ${shock === s ? 'active' : ''}`} onClick={() => setShock(s)}>
              {s}%
            </button>
          ))}
        </div>
        <label className="stress-slider">
          <span>ASX 100 shock</span>
          <input type="range" min={-40} max={0} step={1} value={shock} onChange={e => setShock(+e.target.value)} />
          <strong style={{ color: 'var(--red)' }}>{shock}%</strong>
        </label>
      </div>

      {/* Per-strategy impact */}
      <div className="stress-rows">
        {data.strategies.map(s => {
          const implied = (s.beta ?? 0) * shock
          const projected = s.currentValue * (1 + implied / 100)
          const ddFrac = Math.abs(s.maxDrawdown) / maxImplied
          return (
            <div key={s.id} className="stress-row">
              <div className="stress-row-head">
                <span className="stress-name">{s.name}</span>
                <span className="stress-beta">β {s.beta?.toFixed(2)}</span>
              </div>
              <div className="stress-bar-wrap">
                <div className="stress-bar-track">
                  <div className="stress-bar-fill" style={{ width: `${(Math.abs(implied) / maxImplied) * 100}%` }} />
                  <div className="stress-dd-marker" style={{ left: `${Math.min(100, ddFrac * 100)}%` }}
                    title={`Worst actual drawdown: ${s.maxDrawdown}%`} />
                </div>
                <span className="stress-implied">{implied.toFixed(1)}%</span>
              </div>
              <div className="stress-row-foot">
                <span>{money(s.currentValue)} → <strong style={{ color: 'var(--red)' }}>{money(projected)}</strong></span>
                <span className="stress-dd">worst so far {s.maxDrawdown}%</span>
              </div>
              <div className="stress-exposure">
                {BUCKETS.map(b => s.exposure[b.key] > 0 && (
                  <div key={b.key} className="stress-exp-seg"
                    style={{ width: `${s.exposure[b.key]}%`, background: b.color }}
                    title={`${b.label}: ${s.exposure[b.key]}%`} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="stress-legend">
        {BUCKETS.map(b => (
          <span key={b.key} className="stress-legend-item">
            <span className="stress-legend-dot" style={{ background: b.color }} /> {b.label}
          </span>
        ))}
      </div>
      <div className="stress-marker-key">
        <span className="stress-dd-marker-key" /> = worst drawdown actually recorded (2024–26). When it sits
        past the bar, this strategy has fallen harder than beta alone predicts — concentration bites.
      </div>

      <p className="stress-disclaimer">
        First-order estimate for education, not a forecast or advice. Beta is historical and rises in
        a crisis; real falls can exceed these figures. A severe correction hits every strategy — the
        question is how much, and whether you can hold through it.
      </p>
    </div>
  )
}

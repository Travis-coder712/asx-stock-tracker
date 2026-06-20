import { useEffect, useState } from 'react'

const BASE = import.meta.env.BASE_URL

interface Pick {
  ticker: string
  name: string
  sector: string
  rationale: string
  price: number | null
  [key: string]: unknown
}

interface StrategyResult {
  strategy: string
  asOf: string
  picks: Pick[]
  riskOff?: boolean
  signal?: string
}

interface MarketSignals {
  asOf: string
  asx100: number
  asx100Ma200: number
  aboveMa200: boolean
  return1m: number
  return3m: number
  avgPe: number
  avgDivYield: number
  trendSignal: string
  commentary: string[]
}

interface Diversification {
  totalPicks: number
  uniqueStocks: number
  sectorCount: number
  sectorBreakdown: Record<string, number>
  maxConcentration: number
  warnings: string[]
  rating: string
}

interface PickTodayData {
  asOf: string
  strategies: Record<string, StrategyResult>
  diversification: Diversification
  marketSignals: MarketSignals
}

const STRATEGY_COLORS: Record<string, string> = {
  padley_momentum: '#ff6b6b',
  quant_factors: '#4ecdc4',
  dividend_income: '#ffd43b',
  damodaran_dcf: '#6b8cff',
  contrarian_value: '#cc5de8',
}

const STRATEGY_ORDER = ['padley_momentum', 'quant_factors', 'dividend_income', 'damodaran_dcf', 'contrarian_value']

export default function PickToday() {
  const [data, setData] = useState<PickTodayData | null>(null)
  const [activeStrategies, setActiveStrategies] = useState<Set<string>>(new Set(STRATEGY_ORDER))
  const [excludedStocks, setExcludedStocks] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch(`${BASE}data/today/pick-today.json`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return <div style={{ color: 'var(--text-mute)', padding: 40, textAlign: 'center' }}>Loading...</div>

  const toggleStrategy = (sid: string) => {
    setActiveStrategies(prev => {
      const next = new Set(prev)
      next.has(sid) ? next.delete(sid) : next.add(sid)
      return next
    })
  }

  const toggleStock = (ticker: string) => {
    setExcludedStocks(prev => {
      const next = new Set(prev)
      next.has(ticker) ? next.delete(ticker) : next.add(ticker)
      return next
    })
  }

  // Build combined portfolio from active strategies minus excluded stocks
  const selectedPicks: Pick[] = []
  const seenTickers = new Set<string>()
  for (const sid of STRATEGY_ORDER) {
    if (!activeStrategies.has(sid)) continue
    const strat = data.strategies[sid]
    if (!strat) continue
    for (const p of strat.picks) {
      if (excludedStocks.has(p.ticker)) continue
      if (!seenTickers.has(p.ticker)) {
        seenTickers.add(p.ticker)
        selectedPicks.push({ ...p, _strategy: sid })
      }
    }
  }

  // Compute diversification for selected portfolio
  const sectorCounts: Record<string, number> = {}
  for (const p of selectedPicks) {
    sectorCounts[p.sector] = (sectorCounts[p.sector] || 0) + 1
  }
  const maxConc = selectedPicks.length > 0
    ? Math.max(...Object.values(sectorCounts)) / selectedPicks.length * 100 : 0

  const ms = data.marketSignals

  return (
    <>
      {/* Macro View */}
      <div className="tsr-card">
        <h3>Macro View</h3>
        <p className="tsr-subtitle">Market conditions as of {ms.asOf}. These indicators inform which strategies are favoured.</p>

        <div className="tsr-periods" style={{ marginBottom: 16 }}>
          <div className="tsr-period">
            <div className="period-label">ASX 100</div>
            <div className="tsr-values">
              <div className="tsr-item">
                <div className="name">Level</div>
                <div className="val agl">{ms.asx100?.toLocaleString()}</div>
              </div>
              <div className="tsr-item">
                <div className="name">200d MA</div>
                <div className="val index">{ms.asx100Ma200?.toLocaleString()}</div>
              </div>
            </div>
          </div>
          <div className="tsr-period">
            <div className="period-label">Trend</div>
            <div className="tsr-values">
              <div className="tsr-item">
                <div className="name">Signal</div>
                <div className="val" style={{ color: ms.aboveMa200 ? 'var(--green)' : 'var(--red)', fontSize: 16 }}>
                  {ms.trendSignal}
                </div>
              </div>
            </div>
          </div>
          <div className="tsr-period">
            <div className="period-label">Returns</div>
            <div className="tsr-values">
              <div className="tsr-item">
                <div className="name">1 month</div>
                <div className="val" style={{ color: ms.return1m >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {ms.return1m >= 0 ? '+' : ''}{ms.return1m}%
                </div>
              </div>
              <div className="tsr-item">
                <div className="name">3 month</div>
                <div className="val" style={{ color: ms.return3m >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {ms.return3m >= 0 ? '+' : ''}{ms.return3m}%
                </div>
              </div>
            </div>
          </div>
          <div className="tsr-period">
            <div className="period-label">Valuation</div>
            <div className="tsr-values">
              <div className="tsr-item">
                <div className="name">Avg P/E</div>
                <div className="val" style={{ color: ms.avgPe > 22 ? 'var(--red)' : ms.avgPe < 15 ? 'var(--green)' : 'var(--text-dim)' }}>
                  {ms.avgPe}
                </div>
              </div>
              <div className="tsr-item">
                <div className="name">Avg Yield</div>
                <div className="val index">{ms.avgDivYield}%</div>
              </div>
            </div>
          </div>
        </div>

        {ms.commentary.map((c, i) => (
          <p key={i} style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 8, lineHeight: 1.6,
            borderLeft: i === 0 ? '3px solid var(--accent)' : undefined,
            paddingLeft: i === 0 ? 12 : undefined }}>
            {c}
          </p>
        ))}
      </div>

      {/* Strategy selector */}
      <div className="tsr-card" style={{ marginTop: 16 }}>
        <h3>If We Picked Today — {data.asOf}</h3>
        <p className="tsr-subtitle">
          What each strategy would select based on current fundamentals and prices.
          Toggle strategies on/off and exclude individual stocks to build your own portfolio.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {STRATEGY_ORDER.map(sid => {
            const strat = data.strategies[sid]
            const active = activeStrategies.has(sid)
            return (
              <button key={sid}
                className={`period-tab ${active ? 'active' : ''}`}
                style={{ borderColor: active ? STRATEGY_COLORS[sid] : undefined,
                  color: active ? STRATEGY_COLORS[sid] : undefined,
                  background: active ? `${STRATEGY_COLORS[sid]}15` : undefined }}
                onClick={() => toggleStrategy(sid)}>
                {strat?.strategy ?? sid} ({strat?.picks.length ?? 0})
                {strat?.riskOff && ' — CASH'}
              </button>
            )
          })}
        </div>

        {/* Combined picks table */}
        <div className="peer-table-wrap">
          <table className="peer-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Ticker</th>
                <th>Company</th>
                <th>Sector</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {STRATEGY_ORDER.filter(sid => activeStrategies.has(sid)).map(sid => {
                const strat = data.strategies[sid]
                if (!strat || strat.riskOff) return null
                return strat.picks.map(p => {
                  const excluded = excludedStocks.has(p.ticker)
                  return (
                    <tr key={`${sid}-${p.ticker}`} style={{ opacity: excluded ? 0.3 : 1 }}>
                      <td>
                        <input type="checkbox" checked={!excluded}
                          onChange={() => toggleStock(p.ticker)}
                          style={{ accentColor: STRATEGY_COLORS[sid] }} />
                      </td>
                      <td className="ticker-cell">{p.ticker.replace('.AX', '')}</td>
                      <td className="name-cell">{p.name}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-mute)' }}>{p.sector}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
                        {p.price ? `$${p.price.toFixed(2)}` : '—'}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-dim)', maxWidth: 250 }}>{p.rationale}</td>
                    </tr>
                  )
                })
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diversification analysis */}
      <div className="tsr-card" style={{ marginTop: 16 }}>
        <h3>Portfolio Diversification</h3>
        <p className="tsr-subtitle">
          Analysis of your selected stocks across {Object.keys(sectorCounts).length} sectors.
        </p>

        <div className="tsr-periods" style={{ marginBottom: 16 }}>
          <div className="tsr-period">
            <div className="period-label">Stocks</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{selectedPicks.length}</div>
          </div>
          <div className="tsr-period">
            <div className="period-label">Sectors</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: Object.keys(sectorCounts).length >= 5 ? 'var(--green)' : 'var(--gold)' }}>
              {Object.keys(sectorCounts).length}
            </div>
          </div>
          <div className="tsr-period">
            <div className="period-label">Max concentration</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: maxConc > 30 ? 'var(--red)' : 'var(--green)' }}>
              {maxConc.toFixed(0)}%
            </div>
          </div>
          <div className="tsr-period">
            <div className="period-label">Rating</div>
            <div style={{ fontSize: 18, fontWeight: 700,
              color: Object.keys(sectorCounts).length >= 5 && maxConc <= 30 ? 'var(--green)'
                : Object.keys(sectorCounts).length >= 3 ? 'var(--gold)' : 'var(--red)' }}>
              {Object.keys(sectorCounts).length >= 5 && maxConc <= 30 ? 'Good'
                : Object.keys(sectorCounts).length >= 3 ? 'Moderate' : 'Poor'}
            </div>
          </div>
        </div>

        {/* Sector breakdown bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(sectorCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([sector, count]) => {
              const pct = (count / selectedPicks.length) * 100
              return (
                <div key={sector} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 100, fontSize: 12, color: 'var(--text-dim)', textAlign: 'right', flexShrink: 0 }}>{sector}</span>
                  <div style={{ flex: 1, height: 20, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: pct > 30 ? 'var(--red)' : 'var(--accent)',
                      borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8,
                      fontSize: 11, color: 'var(--text)', minWidth: 40
                    }}>
                      {count} ({pct.toFixed(0)}%)
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {data.diversification.warnings.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {data.diversification.warnings.map((w, i) => (
              <p key={i} style={{ fontSize: 12, color: 'var(--red)', margin: '4px 0' }}>Warning: {w}</p>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

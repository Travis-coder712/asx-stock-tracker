import { useEffect, useMemo, useState } from 'react'

const BASE = import.meta.env.BASE_URL

interface Holding {
  ticker: string
  name: string
  sector: string
  strategies: string[]
  count: number
  combinedWeight: number
  priced: boolean
}
interface RiskData {
  asOf: string
  period: { start: string | null; end: string | null; nObs: number; freq: string }
  strategies: Array<{ id: string; name: string }>
  uniqueNames: number
  sharedNames: number
  holdings: Holding[]
  stockCorr: { tickers: string[]; matrix: number[][] }
  strategyCorr: { ids: string[]; names: string[]; matrix: number[][]; avgOffDiagonal: number | null }
  annVol: Record<string, number>
  sectorWeights: Array<{ sector: string; weight: number }>
}

const STRAT_SHORT: Record<string, string> = {
  padley_momentum: 'Padley',
  damodaran_dcf: 'Damodaran',
  quant_factors: 'Quant',
  dividend_income: 'Dividend',
  contrarian_value: 'Contrarian',
}

// Diverging colour for a correlation value in [-1, 1].
// High positive → warm red (shared risk); near zero → neutral; negative → teal (diversifying).
function corrColor(v: number): string {
  if (v >= 0) {
    const g = Math.round(150 - 110 * v)
    return `rgba(255, ${g}, ${g}, ${(0.1 + 0.7 * v).toFixed(3)})`
  }
  const a = Math.min(1, -v)
  return `rgba(78, 205, 196, ${(0.1 + 0.6 * a).toFixed(3)})`
}

function Heatmap({
  labels,
  matrix,
  cell = 30,
  fullLabels,
}: {
  labels: string[]
  matrix: number[][]
  cell?: number
  fullLabels?: string[]
}) {
  return (
    <div className="heatmap-wrap">
      <div className="heatmap" style={{ gridTemplateColumns: `auto repeat(${labels.length}, ${cell}px)` }}>
        <div className="hm-corner" />
        {labels.map((l, i) => (
          <div key={`c${i}`} className="hm-col-label" style={{ width: cell }} title={fullLabels?.[i] ?? l}>
            {l}
          </div>
        ))}
        {matrix.map((row, r) => (
          <div key={`r${r}`} style={{ display: 'contents' }}>
            <div className="hm-row-label" title={fullLabels?.[r] ?? labels[r]}>{labels[r]}</div>
            {row.map((v, c) => (
              <div
                key={`${r}-${c}`}
                className={`hm-cell ${r === c ? 'diag' : ''}`}
                style={{ width: cell, height: cell, background: r === c ? 'var(--surface)' : corrColor(v) }}
                title={`${labels[r]} vs ${labels[c]}: ${v.toFixed(2)}`}
              >
                {cell >= 30 ? v.toFixed(2) : ''}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PortfolioRisk() {
  const [data, setData] = useState<RiskData | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    fetch(`${BASE}data/risk/portfolio-risk.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true))
  }, [])

  const shared = useMemo(() => data?.holdings.filter((h) => h.count > 1) ?? [], [data])

  if (failed) return <div className="section-header"><h2>Portfolio Risk</h2><div className="line" /><p style={{ color: 'var(--text-dim)' }}>Risk data not available. Run <code>python3 -m pipeline.exporters.export_risk</code>.</p></div>
  if (!data) return <div style={{ color: 'var(--text-dim)', padding: 24 }}>Loading risk analysis…</div>

  const avg = data.strategyCorr.avgOffDiagonal ?? 0
  const topName = data.holdings[0]
  const topSector = data.sectorWeights[0]
  const stratShort = data.strategyCorr.ids.map((id) => STRAT_SHORT[id] ?? id)

  return (
    <div className="risk-page">
      <div className="section-header">
        <h2>Portfolio Risk</h2>
        <div className="line" />
      </div>
      <p style={{ color: 'var(--text-dim)', marginBottom: 20, fontSize: 14, lineHeight: 1.6 }}>
        The five strategies look like five different bets. This tab asks whether they really are — by
        analysing what happens if you ran <strong>all five together</strong>. It flags stocks held in
        multiple strategies, the sector tilts that stack up, and the <strong>real return
        correlations</strong> between the strategies. Data: {data.period.nObs} daily observations
        {data.period.start && ` (${data.period.start} → ${data.period.end})`}. See{' '}
        <em>Learn → Position Sizing → Sizing in practice</em> for the theory.
      </p>

      {/* Stat tiles */}
      <div className="stats" style={{ marginBottom: 24 }}>
        <div className="stat">
          <div className="label">Unique names</div>
          <div className="value accent">{data.uniqueNames}</div>
        </div>
        <div className="stat">
          <div className="label">Held in &gt;1 strategy</div>
          <div className="value gold">{data.sharedNames}</div>
        </div>
        <div className="stat">
          <div className="label">Biggest single name</div>
          <div className="value" style={{ fontSize: 16 }}>
            {topName.ticker.replace('.AX', '')} · {topName.combinedWeight}%
          </div>
        </div>
        <div className="stat">
          <div className="label">Avg cross-strategy corr</div>
          <div className="value" style={{ color: avg > 0.6 ? 'var(--red)' : avg > 0.4 ? 'var(--gold)' : 'var(--green)' }}>
            {avg.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Verdict banner */}
      <div className="risk-verdict" style={{ borderColor: avg > 0.6 ? 'var(--red)' : 'var(--gold)' }}>
        These aren't {data.strategies.length} independent bets. The strategies' daily returns are{' '}
        <strong style={{ color: avg > 0.6 ? 'var(--red)' : 'var(--gold)' }}>{(avg * 100).toFixed(0)}% correlated</strong>{' '}
        on average — so running all five gives you far less diversification than five portfolios
        suggests, and concentrates you in {topSector.sector.toLowerCase()} ({topSector.weight}%) and{' '}
        {topName.ticker.replace('.AX', '')} ({topName.combinedWeight}% of the combined book).
      </div>

      {/* Strategy correlation heatmap */}
      <h3 className="risk-h3">How correlated are the five strategies?</h3>
      <p className="risk-note">
        Each strategy is treated as an equal-weight portfolio of its current holdings. 1.00 = moves
        identically; 0 = independent; red = highly correlated (shared risk), teal = diversifying.
      </p>
      <Heatmap labels={stratShort} fullLabels={data.strategyCorr.names} matrix={data.strategyCorr.matrix} cell={64} />

      {/* Overlap table */}
      <h3 className="risk-h3">Stocks held in more than one strategy</h3>
      <p className="risk-note">
        {data.sharedNames} of {data.uniqueNames} names are shared. In a naive "run everything" book
        these get double- or quadruple-counted — your true exposure to them is larger than any single
        strategy implies.
      </p>
      <div className="overlap-table">
        {shared.map((h) => (
          <div key={h.ticker} className="overlap-row">
            <span className="ov-ticker">{h.ticker.replace('.AX', '')}</span>
            <span className="ov-name">{h.name}</span>
            <span className="ov-chips">
              {data.strategies.map((s) => (
                <span
                  key={s.id}
                  className={`ov-chip ${h.strategies.includes(s.id) ? 'on' : ''}`}
                  title={s.name}
                >
                  {STRAT_SHORT[s.id]?.[0] ?? '?'}
                </span>
              ))}
            </span>
            <span className="ov-count" style={{ color: h.count >= 3 ? 'var(--red)' : 'var(--gold)' }}>
              ×{h.count}
            </span>
            <span className="ov-weight">{h.combinedWeight}%</span>
          </div>
        ))}
      </div>

      {/* Sector concentration */}
      <h3 className="risk-h3">Combined-portfolio sector concentration</h3>
      <p className="risk-note">
        If you split $1 equally across the five strategies (equal-weight within each), this is where
        it lands. Bars over 20% are concentration flags.
      </p>
      <div className="sector-bars">
        {data.sectorWeights.map((s) => (
          <div key={s.sector} className="sector-bar-row">
            <span className="sb-label">{s.sector}</span>
            <div className="sb-track">
              <div
                className="sb-fill"
                style={{ width: `${Math.min(100, s.weight * 3)}%`, background: s.weight > 20 ? 'var(--red)' : s.weight > 12 ? 'var(--gold)' : 'var(--accent)' }}
              />
            </div>
            <span className="sb-val">{s.weight}%</span>
          </div>
        ))}
      </div>

      {/* Stock correlation heatmap */}
      <h3 className="risk-h3">Stock-by-stock correlation ({data.stockCorr.tickers.length} holdings)</h3>
      <p className="risk-note">
        The full picture. Big blocks of red mean clusters of names that rise and fall together —
        real diversification comes from teal, not from simply owning more names. Scroll to explore;
        hover any cell for the pair.
      </p>
      <Heatmap labels={data.stockCorr.tickers} matrix={data.stockCorr.matrix} cell={22} />

      <div className="risk-verdict" style={{ borderColor: 'var(--accent)', marginTop: 24 }}>
        <strong>Takeaway:</strong> owning 29 names across five strategies is not the same as holding
        29 independent bets. Overlap, shared sectors and high return correlation mean the effective
        number of bets is much smaller. Before combining strategies, trim the duplicated names, cap
        the concentrated sectors, and treat highly-correlated holdings as one position — exactly the
        discipline from the Position Sizing module.
      </div>

      <p style={{ color: 'var(--text-mute)', fontSize: 12, marginTop: 16 }}>
        Correlations use daily log returns over the common price window ({data.period.nObs} obs).
        Educational analysis, not financial advice.
      </p>
    </div>
  )
}

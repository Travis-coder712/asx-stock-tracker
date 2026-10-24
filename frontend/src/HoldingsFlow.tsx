import { useEffect, useMemo, useState } from 'react'

const BASE = import.meta.env.BASE_URL

interface Cell { rank: number; ret: number }
interface Stock { ticker: string; cells: Record<string, Cell> }
interface StrategyFlow { name: string; periods: Array<{ id: string; label: string }>; stocks: Stock[] }
type FlowData = Record<string, StrategyFlow>

const STRATEGY_ORDER = ['padley_momentum', 'quant_factors', 'dividend_income', 'damodaran_dcf', 'contrarian_value']
const SHORT: Record<string, string> = {
  padley_momentum: 'Padley', quant_factors: 'Quant', dividend_income: 'Dividend',
  damodaran_dcf: 'Damodaran', contrarian_value: 'Contrarian',
}
const LINE_PALETTE = ['#4dabf7', '#9775fa', '#f783ac', '#63e6be', '#ffa94d', '#a9e34b',
  '#ff8787', '#74c0fc', '#da77f2', '#38d9a9', '#ffd43b', '#e599f7']

function retColor(r: number) {
  if (r >= 30) return '#2b8a3e'
  if (r >= 10) return '#51cf66'
  if (r >= 0) return '#94d82d'
  if (r >= -10) return '#ffa8a8'
  if (r >= -30) return '#ff6b6b'
  return '#c92a2a'
}

export default function HoldingsFlow() {
  const [data, setData] = useState<FlowData | null>(null)
  const [sid, setSid] = useState('padley_momentum')
  const [hover, setHover] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${BASE}data/periods/holdings-flow.json`)
      .then(r => r.ok ? r.json() : null).then(setData).catch(() => {})
  }, [])

  const flow = data?.[sid]

  const geom = useMemo(() => {
    if (!flow) return null
    const W = 900, padL = 58, padR = 64, padT = 34, rowH = 32
    const maxRank = Math.max(...flow.stocks.flatMap(s => Object.values(s.cells).map(c => c.rank)), 1)
    const H = padT + (maxRank - 1) * rowH + 30
    const np = flow.periods.length
    const colX = (i: number) => padL + (np > 1 ? i / (np - 1) * (W - padL - padR) : 0)
    const rowY = (rank: number) => padT + (rank - 1) * rowH
    const pIdx: Record<string, number> = {}
    flow.periods.forEach((p, i) => { pIdx[p.id] = i })

    const tracks = flow.stocks.map((s, si) => {
      const pts = flow.periods
        .filter(p => s.cells[p.id])
        .map(p => ({ x: colX(pIdx[p.id]), y: rowY(s.cells[p.id].rank), ...s.cells[p.id] }))
      // smooth cubic path with horizontal control handles
      let d = ''
      pts.forEach((pt, i) => {
        if (i === 0) { d += `M ${pt.x} ${pt.y}` }
        else {
          const prev = pts[i - 1], mx = (prev.x + pt.x) / 2
          d += ` C ${mx} ${prev.y} ${mx} ${pt.y} ${pt.x} ${pt.y}`
        }
      })
      return { ticker: s.ticker, color: LINE_PALETTE[si % LINE_PALETTE.length], pts, d }
    })
    return { W, H, padL, padR, padT, colX, rowY, maxRank, tracks }
  }, [flow])

  if (!flow || !geom) return null

  return (
    <div className="flow-section" id="holdings-flow">
      <div className="section-header">
        <h2>Holdings Flow</h2>
        <div className="line" />
      </div>
      <p className="risk-sub">
        Every stock each strategy has held, ranked by its return within each 6-month period
        (top&nbsp;=&nbsp;best). A line that <strong>starts</strong> is a stock bought in; a line that
        <strong> ends</strong> is one discarded at the next rebalance. Dot colour = that period's
        return (green&nbsp;=&nbsp;gain, red&nbsp;=&nbsp;loss); dot size = size of the move.
      </p>

      <div className="flow-tabs">
        {STRATEGY_ORDER.filter(s => data?.[s]).map(s => (
          <button key={s} className={`te-preset ${sid === s ? 'active' : ''}`} onClick={() => { setSid(s); setHover(null) }}>
            {SHORT[s]}
          </button>
        ))}
      </div>

      <div className="flow-chart-wrap">
        <svg viewBox={`0 0 ${geom.W} ${geom.H}`} className="flow-svg" preserveAspectRatio="xMidYMid meet">
          {/* period column labels + guides */}
          {flow.periods.map((p, i) => (
            <g key={p.id}>
              <line x1={geom.colX(i)} y1={geom.padT - 8} x2={geom.colX(i)} y2={geom.H - 20}
                stroke="var(--border)" strokeOpacity={0.4} strokeDasharray="2 4" />
              <text x={geom.colX(i)} y={18} textAnchor="middle" className="flow-axis">{p.label.replace(' (current)', '').replace(' (forward)', '')}</text>
            </g>
          ))}
          {/* rank labels */}
          {Array.from({ length: geom.maxRank }, (_, i) => i + 1).map(r => (
            <text key={r} x={18} y={geom.rowY(r) + 4} textAnchor="middle" className="flow-rank">{r}</text>
          ))}

          {/* tracks */}
          {geom.tracks.map(t => {
            const dim = hover && hover !== t.ticker
            return (
              <g key={t.ticker} opacity={dim ? 0.1 : 1}
                onMouseEnter={() => setHover(t.ticker)} onMouseLeave={() => setHover(null)}
                style={{ cursor: 'pointer' }}>
                <path d={t.d} fill="none" stroke={t.color} strokeWidth={hover === t.ticker ? 3.5 : 2}
                  strokeOpacity={0.55} />
                {/* entry label */}
                <text x={t.pts[0].x - 9} y={t.pts[0].y + 4} textAnchor="end" className="flow-tick" fill={t.color}>{t.ticker}</text>
                {/* exit label */}
                <text x={t.pts[t.pts.length - 1].x + 9} y={t.pts[t.pts.length - 1].y + 4} textAnchor="start" className="flow-tick" fill={t.color}>{t.ticker}</text>
                {t.pts.map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r={4 + Math.min(Math.abs(pt.ret), 50) / 50 * 7}
                      fill={retColor(pt.ret)} stroke="var(--bg)" strokeWidth={1.5} />
                    {hover === t.ticker && (
                      <text x={pt.x} y={pt.y - (4 + Math.min(Math.abs(pt.ret), 50) / 50 * 7) - 4}
                        textAnchor="middle" className="flow-ret">{pt.ret >= 0 ? '+' : ''}{pt.ret}%</text>
                    )}
                  </g>
                ))}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flow-legend">
        <span className="flow-legend-item"><span className="flow-dot" style={{ background: '#2b8a3e' }} /> strong gain</span>
        <span className="flow-legend-item"><span className="flow-dot" style={{ background: '#94d82d' }} /> small gain</span>
        <span className="flow-legend-item"><span className="flow-dot" style={{ background: '#ffa8a8' }} /> small loss</span>
        <span className="flow-legend-item"><span className="flow-dot" style={{ background: '#c92a2a' }} /> big loss</span>
        <span className="flow-legend-item">· bigger dot = bigger move · hover a line to trace a stock</span>
      </div>
    </div>
  )
}

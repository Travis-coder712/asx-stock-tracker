import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

// ---------------------------------------------------------------------------
// Position Sizing Simulator
// ---------------------------------------------------------------------------
// Same edge, different bet size → wealth or ruin. Runs a Monte-Carlo of many
// equity curves for a repeated bet and shows how bet fraction (relative to the
// growth-optimal "Kelly" fraction) drives the distribution of outcomes.
//
// Per trade the bankroll is multiplied by:
//   win  (prob p):  1 + f * (avgWin/100)
//   loss (prob 1-p):1 + f * (avgLoss/100)     (avgLoss is negative)
//
// Growth-optimal fraction (Kelly) maximises E[ln(multiplier)]:
//   f* = -(p*w + q*l) / (w*l)      with w = avgWin/100 > 0, l = avgLoss/100 < 0
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const START = 100 // starting bankroll as an index (100 = 100%)
const RUIN_LINE = 20 // "ruined" = bankroll falls below 20% of start
const FLOOR = 1 // display floor for the log axis (1% of start)
const SIM_PATHS = 400 // paths simulated for statistics
const SAMPLE_LINES = 24 // paths actually drawn on the chart

function kellyFraction(p: number, w: number, l: number) {
  // w > 0, l < 0
  if (w <= 0 || l >= 0) return 0
  return -((p * w + (1 - p) * l) / (w * l))
}

interface SimResult {
  chart: Array<Record<string, number>>
  sampleKeys: string[]
  median: number
  p10: number
  p90: number
  ruinRate: number
  kelly: number
  expectancy: number
  edgePositive: boolean
}

function runSim(
  winRate: number,
  avgWin: number,
  avgLoss: number,
  betFraction: number,
  trades: number,
  seed: number,
): SimResult {
  const p = winRate / 100
  const w = avgWin / 100
  const l = avgLoss / 100 // negative
  const f = betFraction / 100
  const rng = mulberry32(seed)

  const winMult = Math.max(0.0001, 1 + f * w)
  const lossMult = Math.max(0.0001, 1 + f * l)

  // Simulate every path, storing the full curve
  const curves: number[][] = []
  for (let path = 0; path < SIM_PATHS; path++) {
    const curve = [START]
    let bank = START
    for (let t = 0; t < trades; t++) {
      const won = rng() < p
      bank = bank * (won ? winMult : lossMult)
      if (bank < FLOOR) bank = FLOOR // absorbing floor — wiped out
      curve.push(bank)
    }
    curves.push(curve)
  }

  // Build chart data: median curve + a handful of sample paths
  const sampleKeys = Array.from({ length: SAMPLE_LINES }, (_, i) => `s${i}`)
  const chart: Array<Record<string, number>> = []
  for (let t = 0; t <= trades; t++) {
    const col = curves.map((c) => c[t]).sort((a, b) => a - b)
    const row: Record<string, number> = {
      t,
      median: col[Math.floor(col.length / 2)],
    }
    for (let i = 0; i < SAMPLE_LINES; i++) row[`s${i}`] = curves[i][t]
    chart.push(row)
  }

  const finals = curves.map((c) => c[c.length - 1]).sort((a, b) => a - b)
  const median = finals[Math.floor(finals.length / 2)]
  const p10 = finals[Math.floor(finals.length * 0.1)]
  const p90 = finals[Math.floor(finals.length * 0.9)]
  const ruinRate = (finals.filter((v) => v <= RUIN_LINE).length / finals.length) * 100
  const expectancy = p * w + (1 - p) * l

  return {
    chart,
    sampleKeys,
    median,
    p10,
    p90,
    ruinRate,
    kelly: kellyFraction(p, w, l) * 100,
    expectancy: expectancy * 100,
    edgePositive: expectancy > 0,
  }
}

function mult(v: number) {
  return `${(v / START).toFixed(2)}×`
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: { t: number; median: number } }>
}
function SimTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '8px 10px',
        fontSize: 12,
      }}
    >
      <div style={{ color: 'var(--text-dim)' }}>Trade {p.t}</div>
      <div style={{ color: 'var(--text)' }}>Median: {mult(p.median)} start</div>
    </div>
  )
}

export function PositionSizingSimulator() {
  const [winRate, setWinRate] = useState(55)
  const [avgWin, setAvgWin] = useState(30)
  const [avgLoss, setAvgLoss] = useState(30) // shown as a positive magnitude
  const [betFraction, setBetFraction] = useState(15)
  const [trades, setTrades] = useState(50)
  const [seed, setSeed] = useState(7)

  const sim = useMemo(
    () => runSim(winRate, avgWin, -avgLoss, betFraction, trades, seed),
    [winRate, avgWin, avgLoss, betFraction, trades, seed],
  )

  const kellyRatio = sim.kelly > 0 ? betFraction / sim.kelly : 0
  const verdict = !sim.edgePositive
    ? { color: 'var(--red)', text: 'No edge — expectancy is negative. No bet size wins; the only winning move is not to play.' }
    : kellyRatio > 1.15
      ? { color: 'var(--red)', text: `Over-betting (${(kellyRatio * 100).toFixed(0)}% of Kelly). You have a real edge but you're betting it into ruin — watch the crashed paths.` }
      : kellyRatio > 0.85
        ? { color: 'var(--gold)', text: `Near full Kelly (${(kellyRatio * 100).toFixed(0)}%). Maximum long-run growth — but stomach-churning swings. Almost nobody bets this big.` }
        : kellyRatio > 0.35
          ? { color: 'var(--green)', text: `Around half-Kelly (${(kellyRatio * 100).toFixed(0)}%). The professional's sweet spot — ~75% of the growth for a fraction of the risk.` }
          : { color: 'var(--accent)', text: `Conservative (${(kellyRatio * 100).toFixed(0)}% of Kelly). Very safe, but you're leaving compounding on the table.` }

  return (
    <div className="interactive-box">
      <div className="interactive-header">Position Sizing Simulator</div>
      <p className="interactive-desc">
        You have one repeatable bet with a fixed edge. The only thing you change is{' '}
        <strong>how much of your bankroll you risk each time</strong>. Watch {SIM_PATHS} possible
        futures play out. Too small and you barely grow; too big and the <em>same winning edge</em>{' '}
        drives most paths to ruin. Somewhere between sits Kelly.
      </p>

      <div className="calc-inputs">
        <label>
          Win rate %
          <input type="range" min={30} max={70} value={winRate} onChange={(e) => setWinRate(+e.target.value)} />{' '}
          <span>{winRate}%</span>
        </label>
        <label>
          Avg win % (per trade)
          <input type="range" min={5} max={80} value={avgWin} onChange={(e) => setAvgWin(+e.target.value)} />{' '}
          <span>+{avgWin}%</span>
        </label>
        <label>
          Avg loss % (per trade)
          <input type="range" min={5} max={80} value={avgLoss} onChange={(e) => setAvgLoss(+e.target.value)} />{' '}
          <span>-{avgLoss}%</span>
        </label>
        <label>
          Bet fraction of bankroll %
          <input type="range" min={1} max={100} value={betFraction} onChange={(e) => setBetFraction(+e.target.value)} />{' '}
          <span>{betFraction}%</span>
        </label>
        <label>
          Number of trades
          <input type="range" min={10} max={150} value={trades} onChange={(e) => setTrades(+e.target.value)} />{' '}
          <span>{trades}</span>
        </label>
        <label style={{ justifyContent: 'flex-end' }}>
          <button className="sim-reroll" onClick={() => setSeed((s) => s + 1)}>
            🎲 New futures
          </button>
        </label>
      </div>

      {/* Kelly gauge */}
      <div
        className="sim-edge"
        style={{ borderColor: verdict.color, color: verdict.color }}
      >
        Growth-optimal (full Kelly) bet ≈{' '}
        <strong>{sim.kelly > 100 ? '>100%' : `${sim.kelly.toFixed(0)}%`}</strong> · you're betting{' '}
        <strong>{betFraction}%</strong>. {verdict.text}
      </div>

      {/* Equity curves */}
      <div style={{ height: 240, marginTop: 16 }}>
        <ResponsiveContainer>
          <LineChart data={sim.chart} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
            <XAxis
              dataKey="t"
              tick={{ fill: 'var(--text-mute)', fontSize: 11 }}
              stroke="var(--border)"
              tickFormatter={(t) => `${t}`}
            />
            <YAxis
              scale="log"
              domain={[FLOOR, 'auto']}
              allowDataOverflow
              tick={{ fill: 'var(--text-mute)', fontSize: 11 }}
              stroke="var(--border)"
              width={48}
              tickFormatter={(v) => `${(v / START).toFixed(v < START ? 2 : 0)}×`}
            />
            <Tooltip content={<SimTooltip />} />
            <ReferenceLine y={START} stroke="var(--text-mute)" strokeDasharray="4 3" strokeOpacity={0.4} />
            <ReferenceLine y={RUIN_LINE} stroke="var(--red)" strokeDasharray="6 3" strokeOpacity={0.5} />
            {sim.sampleKeys.map((k) => (
              <Line
                key={k}
                type="monotone"
                dataKey={k}
                stroke="var(--text-mute)"
                strokeWidth={1}
                strokeOpacity={0.28}
                dot={false}
                isAnimationActive={false}
              />
            ))}
            <Line
              type="monotone"
              dataKey="median"
              stroke="#f783ac"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="sim-chart-caption">
        Log scale. Each faint line is one possible future; the pink line is the median. Grey dashed =
        starting bankroll, red dashed = ruin ({RUIN_LINE}% of start).
      </div>

      {/* Stats */}
      <div className="sim-breakdown">
        <div className="sim-row">
          <span>Edge per trade (expectancy)</span>
          <span style={{ color: sim.edgePositive ? 'var(--green)' : 'var(--red)' }}>
            {sim.expectancy >= 0 ? '+' : ''}
            {sim.expectancy.toFixed(2)}%
          </span>
        </div>
        <div className="sim-row">
          <span>Median outcome</span>
          <span style={{ color: sim.median >= START ? 'var(--green)' : 'var(--red)' }}>{mult(sim.median)}</span>
        </div>
        <div className="sim-row">
          <span>Lucky 10% reach</span>
          <span style={{ color: 'var(--green)' }}>{mult(sim.p90)}</span>
        </div>
        <div className="sim-row">
          <span>Unlucky 10% left with</span>
          <span style={{ color: 'var(--red)' }}>{mult(sim.p10)}</span>
        </div>
        <div className="sim-row total">
          <span>Paths wiped out (ruin)</span>
          <span style={{ color: sim.ruinRate > 0 ? 'var(--red)' : 'var(--green)' }}>
            {sim.ruinRate.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="sim-vol-note">
        Push <strong>bet fraction</strong> up toward and past the Kelly number: the median keeps
        rising for a while, then the ruin rate explodes and the median <em>collapses</em> — because
        one big loss on a huge bet is unrecoverable. That non-obvious peak-then-crash is the whole
        reason sizing matters more than picking.
      </div>
    </div>
  )
}

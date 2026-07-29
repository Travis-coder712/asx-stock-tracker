import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

// ---------------------------------------------------------------------------
// Gamma Scalping Simulator
// ---------------------------------------------------------------------------
// Simulates delta-hedging a long ATM option over a random price path and shows
// the core identity of long-vol trading:
//
//   step P&L  ~=  0.5 * Gamma * ( dS^2  -  sigmaImplied^2 * S^2 * dt )
//                 \_____ gamma harvest _____/   \____ theta / implied cost ____/
//
// You profit when realised variance (dS^2 accumulated) beats the implied
// variance you paid for (sigmaImplied^2). Transaction costs eat the edge.
// r = 0 for clarity; option is struck at-the-money (K = S0).
// ---------------------------------------------------------------------------

// Standard normal pdf
function phi(x: number) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
}

// Black-Scholes gamma for a European option (call or put — same gamma), r = 0
function bsGamma(S: number, K: number, tau: number, sigma: number) {
  if (tau <= 0 || sigma <= 0 || S <= 0) return 0
  const d1 = (Math.log(S / K) + 0.5 * sigma * sigma * tau) / (sigma * Math.sqrt(tau))
  return phi(d1) / (S * sigma * Math.sqrt(tau))
}

// Seeded PRNG (mulberry32) so a given seed + inputs reproduce the same path,
// and the "New path" button just increments the seed.
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Box-Muller: turn two uniforms into a standard normal
function randn(rng: () => number) {
  let u = 0
  let v = 0
  while (u === 0) u = rng()
  while (v === 0) v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const TRADING_DAYS = 252
const CONTRACT_MULT = 1000 // 1 oil option ≈ 1,000 barrels — makes P&L read in real dollars

interface SimResult {
  path: Array<{ step: number; day: number; price: number; cumPnl: number }>
  gammaPnl: number
  thetaCost: number
  txCost: number
  net: number
  measuredVol: number
  startPrice: number
  strike: number
}

function runSim(
  impliedVol: number,
  realizedVol: number,
  days: number,
  rehedgesPerDay: number,
  costBps: number,
  seed: number,
): SimResult {
  const S0 = 80 // notional crude price, $/bbl
  const K = S0
  const sigI = impliedVol / 100
  const sigR = realizedVol / 100
  const tauTotal = days / TRADING_DAYS
  const steps = Math.max(1, Math.round(days * rehedgesPerDay))
  const dt = tauTotal / steps
  const rng = mulberry32(seed)

  let S = S0
  let gammaPnl = 0
  let thetaCost = 0
  let txCost = 0
  const logReturns: number[] = []
  const path: SimResult['path'] = [{ step: 0, day: 0, price: S, cumPnl: 0 }]

  for (let i = 0; i < steps; i++) {
    const tau = tauTotal - i * dt
    const gamma = bsGamma(S, K, tau, sigI)

    // Evolve the price one step with the REALISED vol
    const z = randn(rng)
    const nextS = S * Math.exp(-0.5 * sigR * sigR * dt + sigR * Math.sqrt(dt) * z)
    const dS = nextS - S
    logReturns.push(Math.log(nextS / S))

    // P&L attribution for a delta-hedged long option over the step
    const gp = 0.5 * gamma * dS * dS * CONTRACT_MULT
    const tc = 0.5 * gamma * sigI * sigI * S * S * dt * CONTRACT_MULT
    // Re-hedge trades ~ (gamma * |dS|) units of the future; cost = bps of that notional
    const hedgeUnits = gamma * Math.abs(dS)
    const trade = (costBps / 10000) * S * hedgeUnits * CONTRACT_MULT

    gammaPnl += gp
    thetaCost += tc
    txCost += trade

    S = nextS
    path.push({
      step: i + 1,
      day: (i + 1) / rehedgesPerDay,
      price: S,
      cumPnl: gammaPnl - thetaCost - txCost,
    })
  }

  // Annualised realised vol actually delivered by THIS path
  const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length
  const variance =
    logReturns.reduce((a, b) => a + (b - mean) * (b - mean), 0) / Math.max(1, logReturns.length - 1)
  const measuredVol = Math.sqrt(variance / dt) * 100

  return {
    path,
    gammaPnl,
    thetaCost,
    txCost,
    net: gammaPnl - thetaCost - txCost,
    measuredVol,
    startPrice: S0,
    strike: K,
  }
}

function fmt(n: number) {
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: { day: number; price: number; cumPnl: number } }>
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
      <div style={{ color: 'var(--text-dim)' }}>Day {p.day.toFixed(1)}</div>
      <div style={{ color: 'var(--text)' }}>Price: ${p.price.toFixed(2)}</div>
      <div style={{ color: p.cumPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>
        Cum P&L: {fmt(p.cumPnl)}
      </div>
    </div>
  )
}

export function GammaScalpingSimulator() {
  const [impliedVol, setImpliedVol] = useState(30)
  const [realizedVol, setRealizedVol] = useState(38)
  const [days, setDays] = useState(20)
  const [rehedgesPerDay, setRehedgesPerDay] = useState(1)
  const [costBps, setCostBps] = useState(2)
  const [seed, setSeed] = useState(12345)

  const sim = useMemo(
    () => runSim(impliedVol, realizedVol, days, rehedgesPerDay, costBps, seed),
    [impliedVol, realizedVol, days, rehedgesPerDay, costBps, seed],
  )

  const win = sim.net >= 0
  const volEdge = realizedVol - impliedVol

  return (
    <div className="interactive-box">
      <div className="interactive-header">Gamma Scalping Simulator</div>
      <p className="interactive-desc">
        You buy an at-the-money option (paying <strong>implied vol</strong>) and delta-hedge it to
        neutral. Each price wiggle lets you sell high / buy low on the hedge — that's the gamma
        scalp. You win only if the vol the market <em>actually</em> delivers beats the vol you paid,
        after costs. Move the sliders, then hit <strong>New path</strong> to roll a fresh random
        market.
      </p>

      <div className="calc-inputs">
        <label>
          Implied vol paid %
          <input
            type="range"
            min={5}
            max={80}
            value={impliedVol}
            onChange={(e) => setImpliedVol(+e.target.value)}
          />{' '}
          <span>{impliedVol}%</span>
        </label>
        <label>
          Realised vol (actual) %
          <input
            type="range"
            min={5}
            max={80}
            value={realizedVol}
            onChange={(e) => setRealizedVol(+e.target.value)}
          />{' '}
          <span>{realizedVol}%</span>
        </label>
        <label>
          Days to expiry
          <input
            type="range"
            min={5}
            max={90}
            value={days}
            onChange={(e) => setDays(+e.target.value)}
          />{' '}
          <span>{days}d</span>
        </label>
        <label>
          Re-hedges per day
          <input
            type="range"
            min={1}
            max={8}
            value={rehedgesPerDay}
            onChange={(e) => setRehedgesPerDay(+e.target.value)}
          />{' '}
          <span>{rehedgesPerDay}×</span>
        </label>
        <label>
          Cost per hedge (bps)
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={costBps}
            onChange={(e) => setCostBps(+e.target.value)}
          />{' '}
          <span>{costBps} bps</span>
        </label>
        <label style={{ justifyContent: 'flex-end' }}>
          <button className="sim-reroll" onClick={() => setSeed((s) => s + 1)}>
            🎲 New path
          </button>
        </label>
      </div>

      {/* Vol edge banner — the whole game in one line */}
      <div
        className="sim-edge"
        style={{
          borderColor: volEdge >= 0 ? 'var(--green)' : 'var(--red)',
          color: volEdge >= 0 ? 'var(--green)' : 'var(--red)',
        }}
      >
        Realised {realizedVol}% {volEdge >= 0 ? '>' : '<'} Implied {impliedVol}% →{' '}
        {volEdge >= 0 ? 'long vol has an edge' : 'you overpaid for vol'} (before costs & path luck)
      </div>

      {/* Price path chart */}
      <div style={{ height: 220, marginTop: 16 }}>
        <ResponsiveContainer>
          <LineChart data={sim.path} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
            <XAxis
              dataKey="day"
              tick={{ fill: 'var(--text-mute)', fontSize: 11 }}
              tickFormatter={(d) => `${Math.round(d)}d`}
              stroke="var(--border)"
            />
            <YAxis
              tick={{ fill: 'var(--text-mute)', fontSize: 11 }}
              domain={['dataMin - 1', 'dataMax + 1']}
              stroke="var(--border)"
              width={44}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <Tooltip content={<SimTooltip />} />
            <ReferenceLine
              y={sim.strike}
              stroke="var(--gold)"
              strokeDasharray="6 3"
              strokeOpacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="sim-chart-caption">
        Crude price path (blue). Gold dashed line = strike / your delta-neutral pivot. Every swing
        away and back is a scalp.
      </div>

      {/* Result */}
      <div className="calc-result" style={{ marginTop: 8 }}>
        <div className="calc-big" style={{ color: win ? 'var(--green)' : 'var(--red)' }}>
          {fmt(sim.net)}
        </div>
        <div className="calc-label">
          net P&L on this path over {days} days{' '}
          {win ? '— the scalp cleared theta' : "— theta & costs beat the scalp"}
        </div>
      </div>

      {/* Breakdown */}
      <div className="sim-breakdown">
        <div className="sim-row">
          <span>Gamma harvested (realised moves)</span>
          <span style={{ color: 'var(--green)' }}>{fmt(sim.gammaPnl)}</span>
        </div>
        <div className="sim-row">
          <span>Theta paid (implied vol cost)</span>
          <span style={{ color: 'var(--red)' }}>-{fmt(sim.thetaCost).replace('-', '')}</span>
        </div>
        <div className="sim-row">
          <span>Transaction costs ({sim.path.length - 1} hedges)</span>
          <span style={{ color: 'var(--red)' }}>-{fmt(sim.txCost).replace('-', '')}</span>
        </div>
        <div className="sim-row total">
          <span>Net</span>
          <span style={{ color: win ? 'var(--green)' : 'var(--red)' }}>{fmt(sim.net)}</span>
        </div>
      </div>

      <div className="sim-vol-note">
        Vol you paid: <strong>{impliedVol}%</strong> · Vol this path actually delivered:{' '}
        <strong style={{ color: sim.measuredVol >= impliedVol ? 'var(--green)' : 'var(--red)' }}>
          {sim.measuredVol.toFixed(1)}%
        </strong>
        . Notice the delivered vol rarely equals your target — <em>path luck</em> is real, which is
        why one trade proves nothing and long-vol desks run many at once.
      </div>
    </div>
  )
}

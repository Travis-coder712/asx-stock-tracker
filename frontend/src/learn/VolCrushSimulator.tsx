import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts'

// ---------------------------------------------------------------------------
// Vol Crush Simulator
// ---------------------------------------------------------------------------
// You buy an at-the-money call into an event when implied vol is elevated.
// After the event the underlying makes a move AND implied vol collapses.
// The tool decomposes the P&L into the spot move (delta/gamma), time decay
// (theta) and the implied-vol collapse (vega) so you can see the classic trap:
// being right on direction and still losing because vega dominated.
// r = 0, strike struck ATM at purchase. Equity option, 100 shares/contract.
// ---------------------------------------------------------------------------

function erf(x: number) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t) *
      Math.exp(-x * x)
  return x >= 0 ? y : -y
}
function normCdf(x: number) {
  return 0.5 * (1 + erf(x / Math.SQRT2))
}
// Black-Scholes call, r = 0
function bsCall(S: number, K: number, tau: number, sig: number) {
  if (tau <= 0 || sig <= 0) return Math.max(0, S - K)
  const d1 = (Math.log(S / K) + 0.5 * sig * sig * tau) / (sig * Math.sqrt(tau))
  const d2 = d1 - sig * Math.sqrt(tau)
  return S * normCdf(d1) - K * normCdf(d2)
}

const S0 = 50 // $ stock
const K = S0 // ATM
const MULT = 100 // shares per contract
const TRADING_DAYS = 252

function money(n: number) {
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toLocaleString('en-AU', { maximumFractionDigits: 0 })}`
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: { move: number; crushed: number; nocrush: number } }>
}
function CrushTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-dim)' }}>Move {p.move >= 0 ? '+' : ''}{p.move}%</div>
      <div style={{ color: '#9775fa' }}>After crush: {money(p.crushed)}</div>
      <div style={{ color: 'var(--text-mute)' }}>If IV held: {money(p.nocrush)}</div>
    </div>
  )
}

export function VolCrushSimulator() {
  const [daysToExpiry, setDaysToExpiry] = useState(30)
  const [daysHeld, setDaysHeld] = useState(7)
  const [ivBefore, setIvBefore] = useState(60)
  const [ivAfter, setIvAfter] = useState(35)
  const [move, setMove] = useState(5)

  const r = useMemo(() => {
    const tau0 = daysToExpiry / TRADING_DAYS
    const tau1 = Math.max(0, (daysToExpiry - daysHeld) / TRADING_DAYS)
    const iv0 = ivBefore / 100
    const iv1 = ivAfter / 100
    const S1 = S0 * (1 + move / 100)

    const premium = bsCall(S0, K, tau0, iv0) * MULT
    const valueNow = bsCall(S1, K, tau1, iv1) * MULT

    // Path decomposition (sums exactly to total P&L)
    const afterTime = bsCall(S0, K, tau1, iv0) * MULT // time passes only
    const afterMove = bsCall(S1, K, tau1, iv0) * MULT // + spot move at pre-crush IV
    const thetaPnl = afterTime - premium
    const spotPnl = afterMove - afterTime
    const vegaPnl = valueNow - afterMove
    const net = valueNow - premium

    // Curve: option value vs post-event move, with and without the crush
    const curve: Array<{ move: number; crushed: number; nocrush: number }> = []
    let breakeven: number | null = null
    for (let m = -25; m <= 25; m += 1) {
      const s = S0 * (1 + m / 100)
      const crushed = bsCall(s, K, tau1, iv1) * MULT
      const nocrush = bsCall(s, K, tau1, iv0) * MULT
      curve.push({ move: m, crushed, nocrush })
      if (breakeven === null && crushed >= premium && m >= 0) breakeven = m
    }

    return { premium, valueNow, thetaPnl, spotPnl, vegaPnl, net, curve, breakeven }
  }, [daysToExpiry, daysHeld, ivBefore, ivAfter, move])

  const win = r.net >= 0
  const rightButLost = move > 0 && r.net < 0

  return (
    <div className="interactive-box">
      <div className="interactive-header">Vol Crush Simulator</div>
      <p className="interactive-desc">
        You buy an at-the-money <strong>call</strong> on a $50 stock going into an event (results,
        an RBA call), paying an elevated implied vol. Then the event passes: the stock makes a{' '}
        <strong>move</strong> and implied vol <strong>collapses</strong>. See what your call is
        really worth — and why being right on direction may not be enough.
      </p>

      <div className="calc-inputs">
        <label>
          Days to expiry (at purchase)
          <input type="range" min={7} max={90} value={daysToExpiry} onChange={(e) => setDaysToExpiry(+e.target.value)} />{' '}
          <span>{daysToExpiry}d</span>
        </label>
        <label>
          Days held over event
          <input type="range" min={1} max={Math.max(2, daysToExpiry - 1)} value={Math.min(daysHeld, daysToExpiry - 1)} onChange={(e) => setDaysHeld(+e.target.value)} />{' '}
          <span>{daysHeld}d</span>
        </label>
        <label>
          Implied vol BEFORE %
          <input type="range" min={20} max={120} value={ivBefore} onChange={(e) => setIvBefore(+e.target.value)} />{' '}
          <span>{ivBefore}%</span>
        </label>
        <label>
          Implied vol AFTER %
          <input type="range" min={10} max={120} value={ivAfter} onChange={(e) => setIvAfter(+e.target.value)} />{' '}
          <span>{ivAfter}%</span>
        </label>
        <label>
          Stock move after event %
          <input type="range" min={-25} max={25} value={move} onChange={(e) => setMove(+e.target.value)} />{' '}
          <span>{move >= 0 ? '+' : ''}{move}%</span>
        </label>
      </div>

      <div
        className="sim-edge"
        style={{ borderColor: win ? 'var(--green)' : 'var(--red)', color: win ? 'var(--green)' : 'var(--red)' }}
      >
        {rightButLost
          ? `Stock rose +${move}% — you called the direction right — and the call STILL lost ${money(-r.net)}. The vol crush beat the move.`
          : win
            ? `Net ${money(r.net)}: the move (or the vol you kept) outran the crush.`
            : `Net ${money(r.net)}: time and the vol crush ate the premium.`}
      </div>

      {/* Value-vs-move curve */}
      <div style={{ height: 240, marginTop: 16 }}>
        <ResponsiveContainer>
          <LineChart data={r.curve} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
            <XAxis
              dataKey="move"
              tick={{ fill: 'var(--text-mute)', fontSize: 11 }}
              stroke="var(--border)"
              tickFormatter={(m) => `${m > 0 ? '+' : ''}${m}%`}
              ticks={[-25, -15, -5, 5, 15, 25]}
            />
            <YAxis
              tick={{ fill: 'var(--text-mute)', fontSize: 11 }}
              stroke="var(--border)"
              width={48}
              tickFormatter={(v) => `$${v.toFixed(0)}`}
            />
            <Tooltip content={<CrushTooltip />} />
            <ReferenceLine y={r.premium} stroke="var(--gold)" strokeDasharray="6 3" strokeOpacity={0.6} label={{ value: 'premium paid', position: 'insideTopLeft', fill: 'var(--gold)', fontSize: 10 }} />
            <ReferenceLine x={0} stroke="var(--border)" strokeOpacity={0.5} />
            <Line type="monotone" dataKey="nocrush" name="If IV held" stroke="var(--text-mute)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="crushed" name="After crush" stroke="#9775fa" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <ReferenceDot x={move} y={r.valueNow} r={5} fill={win ? 'var(--green)' : 'var(--red)'} stroke="var(--bg)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="sim-chart-caption">
        Call value vs the post-event move. Dashed grey = value <em>if implied vol had stayed put</em>;
        solid violet = value <em>after the crush</em>. The gap between them is the vega loss. Gold
        line = premium you paid; you only profit where the violet line sits above it. The dot is your
        current scenario.
        {r.breakeven !== null && (
          <> The stock must rise about <strong style={{ color: 'var(--text)' }}>+{r.breakeven}%</strong> just to break even after this crush.</>
        )}
      </div>

      <div className="calc-result" style={{ marginTop: 8 }}>
        <div className="calc-big" style={{ color: win ? 'var(--green)' : 'var(--red)' }}>{money(r.net)}</div>
        <div className="calc-label">
          net P&L · paid {money(r.premium)}, now worth {money(r.valueNow)}
        </div>
      </div>

      <div className="sim-breakdown">
        <div className="sim-row">
          <span>Spot move (delta + gamma)</span>
          <span style={{ color: r.spotPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{r.spotPnl >= 0 ? '+' : ''}{money(r.spotPnl)}</span>
        </div>
        <div className="sim-row">
          <span>Time decay (theta, {daysHeld}d)</span>
          <span style={{ color: r.thetaPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{r.thetaPnl >= 0 ? '+' : ''}{money(r.thetaPnl)}</span>
        </div>
        <div className="sim-row">
          <span>Implied-vol crush (vega, {ivBefore}%→{ivAfter}%)</span>
          <span style={{ color: r.vegaPnl >= 0 ? 'var(--green)' : 'var(--red)' }}>{r.vegaPnl >= 0 ? '+' : ''}{money(r.vegaPnl)}</span>
        </div>
        <div className="sim-row total">
          <span>Net</span>
          <span style={{ color: win ? 'var(--green)' : 'var(--red)' }}>{money(r.net)}</span>
        </div>
      </div>

      <div className="sim-vol-note">
        Set the move to <strong>+5%</strong> with a big crush (60%→35%) and the call still loses:
        you were right and it didn't matter. Now drag the move right — notice how far the stock has
        to travel just to claw back to the gold line. That distance <em>is</em> the crush, and it's
        why buying options right before an event is so often a trap. The opposite side — <em>selling</em>{' '}
        that vol — is lesson 5.
      </div>
    </div>
  )
}

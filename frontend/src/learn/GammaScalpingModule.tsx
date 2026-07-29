import { useState } from 'react'
import { MODULES } from './curriculum'
import { ResourceBox, ExampleBox, DidYouKnow } from './InteractiveElements'
import { GammaScalpingSimulator } from './GammaScalpingSimulator'

const mod = MODULES[7]

interface Props { onBack: () => void }

const LESSONS: Record<string, { title: string; content: React.ReactNode }> = {
  'options-primer': {
    title: 'Options in 90 seconds',
    content: (
      <>
        <p>Everything in this module sits on top of options, so here's the whole vocabulary in one screen. If you already trade options, skim to the next lesson.</p>
        <p>An <strong>option</strong> is a contract giving you the right — not the obligation — to buy or sell something at a fixed price by a fixed date.</p>
        <ul>
          <li><strong>Call:</strong> the right to <em>buy</em> at the strike. You want it if the price goes up.</li>
          <li><strong>Put:</strong> the right to <em>sell</em> at the strike. You want it if the price goes down.</li>
          <li><strong>Strike:</strong> the fixed price in the contract (e.g. a $80 crude call).</li>
          <li><strong>Expiry:</strong> the date the right runs out.</li>
          <li><strong>Premium:</strong> what you pay up front to own the option. This is the key cost.</li>
        </ul>
        <h4>Why the premium is really a price for "movement"</h4>
        <p>Two things drive an option's premium: how far the price sits from the strike, and <strong>how much the market expects the price to move</strong> before expiry. That expected movement is called <strong>implied volatility</strong> (implied vol, or IV). Higher expected movement → more valuable option → higher premium.</p>
        <p>Hold that thought. The entire trade in this module is: <em>you buy expected movement (implied vol) and try to collect more actual movement (realised vol) than you paid for.</em></p>
        <DidYouKnow>The premium you pay for an at-the-money option is, to a first approximation, proportional to implied volatility × √time. Buy a 3-month option and you're paying for three months of expected wiggling.</DidYouKnow>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> An option's premium is mostly a price tag on <em>future movement</em>. Learn to read it as "how much vol am I paying for?" and the rest of this module clicks into place.
        </div>
      </>
    ),
  },
  'delta-and-hedging': {
    title: 'Delta and delta-hedging',
    content: (
      <>
        <p><strong>Delta</strong> answers one question: if the underlying moves $1, how much does my option move? A call with a delta of 0.5 gains about $0.50 when crude rises $1. At-the-money options sit near 0.5 delta; deep in-the-money calls approach 1.0.</p>
        <p>Delta is your <em>directional</em> exposure. If you just buy a call and sit on it, you're making a bet that the price goes up. That's a fine bet — but it's a <em>direction</em> bet, not a <em>volatility</em> bet.</p>
        <h4>Neutralising the direction</h4>
        <p>Here's the pivotal move. Buy a call (delta +0.5), then <strong>sell 0.5 units of the underlying future</strong> against it. Your combined delta is now zero — <strong>delta-neutral</strong>. If the price ticks up or down a dollar, the gain on one leg is cancelled by the loss on the other. You no longer care which way the market goes.</p>
        <p>So what's left to care about? <strong>How much it moves.</strong> By hedging away the direction, you've converted a directional bet into a pure bet on volatility. That is the sentence the whole graphic is built around: <em>"Delta-hedged long options stop being a directional bet. The trade becomes realised vol versus implied vol."</em></p>
        <ExampleBox title="Why the hedge doesn't stay put">
          <p>Delta isn't constant. As crude rises, your call's delta drifts from 0.5 toward 0.7 — you're now net long again and have to sell more future to get back to neutral. As crude falls, delta drops to 0.3 and you buy future back. That constant re-hedging is where the money is made. The rate at which delta changes has a name — <strong>gamma</strong> — and it's the whole next lesson.</p>
        </ExampleBox>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Delta = direction. Hedge the delta to zero and the only thing left driving your P&L is how much the market actually moves. You've built a volatility instrument.
        </div>
      </>
    ),
  },
  'the-scalp': {
    title: 'The scalp: gamma vs theta',
    content: (
      <>
        <p>A long option has positive <strong>gamma</strong>: as the price rises your delta rises, as it falls your delta falls. Re-hedging to neutral therefore forces a beautiful discipline on you automatically.</p>
        <ul>
          <li><strong>Price rallies →</strong> your delta climbs positive → to get back to neutral you <strong>sell futures</strong> (into strength — sell high).</li>
          <li><strong>Price dips →</strong> your delta goes negative → to get back to neutral you <strong>buy futures</strong> (into weakness — buy low).</li>
          <li><strong>Re-hedge back to neutral</strong>, and repeat.</li>
        </ul>
        <p>Every round-trip locks in a small "buy low, sell high" profit on the hedge. This is the <strong>gamma scalp</strong>. You're not predicting anything — the hedging mechanically harvests each wiggle.</p>
        <h4>The catch: theta</h4>
        <p>If it were free money, everyone would do it. The cost is <strong>theta</strong> — time decay. Every day that passes, your option loses a slice of value, because there's less time left for movement. Theta is the daily rent you pay to be long gamma.</p>
        <p>So the trade is a race:</p>
        <div className="lesson-callout" style={{ borderColor: 'var(--green)' }}>
          <strong>You profit when the gamma you scalp each day &gt; the theta you bleed each day.</strong> The graphic's trophy line: "Long vol only works when hedge P&amp;L clears theta."
        </div>
        <p>Play with it below. Crank realised vol above implied and the scalp beats the rent; drop it below and theta grinds you down. Hit <strong>New path</strong> a few times at the same settings to feel how much luck is in a single trade.</p>
        <GammaScalpingSimulator />
        <DidYouKnow>Gamma and theta are two sides of one coin. For a delta-hedged option with no interest rates, theta ≈ −½ × gamma × (implied vol)² × price². You are literally paying, in theta, for the implied variance — and getting paid, in gamma, for the realised variance.</DidYouKnow>
      </>
    ),
  },
  'realized-vs-implied': {
    title: 'Realised vs implied vol',
    content: (
      <>
        <p>This is the heart of the whole thing, and it's worth stating as bluntly as possible.</p>
        <div className="lesson-callout" style={{ borderColor: 'var(--accent)' }}>
          When you buy and delta-hedge an option, your profit over its life is approximately:
          <div style={{ fontFamily: 'ui-monospace, monospace', margin: '10px 0', color: 'var(--text)' }}>
            P&amp;L ≈ ½ × Gamma × ( realised move² − implied move² )
          </div>
          summed over every step. You <strong>bought</strong> the implied move (that's the premium / theta). You <strong>collect</strong> the realised move (that's the gamma scalp). The difference is your edge.
        </div>
        <p>In plain words: <strong>implied vol is the price; realised vol is the payoff.</strong> Buy vol when you think the market will be more turbulent than the premium assumes. Sell vol (the opposite trade) when you think it'll be calmer.</p>
        <h4>Where the numbers come from</h4>
        <ul>
          <li><strong>Implied vol</strong> is quoted by the options market right now — it's baked into the premium. Before a big event (an OPEC meeting, an EIA inventory number, a company's earnings) implied vol is high because everyone expects fireworks.</li>
          <li><strong>Realised vol</strong> is what actually happened — measured after the fact from the price path. You only know it in hindsight, which is exactly why this is a forecasting game, not a free lunch.</li>
        </ul>
        <ExampleBox title="The classic setup">
          <p>Implied vol going into an event is often <em>too high</em> — the market overpays for insurance. A vol seller collects that premium. But sometimes the event is genuinely explosive and realised vol blows past implied — the vol buyer cleans up. Neither side is "right" in general; the edge is in judging when implied is mispriced relative to what will actually unfold.</p>
        </ExampleBox>
        <p>Try this in the simulator above (previous lesson): set implied and realised <em>equal</em>. Over many "New path" rolls the average net P&amp;L hovers near zero (minus costs). Now push realised above implied — the average turns green. That gap is the entire business.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Gamma scalping is long realised vol / short implied vol. You're not betting on direction — you're betting the market will move more (or less) than its own option prices say it will.
        </div>
      </>
    ),
  },
  'frequency-and-path': {
    title: 'Frequency & path dependency',
    content: (
      <>
        <p>Two subtleties separate the textbook from the trading desk. Both are in the graphic, and both cost real money.</p>
        <h4>1. How often do you re-hedge?</h4>
        <p>You can't hedge continuously — you have to choose a rule:</p>
        <ul>
          <li><strong>Clock-based:</strong> re-hedge on a schedule (every hour, every day). Simple and predictable, but you miss intraday swings that reverse before your next check — you leave scalps on the table.</li>
          <li><strong>Band-based:</strong> re-hedge only when your delta drifts past a threshold (say ±0.10). This harvests more of the path and adapts to volatility, but you trade more often, so you pay more in fees and bid-ask spread.</li>
        </ul>
        <p>In the simulator, the <strong>re-hedges per day</strong> slider is exactly this dial. Turn it up and the hedge tracks the path more tightly (more gamma captured) — but watch the transaction-cost line grow. The optimal frequency depends on your costs versus how much extra path you'd capture. There's no universal answer; it's a microstructure question.</p>
        <h4>2. The same realised vol can pay differently</h4>
        <p>Here's the non-obvious one. Two price paths can have <em>identical</em> realised volatility yet hand you very different scalping profits, because <strong>gamma isn't constant across price</strong>.</p>
        <ul>
          <li>Gamma is <strong>highest near the strike</strong> and <strong>near expiry</strong>. Movement there is worth a lot — a rich scalp.</li>
          <li>Gamma is <strong>low far from the strike</strong> ("in the wings"). The same-sized wiggles out there barely move your delta — a weak scalp.</li>
        </ul>
        <p>So a market that chops <em>around your strike</em> is gold; the identical amount of movement happening far above or below the strike is nearly worthless to you. Long vol is <strong>location- and time-sensitive</strong>, not just a number.</p>
        <ExampleBox title="Try it">
          <p>In the simulator, shrink <strong>days to expiry</strong> toward 5. Gamma spikes as expiry nears, so both your potential scalp and your theta bleed get more intense — the P&amp;L swings get wilder on each New path. That's the near-expiry, high-gamma corner of the graphic.</p>
        </ExampleBox>
        <h4>3. Where the edge leaks</h4>
        <p>Every re-hedge crosses the bid-ask spread and pays fees. In calm, trendless markets you re-hedge a lot for tiny scalps and costs quietly eat the lot. The graphic's last panel is blunt about it: <em>"slippage, fees, spread crossing can erase the edge."</em> Set the cost slider to 8–10 bps in the simulator and watch a winning trade turn red.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Realised vol tells you the size of the prize; <em>where</em> and <em>when</em> the movement happens, how often you hedge, and what each hedge costs decide how much of it you actually keep.
        </div>
      </>
    ),
  },
  'reality-check': {
    title: 'Reality check for an ASX investor',
    content: (
      <>
        <p>Time for honesty, because this module lives inside a long-only ASX stock tracker and gamma scalping is a professional derivatives strategy. Here's how the two actually relate.</p>
        <h4>Is this something you'd trade?</h4>
        <p>Realistically, probably not as a full delta-hedging operation. Gamma scalping earns its keep for market-makers and vol desks who pay institutional fees, hedge many positions at once to average out path luck, and watch screens all day. For a retail investor the transaction costs and time cost usually swamp the edge — which the simulator makes viscerally clear.</p>
        <h4>So why learn it?</h4>
        <p>Because it rewires how you see three things you <em>do</em> touch:</p>
        <ul>
          <li><strong>Options prices are volatility prices.</strong> If you ever buy a protective put on your ASX holdings or write covered calls for income, you're trading vol whether you name it or not. Knowing implied vs realised tells you if you're overpaying for insurance or underselling your upside.</li>
          <li><strong>Events are priced in advance.</strong> Implied vol rises before results, RBA decisions, and resource-sector catalysts, then collapses after ("vol crush"). This explains why an option can lose money even when you called the direction right.</li>
          <li><strong>"The trade isn't the direction" is a transferable idea.</strong> Separating <em>what you're exposed to</em> (direction, vol, time, rates) from <em>what you actually want to bet on</em> is the single most professionalising mental habit in markets.</li>
        </ul>
        <h4>The ASX-specific footnotes</h4>
        <ul>
          <li>Exchange-traded options exist on the ASX (ASX Clear) for the larger names and the index (XJO), but liquidity and spreads are far worse than US markets — the cost problem from the last lesson is <em>bigger</em> here, not smaller.</li>
          <li>Franking credits, CGT and the tax treatment of options add friction that the clean simulator ignores. Options income and hedging have their own ATO rules — get advice before trading them for real.</li>
        </ul>
        <div className="lesson-callout">
          <strong>Bottom line:</strong> Treat this as literacy, not a strategy to deploy. The payoff is that options, insurance, and event-driven moves stop being mysterious — you'll read a premium as a vol price and instantly ask "rich or cheap?"
        </div>
        <p style={{ color: 'var(--text-mute)', fontSize: 13, marginTop: 16 }}>
          None of this is financial advice. Options can lose money quickly and are not suitable for
          everyone. This module is educational.
        </p>
        <ResourceBox title="Go deeper" resources={[
          { name: 'Options, Futures, and Other Derivatives', author: 'John C. Hull', type: 'Textbook', note: 'The standard reference. Chapters on Greeks and dynamic hedging cover exactly this. Dense but definitive.' },
          { name: 'Volatility Trading', author: 'Euan Sinclair', type: 'Book', note: 'The practitioner\'s bible on trading realised vs implied vol, hedging frequency, and cost. The most direct follow-up to this module.' },
          { name: 'Dynamic Hedging', author: 'Nassim Taleb', type: 'Book', note: 'How options actually behave in the real world of gaps, jumps, and fat tails — the messy reality behind the clean formula.' },
          { name: 'ASX options education', author: 'ASX', type: 'Free course', note: 'Mechanics of exchange-traded options on the ASX — contract specs, margins, and how to actually place a trade locally.' },
          { name: 'Aswath Damodaran — option pricing lectures', author: 'NYU Stern (free on YouTube)', type: 'Lectures', note: 'The same Damodaran from the valuation module, on what really drives option value. Clear and intuition-first.' },
        ]} />
      </>
    ),
  },
}

export default function GammaScalpingModule({ onBack }: Props) {
  const [currentLesson, setCurrentLesson] = useState(0)
  const lesson = mod.lessons[currentLesson]
  const content = LESSONS[lesson.id]

  return (
    <div className="lesson-page">
      <div className="lesson-nav-top">
        <button className="lesson-back" onClick={onBack}>← All Modules</button>
        <span className="lesson-module-label" style={{ color: mod.accent }}>{mod.title}</span>
      </div>
      <div className="lesson-sidebar">
        {mod.lessons.map((l, i) => (
          <button key={l.id} className={`lesson-tab ${i === currentLesson ? 'active' : ''}`} onClick={() => setCurrentLesson(i)}>
            <span className="lt-num">{l.number}</span>
            <span className="lt-title">{l.title}</span>
            <span className="lt-time">{l.readingTime}</span>
          </button>
        ))}
      </div>
      <div className="lesson-content">
        <div className="lesson-header">
          <span className="lesson-num">Lesson {lesson.number} of {mod.lessons.length}</span>
          <h2>{content?.title ?? lesson.title}</h2>
          <span className="lesson-time">{lesson.readingTime} read</span>
        </div>
        <div className="lesson-body">{content?.content ?? <p>Content coming soon.</p>}</div>
        <div className="lesson-footer">
          {currentLesson > 0 && <button className="lesson-prev" onClick={() => setCurrentLesson(currentLesson - 1)}>← {mod.lessons[currentLesson - 1].title}</button>}
          <div style={{ flex: 1 }} />
          {currentLesson < mod.lessons.length - 1 && <button className="lesson-next" onClick={() => setCurrentLesson(currentLesson + 1)}>{mod.lessons[currentLesson + 1].title} →</button>}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { MODULES } from './curriculum'
import { ResourceBox, ExampleBox, DidYouKnow } from './InteractiveElements'
import { VolCrushSimulator } from './VolCrushSimulator'

const mod = MODULES[9]

interface Props { onBack: () => void }

const LESSONS: Record<string, { title: string; content: React.ReactNode }> = {
  'vega-primer': {
    title: 'Vega: the price of fear',
    content: (
      <>
        <p>The Options & Volatility module showed that an option's premium is really a price for <em>movement</em> — implied volatility. This module is about what happens when that price itself moves. The Greek that measures it is <strong>vega</strong>.</p>
        <div className="lesson-callout" style={{ borderColor: 'var(--accent)' }}>
          <strong>Vega</strong> = how many dollars your option gains or loses when implied volatility changes by one percentage point — with the stock price held still.
        </div>
        <p>If a call has a vega of $8 and implied vol drops from 60% to 45% (down 15 points), the call loses about 15 × $8 = <strong>$120</strong> — even if the stock hasn't moved a cent. That's pure vega. It's the sensitivity nobody warns beginners about, and it's where a huge share of surprise options losses come from.</p>
        <h4>Why implied vol moves at all</h4>
        <p>Implied vol is the market's collective guess about how much a stock will move in the future. That guess is emotional and it swings:</p>
        <ul>
          <li><strong>Fear rising</strong> (before a big unknown) → everyone wants options for protection or speculation → premiums bid up → implied vol <em>up</em>.</li>
          <li><strong>Uncertainty resolving</strong> (the event has happened) → demand for options evaporates → premiums fall → implied vol <em>down</em>.</li>
        </ul>
        <p>Long options are <strong>long vega</strong> — you profit if implied vol rises, lose if it falls. Short options (writing them) are <strong>short vega</strong> — the mirror image.</p>
        <DidYouKnow>Vega isn't actually a Greek letter — it's the odd one out among the "Greeks." It's highest for at-the-money options with lots of time left, and it shrinks to almost nothing as expiry approaches. That timing matters a lot for the vol crush.</DidYouKnow>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Direction (delta), time (theta) and movement-realised (gamma) aren't the whole story. Vega — your exposure to the <em>price of vol itself</em> — is a fourth force, and it can dominate all the others around events.
        </div>
      </>
    ),
  },
  'term-structure': {
    title: 'Event vol & the term structure',
    content: (
      <>
        <p>Implied vol isn't a single number — every expiry date has its own. Plot implied vol against time-to-expiry and you get the <strong>volatility term structure</strong>. Its shape tells you where the market expects turbulence.</p>
        <h4>How events bend the curve</h4>
        <p>When a known event sits on the calendar — a company's results, an RBA rate decision, a major project ruling — the options that <em>expire just after it</em> get bid up, because they must price in the jump the event could cause. You'll see a visible bump in implied vol around that date.</p>
        <p>This is <strong>event vol</strong>: a chunk of extra implied volatility that exists purely because of a scheduled unknown. It is, in effect, an insurance premium the market charges for carrying an option through the event.</p>
        <ExampleBox title="Why the short-dated option is 'expensive'">
          <p>Two weeks before results, a stock's near-dated implied vol might sit at 65% while its longer-dated vol is 35%. The near-dated option isn't mispriced — it's carrying one big, binary event in a short window, so per-day it's pricing enormous movement. Buy it and you're paying up for that event. If the event fizzles, that premium was money down the drain.</p>
        </ExampleBox>
        <h4>The asymmetry that sets the trap</h4>
        <p>Here's the setup for everything that follows: <strong>the event vol is baked into the premium before the event, and it disappears the instant the event passes.</strong> You buy high (elevated event vol) and, unless you do something about it, you're holding an asset whose vol component is about to evaporate on schedule. That scheduled evaporation is the vol crush.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Implied vol rises predictably into scheduled events and falls predictably out of them. Knowing this turns "why did my option lose money?" into "of course it did — I paid for event vol that then vanished."
        </div>
      </>
    ),
  },
  'vol-crush': {
    title: 'The vol crush',
    content: (
      <>
        <p>The <strong>vol crush</strong> (or "IV crush") is the sharp drop in implied volatility immediately after a scheduled event resolves. The uncertainty that justified the elevated premium is gone, so the premium deflates — often within minutes of the announcement.</p>
        <p>The classic case is earnings. A stock reports results after the close; overnight, implied vol on its options can fall from 70% to 35%. Every option holder is <strong>short that 35-point move in vega</strong> whether they wanted the exposure or not.</p>
        <h4>The three forces on your option, at once</h4>
        <p>When you hold a long option through an event, three things hit your P&L simultaneously:</p>
        <ul>
          <li><strong>Spot move (delta + gamma):</strong> did the stock move, and by how much? This <em>helps</em> a call if the stock rises.</li>
          <li><strong>Time decay (theta):</strong> a day or two passed. A small, steady drag.</li>
          <li><strong>Vol crush (vega):</strong> implied vol collapsed. This <em>hurts</em> any long option, hard.</li>
        </ul>
        <p>The question is always whether the spot move earns more than the crush destroys. The simulator below lets you set all three and watch them fight it out. Start at the default (+5% move, 60%→35% crush) — a winning direction call that still loses money — then drag the move until the call finally clears the premium.</p>
        <VolCrushSimulator />
        <DidYouKnow>This is why a strategy of "buy calls before earnings because I think the stock will go up" loses money so reliably. Retail traders bid implied vol up beforehand, then the crush takes it back. You have to be right on direction <em>and</em> by more than the market already paid for — a much higher bar than just guessing up or down.</DidYouKnow>
      </>
    ),
  },
  'right-still-lose': {
    title: 'Right on direction, still lose',
    content: (
      <>
        <p>This is the lesson that costs people the most money to learn the hard way, so let's make it concrete. <strong>You can be completely right about which way a stock moves and still lose on the option.</strong></p>
        <h4>Why "up" isn't enough</h4>
        <p>When you buy an option into an event, the market has already priced in an expected move — that's what the elevated implied vol <em>is</em>. To make money you don't just need the stock to move in your direction; you need it to move <strong>more than the market already charged you for.</strong> The breakeven isn't zero — it's out where the crushed-value curve climbs back above the premium you paid.</p>
        <div className="lesson-callout" style={{ borderColor: 'var(--accent)' }}>
          The market's implied move for an event is roughly <em>implied vol × √(time to expiry)</em>. If a stock's options imply a ±8% earnings move, then a +5% result is a <strong>disappointment</strong> relative to expectations — and your call can fall even though the stock rose.
        </div>
        <p>Go back to the simulator in the previous lesson and read the caption's breakeven number. With a heavy crush you'll often find the stock needs to rise 8–12% <em>just to get your premium back</em>. Anything less and you were right and still lost. That gap is the single most important intuition in this module.</p>
        <ExampleBox title="The three ways to actually win buying event vol">
          <ul>
            <li><strong>A move bigger than implied</strong> — the genuine surprise. Rare, by definition.</li>
            <li><strong>Sell before the crush</strong> — close the position ahead of the event and capture any run-up in implied vol without eating the collapse. You're trading vega, not the event.</li>
            <li><strong>Buy when implied vol is cheap</strong> — take the position when the market is complacent and event vol hasn't inflated yet.</li>
          </ul>
        </ExampleBox>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> "I think it'll go up" is not a reason to buy a call into results. The bar is "I think it'll move more than the ~±X% the options already imply." If you can't say that, you're paying for a crush.
        </div>
      </>
    ),
  },
  'which-side': {
    title: 'Which side to be on',
    content: (
      <>
        <p>Every trap for the buyer is an opportunity for the seller. If long options reliably lose to the vol crush, then <strong>selling</strong> options into events reliably collects it. So why doesn't everyone just sell?</p>
        <h4>The premium-seller's edge</h4>
        <p>Writing options (selling calls or puts, or spreads) makes you <strong>short vega and short gamma</strong>: you pocket the inflated event premium and profit as implied vol crushes and time decays. On average, across many events, implied vol tends to sit slightly <em>above</em> what actually gets realised — the "volatility risk premium." Sellers harvest that gap. It's the structural reason covered-call and put-selling strategies exist.</p>
        <h4>The catch that bankrupts sellers</h4>
        <p>The payoff is horribly asymmetric in the other direction. As a seller you collect small, steady premiums — and occasionally the event is a genuine bombshell and the stock gaps 30%. Now the crush doesn't save you; the <em>move</em> destroys you, and your losses can dwarf years of collected premiums. Selling naked options is <strong>picking up pennies in front of a steamroller</strong> — the same expectancy trap from the Position Sizing module, in options form.</p>
        <div className="lesson-callout" style={{ borderColor: 'var(--gold)' }}>
          Buyers of event vol have <strong>limited loss, rare big wins</strong>. Sellers have <strong>steady small wins, rare catastrophic losses</strong>. Neither is "better" — they're opposite risk shapes. The professional question is which one is <em>mispriced right now</em>, and how you cap the tail.
        </div>
        <h4>Capping the tail</h4>
        <p>This is why disciplined sellers almost never sell naked. They use <strong>defined-risk structures</strong> — spreads, iron condors — that keep the premium-selling edge but cap the catastrophe. And it ties straight back to the last module: <em>position sizing</em> is what keeps a seller alive through the one event that goes against them.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Vol crush makes selling event vol attractive on average, but the tail can ruin you. If you ever sell options, define your risk and size for the disaster, not the average.
        </div>
      </>
    ),
  },
  'vega-reality-check': {
    title: 'Reality check for an ASX investor',
    content: (
      <>
        <p>Unlike full-blown gamma scalping, vega and the vol crush touch decisions an ordinary ASX investor genuinely faces. Here's where.</p>
        <h4>Buying protection (puts)</h4>
        <p>If you buy put options to protect a holding through results or a market scare, you're buying vol — often <em>after</em> it has already spiked, which is exactly when it's most expensive. Protection bought in a panic can lose value fast once the panic subsides and vol crushes, even if the market keeps drifting down. The cheapest insurance is bought when nobody wants it.</p>
        <h4>Writing covered calls for income</h4>
        <p>Selling covered calls against ASX holdings is a popular income strategy, and it's a vega/vol-crush trade whether you call it that or not. Writing them when implied vol is elevated (into results) collects more premium and benefits from the crush — but caps your upside precisely when a good surprise could have run. Understanding event vol tells you <em>when</em> the premium is actually worth taking.</p>
        <h4>The ASX-specific footnotes</h4>
        <ul>
          <li><strong>Reporting season</strong> (February and August) is the big local vol-crush window — implied vol inflates into results and collapses after, stock by stock.</li>
          <li><strong>Resource catalysts</strong> — production reports, commodity-price shocks, project/FID rulings — and <strong>RBA decisions</strong> are the other recurring event-vol drivers in this market.</li>
          <li><strong>Liquidity</strong> on ASX single-stock options is thin outside the biggest names, so the bid-ask spread often costs more than the vega edge you were chasing. The index (XJO) is deeper.</li>
          <li><strong>Tax</strong>: options premiums, assignments and the interaction with franking and CGT have their own ATO treatment — get advice before trading them.</li>
        </ul>
        <div className="lesson-callout">
          <strong>Bottom line:</strong> You may never trade vol for its own sake, but the moment you buy protection or write a covered call you are trading it. Knowing vega and the crush tells you whether you're buying insurance cheap or dear, and whether the income you're selling is actually worth the upside you're giving up.
        </div>
        <p style={{ color: 'var(--text-mute)', fontSize: 13, marginTop: 16 }}>
          Educational only — not financial advice. Options can lose money quickly and are not
          suitable for everyone.
        </p>
        <ResourceBox title="Go deeper" resources={[
          { name: 'Option Volatility and Pricing', author: 'Sheldon Natenberg', type: 'Book', note: 'The classic on how vol actually trades — vega, the term structure, and event vol. The single best next read.' },
          { name: 'Volatility Trading', author: 'Euan Sinclair', type: 'Book', note: 'The volatility risk premium, why sellers get paid, and how to do it without blowing up. Pairs with lesson 5.' },
          { name: 'Options, Futures, and Other Derivatives', author: 'John C. Hull', type: 'Textbook', note: 'The rigorous reference for the Greeks, including vega and its behaviour near expiry.' },
          { name: 'ASX options education', author: 'ASX', type: 'Free course', note: 'Contract specs, covered calls and protective puts on the local market — the practical how-to for the ASX-specific notes above.' },
          { name: 'The Volatility Risk Premium', author: 'AQR / academic literature', type: 'Research', note: 'Evidence that implied vol tends to exceed realised — the structural edge behind selling options.' },
        ]} />
      </>
    ),
  },
}

export default function VegaModule({ onBack }: Props) {
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

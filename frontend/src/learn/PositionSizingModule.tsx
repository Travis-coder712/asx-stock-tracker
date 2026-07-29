import { useState } from 'react'
import { MODULES } from './curriculum'
import { ResourceBox, ExampleBox, DidYouKnow } from './InteractiveElements'
import { PositionSizingSimulator } from './PositionSizingSimulator'

const mod = MODULES[8]

interface Props { onBack: () => void }

const LESSONS: Record<string, { title: string; content: React.ReactNode }> = {
  'sizing-beats-selection': {
    title: 'Sizing beats selection',
    content: (
      <>
        <p>Every other strategy in this app answers one question: <em>what should I buy?</em> This module answers the one that actually decides whether you keep your money: <strong>how much of it should I put on each idea?</strong></p>
        <p>Here's the uncomfortable truth the professionals live by: <strong>two investors can pick the exact same stocks and one ends up rich while the other goes broke — purely because of how they sized their bets.</strong> Selection gets all the attention; sizing does most of the work.</p>
        <h4>The brutal maths of drawdowns</h4>
        <p>Losses and gains are not symmetric, and this is the single most important number in investing:</p>
        <ul>
          <li>Lose 10% → you need +11% to get back to even.</li>
          <li>Lose 25% → you need +33%.</li>
          <li>Lose 50% → you need <strong>+100%</strong> — the market has to double just to undo it.</li>
          <li>Lose 80% → you need +400%. You are effectively finished.</li>
        </ul>
        <p>A big loss doesn't just cost you the money — it costs you the <em>compounding</em> that money would have done for years. This is why avoiding catastrophic losses matters more than catching big winners, and bet size is your only lever on catastrophe.</p>
        <ExampleBox title="Same picks, opposite fates">
          <p>Two people both back a 55%-win-rate strategy. One risks 10% of their bankroll per trade; the other risks 60% chasing faster gains. Over 50 trades the disciplined one compounds steadily. The aggressive one hits an unlucky streak — which is <em>guaranteed</em> to happen eventually — and a couple of 60% bets in a row destroy the account it took years to build. Identical edge. One survives, one doesn't.</p>
        </ExampleBox>
        <DidYouKnow>Warren Buffett's rule 1 is "never lose money" and rule 2 is "never forget rule 1." It sounds glib, but it's really a statement about drawdown maths: the compounding machine only works if you never blow it up.</DidYouKnow>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Protecting against the big loss is worth more than chasing the big win, because recovery is asymmetric. Sizing — not selection — is how you protect against the big loss.
        </div>
      </>
    ),
  },
  'expectancy': {
    title: 'Expectancy: is your edge real?',
    content: (
      <>
        <p>Before you ask "how much should I bet?" you must answer "should I bet at all?" That's what <strong>expectancy</strong> tells you — the average amount you expect to make (or lose) per trade.</p>
        <div className="lesson-callout" style={{ borderColor: 'var(--accent)' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', color: 'var(--text)' }}>
            Expectancy = (Win% × Avg win) − (Loss% × Avg loss)
          </div>
        </div>
        <h4>A worked example</h4>
        <p>Suppose a strategy wins 45% of the time. When it wins, it makes +50%; when it loses, it loses −20%.</p>
        <ul>
          <li>Win side: 0.45 × 50% = +22.5%</li>
          <li>Loss side: 0.55 × 20% = −11.0%</li>
          <li><strong>Expectancy = +11.5% per trade.</strong> Positive — this is a real edge, despite <em>losing more often than it wins.</em></li>
        </ul>
        <p>That last point is the great liberation of thinking in expectancy: <strong>you do not need to be right most of the time.</strong> A low win rate with big winners and small losers (classic momentum / trend-following, like this app's Padley strategy) beats a high win rate with the payoff the wrong way round.</p>
        <ExampleBox title="The high-win-rate trap">
          <p>A strategy that wins 90% of the time sounds wonderful — until you learn it makes +2% on wins and loses −30% on the occasional loss. Expectancy = 0.90 × 2% − 0.10 × 30% = +1.8% − 3.0% = <strong>−1.2%</strong>. It <em>feels</em> like winning (you're right 9 times out of 10) while it quietly bleeds you dry. Picking up pennies in front of a steamroller.</p>
        </ExampleBox>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> No positive expectancy → no bet, at any size. Positive expectancy → now, and only now, the question becomes <em>how much</em>. That's the next lesson.
        </div>
      </>
    ),
  },
  'kelly': {
    title: 'The Kelly criterion',
    content: (
      <>
        <p>You've confirmed you have an edge. How much should you bet to grow your wealth as fast as possible without blowing up? In 1956 a Bell Labs physicist named <strong>John Kelly</strong> worked out the exact answer.</p>
        <p>The <strong>Kelly criterion</strong> gives the bet fraction that maximises the long-run <em>growth rate</em> of your bankroll. Bet less and you grow slower than you could; bet more and — counterintuitively — you also grow slower, because the losses compound against you. There's a single optimal point.</p>
        <div className="lesson-callout" style={{ borderColor: 'var(--gold)' }}>
          For a simple win/loss bet, the growth-optimal fraction solves
          <div style={{ fontFamily: 'ui-monospace, monospace', margin: '8px 0', color: 'var(--text)' }}>
            maximise&nbsp; p·ln(1 + f·w) + (1−p)·ln(1 + f·l)
          </div>
          where p = win probability, w = win %, l = loss % (negative), and f is your bet fraction. The peak of that curve is Kelly.
        </div>
        <p>You don't need to solve it by hand — the simulator does. But notice <em>why</em> it uses the logarithm: maximising log-wealth is the same as maximising the <strong>compound growth rate</strong>, and log punishes big losses savagely (ln of a near-wipeout is a huge negative). Kelly is, at heart, ruin-aversion baked into maths.</p>
        <p>Play with it. Set a real edge, then drag the bet fraction from tiny up to and past the Kelly number. Watch the median outcome rise, peak, then <em>fall</em> as ruin takes over — and hit "New futures" to see how much of any single result is luck.</p>
        <PositionSizingSimulator />
        <DidYouKnow>Ed Thorp — who beat blackjack and then ran a hedge fund that never had a losing year over decades — used Kelly sizing throughout. Claude Shannon (the father of information theory) helped him. Kelly comes from the maths of transmitting signal through a noisy channel; it turns out growing money and sending information are the same problem.</DidYouKnow>
      </>
    ),
  },
  'fractional-kelly': {
    title: 'Fractional Kelly & risk of ruin',
    content: (
      <>
        <p>Kelly is the growth-<em>maximising</em> bet — but almost no professional actually bets full Kelly. Understanding why is what separates a survivor from a statistic.</p>
        <h4>Full Kelly is a wild ride</h4>
        <p>Betting full Kelly produces gut-wrenching swings. Drawdowns of 50% or more are routine and expected — mathematically, at full Kelly you should expect to be <em>at least</em> halved from a peak roughly half the time. Almost no human can hold a position through that without panicking and abandoning the strategy at the worst moment. And the growth curve near the Kelly peak is nearly flat.</p>
        <h4>The half-Kelly sweet spot</h4>
        <p>Because the peak is flat, <strong>betting half of Kelly gives you about three-quarters of the growth for roughly a quarter of the volatility.</strong> That's an extraordinary trade: give up a little return, remove most of the terror. This is why "fractional Kelly" (half, or even quarter) is the practitioner's standard.</p>
        <div className="lesson-callout" style={{ borderColor: 'var(--gold)' }}>
          <strong>Under-betting is safe; over-betting is fatal.</strong> The cost of betting too small is slower growth. The cost of betting too big is <em>ruin</em> — and the two are not remotely symmetric. When unsure, always err smaller.
        </div>
        <h4>Risk of ruin</h4>
        <p>Even with a genuine edge, bet too large and ruin becomes not just possible but <em>certain</em> over enough trades. The simulator makes this visceral: with a real +edge, crank the bet fraction well above Kelly and watch the "paths wiped out" number climb toward 100%. You were right about the edge the entire time. It didn't save you.</p>
        <ExampleBox title="Why your estimates being wrong makes it worse">
          <p>Kelly assumes you know your true win rate and payoffs. You don't — you're estimating them from a noisy, limited history, and humans systematically over-estimate their own edge. If your <em>real</em> edge is smaller than you think, full Kelly on your optimistic estimate is actually <em>over</em>-betting. Fractional Kelly quietly protects you from your own overconfidence.</p>
        </ExampleBox>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Aim for a fraction — a half or a quarter — of the Kelly number, never more. You sacrifice a sliver of growth to buy survival and sanity, and survival is the whole game.
        </div>
      </>
    ),
  },
  'sizing-in-practice': {
    title: 'Sizing in practice',
    content: (
      <>
        <p>Clean win/loss bets are a teaching device. Real portfolios need practical rules. Here are the three that matter most.</p>
        <h4>1. Volatility-based sizing (equal risk, not equal dollars)</h4>
        <p>Putting $5,000 into a sleepy utility and $5,000 into a speculative miner is <em>not</em> equal risk — the miner can move three times as much, so it dominates your outcome. The professional fix is to size by volatility: <strong>put more dollars into calm positions and fewer into wild ones, so each contributes the same risk.</strong> A simple version: target a fixed dollar move (say "I'm willing to lose $500 if this hits my stop") and let the stop distance set the position size.</p>
        <h4>2. Correlation — the hidden concentration</h4>
        <p>Ten positions look diversified. But if they're all iron-ore miners, you don't have ten bets — you have <strong>one bet on the iron ore price, ten times over.</strong> Correlated holdings move together, so their risks add up instead of cancelling out. Real diversification comes from holding things that <em>don't</em> move together, not just from holding many things.</p>
        <ExampleBox title="From this app's own portfolios">
          <p>Look across the five strategies on the Strategies tab: <strong>FMG</strong> (Fortescue) shows up in the Padley, Damodaran and Quant portfolios simultaneously. If you naively ran all five strategies together, you'd be far more exposed to a single iron-ore stock than any one portfolio suggests. That's correlation quietly concentrating your risk — exactly the trap this lesson warns about.</p>
        </ExampleBox>
        <h4>3. Position caps</h4>
        <p>Regardless of what any formula says, most sensible investors cap any single position (commonly 5–15% of the portfolio) and any single theme or sector (say 25–30%). A cap is a crude tool, but it's a hard backstop against a concentrated bet or a correlation you didn't spot — and against your own conviction, which is often highest right before it's wrong.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Size by risk, not by dollars; treat correlated holdings as one bet; and cap every position and theme. These three rules do 90% of what fancy sizing maths does, with far less that can go wrong.
        </div>
      </>
    ),
  },
  'sizing-reality-check': {
    title: 'A sane rule for a retail investor',
    content: (
      <>
        <p>You don't need to run Monte-Carlo simulations before every trade. Here's a robust, boring framework that captures almost all the benefit and is genuinely usable on the ASX.</p>
        <h4>A starter framework</h4>
        <ul>
          <li><strong>Only bet on a real edge.</strong> If you can't state your positive expectancy in one sentence, it's a punt — size it like entertainment money or skip it.</li>
          <li><strong>Cap any single stock at ~10% of the portfolio.</strong> Simple, hard to break, saves you from your best ideas.</li>
          <li><strong>Cap any theme (a sector, a commodity, a factor) at ~25–30%.</strong> This is where correlation bites — count FMG, BHP and RIO as mostly one bet.</li>
          <li><strong>Risk a fixed small % per idea (e.g. 1–2% of the portfolio) to your stop.</strong> Let the stop distance decide the dollar size, so volatile names automatically get smaller.</li>
          <li><strong>If you use a formula, use a fraction of Kelly — a quarter or a half, never full.</strong> Your edge estimate is noisier than you think.</li>
          <li><strong>Rebalance back to your caps periodically.</strong> Winners grow into oversized bets; trimming them is disciplined, not defeatist (mind the CGT — see the "What to Watch Out For" module).</li>
        </ul>
        <h4>Honest caveats</h4>
        <ul>
          <li>Kelly assumes you can estimate your edge. For discretionary stock-picking you really can't, precisely — so lean conservative and treat the simulator as intuition-building, not a calculator to obey.</li>
          <li>Real returns have fat tails and gaps (stocks can open 40% down on news). The clean simulator understates how bad the worst days are, which is another argument for betting smaller than the maths suggests.</li>
          <li>Tax, brokerage and franking all interact with rebalancing on the ASX. Frequent trimming has real costs.</li>
        </ul>
        <div className="lesson-callout">
          <strong>Bottom line:</strong> You will spend most of your energy deciding <em>what</em> to buy. The evidence says most of your <em>result</em> comes from <em>how much</em> you buy and whether you avoid the account-ending loss. Get sizing roughly right and you've already beaten most investors who obsess only over selection.
        </div>
        <p style={{ color: 'var(--text-mute)', fontSize: 13, marginTop: 16 }}>
          Educational only — not financial advice. Position sizing does not eliminate the risk of
          loss; it manages it.
        </p>
        <ResourceBox title="Go deeper" resources={[
          { name: 'Fortune’s Formula', author: 'William Poundstone', type: 'Book', note: 'The story of Kelly, Shannon and Thorp — the most readable way in. Start here.' },
          { name: 'A Man for All Markets', author: 'Edward O. Thorp', type: 'Memoir', note: 'The blackjack-and-hedge-fund legend who actually lived by Kelly sizing. Practical and inspiring.' },
          { name: 'The Kelly Capital Growth Investment Criterion', author: 'MacLean, Thorp & Ziemba', type: 'Academic', note: 'The definitive technical collection. For when you want the real maths and evidence.' },
          { name: 'Trade Your Way to Financial Freedom', author: 'Van K. Tharp', type: 'Book', note: 'Position sizing and expectancy aimed squarely at the retail trader. Less rigorous, very practical.' },
          { name: 'Michael Mauboussin — essays', author: 'Counterpoint Global / Columbia', type: 'Free essays', note: 'On process vs outcome and the role of luck — the mindset that makes sizing discipline stick.' },
        ]} />
      </>
    ),
  },
}

export default function PositionSizingModule({ onBack }: Props) {
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

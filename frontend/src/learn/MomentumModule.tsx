import { useState } from 'react'
import { MODULES } from './curriculum'
import { ResourceBox, ExampleBox, DidYouKnow } from './InteractiveElements'

const mod = MODULES[1]

interface Props { onBack: () => void }

const LESSONS: Record<string, { title: string; content: React.ReactNode }> = {
  'what-is-momentum': {
    title: 'What is momentum investing?',
    content: (
      <>
        <p>Momentum investing is built on a simple observation: <strong>stocks that have been going up tend to keep going up, and stocks that have been going down tend to keep going down</strong>. At least for a while.</p>
        <p>This isn't just folklore — it's one of the most documented phenomena in finance. Academics Jegadeesh and Titman published their landmark study in 1993, showing that buying recent winners and selling recent losers generated significant returns over 3-12 month horizons.</p>
        <h4>Why does momentum persist?</h4>
        <ul>
          <li><strong>Underreaction:</strong> Markets are slow to fully price in good news. When a company beats earnings, the stock jumps — but often not enough. It drifts up over the following weeks as more investors notice</li>
          <li><strong>Herding:</strong> Investors follow each other. When fund managers see a stock rising, they add it to their portfolios, pushing it higher</li>
          <li><strong>Confirmation loops:</strong> Rising prices attract positive analyst coverage, which attracts more buyers, which pushes prices higher</li>
        </ul>
        <h4>The evidence on the ASX</h4>
        <p>Look at this app's Padley Momentum strategy — it picked the 10 highest-momentum stocks in January 2024 and returned <strong>+24.9%</strong> in the first 6 months alone. The strategy compounds well in rising markets because momentum feeds on itself.</p>
        <ExampleBox title="From this app's data">
          <p>PME (Pro Medicus) had +78% momentum when selected in H1 2024. It was the top momentum pick. Six months later, it was still leading. But by H2 2025, the same momentum that drove it up started driving it sideways. Momentum stocks are exciting on the way up — and painful on the way down.</p>
        </ExampleBox>
        <DidYouKnow>The momentum effect was first documented on the US market, but it's been confirmed on every major stock exchange in the world — including the ASX. It even works across asset classes (currencies, commodities, bonds).</DidYouKnow>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Momentum is real, well-documented, and exploitable — but it reverses suddenly. The same H1 2024 picks eventually gave back gains by H1 2026 (-10.7%). Momentum is a tool, not a religion.
        </div>
      </>
    ),
  },
  'key-indicators': {
    title: 'Key indicators',
    content: (
      <>
        <p>Momentum investors use a handful of indicators to identify and confirm trends. You don't need all of them — but you need to understand what they're telling you.</p>
        <h4>1. Moving averages</h4>
        <p>The <strong>200-day moving average (200 MA)</strong> is the most important single indicator. It smooths out daily noise and shows the underlying trend.</p>
        <ul>
          <li><strong>Price above 200 MA:</strong> The trend is up — "risk on." This app's Padley strategy only buys when the ASX 100 is above its 200-day MA</li>
          <li><strong>Price below 200 MA:</strong> The trend is down — "risk off." Go to cash</li>
          <li><strong>The 50/200 crossover ("Golden Cross" and "Death Cross"):</strong> When the 50-day MA crosses above the 200-day, it's a bullish signal (and vice versa)</li>
        </ul>
        <h4>2. RSI (Relative Strength Index)</h4>
        <p>RSI measures how overbought or oversold a stock is on a scale of 0-100:</p>
        <ul>
          <li><strong>Above 70:</strong> Overbought — the stock may be due for a pullback</li>
          <li><strong>Below 30:</strong> Oversold — the stock may be due for a bounce</li>
          <li><strong>Between 40-60:</strong> Neutral territory</li>
        </ul>
        <p>RSI is useful for timing entries. Even in an uptrend, you don't want to buy at peak RSI.</p>
        <h4>3. Volume</h4>
        <p>Volume confirms price moves. A stock rising on <em>high volume</em> is more convincing than one rising on thin trading. Think of volume as conviction — how many people are backing this move with real money?</p>
        <h4>4. 12-month return</h4>
        <p>The simplest momentum measure: how much has the stock risen in the past 12 months? This app's Padley strategy ranks stocks by this metric. PME (Pro Medicus) topped the list at +78% momentum when selected in H1 2024.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> The 200-day MA is the one indicator every investor should watch. It won't catch every top or bottom, but it keeps you on the right side of major trends and out of crashes.
        </div>
      </>
    ),
  },
  'padley-approach': {
    title: 'The Padley approach',
    content: (
      <>
        <p>Marcus Padley runs Marcus Today, one of Australia's most-followed stock newsletters. His approach combines <strong>momentum with capital preservation</strong> — he's happy to go 100% cash when conditions deteriorate.</p>
        <h4>The screening filters</h4>
        <p>Padley doesn't just chase any stock that's going up. He filters for quality first:</p>
        <ul>
          <li><strong>Positive earnings:</strong> The company must be profitable (EPS &gt; 0)</li>
          <li><strong>ROE &gt; 10%:</strong> The business must generate decent returns on equity — no struggling companies</li>
          <li><strong>Market cap &gt; $1B:</strong> Larger companies only — small caps are too volatile and illiquid</li>
          <li><strong>Positive 12-month return:</strong> Must be in an uptrend</li>
        </ul>
        <p>Then he ranks by momentum — the stocks with the strongest price gains over the past year.</p>
        <h4>The capital preservation rule</h4>
        <p>This is what distinguishes Padley from pure momentum: <strong>if the market itself is falling, he goes to cash</strong>. In this app, if the ASX 100 breaks below its 200-day moving average, the Padley strategy sells everything and waits.</p>
        <p>His MT20 portfolio has achieved ~20% p.a. returns partly because it <em>avoids</em> the worst drawdowns. Missing the bottom 10 trading days of each year is more valuable than catching the top 10.</p>
        <h4>How the app models this</h4>
        <p>In January 2024, the ASX 100 was above its 200-day MA (risk on), so the strategy went fully invested. The top picks — PME (+78%), REA (+71%), CAR (+59%) — were all high-quality, high-momentum names. The result: +24.9% in six months.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Padley's edge isn't just picking winners — it's knowing when to step aside. The discipline to go to cash when the market turns is what protects the compounding over years.
        </div>
      </>
    ),
  },
  'momentum-risks': {
    title: 'Momentum risks',
    content: (
      <>
        <p>Momentum works — until it doesn't. Understanding when and why it fails is as important as understanding why it works.</p>
        <h4>1. Momentum reversal (the crash)</h4>
        <p>Momentum strategies are vulnerable to sudden reversals. When the market turns, the stocks that went up the most often fall the fastest. Look at the Padley strategy's H2 2025 period: -3.2%. And H1 2026: -10.7%. The very stocks that led the rally led the decline.</p>
        <h4>2. Whipsaws</h4>
        <p>When the market chops sideways — neither trending up nor down — momentum signals generate false starts. You buy because the stock is rising, it reverses, you sell at a loss, then it starts rising again. Each round-trip costs you brokerage and spread.</p>
        <h4>3. Late entry</h4>
        <p>By definition, you're buying stocks that have <em>already</em> gone up. If you enter too late in the trend, you're the last buyer before the reversal. The "What If You Held Longer?" data shows this clearly: H1 2024 momentum picks returned +89% at 18 months, but by 24 months had given back to +75%. The trend was already mature when selected.</p>
        <h4>4. Factor crowding</h4>
        <p>When too many investors use the same momentum signals, the strategy gets crowded. Everyone buys the same stocks, pushing them to unsustainable levels, and when they all try to exit at once, the crash is amplified.</p>
        <h4>5. High turnover costs</h4>
        <p>Momentum portfolios need to rebalance frequently — in this app, every 6 months. Each rebalance triggers potential CGT events. The CGT discount (50% for assets held over 12 months) partially mitigates this, but it's still a drag that index funds don't have.</p>
        <h4>How to manage these risks</h4>
        <ul>
          <li><strong>Stop losses:</strong> Define your maximum acceptable loss per position (e.g., 15%) and stick to it</li>
          <li><strong>Position sizing:</strong> Don't put more than 10-15% of your portfolio in any single momentum stock</li>
          <li><strong>Market-level risk-off:</strong> Follow Padley's approach — when the market itself turns, go to cash</li>
          <li><strong>Diversify across strategies:</strong> This is why this app tests 5 different approaches. When momentum fails, value strategies often pick up</li>
        </ul>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Momentum is highest-return and highest-risk. The Padley strategy in this app returned +64% cumulatively — best of all five — but had the deepest drawdown periods. It's not for everyone, and it's definitely not a "set and forget" approach.
        </div>
        <ResourceBox title="Further reading" resources={[
          { name: 'Marcus Today Newsletter', author: 'Marcus Padley', type: 'Newsletter', note: 'The source — Padley\'s daily market commentary and MT20 portfolio. Paid subscription, 14-day free trial.' },
          { name: 'Returns to Buying Winners and Selling Losers', author: 'Jegadeesh & Titman (1993)', type: 'Paper', note: 'The landmark academic paper that proved momentum exists. Dense but foundational.' },
          { name: 'Dual Momentum Investing', author: 'Gary Antonacci', type: 'Book', note: 'Combines absolute and relative momentum. Practical, implementable approach.' },
        ]} />
      </>
    ),
  },
}

export default function MomentumModule({ onBack }: Props) {
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

import { useState } from 'react'
import { MODULES } from './curriculum'
import { FrankingCalculator, ResourceBox, DidYouKnow } from './InteractiveElements'

const mod = MODULES[4]
interface Props { onBack: () => void }

const LESSONS: Record<string, { title: string; content: React.ReactNode }> = {
  'why-dividends': {
    title: 'Why dividends matter',
    content: (
      <>
        <p>In Australia, dividends aren't just income — they're a <strong>tax-advantaged income stream</strong> that makes our market uniquely attractive for income investors.</p>
        <h4>The numbers</h4>
        <p>The ASX 200 has a dividend yield of roughly 4% — one of the highest among developed markets. Compare that to the S&P 500 at ~1.5% or the FTSE 100 at ~3.5%. Australian companies pay out a higher proportion of profits as dividends.</p>
        <h4>Why franking credits change everything</h4>
        <p>Module 1 introduced franking credits. Let's go deeper with a real example from this app's holdings.</p>
        <p><strong>FMG (Fortescue)</strong> — 6.1% dividend yield, fully franked:</p>
        <div className="lesson-table">
          <table>
            <thead><tr><th>Scenario</th><th>Unfranked 6.1%</th><th>Fully franked 6.1%</th></tr></thead>
            <tbody>
              <tr><td>Cash dividend on $10,000</td><td>$610</td><td>$610</td></tr>
              <tr><td>Franking credit</td><td>$0</td><td>$261</td></tr>
              <tr><td>Grossed-up income</td><td>$610</td><td>$871</td></tr>
              <tr><td>Tax at 32.5%</td><td>$198</td><td>$283</td></tr>
              <tr><td>Less franking credit</td><td>$0</td><td>-$261</td></tr>
              <tr><td><strong>Tax payable</strong></td><td><strong>$198</strong></td><td><strong>$22</strong></td></tr>
              <tr><td><strong>After-tax income</strong></td><td><strong>$412</strong></td><td><strong>$588</strong></td></tr>
              <tr><td><strong>Effective tax rate</strong></td><td><strong>32.5%</strong></td><td><strong>3.6%</strong></td></tr>
            </tbody>
          </table>
        </div>
        <p>The fully franked dividend delivers <strong>43% more after-tax income</strong> than the same yield unfranked. For investors in lower tax brackets (or superannuation at 15%), the advantage is even larger — some receive a <em>refund</em> from the ATO.</p>
        <h4>Dividends as a signal</h4>
        <p>Companies that pay consistent, growing dividends are signalling confidence in their future earnings. Cutting a dividend is one of the most negative signals a company can send — boards avoid it at almost any cost. This makes dividend history a useful quality filter.</p>
        <FrankingCalculator />
        <DidYouKnow>Australia is one of only a handful of countries with a full dividend imputation system. New Zealand has a partial system. Most countries (US, UK, Europe) double-tax corporate profits — once at the company level, again in the shareholder's hands.</DidYouKnow>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> On the ASX, a 4% fully franked yield delivers more after-tax income than a 5.5% savings account for most taxpayers. The Dividend Income strategy in this app returned +13% cumulatively — not the highest, but with the steadiest income stream and lowest volatility.
        </div>
        <ResourceBox title="Further reading" resources={[
          { name: 'ATO Dividend Imputation Guide', type: 'Website', note: 'Official ATO guidance on how franking credits work in your tax return.' },
          { name: 'Motivated Money', author: 'Peter Thornhill', type: 'Book', note: 'Australian classic on dividend investing. Thornhill advocates 100% equities with dividend reinvestment.' },
          { name: 'Get Started Investing Podcast', author: 'Equity Mates', type: 'Podcast', note: 'Ep 15-18 cover dividends and franking in plain language.' },
        ]} />
      </>
    ),
  },
  'sustainability': {
    title: 'Dividend sustainability',
    content: (
      <>
        <p>A high dividend yield is meaningless if the company can't sustain it. The most important question isn't "how much does it pay?" but "can it keep paying?"</p>
        <h4>The four tests</h4>
        <p><strong>1. Payout ratio</strong></p>
        <p>What percentage of earnings is paid as dividends? The Dividend Income strategy filters for payout ratio &lt; 80%. Above 80%, the company is paying out almost everything it earns — leaving no buffer for bad years and no capital for growth.</p>
        <ul>
          <li><strong>&lt; 50%:</strong> Very sustainable — plenty of room to grow the dividend</li>
          <li><strong>50-70%:</strong> Healthy — standard for mature ASX companies</li>
          <li><strong>70-80%:</strong> Stretching — sustainable only if earnings are stable</li>
          <li><strong>&gt; 80%:</strong> Risky — one bad quarter and the dividend gets cut</li>
        </ul>
        <p><strong>2. Free cash flow coverage</strong></p>
        <p>Earnings can be manipulated with accounting choices. Free cash flow (FCF) — actual cash generated after capital expenditure — is harder to fake. If FCF doesn't cover the dividend, the company is borrowing to pay shareholders. That's unsustainable.</p>
        <p><strong>3. Earnings stability</strong></p>
        <p>A mining company with a 6% yield might look attractive — but if its earnings swing 50% year-to-year with commodity prices, the dividend is only as stable as the iron ore price. Banks and utilities have more predictable earnings, making their dividends more reliable.</p>
        <p><strong>4. Dividend growth history</strong></p>
        <p>This app's strategy requires DPS (dividends per share) growth &gt; 0 over 3 years. A company that has grown its dividend for 3+ consecutive years is signalling both ability and willingness to keep paying. Companies like MQG, JBH, and IAG have long histories of progressive dividends.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> The best dividend stocks aren't the highest-yielding — they're the ones that can sustain and grow their payouts. A 3.5% yield that grows 8% per year is worth more than a 6% yield that gets cut next year.
        </div>
      </>
    ),
  },
  'yield-traps': {
    title: 'Dividend traps',
    content: (
      <>
        <p>A "dividend trap" is a stock with a high yield that's about to be cut. The yield looks attractive <em>because the price has already fallen</em> in anticipation of the cut — you're the last person to notice.</p>
        <h4>How traps form</h4>
        <p>Imagine a stock trading at $10 that pays $0.50 in dividends (5% yield). Bad news hits — profits will halve. The stock falls to $6. Now the yield is $0.50 / $6 = 8.3%. Looks amazing! But the next dividend will be $0.25 (or zero), and the stock might fall further.</p>
        <p>The high yield was a mirage — it reflected the <em>old</em> dividend on the <em>new</em> (lower) price.</p>
        <h4>Warning signs</h4>
        <ul>
          <li><strong>Yield significantly above sector average:</strong> If a bank yields 8% when its peers yield 5%, the market is pricing in a cut</li>
          <li><strong>Payout ratio above 90%:</strong> There's no margin to maintain the dividend if earnings dip even slightly</li>
          <li><strong>Declining earnings:</strong> If revenue and profit are shrinking, the dividend will eventually follow</li>
          <li><strong>Rising debt:</strong> If the company is borrowing to pay dividends, it's running on borrowed time (literally)</li>
          <li><strong>One-off special dividends inflating yield:</strong> A special dividend from selling an asset isn't recurring income</li>
        </ul>
        <h4>Real examples from the ASX</h4>
        <p>AMP was a classic dividend trap — high yield, decades of history, but a business in structural decline. Investors who bought for the yield watched both the dividend and the share price halve.</p>
        <p>Telstra (TLS) cut its dividend in 2017 from 31c to 22c — a 29% reduction. The yield had been "attractive" at 5%+, but the underlying business (NBN impact, mobile competition) couldn't support it.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> If a yield looks too good to be true, it probably is. This app's Dividend Income strategy protects against traps by requiring payout ratio &lt; 80% and positive EPS — simple filters that screen out most traps before they hurt you.
        </div>
      </>
    ),
  },
}

export default function DividendModule({ onBack }: Props) {
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
            <span className="lt-num">{l.number}</span><span className="lt-title">{l.title}</span><span className="lt-time">{l.readingTime}</span>
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

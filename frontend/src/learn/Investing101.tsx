import { useState } from 'react'
import { MODULES } from './curriculum'
import { CompoundCalculator, ResourceBox, ExampleBox, DidYouKnow } from './InteractiveElements'

const mod = MODULES[0]

interface Props {
  onBack: () => void
}

const LESSONS: Record<string, { title: string; content: React.ReactNode }> = {
  'what-is-a-share': {
    title: 'What is a share?',
    content: (
      <>
        <p>When you buy a share in a company like BHP or CSL, you're buying a tiny piece of ownership. You literally become a part-owner of that business.</p>
        <p>That ownership gives you two things:</p>
        <ul>
          <li><strong>A claim on profits</strong> — if the company makes money, you're entitled to a share of it (paid as dividends, or reinvested to grow the business)</li>
          <li><strong>A vote</strong> — you can vote on major decisions at the annual general meeting (though with one share among millions, your vote is symbolic)</li>
        </ul>
        <h4>Why do share prices move?</h4>
        <p>A share's price is simply what someone is willing to pay for it right now. Prices move because of:</p>
        <ul>
          <li><strong>Earnings</strong> — if a company earns more than expected, people want to own it, pushing the price up</li>
          <li><strong>Expectations</strong> — prices reflect what people <em>think</em> will happen, not just what has happened</li>
          <li><strong>Interest rates</strong> — when rates rise, cash in the bank becomes more attractive, and share prices tend to fall</li>
          <li><strong>Sentiment</strong> — fear and greed. Markets overshoot in both directions</li>
        </ul>
        <ExampleBox title="Real example: CSL Limited">
          <p>CSL (ASX:CSL) makes blood plasma products. In 2000, it traded at ~$10. By 2024, it was ~$300. That 30x return wasn't luck — CSL grew its earnings every single year for two decades. The share price followed the earnings. That's what "owning a business" means in practice.</p>
        </ExampleBox>
        <DidYouKnow>There are over 2,000 companies listed on the ASX, but the top 20 make up about 45% of the total market value. BHP, CBA, and CSL alone account for roughly 15%.</DidYouKnow>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> A share is not a lottery ticket — it's a piece of a real business. The price should, over time, reflect what that business earns.
        </div>
      </>
    ),
  },
  'how-the-asx-works': {
    title: 'How the ASX works',
    content: (
      <>
        <p>The Australian Securities Exchange (ASX) is where buyers and sellers of shares meet. It's been operating since 1987 (when six state exchanges merged).</p>
        <h4>Key mechanics</h4>
        <ul>
          <li><strong>Market hours:</strong> 10:00 AM – 4:00 PM AEST, Monday to Friday</li>
          <li><strong>Settlement:</strong> T+2 — when you buy, the shares land in your account two business days later</li>
          <li><strong>Brokers:</strong> You need a broker to trade. Online brokers (CommSec, SelfWealth, Stake) charge $5–$20 per trade</li>
          <li><strong>CHESS:</strong> Australia's electronic settlement system. Your shares are held in your name (not the broker's), which is safer than many overseas markets</li>
        </ul>
        <h4>Indices — the scoreboard</h4>
        <ul>
          <li><strong>ASX 200 (S&P/ASX 200):</strong> The top 200 companies by market cap — the main benchmark</li>
          <li><strong>ASX 100:</strong> The top 100 — used for AGL's TSR comparison (as you can see in this app)</li>
          <li><strong>All Ordinaries:</strong> Broader index, ~500 companies</li>
        </ul>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> The ASX is well-regulated and transparent. CHESS holding means your shares are in your name — a significant advantage over US-style "street name" holding.
        </div>
      </>
    ),
  },
  'risk-and-return': {
    title: 'Risk vs return',
    content: (
      <>
        <p>This is the single most important concept in investing: <strong>higher potential returns always come with higher risk</strong>. There is no free lunch.</p>
        <h4>The spectrum</h4>
        <div className="lesson-table">
          <table>
            <thead><tr><th>Asset</th><th>Typical return</th><th>Risk level</th></tr></thead>
            <tbody>
              <tr><td>Savings account</td><td>4–5% p.a.</td><td>Virtually zero</td></tr>
              <tr><td>Government bonds</td><td>4–5% p.a.</td><td>Very low</td></tr>
              <tr><td>ASX 200 index (shares)</td><td>8–10% p.a. (long-term avg)</td><td>Moderate</td></tr>
              <tr><td>Individual shares</td><td>-100% to +1000%</td><td>High</td></tr>
              <tr><td>Speculative small caps</td><td>-100% to +10,000%</td><td>Very high</td></tr>
            </tbody>
          </table>
        </div>
        <h4>What "risk" actually means</h4>
        <p>Risk isn't just "you might lose money." It's <strong>volatility</strong> — how much the price bounces around. A stock that swings 30% in a month is riskier than one that moves 5%, even if both end up at the same price.</p>
        <p>The danger is that volatility can <em>force</em> bad decisions. If your $10,000 investment drops to $7,000, can you hold on? Most people can't — and that's where the real losses happen.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Only invest money you won't need for 5+ years. The ASX has never lost money over any 10-year period in its history — but it's dropped 40%+ in single years.
        </div>
      </>
    ),
  },
  'compound-interest': {
    title: 'The power of compounding',
    content: (
      <>
        <p>Einstein (allegedly) called compound interest the eighth wonder of the world. Whether he said it or not, the maths is extraordinary.</p>
        <h4>A simple example</h4>
        <p>Invest $5,000 at 8% per year (the long-term ASX average including dividends):</p>
        <div className="lesson-table">
          <table>
            <thead><tr><th>Years</th><th>Value</th><th>Growth</th></tr></thead>
            <tbody>
              <tr><td>0</td><td>$5,000</td><td>—</td></tr>
              <tr><td>5</td><td>$7,347</td><td>+47%</td></tr>
              <tr><td>10</td><td>$10,795</td><td>+116%</td></tr>
              <tr><td>20</td><td>$23,305</td><td>+366%</td></tr>
              <tr><td>30</td><td>$50,313</td><td>+906%</td></tr>
            </tbody>
          </table>
        </div>
        <p>The magic is in the last decade. From year 20 to year 30, you gained $27,000 — more than the first 20 years combined. That's compounding: you earn returns on your returns.</p>
        <h4>The real lesson</h4>
        <p><strong>Time is your most valuable asset.</strong> Starting 10 years earlier is worth more than doubling your investment amount. A 25-year-old who invests $200/month beats a 35-year-old who invests $400/month — by retirement.</p>
        <CompoundCalculator />
        <DidYouKnow>If you invested $5,000 in the ASX 200 at the bottom of the GFC (March 2009) and reinvested all dividends, you'd have over $35,000 by 2024. Time in market, not timing the market.</DidYouKnow>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Start now, even with small amounts. The app's Dividend Income strategy shows how $5,000 grew to $5,648 in just 2.5 years — compounding dividends reinvested into more shares.
        </div>
      </>
    ),
  },
  'diversification': {
    title: 'Diversification',
    content: (
      <>
        <p>Diversification is often called "the only free lunch in investing." It's the idea that spreading your money across different investments reduces risk without necessarily reducing returns.</p>
        <h4>Why it works</h4>
        <p>Different stocks move for different reasons. When mining stocks fall (commodity prices drop), healthcare stocks might rise (aging population). By owning both, your overall portfolio is smoother.</p>
        <h4>How much is enough?</h4>
        <ul>
          <li><strong>1 stock:</strong> Extremely risky — one bad earnings report and you lose 30%</li>
          <li><strong>10 stocks:</strong> Significantly less risky — this is what each strategy in this app holds</li>
          <li><strong>20–30 stocks:</strong> Most of the diversification benefit captured</li>
          <li><strong>200+ stocks (index fund):</strong> Maximum diversification, market-average returns</li>
        </ul>
        <h4>Diversification that matters</h4>
        <p>It's not just about the number of stocks — it's about <em>different types</em> of stocks:</p>
        <ul>
          <li>Different <strong>sectors</strong> (banks, miners, tech, healthcare)</li>
          <li>Different <strong>sizes</strong> (large caps vs small caps)</li>
          <li>Different <strong>styles</strong> (growth vs value — exactly what this app's 5 strategies test)</li>
        </ul>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Notice how the 5 strategies in this app often hold different stocks. That's diversification across styles — even if all 5 strategies underperform individually, the combined portfolio is more robust.
        </div>
      </>
    ),
  },
  'dividends-and-franking': {
    title: 'Dividends and franking credits',
    content: (
      <>
        <p>Dividends are cash payments companies make to shareholders — typically twice a year on the ASX (interim and final dividends).</p>
        <h4>The Australian advantage: franking credits</h4>
        <p>Australia has a unique system called <strong>dividend imputation</strong>. When a company pays tax on its profits (30%), it can pass a "franking credit" to shareholders. This credit reduces the tax you personally owe.</p>
        <h4>Worked example</h4>
        <div className="lesson-table">
          <table>
            <thead><tr><th>Component</th><th>Amount</th></tr></thead>
            <tbody>
              <tr><td>Cash dividend received</td><td>$70</td></tr>
              <tr><td>Franking credit (company already paid 30% tax)</td><td>$30</td></tr>
              <tr><td>Grossed-up dividend (what you declare to the ATO)</td><td>$100</td></tr>
              <tr><td>Tax at your marginal rate (say 32.5%)</td><td>$32.50</td></tr>
              <tr><td>Less franking credit</td><td>-$30.00</td></tr>
              <tr><td><strong>Actual tax you pay</strong></td><td><strong>$2.50</strong></td></tr>
            </tbody>
          </table>
        </div>
        <p>On $70 of income, you only pay $2.50 in tax. That's an effective tax rate of 3.6% — far better than the same $70 from a savings account (taxed at your full marginal rate).</p>
        <p>If you're on a lower tax bracket (or in a super fund at 15%), you can actually <strong>get a refund</strong> — the ATO pays you the difference.</p>
        <h4>Grossed-up yield</h4>
        <p>This is why the Dividend Income strategy in this app looks at <strong>grossed-up yield</strong>, not just the headline dividend. A stock yielding 4% fully franked is worth more after tax than a stock yielding 5% unfranked.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Franking credits are a significant advantage for Australian investors. The Dividend Income strategy screens for fully franked high-yielders — stocks like FMG (6.1% yield, fully franked) deliver an after-tax return far higher than a savings account.
        </div>
      </>
    ),
  },
  'common-traps': {
    title: 'Common traps',
    content: (
      <>
        <p>Every investor makes these mistakes — especially at the start. Knowing them won't prevent them entirely, but it helps you catch yourself.</p>
        <h4>1. FOMO buying</h4>
        <p>"Everyone's talking about this stock, it's up 50%, I need to get in!" By the time a stock is in the news, the easy money has been made. The Padley Momentum strategy in this app tries to capture trends <em>early</em> — not after they're on the front page.</p>
        <h4>2. Panic selling</h4>
        <p>Markets drop. It's uncomfortable. The instinct is to sell and stop the pain. But selling at the bottom locks in your losses. Look at the "What If You Held Longer?" data in this app — the H1 2024 picks that dropped initially went on to return +89% at 18 months.</p>
        <h4>3. Confirmation bias</h4>
        <p>Once you buy a stock, you start noticing only the good news about it. You ignore the warning signs. This is why the Contrarian Value strategy deliberately looks for unpopular stocks — it fights confirmation bias by design.</p>
        <h4>4. Overtrading</h4>
        <p>Every trade costs money (brokerage, spread, CGT events). Studies show that the most active traders have the worst returns. The strategies in this app rebalance every 6 months — not every day.</p>
        <h4>5. Anchoring</h4>
        <p>"I bought at $10, so I'll sell when it gets back to $10." The price you paid is irrelevant to where the stock is going. The Damodaran Value strategy focuses on what a stock is <em>worth</em>, not what you paid for it.</p>
        <h4>6. Recency bias</h4>
        <p>Whatever happened recently feels like it will continue forever. Markets crash? "It'll never recover." Markets boom? "It'll never end." The extended hold analysis in this app shows how different the picture looks at 6 months vs 24 months.</p>
        <ExampleBox title="Real example from this app">
          <p>The H1 2024 Padley Momentum picks dropped early — causing the instinct to sell. But the "What If You Held Longer?" data shows those picks went on to return +89% at 18 months. Panic selling would have cost you a near-double.</p>
        </ExampleBox>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> The best defence against these biases is a systematic approach — pick a strategy, follow its rules, rebalance on schedule, and don't check your portfolio every day. That's exactly what this app is designed to test.
        </div>
        <ResourceBox title="Further reading" resources={[
          { name: 'The Intelligent Investor', author: 'Benjamin Graham', type: 'Book', note: 'The classic. Chapter 8 ("Mr Market") and Chapter 20 ("Margin of Safety") are essential.' },
          { name: 'A Random Walk Down Wall Street', author: 'Burton Malkiel', type: 'Book', note: 'The case for index investing and why most active managers underperform.' },
          { name: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', type: 'Book', note: 'The definitive guide to cognitive biases. Chapter on loss aversion directly applies to investing.' },
          { name: 'ASX Investor Education', type: 'Website', note: 'Free courses from the ASX itself — asx.com.au/education' },
          { name: 'Equity Mates Podcast', type: 'Podcast', note: 'Australian investing podcast for beginners. Approachable, no jargon.' },
        ]} />
      </>
    ),
  },
}

export default function Investing101({ onBack }: Props) {
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
          <button
            key={l.id}
            className={`lesson-tab ${i === currentLesson ? 'active' : ''}`}
            onClick={() => setCurrentLesson(i)}
          >
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
        <div className="lesson-body">
          {content?.content ?? <p>Content coming soon.</p>}
        </div>
        <div className="lesson-footer">
          {currentLesson > 0 && (
            <button className="lesson-prev" onClick={() => setCurrentLesson(currentLesson - 1)}>
              ← {mod.lessons[currentLesson - 1].title}
            </button>
          )}
          <div style={{ flex: 1 }} />
          {currentLesson < mod.lessons.length - 1 && (
            <button className="lesson-next" onClick={() => setCurrentLesson(currentLesson + 1)}>
              {mod.lessons[currentLesson + 1].title} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

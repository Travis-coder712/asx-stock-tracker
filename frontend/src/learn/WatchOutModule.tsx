import { useState } from 'react'
import { MODULES } from './curriculum'

const mod = MODULES[6]
interface Props { onBack: () => void }

const LESSONS: Record<string, { title: string; content: React.ReactNode }> = {
  'biases': {
    title: 'Cognitive biases in investing',
    content: (
      <>
        <p>Your brain is optimised for survival on the savannah, not for making investment decisions. Every investor — beginner to professional — is running software that actively works against them.</p>
        <h4>The big six biases</h4>
        <p><strong>1. Loss aversion</strong></p>
        <p>Losing $100 feels about twice as painful as gaining $100 feels good. This means you'll hold losing stocks too long (hoping to break even) and sell winners too early (locking in the gain before it disappears). Kahneman won a Nobel Prize for documenting this.</p>
        <p><strong>2. Anchoring</strong></p>
        <p>"I bought AGL at $12, so I'll wait until it gets back to $12 before I sell." The price you paid is irrelevant to where the stock is going. Yet your brain anchors on it and won't let go. The Damodaran strategy fights this by valuing stocks independently of their recent price.</p>
        <p><strong>3. Recency bias</strong></p>
        <p>Whatever happened recently dominates your thinking. After a crash, you assume markets only go down. After a boom, you assume they only go up. The "What If You Held Longer?" data in this app shows how dramatically the picture changes across different time horizons.</p>
        <p><strong>4. Confirmation bias</strong></p>
        <p>Once you own a stock, you unconsciously seek out information that confirms your decision and dismiss information that contradicts it. You follow the bullish analysts and ignore the bearish ones.</p>
        <p><strong>5. Herd mentality</strong></p>
        <p>It feels safer to do what everyone else is doing. But buying popular stocks at popular prices is how you guarantee average (or below-average) returns. The Contrarian Value strategy deliberately buys unpopular stocks — it fights the herd by design.</p>
        <p><strong>6. Overconfidence</strong></p>
        <p>After a few winning trades, you believe you have skill. You increase position sizes, trade more frequently, take bigger risks. Studies consistently show that the most confident retail traders have the worst returns.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> You can't eliminate these biases — they're hardwired. But you can build systems that bypass them. That's the entire point of this app: systematic strategies with fixed rules remove the human decision-maker (and their biases) from the process.
        </div>
      </>
    ),
  },
  'media-trap': {
    title: 'The media trap',
    content: (
      <>
        <p>Financial media exists to sell advertising, not to make you money. Understanding this changes how you consume it.</p>
        <h4>How financial media works against you</h4>
        <p><strong>1. It's always urgent.</strong> "MARKETS PLUNGE" or "RALLY CONTINUES" — every day is presented as significant. In reality, most days are noise. The ASX moves less than 1% on a typical day, but headlines are written to make you feel you need to act <em>right now</em>.</p>
        <p><strong>2. It's backward-looking.</strong> By the time something is in the news, it's already priced in. "BHP surges on iron ore demand" — by the time you read it, BHP has already surged. You're not getting useful forward-looking information.</p>
        <p><strong>3. It amplifies extremes.</strong> "Expert predicts ASX crash" or "This stock will 10x" — extreme predictions generate clicks. Measured, nuanced analysis ("the market is roughly fairly valued and will probably return 7-9% over the next decade") doesn't make headlines.</p>
        <p><strong>4. It creates false narratives.</strong> After any market move, analysts create a story explaining why it happened. These narratives are constructed <em>after the fact</em> — they explain nothing and predict nothing. "Markets fell on trade war fears" — did they? Or did they fall because that's what markets do sometimes?</p>
        <h4>What to watch instead</h4>
        <ul>
          <li><strong>Company announcements on the ASX:</strong> Primary source, unfiltered. Read the actual earnings release, not the journalist's summary</li>
          <li><strong>Annual reports:</strong> The best companies write honest, detailed annual reports. Read the chairman's letter and the risk section</li>
          <li><strong>Data:</strong> This app fetches raw price and fundamental data from yfinance — no narratives, no spin, just numbers</li>
          <li><strong>Long-form analysis:</strong> Quarterly publications from fund managers (Platinum, Magellan, Argo) provide thoughtful perspective. They're not trying to sell you clicks</li>
        </ul>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> The best thing you can do for your returns is <strong>reduce your financial media consumption</strong>. Check your portfolio monthly, not daily. Read annual reports, not tweets. Let the systematic strategies in this app do the screening — they don't watch the news.
        </div>
      </>
    ),
  },
  'tax-and-fees': {
    title: 'Tax and fees',
    content: (
      <>
        <p>Tax and fees are the silent killers of returns. A strategy that beats the market by 2% but generates 3% more in tax drag actually <em>underperforms</em>.</p>
        <h4>Capital Gains Tax (CGT) in Australia</h4>
        <ul>
          <li><strong>Held &lt; 12 months:</strong> Gain is added to your taxable income at your full marginal rate (up to 47% including Medicare levy)</li>
          <li><strong>Held &gt; 12 months:</strong> 50% CGT discount — only half the gain is taxable. A $10,000 gain is taxed as $5,000</li>
          <li><strong>Capital losses:</strong> Can offset capital gains (carry forward indefinitely). Cannot offset salary income</li>
        </ul>
        <p>This creates a strong incentive to hold for at least 12 months. The strategies in this app rebalance every 6 months — which means some positions are sold before the CGT discount kicks in. A 12-month rebalancing cycle would be more tax-efficient but less responsive to market changes.</p>
        <h4>Brokerage costs</h4>
        <div className="lesson-table">
          <table>
            <thead><tr><th>Portfolio size</th><th>10 stocks × $10 brokerage</th><th>Cost as % of portfolio</th></tr></thead>
            <tbody>
              <tr><td>$5,000</td><td>$200 (buy + sell)</td><td>4.0%</td></tr>
              <tr><td>$25,000</td><td>$200</td><td>0.8%</td></tr>
              <tr><td>$100,000</td><td>$200</td><td>0.2%</td></tr>
            </tbody>
          </table>
        </div>
        <p>At $5,000 per strategy, brokerage is a meaningful drag — 4% just to get in and out. This is why ETFs (which have very low internal costs) often beat active strategies for small portfolios.</p>
        <h4>The bid-ask spread</h4>
        <p>When you buy, you pay the "ask" price. When you sell, you get the "bid" price. The gap (spread) is typically 0.1-0.5% for ASX 100 stocks, but can be 1-2% for small caps. You lose the spread on every trade, and it doesn't show up in your brokerage statement.</p>
        <h4>Management fees (if using ETFs)</h4>
        <p>If instead of picking individual stocks you bought an ASX 200 ETF (like IOZ at 0.09% p.a. or STW at 0.13% p.a.), your annual cost on $25,000 would be just $22-$33. Hard to beat that with active management.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> At small portfolio sizes (&lt; $25,000), the costs of active stock picking (brokerage, spreads, tax events) can eat a significant chunk of your returns. Consider whether a low-cost ETF would deliver similar results with less friction — then use the strategies in this app to learn and build conviction before committing larger amounts.
        </div>
      </>
    ),
  },
  'when-to-sell': {
    title: 'When to sell',
    content: (
      <>
        <p>Buying is the easy part. Every investor loves buying — it's exciting, it's optimistic, it's full of potential. Selling is where the real money is made or lost, and it's where most investors fail.</p>
        <h4>Good reasons to sell</h4>
        <ul>
          <li><strong>The thesis has changed:</strong> You bought because the company was growing at 15%. Growth has slowed to 3% and management admits the market is saturated. Your original reason for buying no longer holds</li>
          <li><strong>The valuation is extreme:</strong> The stock has tripled and now trades at P/E 80 in a sector that averages P/E 20. The future returns are already priced in</li>
          <li><strong>You found something better:</strong> Your portfolio has limited slots. If you've found a stock with a better risk/reward than one of your current holdings, switching makes sense (after accounting for CGT and brokerage)</li>
          <li><strong>Rebalancing:</strong> Your position has grown to 30% of your portfolio — too concentrated. Trimming back to your target weight is disciplined risk management</li>
          <li><strong>You need the money:</strong> Life events (house deposit, education, medical) are perfectly valid reasons. Just make sure you're selling positions with losses first (tax offset) or long-held positions (CGT discount)</li>
        </ul>
        <h4>Bad reasons to sell</h4>
        <ul>
          <li><strong>"It dropped 10%":</strong> Price drops are normal. The question is whether the <em>business</em> has deteriorated. If not, the drop is an opportunity to buy more, not a reason to sell</li>
          <li><strong>"Everyone's saying it's going down":</strong> If everyone's already sold, who's left to push it lower? Contrarians buy when others panic</li>
          <li><strong>"I want to lock in my gains":</strong> What will you do with the cash? If you don't have a better investment lined up, you're just generating a tax event for no reason</li>
          <li><strong>"I saw bad news on social media":</strong> One negative article isn't a thesis change. Read the company's actual announcements, not Twitter hot takes</li>
        </ul>
        <h4>The decision journal approach</h4>
        <p>Before every sell decision, write down:</p>
        <ul>
          <li>Why you're selling (be specific)</li>
          <li>What would have to change for you to buy it back</li>
          <li>Your confidence level (1-10) that selling is the right call</li>
        </ul>
        <p>Review the journal quarterly. You'll quickly see patterns in your decision-making — and you'll find that many of your panic sells were mistakes.</p>
        <p>This app's systematic approach removes the sell decision from human judgment: rebalance every 6 months, re-screen, replace what no longer qualifies. No emotion, no agonising, no regret.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> The best investors sell rarely and deliberately. They sell because the business changed, not because the price changed. If you can't articulate why you're selling in one sentence — without referencing the recent price — you probably shouldn't sell.
        </div>
      </>
    ),
  },
}

export default function WatchOutModule({ onBack }: Props) {
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

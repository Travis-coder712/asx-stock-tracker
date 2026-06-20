import { useState } from 'react'
import { MODULES } from './curriculum'
import { GrahamCalculator, ResourceBox, ExampleBox, DidYouKnow } from './InteractiveElements'

const mod = MODULES[5]
interface Props { onBack: () => void }

const LESSONS: Record<string, { title: string; content: React.ReactNode }> = {
  'graham': {
    title: "Benjamin Graham's margin of safety",
    content: (
      <>
        <p>Benjamin Graham is the father of value investing. His 1949 book <em>The Intelligent Investor</em> — which Warren Buffett calls "by far the best book on investing ever written" — introduced one idea above all others: <strong>the margin of safety</strong>.</p>
        <h4>The concept</h4>
        <p>Never pay full price. Always buy at a discount to what the business is worth — so that even if your estimate of value is wrong, you're still protected. The difference between what you pay and what the business is worth is your "margin of safety."</p>
        <p>Graham was shaped by the 1929 crash. He lost almost everything. His entire philosophy is built on the assumption that <strong>you will be wrong</strong> — and building in enough cushion to survive it.</p>
        <h4>The Graham Number</h4>
        <p>Graham developed a formula for estimating the maximum price a defensive investor should pay:</p>
        <p style={{ textAlign: 'center', fontSize: 16, padding: '12px 0', color: 'var(--accent)' }}>
          <strong>Graham Number = √(22.5 × EPS × Book Value Per Share)</strong>
        </p>
        <p>The 22.5 comes from Graham's maximum acceptable P/E of 15 multiplied by his maximum acceptable P/B of 1.5 (15 × 1.5 = 22.5).</p>
        <h4>How this app uses it</h4>
        <p>The Contrarian Deep Value strategy screens for stocks where the Graham Number exceeds the current price — meaning the stock trades below Graham's maximum acceptable valuation. In January 2024, only <strong>7 stocks</strong> on the ASX 100 passed this strict filter.</p>
        <p>SOL (Soul Pattinson) had the largest Graham discount at +131% — its Graham Number was well above its market price. But strict value investing returned only +6.5% cumulatively — the worst-performing momentum strategies did 10x better.</p>
        <h4>Net-net investing</h4>
        <p>Graham's most extreme strategy: buy stocks trading below their <strong>net current asset value</strong> (current assets minus <em>all</em> liabilities). You're getting the business for less than its liquidation value — essentially free. These are vanishingly rare on the modern ASX, but they existed in Graham's depression-era market.</p>
        <GrahamCalculator />
        <ExampleBox title="Try it with this app's picks">
          <p>SOL (Soul Pattinson): EPS $4.70, BVPS $31.50, Price ~$33. Graham Number = √(22.5 × 4.70 × 31.50) = $57.75. That's a 75% discount — strong buy signal. SOL was the app's top Contrarian pick.</p>
          <p>Now try PME: EPS $0.90, BVPS $1.20, Price ~$180. Graham Number = √(22.5 × 0.90 × 1.20) = $4.92. At $180, PME is 36x Graham's maximum price. Yet it was the top momentum performer. Graham and Padley would disagree violently about this stock.</p>
        </ExampleBox>
        <DidYouKnow>Warren Buffett took Graham's class at Columbia Business School in 1950-51 and was the only student ever to receive an A+. He later worked at Graham's fund, Graham-Newman, before starting his own partnership.</DidYouKnow>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Graham's genius was the margin of safety — accepting that you'll be wrong and building in protection. His specific numbers (P/E &lt; 15, P/B &lt; 1.5) are aggressive filters that produce very concentrated, often unloved portfolios. The returns are modest but the downside protection is real.
        </div>
        <ResourceBox title="Further reading" resources={[
          { name: 'The Intelligent Investor', author: 'Benjamin Graham', type: 'Book', note: 'The bible of value investing. The revised edition with Jason Zweig\'s commentary is the one to get.' },
          { name: 'Security Analysis', author: 'Graham & Dodd', type: 'Book', note: 'The technical companion to The Intelligent Investor. Heavy but comprehensive.' },
          { name: 'Berkshire Hathaway Annual Letters', author: 'Warren Buffett', type: 'Free online', note: 'Buffett\'s letters to shareholders from 1965 to present. The best free investing education available.' },
          { name: 'Damodaran Online', author: 'Aswath Damodaran', type: 'Website', note: 'Free valuation spreadsheets, datasets, and lecture videos at pages.stern.nyu.edu/~adamodar/' },
        ]} />
      </>
    ),
  },
  'buffett': {
    title: "Buffett's evolution",
    content: (
      <>
        <p>Warren Buffett started as a strict Graham disciple — buying "cigar butts" (cheap, beaten-down stocks with one last puff of value). But his partner Charlie Munger convinced him to evolve: <strong>"It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price."</strong></p>
        <h4>From cigar butts to compounders</h4>
        <p>Graham-style investing buys $1 of assets for $0.50 and waits for the market to close the gap. Buffett realised the more powerful approach is to buy businesses that <em>grow</em> their value every year — where time works <em>for</em> you, not against you.</p>
        <div className="lesson-table">
          <table>
            <thead><tr><th>Graham style</th><th>Buffett evolution</th></tr></thead>
            <tbody>
              <tr><td>Buy cheap assets</td><td>Buy quality businesses</td></tr>
              <tr><td>P/B &lt; 1, P/E &lt; 15</td><td>Reasonable P/E for the growth rate</td></tr>
              <tr><td>Sell when price reaches value</td><td>Hold forever if the business keeps compounding</td></tr>
              <tr><td>Diversify widely (30+ stocks)</td><td>Concentrate (5-10 positions)</td></tr>
              <tr><td>Ignore management quality</td><td>Management is everything</td></tr>
            </tbody>
          </table>
        </div>
        <h4>The Buffett checklist</h4>
        <ul>
          <li><strong>Durable competitive advantage ("moat"):</strong> Can competitors copy this business easily? If not, it has pricing power</li>
          <li><strong>Consistent earnings:</strong> Not cyclical, not one-hit wonders. Steady growth over 10+ years</li>
          <li><strong>High return on equity:</strong> The business generates strong returns on the capital invested in it. ROE &gt; 15% consistently</li>
          <li><strong>Good management:</strong> Honest, competent, capital-allocation-savvy. Look at how they allocate free cash flow</li>
          <li><strong>Reasonable price:</strong> Not necessarily <em>cheap</em>, but not expensive relative to the quality. Pay a fair price for an excellent business</li>
        </ul>
        <h4>Why this matters for the app</h4>
        <p>The tension between Graham and Buffett is visible in this app's results. The Contrarian Value strategy (strict Graham) returned +6.5%. But stocks that score high on <em>quality</em> (Buffett's emphasis) — like PME (ROE 77%) and REA (ROE 28%) — drove the Momentum and Quant strategies to +60%+ returns. Quality compounds.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Buffett's evolution is the most important lesson in value investing history: being cheap isn't enough. A stock can be cheap forever if the business is declining. Look for businesses that grow their intrinsic value every year — then buy them at a fair price.
        </div>
      </>
    ),
  },
  'value-traps': {
    title: 'Value traps',
    content: (
      <>
        <p>A value trap is a stock that <em>looks</em> cheap but <em>deserves</em> to be cheap. The low P/E isn't an opportunity — it's a warning.</p>
        <h4>Why stocks become value traps</h4>
        <ul>
          <li><strong>Structural decline:</strong> The industry is shrinking. Print media, fossil fuel power generation (relevant for AGL), physical retail. The business earns less every year, so last year's P/E understates how expensive the stock really is on <em>future</em> earnings</li>
          <li><strong>Disruption:</strong> A new technology or competitor is eating the business. Kodak had a low P/E in 2005. It was bankrupt by 2012</li>
          <li><strong>Balance sheet rot:</strong> Rising debt, declining asset quality, deferred maintenance. The book value you're paying a low multiple of isn't really worth what the accounts say</li>
          <li><strong>Management capture:</strong> Executives milking the business for personal benefit rather than creating shareholder value. Empire-building acquisitions that destroy value</li>
        </ul>
        <h4>How to tell the difference</h4>
        <div className="lesson-table">
          <table>
            <thead><tr><th>Genuine value</th><th>Value trap</th></tr></thead>
            <tbody>
              <tr><td>Temporarily depressed earnings</td><td>Permanently declining earnings</td></tr>
              <tr><td>Market overreacted to one-off event</td><td>Market correctly pricing structural decline</td></tr>
              <tr><td>Industry is stable or growing</td><td>Industry is shrinking</td></tr>
              <tr><td>Company gaining market share</td><td>Company losing market share</td></tr>
              <tr><td>Debt is stable or falling</td><td>Debt is rising to fund dividends</td></tr>
              <tr><td>Management buying shares</td><td>Management selling shares</td></tr>
            </tbody>
          </table>
        </div>
        <h4>The app's evidence</h4>
        <p>The Contrarian Value strategy's +6.5% return over 2.5 years (barely above inflation) suggests that some of its picks were value traps. WHC (Whitehaven Coal) and WDS (Woodside) looked cheap on P/B and P/E, but both face structural headwinds from the energy transition. The market was pricing in real risks, not overreacting.</p>
        <p>Compare that to the "expensive" momentum stocks — PME at P/E 77 returned +78% in 6 months. Sometimes expensive stocks are expensive because they're excellent businesses growing rapidly.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> The hardest question in value investing: is this stock cheap because the market is wrong, or cheap because the market is right? Graham's filters don't answer this question — they only find cheap stocks. You still need judgment about whether the cheapness is an opportunity or a warning.
        </div>
      </>
    ),
  },
}

export default function ValueModule({ onBack }: Props) {
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

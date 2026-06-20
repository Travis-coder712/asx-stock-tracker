import { useState } from 'react'
import { MODULES } from './curriculum'
import { ResourceBox, ExampleBox, DidYouKnow } from './InteractiveElements'

const mod = MODULES[3]
interface Props { onBack: () => void }

const LESSONS: Record<string, { title: string; content: React.ReactNode }> = {
  'what-are-factors': {
    title: 'What are "factors"?',
    content: (
      <>
        <p>In 1992, Eugene Fama and Kenneth French published research that changed investing forever. They showed that stock returns could be explained by a small number of <strong>factors</strong> — measurable characteristics that predict which stocks will outperform.</p>
        <p>A "factor" is simply a trait that groups of winning stocks tend to share. The five most established factors are:</p>
        <h4>The Big Five</h4>
        <div className="lesson-table">
          <table>
            <thead><tr><th>Factor</th><th>What it means</th><th>Why it works</th></tr></thead>
            <tbody>
              <tr><td><strong>Value</strong></td><td>Low price relative to book value (P/B), earnings (P/E), or cash flow</td><td>Cheap stocks tend to recover as the market re-prices them. Compensation for "ugliness risk"</td></tr>
              <tr><td><strong>Size</strong></td><td>Smaller companies outperform larger ones (historically)</td><td>Less analyst coverage, less efficient pricing, higher growth potential</td></tr>
              <tr><td><strong>Momentum</strong></td><td>Stocks that have risen recently continue to rise (12-1 month returns)</td><td>Underreaction to news, herding behaviour</td></tr>
              <tr><td><strong>Quality</strong></td><td>High ROE, low debt, stable earnings</td><td>Well-run businesses compound value. Less likely to blow up</td></tr>
              <tr><td><strong>Low Volatility</strong></td><td>Stocks with smaller price swings outperform on a risk-adjusted basis</td><td>"Boring" stocks are under-owned because they're not exciting. The premium is for being ignored</td></tr>
            </tbody>
          </table>
        </div>
        <h4>How this app uses factors</h4>
        <p>The Quant Factors strategy in this app scores every ASX stock across three factors — Value (P/B rank), Momentum (12-month return rank), and Quality (ROE rank) — then buys the top 10 by composite score. It returned <strong>+60.7% cumulatively</strong>, the second-best strategy.</p>
        <p>The power of combining factors is that they're partially uncorrelated: when value stocks are underperforming, momentum stocks often pick up the slack, and vice versa. The composite smooths out any single factor's bad periods.</p>
        <ExampleBox title="Factor scores from this app">
          <p><strong>SOL:</strong> Value #22, Momentum #26, Quality #20 = Composite 68. Strong across ALL three factors — no single weakness. This is the ideal factor stock.</p>
          <p><strong>PME:</strong> Value #99 (worst!), Momentum #2, Quality #3 = Composite 104. Extreme momentum and quality compensated for terrible value. Two strong factors overcame one weak one.</p>
          <p><strong>This is the beauty of multi-factor:</strong> you don't need perfection. A stock with one glaring weakness can still be a top pick if it excels elsewhere.</p>
        </ExampleBox>
        <DidYouKnow>The five factors (value, size, momentum, quality, low vol) explain about 90% of the variation in stock returns across different portfolios. Individual stock-picking skill — "alpha" — explains less than 10%.</DidYouKnow>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Factor investing is systematic, evidence-based, and removes emotion from stock selection. It's the closest thing to a "scientific" approach to picking stocks — and the Quant Factors strategy's +60.7% return demonstrates it works on the ASX.
        </div>
      </>
    ),
  },
  'scoring-models': {
    title: 'How scoring models work',
    content: (
      <>
        <p>A factor scoring model is a systematic way to rank stocks. No narratives, no gut feelings — just data in, rankings out.</p>
        <h4>The process</h4>
        <p><strong>Step 1: Collect data.</strong> For every stock, gather the relevant metrics — P/B ratio, 12-month return, ROE, etc.</p>
        <p><strong>Step 2: Rank each factor independently.</strong> Sort all stocks by P/B (ascending — lowest P/B = best value rank). Sort by momentum (descending — highest return = best momentum rank). Sort by ROE (descending — highest ROE = best quality rank).</p>
        <p><strong>Step 3: Create a composite score.</strong> Add the ranks together. A stock that ranks 5th on value, 10th on momentum, and 3rd on quality gets a composite of 18. Lower composite = better overall.</p>
        <p><strong>Step 4: Buy the top N stocks.</strong> Equal-weight them (same dollar amount in each). Rebalance periodically (this app does it every 6 months).</p>
        <h4>What this app's model produced</h4>
        <p>In January 2024, the top composite scores were:</p>
        <ul>
          <li><strong>SOL (Soul Pattinson):</strong> Composite 68 — Value #22, Momentum #26 (+25%), Quality #20 (ROE 21%). Strong across all three factors</li>
          <li><strong>FMG (Fortescue):</strong> Composite 76 — Value #45, Momentum #6 (+57%), Quality #25. Momentum-driven</li>
          <li><strong>PME (Pro Medicus):</strong> Composite 104 — Value #99 (expensive!), Momentum #2 (+78%), Quality #3 (ROE 77%). Extreme momentum and quality overcame terrible value rank</li>
        </ul>
        <p>Notice how PME made it despite being ranked almost last on value. The model allows a stock to "make up" for weakness in one factor with strength in others. That's the beauty of a multi-factor approach.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Factor models are transparent and repeatable. Anyone with the same data will get the same rankings. This removes the biggest risk in investing — yourself. No FOMO, no panic, no confirmation bias. Just data.
        </div>
      </>
    ),
  },
  'factor-risks': {
    title: 'Factor risks',
    content: (
      <>
        <p>Factor investing isn't magic. Like every approach, it has specific risks you need to understand.</p>
        <h4>1. Factor crowding</h4>
        <p>When everyone uses the same factor model, the same stocks get bought by every quant fund. This pushes prices above fair value — and when the crowded trade unwinds, the crash is amplified. The "quant quake" of August 2007 saw factor strategies lose 10%+ in days as funds unwound identical positions.</p>
        <h4>2. Regime changes</h4>
        <p>Factors go through long periods of underperformance. Value investing underperformed growth from 2010-2020 — an entire decade. If you'd given up after 5 years of underperformance, you'd have missed the value recovery in 2021-22. Sticking with a factor strategy requires conviction through years of pain.</p>
        <h4>3. Backtesting overfitting</h4>
        <p>It's easy to find factors that "worked" in historical data. With enough variables and enough time, you can find patterns in random noise. The five established factors (value, size, momentum, quality, low vol) have survived decades of out-of-sample testing. Novel "factors" promoted in marketing materials often don't survive real trading.</p>
        <h4>4. Data quality</h4>
        <p>Factor models are only as good as their inputs. This app uses yfinance for fundamentals — the data is point-in-time and reasonably reliable, but it's not Bloomberg-quality. ROE figures can be distorted by one-off write-downs, P/B ratios can be meaningless for asset-light tech companies. Garbage in, garbage out.</p>
        <h4>5. Transaction costs</h4>
        <p>Rebalancing every 6 months means buying and selling stocks. Each trade costs brokerage ($5-20) plus the bid-ask spread (typically 0.1-0.5% for ASX 100 stocks). With 10 stocks rebalanced 5 times, that's potentially 100 trades — $1,000-2,000 in costs on a $5,000 portfolio. At scale it's fine; at small sizes it eats returns.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Factor investing works over long periods but requires patience through drawdowns, discipline to stick to the model, and enough capital to absorb transaction costs. It's not a get-rich-quick strategy — it's a get-rich-slowly system.
        </div>
        <ResourceBox title="Further reading" resources={[
          { name: 'Your Complete Guide to Factor-Based Investing', author: 'Berkin & Swedroe', type: 'Book', note: 'The accessible entry point. Covers all five factors with evidence and implementation advice.' },
          { name: 'AQR Research Papers', type: 'Website', note: 'AQR Capital (Cliff Asness) publishes excellent free research on factor investing at aqr.com/insights' },
          { name: 'Expected Returns', author: 'Antti Ilmanen', type: 'Book', note: 'The definitive (and dense) reference on what drives returns across asset classes.' },
        ]} />
      </>
    ),
  },
}

export default function FactorModule({ onBack }: Props) {
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

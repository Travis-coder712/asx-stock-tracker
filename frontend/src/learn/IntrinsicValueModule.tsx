import { useState } from 'react'
import { MODULES } from './curriculum'
import { ResourceBox, ExampleBox, DidYouKnow } from './InteractiveElements'

const mod = MODULES[2]
interface Props { onBack: () => void }

const LESSONS: Record<string, { title: string; content: React.ReactNode }> = {
  'what-is-value': {
    title: 'What is a stock "worth"?',
    content: (
      <>
        <p>The market price of a stock tells you what people are <em>paying</em> for it right now. But that's not necessarily what it's <em>worth</em>.</p>
        <p>Aswath Damodaran, the NYU professor who has taught valuation to a generation of analysts, draws a sharp distinction:</p>
        <ul>
          <li><strong>Price</strong> is what you pay — set by supply and demand, driven by sentiment, momentum, and crowd behaviour</li>
          <li><strong>Value</strong> is what you get — determined by the cash the business will generate over its lifetime</li>
        </ul>
        <p>When price is below value, you have a buying opportunity. When price is above value, you might want to sell. The gap between price and value is what Damodaran calls the <strong>"margin of safety"</strong> — a term borrowed from Benjamin Graham.</p>
        <h4>Why does price diverge from value?</h4>
        <ul>
          <li><strong>Fear:</strong> During market panics, investors sell everything regardless of underlying value. Good companies get dragged down with bad ones</li>
          <li><strong>Greed:</strong> During bubbles, investors pay absurd multiples for growth stories that may never materialise</li>
          <li><strong>Neglect:</strong> Boring companies in unfashionable sectors get ignored, even when they're printing cash</li>
          <li><strong>Misunderstanding:</strong> Temporary problems (a one-off write-down, a product recall) get treated as permanent</li>
        </ul>
        <p>The Damodaran strategy in this app looks for stocks where the market price sits well below what sector peers suggest the company is worth — that price-value gap is the opportunity.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Price and value are different things. The entire discipline of valuation is about estimating value independently, then comparing it to what the market charges. Every good investment starts with this distinction.
        </div>
      </>
    ),
  },
  'dcf-plain-english': {
    title: 'DCF in plain English',
    content: (
      <>
        <p>DCF — Discounted Cash Flow — sounds intimidating, but the concept is beautifully simple: <strong>a business is worth the total cash it will generate for you, adjusted for the fact that money today is worth more than money tomorrow.</strong></p>
        <h4>The three steps</h4>
        <p><strong>Step 1: Estimate future cash flows.</strong> How much free cash will this company generate each year for the next 5-10 years? This is the hard part — it requires understanding the business, its market, its competitive position, and its growth trajectory.</p>
        <p><strong>Step 2: Discount those cash flows back to today.</strong> $100 in 5 years isn't worth $100 today — you could invest today's $100 and have more than $100 in 5 years. The "discount rate" captures this time value of money plus the risk of the investment. For Australian equities, a typical discount rate is 8-12%.</p>
        <p><strong>Step 3: Add a terminal value.</strong> The company doesn't stop existing after year 10. The terminal value estimates what all the cash flows after your forecast period are worth. This often represents 60-80% of the total DCF value — which is why it's the most dangerous number in the model.</p>
        <h4>A simplified example</h4>
        <div className="lesson-table">
          <table>
            <thead><tr><th>Year</th><th>Free Cash Flow</th><th>Discount Factor (10%)</th><th>Present Value</th></tr></thead>
            <tbody>
              <tr><td>1</td><td>$100M</td><td>0.91</td><td>$91M</td></tr>
              <tr><td>2</td><td>$110M</td><td>0.83</td><td>$91M</td></tr>
              <tr><td>3</td><td>$121M</td><td>0.75</td><td>$91M</td></tr>
              <tr><td>4</td><td>$133M</td><td>0.68</td><td>$91M</td></tr>
              <tr><td>5</td><td>$146M</td><td>0.62</td><td>$91M</td></tr>
              <tr><td colSpan={3}><strong>Sum of 5-year cash flows</strong></td><td><strong>$455M</strong></td></tr>
              <tr><td colSpan={3}>Terminal value (growing 3% forever)</td><td>$1,320M</td></tr>
              <tr><td colSpan={3}><strong>Total business value</strong></td><td><strong>$1,775M</strong></td></tr>
            </tbody>
          </table>
        </div>
        <p>If this company has 100 million shares outstanding, the DCF value per share is $17.75. If the market price is $12, you have a 48% margin of safety — a potential bargain. If the market price is $25, it's overvalued.</p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> DCF is conceptually simple — future cash, discounted back. The difficulty is in the inputs, not the maths. Small changes to growth rates or discount rates produce wildly different valuations. That's why Damodaran insists on starting with the narrative, not the spreadsheet.
        </div>
      </>
    ),
  },
  'narrative-to-numbers': {
    title: 'Narrative to numbers',
    content: (
      <>
        <p>Damodaran's signature contribution isn't a formula — it's a process. He insists that every valuation must start with a <strong>story about the business</strong>, and every number in the model must be traceable back to that story.</p>
        <h4>The process</h4>
        <p><strong>1. Tell the story.</strong> In plain language, what is this company? What does it do? Where is it going? For example: "AGL is Australia's largest electricity generator, transitioning from coal to renewables. Revenue will be flat as coal plants retire, but margins could improve as cheap renewables replace expensive gas peaking. Risk: the transition could be more expensive and slower than planned."</p>
        <p><strong>2. Test the story.</strong> Is it plausible? Does the market, the competition, and the regulatory environment support it? What could go wrong? What would make you change the story?</p>
        <p><strong>3. Convert to numbers.</strong> Each element of the story maps to a valuation input:</p>
        <ul>
          <li>"Revenue flat" → 0-2% revenue growth</li>
          <li>"Margins improve" → operating margin expanding from 8% to 12% over 5 years</li>
          <li>"Transition risk" → higher discount rate (12% vs 10% for a stable utility)</li>
          <li>"Coal retirement" → declining capex after 2028</li>
        </ul>
        <p><strong>4. Value the company.</strong> Plug the narrative-derived numbers into a DCF or relative valuation. The output is not "the answer" — it's one scenario. Run multiple narratives (optimistic, base, pessimistic) to get a range.</p>
        <h4>Why this matters</h4>
        <p>Most amateur investors do it backwards — they find a stock they like, then build a spreadsheet to justify buying it. Damodaran's process forces honesty: if you can't articulate the story, you shouldn't be valuing the company.</p>
        <p>This app's Damodaran strategy uses a simplified version — comparing P/E and FCF yield to sector medians — because full narrative-to-numbers DCF for 100 stocks isn't practical in code. But the principle is the same: is this stock cheap <em>relative to what it actually is?</em></p>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Start with the story, not the spreadsheet. If you can't explain in two sentences why a company will be worth more in 5 years, no amount of financial modelling will save you.
        </div>
      </>
    ),
  },
  'relative-valuation': {
    title: 'Relative valuation',
    content: (
      <>
        <p>If DCF is valuation from first principles, relative valuation is valuation by comparison. It asks: <strong>how does this stock's price compare to similar companies?</strong></p>
        <h4>The key multiples</h4>
        <div className="lesson-table">
          <table>
            <thead><tr><th>Multiple</th><th>What it measures</th><th>When to use</th></tr></thead>
            <tbody>
              <tr><td><strong>P/E ratio</strong></td><td>Price relative to earnings</td><td>Profitable companies with stable earnings</td></tr>
              <tr><td><strong>EV/EBITDA</strong></td><td>Enterprise value relative to operating profit</td><td>Comparing companies with different capital structures</td></tr>
              <tr><td><strong>P/B ratio</strong></td><td>Price relative to book value (net assets)</td><td>Asset-heavy businesses (banks, REITs, miners)</td></tr>
              <tr><td><strong>FCF yield</strong></td><td>Free cash flow relative to market cap</td><td>Cash-generative businesses</td></tr>
            </tbody>
          </table>
        </div>
        <h4>The critical rule: compare within sectors</h4>
        <p>A P/E of 30 is expensive for a bank but cheap for a high-growth tech company. You must compare like with like. This app's Damodaran strategy computes <strong>sector median P/E</strong> and scores each stock by how far below its sector median it sits.</p>
        <h4>What the app found</h4>
        <p>The strategy's top picks have P/E ratios well below their sector medians — CCL at P/E 24.8 vs sector median 53.4, or SOL at P/E 6.9 vs sector median 19.1. These stocks are "cheap relative to peers."</p>
        <p>But cheap relative to peers returned only +9.2% over the tracking period — the worst of the momentum-style strategies. Why? Because sometimes stocks are cheap for a reason. The market was right about some of these companies.</p>
        <h4>Damodaran's warning</h4>
        <p>Relative valuation has a fundamental flaw: if the entire sector is overvalued, the "cheapest" stock in the sector is still overvalued. During the tech bubble, stocks with P/E ratios of 50 were "cheap" relative to peers at P/E 200. They still crashed.</p>
        <ExampleBox title="Sector-relative valuation in this app">
          <p>The Damodaran strategy found CCL (Coca-Cola Amatil) at P/E 24.8 vs its sector median of 53.4 — a 54% discount to peers. SOL at P/E 6.9 vs sector median 19.1 — a 64% discount. But the overall strategy returned only +9.2%. Being cheap relative to peers wasn't enough — the peers themselves were expensive.</p>
        </ExampleBox>
        <DidYouKnow>Damodaran updates his valuation datasets for every publicly traded company in the world — for free — on his NYU website. He's valued over 40,000 companies and makes all his spreadsheets available for download.</DidYouKnow>
        <div className="lesson-callout">
          <strong>Key takeaway:</strong> Relative valuation is fast and intuitive — but it only tells you which stocks are cheaper than their peers, not whether they're actually cheap in absolute terms. Combine it with DCF for a more complete picture.
        </div>
        <ResourceBox title="Further reading" resources={[
          { name: 'The Little Book of Valuation', author: 'Aswath Damodaran', type: 'Book', note: 'Compact, practical intro to valuation. Covers DCF and relative methods with worked examples.' },
          { name: 'Damodaran on Valuation (YouTube)', author: 'NYU Stern', type: 'Video', note: 'Full semester of valuation lectures, free. The best graduate-level finance education available online.' },
          { name: 'Musings on Markets (blog)', author: 'Aswath Damodaran', type: 'Blog', note: 'Damodaran\'s blog where he values companies in real-time — Tesla, Uber, Apple, etc.' },
        ]} />
      </>
    ),
  },
}

export default function IntrinsicValueModule({ onBack }: Props) {
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

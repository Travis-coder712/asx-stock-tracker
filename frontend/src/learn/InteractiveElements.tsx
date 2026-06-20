import { useState } from 'react'

export function CompoundCalculator() {
  const [initial, setInitial] = useState(5000)
  const [monthly, setMonthly] = useState(200)
  const [rate, setRate] = useState(8)
  const [years, setYears] = useState(10)

  const rows: Array<{ year: number; balance: number }> = []
  let balance = initial
  for (let y = 0; y <= years; y++) {
    rows.push({ year: y, balance: Math.round(balance) })
    balance = (balance + monthly * 12) * (1 + rate / 100)
  }

  return (
    <div className="interactive-box">
      <div className="interactive-header">Compound Interest Calculator</div>
      <div className="calc-inputs">
        <label>Initial investment <input type="number" value={initial} onChange={e => setInitial(+e.target.value)} /></label>
        <label>Monthly contribution <input type="number" value={monthly} onChange={e => setMonthly(+e.target.value)} /></label>
        <label>Annual return % <input type="number" value={rate} step={0.5} onChange={e => setRate(+e.target.value)} /></label>
        <label>Years <input type="range" min={1} max={30} value={years} onChange={e => setYears(+e.target.value)} /> <span>{years}</span></label>
      </div>
      <div className="calc-result">
        <div className="calc-big">${rows[rows.length - 1].balance.toLocaleString()}</div>
        <div className="calc-label">after {years} years</div>
        <div className="calc-detail">
          Total contributed: ${(initial + monthly * 12 * years).toLocaleString()} ·
          Growth: ${(rows[rows.length - 1].balance - initial - monthly * 12 * years).toLocaleString()}
        </div>
      </div>
      <div className="calc-chart">
        {rows.map((r, i) => (
          <div key={i} className="calc-bar-row">
            <span className="calc-bar-label">Yr {r.year}</span>
            <div className="calc-bar" style={{ width: `${(r.balance / rows[rows.length - 1].balance) * 100}%` }}>
              <span className="calc-bar-val">${r.balance.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FrankingCalculator() {
  const [investment, setInvestment] = useState(10000)
  const [yield_, setYield] = useState(5)
  const [franking, setFranking] = useState(100)
  const [taxRate, setTaxRate] = useState(32.5)

  const cashDiv = investment * (yield_ / 100)
  const frankingCredit = cashDiv * (franking / 100) * (30 / 70)
  const grossedUp = cashDiv + frankingCredit
  const taxOwed = grossedUp * (taxRate / 100)
  const netTax = Math.max(0, taxOwed - frankingCredit)
  const afterTaxIncome = cashDiv - netTax
  const effectiveRate = cashDiv > 0 ? (netTax / cashDiv) * 100 : 0

  const unfrankedTax = cashDiv * (taxRate / 100)
  const unfrankedAfterTax = cashDiv - unfrankedTax

  return (
    <div className="interactive-box">
      <div className="interactive-header">Franking Credit Calculator</div>
      <div className="calc-inputs">
        <label>Investment $ <input type="number" value={investment} onChange={e => setInvestment(+e.target.value)} /></label>
        <label>Dividend yield % <input type="number" value={yield_} step={0.5} onChange={e => setYield(+e.target.value)} /></label>
        <label>Franking % <input type="range" min={0} max={100} value={franking} onChange={e => setFranking(+e.target.value)} /> <span>{franking}%</span></label>
        <label>Your tax rate % <input type="range" min={0} max={47} value={taxRate} step={0.5} onChange={e => setTaxRate(+e.target.value)} /> <span>{taxRate}%</span></label>
      </div>
      <div className="calc-comparison">
        <div className="calc-compare-col">
          <div className="calc-compare-title" style={{ color: 'var(--green)' }}>With Franking</div>
          <div className="calc-row"><span>Cash dividend</span><span>${cashDiv.toFixed(0)}</span></div>
          <div className="calc-row"><span>Franking credit</span><span>${frankingCredit.toFixed(0)}</span></div>
          <div className="calc-row"><span>Grossed-up income</span><span>${grossedUp.toFixed(0)}</span></div>
          <div className="calc-row"><span>Tax payable</span><span style={{ color: 'var(--red)' }}>-${netTax.toFixed(0)}</span></div>
          <div className="calc-row total"><span>After-tax income</span><span style={{ color: 'var(--green)' }}>${afterTaxIncome.toFixed(0)}</span></div>
          <div className="calc-row"><span>Effective tax rate</span><span>{effectiveRate.toFixed(1)}%</span></div>
        </div>
        <div className="calc-compare-col">
          <div className="calc-compare-title" style={{ color: 'var(--text-mute)' }}>Without Franking</div>
          <div className="calc-row"><span>Cash dividend</span><span>${cashDiv.toFixed(0)}</span></div>
          <div className="calc-row"><span>Franking credit</span><span>$0</span></div>
          <div className="calc-row"><span>Grossed-up income</span><span>${cashDiv.toFixed(0)}</span></div>
          <div className="calc-row"><span>Tax payable</span><span style={{ color: 'var(--red)' }}>-${unfrankedTax.toFixed(0)}</span></div>
          <div className="calc-row total"><span>After-tax income</span><span>${unfrankedAfterTax.toFixed(0)}</span></div>
          <div className="calc-row"><span>Effective tax rate</span><span>{taxRate}%</span></div>
        </div>
      </div>
      <div className="calc-result">
        <div className="calc-label">Franking advantage: <strong style={{ color: 'var(--green)' }}>${(afterTaxIncome - unfrankedAfterTax).toFixed(0)} more</strong> after tax ({((afterTaxIncome / unfrankedAfterTax - 1) * 100).toFixed(0)}% better)</div>
      </div>
    </div>
  )
}

export function GrahamCalculator() {
  const [eps, setEps] = useState(2.5)
  const [bvps, setBvps] = useState(15)
  const [price, setPrice] = useState(20)

  const grahamNumber = eps > 0 && bvps > 0 ? Math.sqrt(22.5 * eps * bvps) : 0
  const discount = price > 0 ? ((grahamNumber - price) / price) * 100 : 0
  const isBargain = grahamNumber > price

  return (
    <div className="interactive-box">
      <div className="interactive-header">Graham Number Calculator</div>
      <p className="interactive-desc">Enter a stock's EPS and book value per share to see if it passes Graham's test.</p>
      <div className="calc-inputs">
        <label>Earnings per share (EPS) $ <input type="number" value={eps} step={0.1} onChange={e => setEps(+e.target.value)} /></label>
        <label>Book value per share $ <input type="number" value={bvps} step={0.5} onChange={e => setBvps(+e.target.value)} /></label>
        <label>Current share price $ <input type="number" value={price} step={0.5} onChange={e => setPrice(+e.target.value)} /></label>
      </div>
      <div className="calc-result">
        <div className="calc-formula">√(22.5 × ${eps} × ${bvps}) = <strong>${grahamNumber.toFixed(2)}</strong></div>
        <div className="calc-big" style={{ color: isBargain ? 'var(--green)' : 'var(--red)' }}>
          {isBargain ? 'BUY SIGNAL' : 'TOO EXPENSIVE'}
        </div>
        <div className="calc-label">
          Graham Number: ${grahamNumber.toFixed(2)} vs Price: ${price.toFixed(2)} — {discount >= 0 ? `${discount.toFixed(0)}% discount` : `${Math.abs(discount).toFixed(0)}% premium`}
        </div>
      </div>
    </div>
  )
}

export function RiskQuiz() {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const questions = [
    { q: 'Your portfolio drops 20% in a month. You:', options: ['Sell everything immediately', 'Sell half to reduce risk', 'Hold and wait', 'Buy more — it\'s on sale'] },
    { q: 'You prefer investments that:', options: ['Never lose value', 'Rarely lose value, modest returns', 'Sometimes lose value, good returns', 'Often volatile, highest potential returns'] },
    { q: 'How long until you need this money?', options: ['Less than 1 year', '1-3 years', '3-7 years', '7+ years'] },
    { q: 'A friend tells you about a "hot stock." You:', options: ['Buy immediately', 'Research it and maybe buy', 'Ignore tips entirely', 'Short it — hot tips are usually wrong'] },
    { q: 'How do you feel about checking your portfolio?', options: ['I check multiple times daily', 'I check weekly', 'I check monthly', 'I check quarterly or less'] },
  ]

  const total = Object.values(answers).reduce((s, v) => s + v, 0)
  const maxScore = questions.length * 3
  const allAnswered = Object.keys(answers).length === questions.length

  const profile = total <= 5 ? { label: 'Conservative', color: '#4ecdc4', desc: 'You prioritise capital preservation. Consider the Dividend Income strategy — steady returns with lower volatility.' }
    : total <= 10 ? { label: 'Moderate', color: '#ffd43b', desc: 'You balance growth and safety. The Quant Factors strategy suits you — systematic, diversified, evidence-based.' }
    : { label: 'Aggressive', color: '#ff6b6b', desc: 'You\'re comfortable with volatility for higher returns. The Padley Momentum strategy matches your risk appetite — but use stop losses.' }

  return (
    <div className="interactive-box">
      <div className="interactive-header">What's Your Risk Profile?</div>
      <p className="interactive-desc">Answer honestly — there are no wrong answers.</p>
      {questions.map((q, qi) => (
        <div key={qi} className="quiz-question">
          <div className="quiz-q">{qi + 1}. {q.q}</div>
          <div className="quiz-options">
            {q.options.map((opt, oi) => (
              <button key={oi} className={`quiz-option ${answers[qi] === oi ? 'selected' : ''}`}
                onClick={() => setAnswers(prev => ({ ...prev, [qi]: oi }))}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
      {allAnswered && (
        <div className="quiz-result" style={{ borderColor: profile.color }}>
          <div className="quiz-profile" style={{ color: profile.color }}>{profile.label}</div>
          <div className="quiz-score">Score: {total}/{maxScore}</div>
          <p>{profile.desc}</p>
        </div>
      )}
    </div>
  )
}

export function ResourceBox({ title, resources }: { title: string; resources: Array<{ name: string; author?: string; type: string; note: string }> }) {
  return (
    <div className="resource-box">
      <div className="resource-title">{title}</div>
      {resources.map((r, i) => (
        <div key={i} className="resource-item">
          <div className="resource-name">{r.name}{r.author && <span className="resource-author"> — {r.author}</span>}</div>
          <span className="resource-type">{r.type}</span>
          <div className="resource-note">{r.note}</div>
        </div>
      ))}
    </div>
  )
}

export function ExampleBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="example-box">
      <div className="example-title">{title}</div>
      {children}
    </div>
  )
}

export function DidYouKnow({ children }: { children: React.ReactNode }) {
  return (
    <div className="did-you-know">
      <span className="dyk-label">Did you know?</span>
      {children}
    </div>
  )
}

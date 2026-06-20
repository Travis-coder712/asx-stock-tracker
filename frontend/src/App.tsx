import './App.css'

const STRATEGIES = [
  {
    id: 'padley_momentum',
    name: 'Padley Momentum',
    css: 'padley',
    description: 'Trend-following with capital preservation. Screen by earnings momentum + ROE, rank by 12-month price momentum. Go to cash when ASX 200 breaks below 200-day MA.',
    inspired: 'Marcus Padley / Marcus Today',
  },
  {
    id: 'damodaran_dcf',
    name: 'Damodaran Intrinsic Value',
    css: 'damodaran',
    description: 'DCF valuation with narrative-to-numbers approach. Score stocks by discount-to-intrinsic-value, supplemented by relative valuation (P/E, EV/EBITDA vs peers).',
    inspired: 'Aswath Damodaran / NYU Stern',
  },
  {
    id: 'quant_factors',
    name: 'Quantitative Factors',
    css: 'quant',
    description: 'Multi-factor model ranking stocks by value (low P/B), momentum (12-1 month returns), quality (high ROE, low debt), and low volatility. Equal-weight top-ranked.',
    inspired: 'Fama-French factor research',
  },
  {
    id: 'dividend_income',
    name: 'Dividend Income',
    css: 'dividend',
    description: 'High-yield dividend strategy with franking credit advantage. Rank by grossed-up yield, filter by payout ratio <80%, DPS growth >0 over 3 years.',
    inspired: 'Australian income investing',
  },
  {
    id: 'contrarian_value',
    name: 'Contrarian Deep Value',
    css: 'contrarian',
    description: 'Graham/Buffett-style value investing. Graham Number screen, P/B <1, current ratio >1.5, five years of positive earnings. Buy below intrinsic value.',
    inspired: 'Benjamin Graham / Warren Buffett',
  },
]

const TSR_PERIODS = [
  { label: 'FY24 (1 Jul 2023)', start: '2023-07-01' },
  { label: 'FY25 (1 Jul 2024)', start: '2024-07-01' },
  { label: 'FY26 (1 Jul 2025)', start: '2025-07-01' },
  { label: 'FY27 (1 Jul 2026)', start: '2026-07-01' },
]

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>ASX Stock Tracker</h1>
        <p className="subtitle">
          Five investment philosophies, each with a hypothetical $5,000 stake on ASX stocks.
          Auto-picked by strategy rules with manual override. Tracked over 6 months.
        </p>
        <p className="version">v0.1.0 · scaffolding</p>
      </header>

      <div className="stats">
        <div className="stat">
          <div className="label">Strategies</div>
          <div className="value accent">5</div>
        </div>
        <div className="stat">
          <div className="label">Stake per strategy</div>
          <div className="value green">$5,000</div>
        </div>
        <div className="stat">
          <div className="label">Total invested</div>
          <div className="value gold">$25,000</div>
        </div>
        <div className="stat">
          <div className="label">Data source</div>
          <div className="value" style={{ fontSize: 16 }}>yfinance</div>
        </div>
      </div>

      <div className="section-header">
        <h2>Strategy Portfolios</h2>
        <div className="line" />
      </div>

      <div className="strategy-grid">
        {STRATEGIES.map(s => (
          <div key={s.id} className={`strategy-card ${s.css}`}>
            <div className="card-header">
              <h3>{s.name}</h3>
              <span className="coming-soon">Coming Soon</span>
            </div>
            <p className="description">{s.description}</p>
            <p className="description" style={{ fontStyle: 'italic', fontSize: 12 }}>
              Inspired by: {s.inspired}
            </p>
            <div className="portfolio-value">
              <span className="amount" style={{ color: 'var(--text-mute)' }}>$5,000</span>
              <span className="return" style={{ color: 'var(--text-mute)' }}>—</span>
            </div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <h2>AGL Total Shareholder Return</h2>
        <div className="line" />
      </div>

      <div className="tsr-card">
        <h3>AGL Energy (ASX:AGL) vs S&P/ASX 100</h3>
        <p className="tsr-subtitle">
          Tracking TSR (price appreciation + reinvested dividends) over rolling 4-year periods from 1 July each year.
        </p>
        <div className="tsr-periods">
          {TSR_PERIODS.map(p => (
            <div key={p.start} className="tsr-period">
              <div className="period-label">{p.label}</div>
              <div className="tsr-values">
                <div className="tsr-item">
                  <div className="name">AGL</div>
                  <div className="val agl">—</div>
                </div>
                <div className="tsr-item">
                  <div className="name">ASX 100</div>
                  <div className="val index">—</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="footer">
        ASX Stock Tracker · built with Claude Code · data via yfinance
      </footer>
    </div>
  )
}

export default App

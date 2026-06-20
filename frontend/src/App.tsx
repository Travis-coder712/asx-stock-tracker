import { useEffect, useState } from 'react'
import Dashboard from './Dashboard'
import AglAnalysis from './AglAnalysis'
import PickToday from './PickToday'
import LearnHub from './learn/LearnHub'
import Investing101 from './learn/Investing101'
import MomentumModule from './learn/MomentumModule'
import IntrinsicValueModule from './learn/IntrinsicValueModule'
import FactorModule from './learn/FactorModule'
import DividendModule from './learn/DividendModule'
import ValueModule from './learn/ValueModule'
import WatchOutModule from './learn/WatchOutModule'
import './App.css'

interface Metadata {
  version: string
  builtAt: string
  latestPrice: string | null
  stockCount: number
}

interface Holding {
  ticker: string
  name: string
  shares: number
  buyPrice: number
  buyDate: string
  rationale: string
}

interface StrategyData {
  snapshots: Array<{ date: string; totalValue: number }>
  holdings: Holding[]
}

const BASE = import.meta.env.BASE_URL

type Tab = 'strategies' | 'pick-today' | 'agl' | 'learn'

const STRATEGIES = [
  { id: 'padley_momentum', name: 'Padley Momentum', css: 'padley',
    description: 'Trend-following with capital preservation. Screen by earnings momentum + ROE, rank by 12-month price momentum. Go to cash when ASX 100 breaks below 200-day MA.',
    inspired: 'Marcus Padley / Marcus Today' },
  { id: 'damodaran_dcf', name: 'Damodaran Intrinsic Value', css: 'damodaran',
    description: 'Score stocks by discount-to-intrinsic-value using sector-relative P/E and FCF yield.',
    inspired: 'Aswath Damodaran / NYU Stern' },
  { id: 'quant_factors', name: 'Quantitative Factors', css: 'quant',
    description: 'Multi-factor model ranking stocks by value (low P/B), momentum (12-1 month returns), quality (high ROE, low debt). Equal-weight top-ranked.',
    inspired: 'Fama-French factor research' },
  { id: 'dividend_income', name: 'Dividend Income', css: 'dividend',
    description: 'High-yield dividend strategy with franking credit advantage. Rank by grossed-up yield, filter by payout ratio <80%, DPS growth >0 over 3 years.',
    inspired: 'Australian income investing' },
  { id: 'contrarian_value', name: 'Contrarian Deep Value', css: 'contrarian',
    description: 'Graham Number screen, P/B <1.5, current ratio >1, positive EPS. Buy below intrinsic value.',
    inspired: 'Benjamin Graham / Warren Buffett' },
]

function App() {
  const [tab, setTab] = useState<Tab>('strategies')
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [strategyData, setStrategyData] = useState<Record<string, StrategyData>>({})
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null)
  const [activeModule, setActiveModule] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${BASE}data/metadata.json`).then(r => r.ok ? r.json() : null).then(setMetadata).catch(() => {})
    STRATEGIES.forEach(s => {
      Promise.all([
        fetch(`${BASE}data/portfolios/${s.id}.json`).then(r => r.ok ? r.json() : []),
        fetch(`${BASE}data/portfolios/${s.id}-holdings.json`).then(r => r.ok ? r.json() : []),
      ]).then(([snapshots, holdings]) => {
        setStrategyData(prev => ({ ...prev, [s.id]: { snapshots, holdings } }))
      }).catch(() => {})
    })
  }, [])

  // Handle learn module navigation
  if (activeModule) {
    const onBack = () => setActiveModule(null)
    const mods: Record<string, React.ReactNode> = {
      'investing-101': <Investing101 onBack={onBack} />,
      'momentum': <MomentumModule onBack={onBack} />,
      'intrinsic-value': <IntrinsicValueModule onBack={onBack} />,
      'factor-investing': <FactorModule onBack={onBack} />,
      'dividend-investing': <DividendModule onBack={onBack} />,
      'value-investing': <ValueModule onBack={onBack} />,
      'watch-out': <WatchOutModule onBack={onBack} />,
    }
    return <div className="app">{mods[activeModule] ?? <LearnHub onSelectModule={setActiveModule} />}</div>
  }

  return (
    <div className="app">
      <header className="header">
        <h1>ASX Stock Tracker</h1>
        <p className="subtitle">
          Five investment philosophies tested on the ASX with hypothetical portfolios.
          Auto-picked by strategy rules, rebalanced every 6 months, tracked with real data.
        </p>
        <p className="version">
          v{metadata?.version ?? '1.2.0'}
          {metadata?.latestPrice && ` · data to ${metadata.latestPrice}`}
        </p>
      </header>

      {/* Tab navigation */}
      <div className="main-tabs">
        <button className={`main-tab ${tab === 'strategies' ? 'active' : ''}`} onClick={() => setTab('strategies')}>
          Strategies
        </button>
        <button className={`main-tab ${tab === 'pick-today' ? 'active' : ''}`} onClick={() => setTab('pick-today')}>
          Pick Today
        </button>
        <button className={`main-tab ${tab === 'agl' ? 'active' : ''}`} onClick={() => setTab('agl')}>
          AGL Analysis
        </button>
        <button className={`main-tab ${tab === 'learn' ? 'active' : ''}`} onClick={() => setTab('learn')}>
          Learn
        </button>
      </div>

      {/* Strategies tab */}
      {tab === 'strategies' && (
        <>
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
              <div className="label">Total hypothetical</div>
              <div className="value gold">$25,000</div>
            </div>
            <div className="stat">
              <div className="label">Stocks tracked</div>
              <div className="value" style={{ fontSize: 16 }}>{metadata?.stockCount ?? '—'}</div>
            </div>
          </div>

          <div className="section-header">
            <h2>Strategy Portfolios</h2>
            <div className="line" />
          </div>

          <div className="strategy-grid">
            {STRATEGIES.map(s => {
              const data = strategyData[s.id]
              const hasData = data && data.snapshots.length > 0
              const latest = hasData ? data.snapshots[data.snapshots.length - 1] : null
              const returnPct = latest ? ((latest.totalValue - 5000) / 5000) * 100 : null
              const isExpanded = expandedStrategy === s.id

              return (
                <div key={s.id} className={`strategy-card ${s.css}`}>
                  <div className="card-header">
                    <h3>{s.name}</h3>
                    {hasData ? (
                      <span className="badge">{data.holdings.length} holdings</span>
                    ) : (
                      <span className="coming-soon">Coming Soon</span>
                    )}
                  </div>
                  <p className="description">{s.description}</p>
                  <p className="description" style={{ fontStyle: 'italic', fontSize: 12 }}>
                    Inspired by: {s.inspired}
                  </p>
                  {hasData && data.holdings.length > 0 && (
                    <div className="holdings-list">
                      {data.holdings.map(h => (
                        <span key={h.ticker} className="holding-chip">{h.ticker.replace('.AX', '')}</span>
                      ))}
                    </div>
                  )}
                  <div className="portfolio-value">
                    <span className="amount" style={{ color: hasData ? 'var(--text)' : 'var(--text-mute)' }}>
                      {latest ? `$${latest.totalValue.toLocaleString('en-AU', { maximumFractionDigits: 0 })}` : '$5,000'}
                    </span>
                    <span className={`return ${returnPct !== null ? (returnPct >= 0 ? 'positive' : 'negative') : ''}`}>
                      {returnPct !== null ? `${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  {hasData && (
                    <button className="expand-btn" onClick={() => setExpandedStrategy(isExpanded ? null : s.id)}>
                      {isExpanded ? 'Hide details ▲' : 'Show holdings detail ▼'}
                    </button>
                  )}
                  {isExpanded && hasData && (
                    <div className="holdings-detail">
                      <table className="holdings-table">
                        <thead>
                          <tr>
                            <th>Ticker</th>
                            <th>Company</th>
                            <th style={{ textAlign: 'right' }}>Buy Price</th>
                            <th>Rationale</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.holdings.map(h => (
                            <tr key={h.ticker}>
                              <td className="ticker-cell">{h.ticker.replace('.AX', '')}</td>
                              <td className="name-cell">{h.name}</td>
                              <td style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace' }}>${h.buyPrice.toFixed(2)}</td>
                              <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{h.rationale}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <Dashboard />
        </>
      )}

      {/* Pick Today tab */}
      {tab === 'pick-today' && <PickToday />}

      {/* AGL Analysis tab */}
      {tab === 'agl' && <AglAnalysis />}

      {/* Learn tab */}
      {tab === 'learn' && <LearnHub onSelectModule={setActiveModule} />}

      <footer className="footer">
        ASX Stock Tracker · built with Claude Code · data via yfinance
      </footer>
    </div>
  )
}

export default App

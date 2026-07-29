interface Props {
  onGoToLearn: () => void
}

export default function About({ onGoToLearn }: Props) {
  return (
    <div className="about-page">
      <div className="section-header">
        <h2>About this app</h2>
        <div className="line" />
      </div>

      <p className="about-lead">
        A personal sandbox for learning how investing actually works — by testing real
        stock-picking philosophies against real ASX data and building the interactive tools that
        make the ideas stick. It is a place to think more clearly about markets, not a place to get
        told what to buy.
      </p>

      <h3 className="about-h3">What it's trying to achieve</h3>
      <ul className="about-list">
        <li><strong>Make strategies concrete.</strong> Five distinct investment philosophies (momentum, intrinsic value, quant factors, dividend/income, deep value) are run as hypothetical $5,000 portfolios on real price data, so you can see how each behaves through actual market conditions rather than in theory.</li>
        <li><strong>Compare honestly.</strong> All five sit on one dashboard with the same rules, the same starting stake and the same time period — including the losers. Momentum's +64% and Damodaran value's −8% are both shown.</li>
        <li><strong>Teach the thinking.</strong> A 10-module curriculum explains the <em>why</em> behind each approach, and interactive simulators (gamma scalping, position sizing, vol crush) let you feel counter-intuitive truths by dragging sliders instead of just reading them.</li>
        <li><strong>Surface hidden risk.</strong> The Portfolio Risk tab measures how correlated and concentrated the strategies really are — the diversification the five separate portfolios hide.</li>
        <li><strong>Track one real question.</strong> The AGL analysis follows a specific employer's total shareholder return against its ASX 100 peers.</li>
      </ul>

      <h3 className="about-h3">What it is <em>not</em></h3>
      <div className="about-callout warn">
        <ul className="about-list tight">
          <li><strong>Not financial advice.</strong> Nothing here is a recommendation to buy, sell or hold anything. It doesn't know your circumstances, goals or risk tolerance. For personal advice, see a licensed adviser.</li>
          <li><strong>Not a live trading system.</strong> The portfolios are hypothetical and don't account for real brokerage, slippage, taxes or the emotional reality of holding through a drawdown.</li>
          <li><strong>Not a predictor.</strong> Every result is <em>backtested with hindsight</em>. Strategies that worked over this window may not work next year — past performance is not a guide to the future, and the sample is short.</li>
          <li><strong>Not a complete data source.</strong> Prices come from a free feed (yfinance), fundamentals are point-in-time snapshots, and coverage is limited to a set of larger ASX names. Numbers can be stale, missing or wrong. Verify anything before acting on it.</li>
          <li><strong>Not exhaustive.</strong> Five strategies out of countless approaches, chosen because they're instructive — not because they're the "best".</li>
        </ul>
      </div>

      <h3 className="about-h3">How to get the most from it</h3>
      <ul className="about-list">
        <li>Start with <strong>Learn → Investing 101</strong> if any of the terms are unfamiliar.</li>
        <li>Treat the strategy returns as <em>case studies in behaviour</em>, not tips — ask <em>why</em> momentum led and value lagged over this period.</li>
        <li>Use the simulators to build intuition, then read the matching lesson's honest "reality check" on where it applies to a retail investor.</li>
        <li>Check the <strong>Portfolio Risk</strong> tab before assuming more holdings means more diversification.</li>
      </ul>

      <div className="about-callout">
        New here? The curriculum is the best starting point.{' '}
        <button className="about-link-btn" onClick={onGoToLearn}>Go to Learn →</button>
      </div>

      <p className="about-fineprint">
        Built by Travis with Claude Code as a learning project. Data via yfinance. Educational
        use only — not financial product advice. If you're making real investment decisions, do
        your own research and consider professional, licensed advice.
      </p>
    </div>
  )
}

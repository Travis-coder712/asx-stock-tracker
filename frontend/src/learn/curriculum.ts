export type LessonStatus = 'built' | 'planned'
export type ModuleStatus = 'available' | 'planned'

export interface Lesson {
  id: string
  number: number
  title: string
  summary: string
  readingTime: string
  status: LessonStatus
}

export interface Module {
  id: string
  number: number
  title: string
  tagline: string
  accent: string
  status: ModuleStatus
  lessons: Lesson[]
}

export const MODULES: Module[] = [
  {
    id: 'investing-101',
    number: 1,
    title: 'Investing 101',
    tagline: 'The foundations — what shares are, how the ASX works, and the traps to avoid.',
    accent: '#51cf66',
    status: 'available',
    lessons: [
      { id: 'what-is-a-share', number: 1, title: 'What is a share?', summary: 'What you\'re actually buying when you buy a stock — ownership, earnings, and why prices move.', readingTime: '6 min', status: 'built' },
      { id: 'how-the-asx-works', number: 2, title: 'How the ASX works', summary: 'Market hours, brokers, settlement, indices — the mechanics of the Australian market.', readingTime: '7 min', status: 'built' },
      { id: 'risk-and-return', number: 3, title: 'Risk vs return', summary: 'The fundamental trade-off. Why higher returns always come with higher risk, and how to think about it.', readingTime: '8 min', status: 'built' },
      { id: 'compound-interest', number: 4, title: 'The power of compounding', summary: 'Why time in market beats timing the market. The maths behind exponential growth.', readingTime: '6 min', status: 'built' },
      { id: 'diversification', number: 5, title: 'Diversification', summary: 'Why you don\'t put everything in one stock. The free lunch of investing.', readingTime: '5 min', status: 'built' },
      { id: 'dividends-and-franking', number: 6, title: 'Dividends and franking credits', summary: 'Australia\'s unique advantage — franking credits explained, grossed-up yields, and why it matters.', readingTime: '8 min', status: 'built' },
      { id: 'common-traps', number: 7, title: 'Common traps', summary: 'FOMO buying, panic selling, confirmation bias, overtrading — the mistakes every beginner makes.', readingTime: '7 min', status: 'built' },
    ],
  },
  {
    id: 'momentum',
    number: 2,
    title: 'Momentum & Technical Analysis',
    tagline: 'Why trends persist and how Marcus Padley trades them.',
    accent: '#ff6b6b',
    status: 'planned',
    lessons: [
      { id: 'what-is-momentum', number: 1, title: 'What is momentum investing?', summary: 'Why stocks that have gone up tend to keep going up — and the academic evidence.', readingTime: '7 min', status: 'planned' },
      { id: 'key-indicators', number: 2, title: 'Key indicators', summary: 'Moving averages (200-day MA), RSI, volume — what they tell you and what they don\'t.', readingTime: '8 min', status: 'planned' },
      { id: 'padley-approach', number: 3, title: 'The Padley approach', summary: 'Earnings growth screens, ROE filters, market-timing, and the capital preservation mindset.', readingTime: '9 min', status: 'planned' },
      { id: 'momentum-risks', number: 4, title: 'Momentum risks', summary: 'Whipsaws, late entry, reversal — when momentum stops working and how to protect yourself.', readingTime: '6 min', status: 'planned' },
    ],
  },
  {
    id: 'intrinsic-value',
    number: 3,
    title: 'Intrinsic Valuation',
    tagline: 'What a stock is actually worth — Damodaran\'s DCF in plain English.',
    accent: '#6b8cff',
    status: 'planned',
    lessons: [
      { id: 'what-is-value', number: 1, title: 'What is a stock "worth"?', summary: 'The concept of intrinsic value and why market price doesn\'t equal value.', readingTime: '7 min', status: 'planned' },
      { id: 'dcf-plain-english', number: 2, title: 'DCF in plain English', summary: 'Future cash flows, discount rates, terminal value — the whole model without the maths anxiety.', readingTime: '10 min', status: 'planned' },
      { id: 'narrative-to-numbers', number: 3, title: 'Narrative to numbers', summary: 'Start with the business story, translate to valuation inputs. Damodaran\'s signature approach.', readingTime: '8 min', status: 'planned' },
      { id: 'relative-valuation', number: 4, title: 'Relative valuation', summary: 'P/E and EV/EBITDA — comparing apples to apples across a sector.', readingTime: '7 min', status: 'planned' },
    ],
  },
  {
    id: 'factor-investing',
    number: 4,
    title: 'Factor Investing',
    tagline: 'The Big Five factors and why some characteristics predict returns.',
    accent: '#4ecdc4',
    status: 'planned',
    lessons: [
      { id: 'what-are-factors', number: 1, title: 'What are "factors"?', summary: 'Value, size, momentum, quality, low volatility — the academic evidence.', readingTime: '8 min', status: 'planned' },
      { id: 'scoring-models', number: 2, title: 'How scoring models work', summary: 'Ranking, weighting, composite scores — the mechanics of factor investing.', readingTime: '7 min', status: 'planned' },
      { id: 'factor-risks', number: 3, title: 'Factor risks', summary: 'Crowding, regime changes, backtesting overfitting — the hidden dangers.', readingTime: '6 min', status: 'planned' },
    ],
  },
  {
    id: 'dividend-investing',
    number: 5,
    title: 'Dividend & Income Investing',
    tagline: 'High-yield strategies with the Australian franking credit advantage.',
    accent: '#ffd43b',
    status: 'planned',
    lessons: [
      { id: 'why-dividends', number: 1, title: 'Why dividends matter', summary: 'Especially in Australia — franking credits explained with worked examples.', readingTime: '8 min', status: 'planned' },
      { id: 'sustainability', number: 2, title: 'Dividend sustainability', summary: 'Payout ratio, FCF coverage, earnings stability — how to spot a dividend trap.', readingTime: '7 min', status: 'planned' },
      { id: 'yield-traps', number: 3, title: 'Dividend traps', summary: 'High yield can mean the market expects a cut. How to tell the difference.', readingTime: '6 min', status: 'planned' },
    ],
  },
  {
    id: 'value-investing',
    number: 6,
    title: 'Value Investing',
    tagline: 'Graham\'s margin of safety, Buffett\'s evolution, and contrarian thinking.',
    accent: '#cc5de8',
    status: 'planned',
    lessons: [
      { id: 'graham', number: 1, title: 'Benjamin Graham\'s margin of safety', summary: 'The origin story — net-net investing and the Graham Number.', readingTime: '8 min', status: 'planned' },
      { id: 'buffett', number: 2, title: 'Buffett\'s evolution', summary: 'From cigar butts to "wonderful companies at fair prices" — what changed.', readingTime: '7 min', status: 'planned' },
      { id: 'value-traps', number: 3, title: 'Value traps', summary: 'Structural decline, catching falling knives — when cheap stocks deserve to be cheap.', readingTime: '6 min', status: 'planned' },
    ],
  },
  {
    id: 'watch-out',
    number: 7,
    title: 'What to Watch Out For',
    tagline: 'Cognitive biases, media traps, tax, fees, and when to sell.',
    accent: '#ff922b',
    status: 'planned',
    lessons: [
      { id: 'biases', number: 1, title: 'Cognitive biases in investing', summary: 'Loss aversion, anchoring, recency bias — the mistakes your brain makes.', readingTime: '8 min', status: 'planned' },
      { id: 'media-trap', number: 2, title: 'The media trap', summary: 'Financial news is entertainment, not advice. How to filter signal from noise.', readingTime: '6 min', status: 'planned' },
      { id: 'tax-and-fees', number: 3, title: 'Tax and fees', summary: 'CGT discount, wash sales, brokerage costs — the hidden drag on returns.', readingTime: '7 min', status: 'planned' },
      { id: 'when-to-sell', number: 4, title: 'When to sell', summary: 'The hardest decision in investing. Frameworks for letting go.', readingTime: '7 min', status: 'planned' },
    ],
  },
]

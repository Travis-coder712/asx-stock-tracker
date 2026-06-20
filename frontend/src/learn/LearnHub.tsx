import { MODULES } from './curriculum'

interface Props {
  onSelectModule: (moduleId: string) => void
}

export default function LearnHub({ onSelectModule }: Props) {
  return (
    <div className="learn-section">
      <div className="section-header">
        <h2>Learn</h2>
        <div className="line" />
      </div>
      <p style={{ color: 'var(--text-dim)', marginBottom: 24, fontSize: 14 }}>
        A 7-module curriculum covering investing foundations and the thinking behind each strategy.
        Interactive exercises use live data from the portfolios above.
      </p>

      <div className="module-grid">
        {MODULES.map(m => (
          <div
            key={m.id}
            className={`module-card ${m.status === 'available' ? 'clickable' : 'planned'}`}
            onClick={() => m.status === 'available' && onSelectModule(m.id)}
            style={{ '--module-accent': m.accent } as React.CSSProperties}
          >
            <div className="mc-header">
              <span className="mc-number">{m.number}</span>
              {m.status === 'planned' && <span className="coming-soon">Coming Soon</span>}
              {m.status === 'available' && (
                <span className="mc-badge available">{m.lessons.length} lessons</span>
              )}
            </div>
            <h3 className="mc-title">{m.title}</h3>
            <p className="mc-tagline">{m.tagline}</p>
            <div className="mc-lessons">
              {m.lessons.map(l => (
                <div key={l.id} className={`mc-lesson ${l.status}`}>
                  <span className="mc-lesson-num">{l.number}</span>
                  <span className="mc-lesson-title">{l.title}</span>
                  <span className="mc-lesson-time">{l.readingTime}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

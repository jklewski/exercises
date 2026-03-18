import { exercises } from '../exercises/index.js'

/**
 * Chapter map – add a name to any chapter to display it as a subtitle.
 * Exercises not yet in the registry are shown as greyed-out placeholders.
 * Sub-exercises (26a / 26b / 26c) are listed explicitly.
 */
const CHAPTERS = [
  { number: 2,  name: null, ids: ['1','2','3','4','5','6','7'] },
  { number: 3,  name: null, ids: ['10','11','12','13'] },
  { number: 4,  name: null, ids: ['14','15','16'] },
  { number: 6,  name: null, ids: ['17','18','19','20','21','22','23','24','25'] },
  { number: 7,  name: null, ids: ['26a','26b','26c','27','28','29'] },
  { number: 8,  name: null, ids: ['30','31','32','33'] },
  { number: 9,  name: null, ids: ['34','35','36','37','38'] },
  { number: 10, name: null, ids: ['39','40','41'] },
]

/** Strip the "Uppgift 20 – " prefix to show just the topic in the card. */
function shortTitle(title) {
  return title.replace(/^Uppgift\s+[\w]+\s*[–-]\s*/, '')
}

export default function LandingPage({ onNavigate }) {
  return (
    <div className="landing-wrap">

      {/* ── Hero ── */}
      <header className="landing-hero">
        <div className="landing-inner landing-hero-inner">
          <div>
            <h1 className="landing-title">Byggkonstruktion</h1>
            <p className="landing-sub">Övningsuppgifter</p>
          </div>
          <div className="landing-hero-links">
            <a
              className="site-footer-link"
              href="https://github.com/jklewski/"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub repository"
            >
              <svg className="site-footer-github" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577
                  0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755
                  -1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236
                  1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466
                  -1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176
                  0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3-.405c1.02.005 2.045.138 3 .405
                  2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23
                  1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22
                  0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295
                  24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              /jklewski
            </a>
            <span className="site-footer-sep">·</span>
            <a className="site-footer-link" href="mailto:jonas.niklewski@kstr.lth.se">
              Rapportera fel
            </a>
          </div>
        </div>
      </header>

      {/* ── Info box ── */}
      <div className="landing-inner">
        <div className="landing-infobox">
          <span className="landing-infobox-icon">📐</span>
          <p>
            Detta är en samling övningsuppgifter som används i kursen{' '}
            <strong>VBKF15: Konstruktionsteknik</strong>. När du arbetat dig igenom
            uppgifterna så kan du generera oändligt många typtentor inför den stora dagen.
          </p>
        </div>
      </div>

      {/* ── Chapters ── */}
      <div className="landing-inner landing-body">

        {CHAPTERS.map(ch => (
          <section key={ch.number} className="chapter-section">
            <div className="chapter-heading">
              <span className="chapter-badge">Kap. {ch.number}</span>
              {ch.name && <span className="chapter-name">{ch.name}</span>}
              <div className="chapter-rule" />
            </div>

            <div className="ex-grid">
              {ch.ids.map(id => {
                const ex      = exercises[id]
                const active  = !!ex
                return (
                  <button
                    key={id}
                    className={`ex-card${active ? '' : ' ex-card--dim'}`}
                    onClick={active ? () => onNavigate(id) : undefined}
                    disabled={!active}
                  >
                    <span className="ex-card-id">{id}</span>
                    {active
                      ? <span className="ex-card-title">{shortTitle(ex.title)}</span>
                      : <span className="ex-card-title ex-card-title--empty">Kommande</span>
                    }
                  </button>
                )
              })}
            </div>
          </section>
        ))}

        {/* ── Exam button ── */}
        <div className="landing-footer">
          <button className="exam-btn" onClick={() => onNavigate('exam')}>
            <span className="exam-btn-icon">✎</span>
            Skapa tentamen…
          </button>
        </div>

      </div>

    </div>
  )
}

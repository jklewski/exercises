import { exercises } from '../../exercises/index.js'
import { seededPick } from '../../utils/seededRandom.js'
import ExamExercise from './ExamExercise.jsx'
import './exam.css'

export default function ExamShell({ hash }) {
  // Parse params from hash: exam?title=...&seed=...&count=...&pool=...
  const qs = hash.includes('?') ? hash.split('?')[1] : ''
  const params = new URLSearchParams(qs)

  const title = params.get('title') || 'Tentamen'
  const seed = params.get('seed') || 'default'
  const count = parseInt(params.get('count') || '3', 10)
  const poolIds = (params.get('pool') || '')
    .split(',')
    .filter(id => exercises[id])

  const selectedIds = seededPick(poolIds, count, seed)

  function handleEdit() {
    window.location.hash = 'exam'
  }

  return (
    <div className="exam-wrapper">

      {/* Toolbar – hidden when printing */}
      <div className="exam-controls no-print">
        <button className="back-btn" onClick={handleEdit}>
          ← Redigera
        </button>
        <button className="exam-print-btn" onClick={() => window.print()}>
          Skriv ut / Spara PDF
        </button>
      </div>

      <div className="exam-document">

        {/* Exam header: title + course/date fields + student fields */}
        <div className="exam-header">
          <div className="exam-header-top">
            <h1 className="exam-title">{title}</h1>
            <div className="exam-meta">
              <div className="exam-meta-row">
                <span>Kurs:</span>
                <span className="exam-meta-line" />
              </div>
              <div className="exam-meta-row">
                <span>Datum:</span>
                <span className="exam-meta-line" />
              </div>
            </div>
          </div>
          <div className="exam-student-fields">
            <div className="exam-student-field">
              <span>Namn:</span>
              <span className="exam-field-line" />
            </div>
            <div className="exam-student-field">
              <span>Personnummer:</span>
              <span className="exam-field-line" />
            </div>
          </div>
        </div>

        {/* One exercise per page (page-break class on all but the last) */}
        {selectedIds.map((id, i) => (
          <div
            key={id}
            className={i < selectedIds.length - 1 ? 'exam-exercise-page' : ''}
          >
            <ExamExercise exercise={exercises[id]} index={i} />
          </div>
        ))}

      </div>
    </div>
  )
}

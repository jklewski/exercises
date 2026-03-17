import { useState, useEffect } from 'react'
import './App.css'
import ExerciseShell from './components/exercise/ExerciseShell.jsx'
import ExamConfig from './components/exam/ExamConfig.jsx'
import ExamShell from './components/exam/ExamShell.jsx'
import { exercises } from './exercises/index.js'

export default function App() {
  const [hash, setHash] = useState(window.location.hash.slice(1))

  useEffect(() => {
    function syncHash() {
      setHash(window.location.hash.slice(1))
    }
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  function navigate(id) {
    window.location.hash = id ?? ''
  }

  const route = hash.split('?')[0]

  // Exam routes
  if (route === 'exam') {
    const hasParams = hash.includes('?') && hash.split('?')[1].length > 0
    if (hasParams) {
      return <ExamShell hash={hash} />
    }
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem' }}>
        <button className="back-btn" onClick={() => navigate(null)}>
          ← Alla uppgifter
        </button>
        <ExamConfig />
      </div>
    )
  }

  const exercise = exercises[route] ?? null

  if (!exercise) {
    return (
      <div className="index-page">
        <div className="index-header">
          <h1>Byggkonstruktion – Övningsuppgifter</h1>
        </div>
        <ul className="exercise-list">
          {Object.entries(exercises).map(([id, ex]) => (
            <li key={id}>
              <button className="exercise-list-btn" onClick={() => navigate(id)}>
                <span className="exercise-list-id">{id}</span>
                <span className="exercise-list-title">{ex.title}</span>
              </button>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e5e7eb' }}>
          <button className="exercise-list-btn" onClick={() => navigate('exam')}>
            <span className="exercise-list-id" style={{ background: '#475569' }}>✎</span>
            <span className="exercise-list-title">Skapa tentamen…</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem' }}>
      <button className="back-btn" onClick={() => navigate(null)}>
        ← Alla uppgifter
      </button>
      <ExerciseShell exercise={exercise} />
    </div>
  )
}

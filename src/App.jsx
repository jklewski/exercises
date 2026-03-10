import { useState, useEffect } from 'react'
import './App.css'
import ExerciseShell from './components/exercise/ExerciseShell.jsx'
import { exercises } from './exercises/index.js'

export default function App() {
  const [currentId, setCurrentId] = useState(null)

  // Sync with URL hash on load and on back/forward navigation
  useEffect(() => {
    function syncHash() {
      const id = window.location.hash.slice(1)
      setCurrentId(id && exercises[id] ? id : null)
    }
    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  function navigate(id) {
    window.location.hash = id ?? ''
  }

  const exercise = currentId ? exercises[currentId] : null

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
